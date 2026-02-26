'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    ShoppingCart,
    Loader2,
    Search,
    Trash2,
    Beef,
    Zap,
    Wheat,
    Droplet,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Camera,
    Info,
    Sparkles,
    Check,
    Activity,
    Heart,
    X,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { cn, formatFoodName } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DailyPlan } from '@/lib/utils/meal-generator';
import { Recipe } from '@/lib/data/recipes';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_in_pantry: boolean;
    is_favorite: boolean;
    category?: string;
    source_table?: 'food_items' | 'pantry_items';
    quantity?: string;
}

const CAL_TO_KJ = 4.184;
const formatEnergy = (calories: number, unit: 'kcal' | 'kJ') => {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};

interface PantryViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategories?: string[];
    setSelectedCategories?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    refreshKey?: number;
}

export function PantryView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false,
    refreshKey = 0
}: PantryViewProps) {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery } = useSearch();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const { dailyPlan, updateDailyPlan, energyUnit, measurementUnit } = useUserPreferences();

    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories !== undefined ? externalSetSelectedCategories : setLocalSelectedCategories;

    const [user, setUser] = useState<any>(null);

    // Category grouping for pantry
    const getCategoryGroup = (category?: string) => {
        if (!category) return 'Other';
        const normalized = category.toLowerCase().trim();
        
        // Map DB categories to store sections
        switch(normalized) {
            case 'fruit':
            case 'vegetables':
                return 'Produce';
            case 'proteins':
            case 'legumes':
                return 'Proteins';
            case 'grains':
                return 'Grains';
            case 'oils':
            case 'flavour':
                return 'Pantry Staples';
            case 'nuts':
                return 'Nuts & Seeds';
            case 'supplements':
                return 'Supplements';
            case 'general':
            default:
                return 'Other';
        }
    };

    const getCategoryColor = (group: string) => {
        switch(group) {
            case 'Produce': return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800/50', text: 'text-green-700 dark:text-green-400', icon: '🥬' };
            case 'Proteins': return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800/50', text: 'text-red-700 dark:text-red-400', icon: '🥩' };
            case 'Grains': return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: '🌾' };
            case 'Pantry Staples': return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800/50', text: 'text-orange-700 dark:text-orange-400', icon: '🫙' };
            case 'Nuts & Seeds': return { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800/50', text: 'text-purple-700 dark:text-purple-400', icon: '🥜' };
            case 'Supplements': return { bg: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800/50', text: 'text-teal-700 dark:text-teal-400', icon: '💊' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: '📦' };
        }
    };

    // Shopping list quick-add state
    const [buyMoreItem, setBuyMoreItem] = useState<FoodItem | null>(null);
    const [buyMoreQty, setBuyMoreQty] = useState('1');
    const [buyMoreWeight, setBuyMoreWeight] = useState('');
    const [buyMoreUnit, setBuyMoreUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');
    const [buyMorePortions, setBuyMorePortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [buyMoreSelectedPortion, setBuyMoreSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [buyMoreAdding, setBuyMoreAdding] = useState(false);
    const [expandedQuantityId, setExpandedQuantityId] = useState<string | null>(null);

    interface QuantityEntry {
        qty: number;
        label: string | null;
        weight_g: number | null;
        unit: string | null;
        raw: string;
    }

    // Terminal words that mark a food name as a mass noun (never pluralised in English)
    const MASS_NOUN_TERMS = new Set([
        // Grains & starches
        'rice', 'flour', 'meal', 'starch', 'bran', 'quinoa', 'amaranth',
        'millet', 'sorghum', 'wheat', 'oat', 'barley', 'rye', 'buckwheat', 'dahl', 'dal',
        // Dairy & fats
        'butter', 'margarine', 'cream', 'milk', 'ghee', 'oil', 'lard',
        // Condiments & pantry staples
        'honey', 'sugar', 'salt', 'vinegar', 'mustard', 'sauce', 'paste',
        'mayonnaise', 'syrup', 'molasses', 'yeast',
        // Liquids
        'juice', 'water', 'broth', 'stock', 'essence',
        // Ground spices & powders (the last word will be "powder", "cumin", etc.)
        'powder', 'cocoa', 'cinnamon', 'turmeric', 'paprika', 'cumin', 'ginger',
        'nutmeg', 'cardamom', 'elachi', 'mace', 'anise', 'allspice',
        // Fresh herbs and leafy greens used as bulk ingredients
        'kale', 'spinach', 'lettuce', 'parsley', 'basil', 'mint', 'thyme',
        'rosemary', 'coriander', 'dhania',
        // Brassicas used as mass ingredient
        'broccoli', 'cauliflower',
        // Baked & processed
        'bread', 'extract',
    ]);

    const pluralize = (name: string, qty: number): string => {
        if (qty <= 1) return name;
        // Strip emojis and parentheticals for the mass-noun check only
        const stripped = name
            .replace(/\p{Emoji}/gu, '')
            .replace(/\(.*?\)/g, '')
            .trim()
            .toLowerCase();
        const words = stripped.split(/\s+/).filter(Boolean);
        const lastWord = words[words.length - 1];
        if (lastWord && MASS_NOUN_TERMS.has(lastWord)) return name;
        if (words.length >= 2 && MASS_NOUN_TERMS.has(words.slice(-2).join(' '))) return name;
        // If name ends with 🔥, pluralise the text part before it
        const fireMatch = name.match(/^(.*?)\s*(🔥\s*)$/);
        if (fireMatch) {
            const base = fireMatch[1];
            const fire = fireMatch[2];
            if (/[^aeiou]y$/i.test(base)) return base.slice(0, -1) + 'ies ' + fire;
            if (/(s|sh|ch|x|z)$/i.test(base)) return base + 'es ' + fire;
            if (/fe?$/i.test(base)) return base.replace(/fe?$/, 'ves') + ' ' + fire;
            return base + 's ' + fire;
        }
        if (/[^aeiou]y$/i.test(name)) return name.slice(0, -1) + 'ies';
        if (/(s|sh|ch|x|z)$/i.test(name)) return name + 'es';
        if (/fe?$/i.test(name)) return name.replace(/fe?$/, 'ves');
        return name + 's';
    };

    const parseQuantityEntry = (s: string): QuantityEntry => {
        // Format: "5 Large (223g)"
        const labeled = s.trim().match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
        if (labeled) return { qty: parseFloat(labeled[1]), label: labeled[2], weight_g: parseFloat(labeled[3]), unit: 'g', raw: s };
        // Format: "1 x 100g"
        const weighted = s.trim().match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|oz|lb)$/i);
        if (weighted) return { qty: parseFloat(weighted[1]), label: null, weight_g: parseFloat(weighted[2]), unit: weighted[3], raw: s };
        // Plain qty
        const plain = s.trim().match(/^(\d+(?:\.\d+)?)$/);
        if (plain) return { qty: parseFloat(plain[1]), label: null, weight_g: null, unit: null, raw: s };
        return { qty: 1, label: null, weight_g: null, unit: null, raw: s };
    };

    const parseQuantityEntries = (quantity: string | undefined): string[] => {
        if (!quantity) return [];
        return quantity.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
    };

    useEffect(() => {
        fetchPantry();
    }, [refreshKey]);

    // Fetch portions when a buyMoreItem is selected
    useEffect(() => {
        if (!buyMoreItem) { setBuyMorePortions([]); setBuyMoreSelectedPortion(null); return; }
        const foodId = buyMoreItem.source_table === 'food_items' ? buyMoreItem.id : null;
        if (!foodId) return;
        fetchFoodMeasures(foodId)
            .then(measures => setBuyMorePortions(measures || []))
            .catch(() => setBuyMorePortions([]));
    }, [buyMoreItem?.id]);

    const openBuyMore = (food: FoodItem) => {
        setBuyMoreItem(food);
        setBuyMoreQty('1');
        setBuyMoreWeight('');
        setBuyMoreUnit('g');
        setBuyMoreSelectedPortion(null);
        setQuickAddMode('pantry');
    };

    const buildQuantityString = (qty: string, portion: { label: string; weight_g: number } | null, weight: string, unit: string): string => {
        if (portion) return `${qty} ${portion.label} (${portion.weight_g}g)`;
        if (weight) return `${qty} x ${weight}${unit}`;
        return qty;
    };

    const mergeQuantityStrings = (existing: string | undefined, incoming: string): string => {
        if (!existing) return incoming;
        // Drop zero-quantity entries before merging (e.g. '0' left after items are consumed)
        const existingEntries = existing.split(/\s*\+\s*/).map(s => s.trim()).filter(s => {
            if (!s) return false;
            const e = parseQuantityEntry(s);
            return e.qty > 0;
        });
        // If all existing entries were zeros, just return incoming
        if (existingEntries.length === 0) return incoming;
        const b = parseQuantityEntry(incoming);
        // Find a matching existing entry to sum into
        const matchIndex = existingEntries.findIndex(e => {
            const a = parseQuantityEntry(e);
            return a.label === b.label && a.weight_g === b.weight_g && a.unit === b.unit;
        });
        if (matchIndex >= 0) {
            const a = parseQuantityEntry(existingEntries[matchIndex]);
            const sumQty = a.qty + b.qty;
            if (b.label && b.weight_g) {
                existingEntries[matchIndex] = `${sumQty} ${b.label} (${b.weight_g}g)`;
            } else if (b.weight_g) {
                existingEntries[matchIndex] = `${sumQty} x ${b.weight_g}${b.unit}`;
            } else {
                existingEntries[matchIndex] = `${sumQty}`;
            }
            return existingEntries.join(' + ');
        }
        // No matching entry — append incoming to the non-zero filtered entries
        return `${existingEntries.join(' + ')} + ${incoming}`;
    };

    const handleBuyMoreAdd = async () => {
        if (!buyMoreItem) return;
        setBuyMoreAdding(true);
        try {
            const quantityString = buildQuantityString(buyMoreQty, buyMoreSelectedPortion, buyMoreWeight, buyMoreUnit);

            if (quickAddMode === 'pantry') {
                if (buyMoreItem.source_table === 'food_items') {
                    await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', buyMoreItem.id);
                }
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                const currentQty = quantities[buyMoreItem.id] || buyMoreItem.quantity;
                const merged = mergeQuantityStrings(currentQty, quantityString);
                quantities[buyMoreItem.id] = merged;
                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
                setFoods(prev => prev.map(f => f.id === buyMoreItem.id ? { ...f, quantity: merged } : f));
                toast.success(`Updated quantity for ${buyMoreItem.common_name || buyMoreItem.name}`);
            } else {
                const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                const newItem = {
                    id: `manual-${Date.now()}`,
                    name: buyMoreItem.common_name || buyMoreItem.name,
                    quantity: quantityString,
                    unit: '',
                    checked: false,
                    source: 'manual'
                };
                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
                toast.success(`Added to groceries`);
            }
            setBuyMoreItem(null);
        } catch (e) {
            toast.error('Failed to add item');
        } finally {
            setBuyMoreAdding(false);
        }
    };

    const toggleFavorite = async (item: FoodItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Please sign in to save favorites");
            return;
        }
        try {
            const { error } = await supabase.from('food_items').update({ is_favorite: !item.is_favorite } as any).eq('id', item.id);
            if (error) throw error;
            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_favorite: !f.is_favorite } : f));
            toast.success(item.is_favorite ? "Removed from favourites" : "Added to favourites");
        } catch (error) { toast.error("Action failed"); }
    };

    const toggleGroup = (groupName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const fetchPantry = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const [foodItemsRes, pantryItemsRes] = await Promise.all([
                supabase.from('food_items')
                    .select('*')
                    .eq('is_in_pantry', true)
                    .order('common_name', { ascending: true }),
                user ? supabase.from('pantry_items')
                    .select('*, scanned_products(nutrition, image_url, default_unit), food_items(*)')
                    .eq('user_id', user.id)
                    : { data: [] }
            ]);

            if (foodItemsRes.error) throw foodItemsRes.error;

            const curatedFoods = (foodItemsRes.data || []) as FoodItem[];

            const personalFoods = (pantryItemsRes.data || []).map((item: any) => {
                const sp = item.scanned_products;
                const fi = item.food_items;
                const nutrition = sp?.nutrition || {};

                // Try to extract category from notes if not linked to food_item
                let category = fi?.category || sp?.category || 'General';
                if (category === 'General' && item.notes) {
                    const categoryMatch = item.notes.match(/Category:\s*(\w+)/);
                    if (categoryMatch) {
                        category = categoryMatch[1];
                    }
                }

                return {
                    id: item.id,
                    name: sp?.name || fi?.name || item.custom_name || 'Personal Item',
                    common_name: fi?.common_name || sp?.common_name || sp?.name || fi?.name || item.custom_name || 'Personal Item',
                    energy_kcal: nutrition.energy || fi?.energy_kcal || 0,
                    protein_g: nutrition.protein || fi?.protein_g || 0,
                    carbs_g: nutrition.carbs || fi?.carbs_g || 0,
                    fat_g: nutrition.fat || fi?.fat_g || 0,
                    image: sp?.image_url || fi?.image || null,
                    is_in_pantry: true,
                    is_favorite: fi?.is_favorite || false,
                    category: category,
                    source_table: 'pantry_items',
                    quantity: item.quantity
                } as FoodItem;
            });

            const combined = [
                ...curatedFoods.map(f => ({ ...f, source_table: 'food_items' as const })),
                ...personalFoods
            ];

            // Merge in locally-stored quantities (persists without login)
            try {
                const savedQuantities = localStorage.getItem('pantry_quantities');
                if (savedQuantities) {
                    const quantities: Record<string, string> = JSON.parse(savedQuantities);
                    combined.forEach(item => {
                        if (quantities[item.id]) {
                            item.quantity = quantities[item.id];
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load saved quantities', e);
            }

            setFoods(combined);
        } catch (error: any) {
            console.error('Error fetching pantry:', error);
            if (error.code === '42703') {
                toast.error("Database schema update required. Please run the latest migration.");
            } else {
                toast.error("Failed to load pantry.");
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromPantry = async (id: string, name: string, source: string = 'food_items') => {
        try {
            let error;

            if (source === 'pantry_items') {
                const res = await supabase.from('pantry_items').delete().eq('id', id);
                error = res.error;
            } else {
                const res = await supabase
                    .from('food_items')
                    .update({ is_in_pantry: false } as any)
                    .eq('id', id);
                error = res.error;
            }

            if (error) throw error;

            setFoods(prev => prev.filter(f => f.id !== id));
            toast.success(`${name} removed from pantry`);
        } catch (error) {
            console.error('Error removing from pantry:', error);
            toast.error("Failed to remove item.");
        }
    };

    const clearPantry = async () => {
        if (!confirm('Remove all items from your pantry?')) return;
        try {
            const foodItemIds = foods.filter(f => f.source_table === 'food_items').map(f => f.id);
            const pantryItemIds = foods.filter(f => f.source_table === 'pantry_items').map(f => f.id);

            if (foodItemIds.length > 0) {
                const { error } = await supabase.from('food_items').update({ is_in_pantry: false } as any).in('id', foodItemIds);
                if (error) throw error;
            }
            if (pantryItemIds.length > 0) {
                const { error } = await supabase.from('pantry_items').delete().in('id', pantryItemIds);
                if (error) throw error;
            }

            // Clear localStorage quantities
            try {
                const saved = localStorage.getItem('pantry_quantities');
                if (saved) {
                    const quantities: Record<string, string> = JSON.parse(saved);
                    foods.forEach(f => delete quantities[f.id]);
                    localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
                }
            } catch (e) { /* ignore */ }

            setFoods([]);
            toast.success('Pantry cleared');
        } catch (error) {
            console.error('Error clearing pantry:', error);
            toast.error('Failed to clear pantry');
        }
    };

    const updatePantryQuantity = async (item: FoodItem, newQty: string, newWeight: string, newUnit: string) => {
        const quantityString = newWeight ? `${newQty} x ${newWeight}${newUnit}` : newQty;

        // Update UI immediately
        setFoods(prev => prev.map(f => f.id === item.id ? { ...f, quantity: quantityString } : f));
        setBuyMoreItem(null);
        toast.success(`Updated quantity for "${item.name}"`);

        // Persist to localStorage (works without login)
        try {
            const saved = localStorage.getItem('pantry_quantities');
            const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
            quantities[item.id] = quantityString;
            localStorage.setItem('pantry_quantities', JSON.stringify(quantities));
        } catch (e) {
            console.error('Failed to save quantity to localStorage', e);
        }

        // Also try to save to DB for pantry_items (best-effort, won't error if it fails)
        if (item.source_table === 'pantry_items') {
            try {
                await supabase
                    .from('pantry_items')
                    .update({ quantity: quantityString } as any)
                    .eq('id', item.id);
            } catch (e) {
                console.warn('DB sync skipped', e);
            }
        }
    };

    const addToShoppingList = (food: FoodItem) => {
        // Get existing manual items from localStorage
        const saved = localStorage.getItem('vitala_shopping_manual_items');
        let manualItems: any[] = [];
        try {
            manualItems = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to parse shopping list', e);
        }

        const itemName = food.common_name || food.name;
        const foodId = food.source_table === 'food_items' ? food.id : undefined;

        // Check for existing item with same name or food_item_id
        const existingIndex = manualItems.findIndex(item =>
            (foodId && item.food_item_id === foodId) ||
            item.name.toLowerCase() === itemName.toLowerCase()
        );

        if (existingIndex >= 0) {
            // Aggregate quantities
            const existing = manualItems[existingIndex];
            const parseQty = (s: string) => {
                const match = s.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
                return match ? { num: parseFloat(match[1]), unit: match[2].trim() } : null;
            };

            const oldQty = parseQty(existing.quantity);
            const quantityString = buyMoreWeight ? `${buyMoreQty} x ${buyMoreWeight}${buyMoreUnit}` : buyMoreQty;
            const newQty = parseQty(quantityString);

            if (oldQty && newQty && oldQty.unit === newQty.unit) {
                const sum = oldQty.num + newQty.num;
                manualItems[existingIndex].quantity = oldQty.unit ? `${sum} ${oldQty.unit}` : `${sum}`;
            } else {
                // Different units, concatenate
                manualItems[existingIndex].quantity = `${existing.quantity} + ${quantityString}`;
            }

            toast.success(`Updated "${itemName}" quantity in shopping list`);
        } else {
            // Add new item
            const quantityString = buyMoreWeight ? `${buyMoreQty} x ${buyMoreWeight}${buyMoreUnit}` : buyMoreQty;
            const newItem = {
                id: `manual-${Date.now()}`,
                name: itemName,
                quantity: quantityString,
                unit: '',
                checked: false,
                source: 'manual',
                food_item_id: foodId
            };
            manualItems.push(newItem);
            toast.success(`Added ${quantityString} "${itemName}" to shopping list`);
        }

        localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(manualItems));
        setBuyMoreItem(null);
        setBuyMoreQty('1');
    };

    const filteredFoods = foods.filter(food => {
        const matchesSearch = (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorites = !showFavoritesOnly || food.is_favorite;
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(food.category || 'General');

        return matchesSearch && matchesFavorites && matchesCategory;
    });

    // Grouping logic - by category section instead of name
    const groupedFoods = filteredFoods.reduce((acc, food) => {
        const categoryGroup = getCategoryGroup(food.category);
        if (!acc[categoryGroup]) acc[categoryGroup] = [];
        acc[categoryGroup].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>);

    // Sort groups with produce first, then proteins, grains, etc.
    const categoryOrder = ['Produce', 'Proteins', 'Grains', 'Pantry Staples', 'Nuts & Seeds', 'Supplements', 'Other'];
    const groupNames = Object.keys(groupedFoods).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Login Prompt - Only shown if not loading and no user */}
            {!loading && !user && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-900/50 flex items-center justify-center text-emerald-500 shadow-sm">
                            <Zap size={24} className="fill-current" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-postgres-100">Unlock Cloud Sync</h3>
                            <p className="text-[10px] text-slate-500 font-medium max-w-md mt-1">
                                Sign in to sync your pantry across devices and enable smart meal planning features.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl px-6 h-11 font-black uppercase tracking-widest text-[10px] shrink-0 relative z-10"
                    >
                        Sign In via Google
                    </Button>
                </div>
            )}

            {/* List Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Checking your kitchen...</p>
                </div>
            ) : filteredFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pantry Empty</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 px-4">
                        Add your favorite healthy foods to your pantry to make meal planning a breeze.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/ingredients/foods')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        Stock Up Now
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {filteredFoods.length} item{filteredFoods.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={clearPantry}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            Clear All
                        </button>
                    </div>
                    {/* Food Items Grouped by Category */}
                    <div className="space-y-3">
                        {groupNames.map((groupName) => {
                            const items = groupedFoods[groupName];
                            const colors = getCategoryColor(groupName);

                            return (
                                <div key={groupName} className={cn("rounded-xl border p-4", colors.bg, colors.border)}>
                                    <div className={cn("text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2", colors.text)}>
                                        <span className="text-lg">{colors.icon}</span>
                                        {groupName}
                                        <Badge className="ml-auto text-[9px] bg-white/50 dark:bg-slate-900/50 border-none text-slate-700 dark:text-slate-300">
                                            {items.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        {items.map((food) => (
                                            <div key={food.id}>
                                                <div
                                                    className="group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="w-5 h-5 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
                                                        <Check size={12} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            {food.is_favorite && (
                                                                <Heart size={12} className="text-rose-500 fill-current shrink-0" />
                                                            )}
                                                            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                                {formatFoodName(food.common_name || food.name)}
                                                            </span>
                                                        </div>
                                                        {(() => {
                                                            const entries = parseQuantityEntries(food.quantity);
                                                            if (entries.length === 0) return <span className="text-xs text-slate-400">In Stock</span>;
                                                            if (entries.length === 1) return <span className="text-xs text-slate-500 dark:text-slate-400">{entries[0]}</span>;
                                                            return <span className="text-xs text-slate-500 dark:text-slate-400">{entries.length} stock entries</span>;
                                                        })()}
                                                    </div>
                                                    {parseQuantityEntries(food.quantity).length > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedQuantityId(expandedQuantityId === food.id ? null : food.id); }}
                                                            className={cn("p-1.5 rounded-lg transition-all", expandedQuantityId === food.id ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500" : "text-slate-300 dark:text-slate-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-500")}
                                                            title="View stock breakdown"
                                                        >
                                                            <List size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); buyMoreItem?.id === food.id ? setBuyMoreItem(null) : openBuyMore(food); }}
                                                        className={cn("p-1.5 rounded-lg transition-all", buyMoreItem?.id === food.id ? "bg-amber-100 dark:bg-amber-950/40 text-amber-500" : "text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500")}
                                                        title="Update quantity / add to list"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(food, e); }}
                                                        className={cn("p-1.5 rounded-lg transition-all", food.is_favorite ? "text-rose-500" : "text-slate-300 dark:text-slate-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500")}
                                                        title="Favourite"
                                                    >
                                                        <Heart size={14} fill={food.is_favorite ? "currentColor" : "none"} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeFromPantry(food.id, food.name, food.source_table); }}
                                                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all"
                                                        title="Remove from pantry"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>

                                                {/* Quantity breakdown accordion */}
                                                {expandedQuantityId === food.id && (() => {
                                                    const entries = parseQuantityEntries(food.quantity).map(e => parseQuantityEntry(e)).filter(e => e.qty > 0);
                                                    const foodName = formatFoodName(food.common_name || food.name);
                                                    return (
                                                        <div className="mt-1 mb-0.5 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Stock Breakdown</p>
                                                            <div className="space-y-2">
                                                                {entries.map((e, i) => {
                                                                    const totalWeight = e.weight_g != null ? e.qty * e.weight_g : null;
                                                                    return (
                                                                        <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-emerald-100 dark:border-emerald-900/40 last:border-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{e.qty}</span>
                                                                                {e.label ? (
                                                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{e.label} {pluralize(foodName, e.qty)}</span>
                                                                                ) : e.weight_g != null ? (
                                                                                    <span className="text-sm font-semibold text-slate-400">× {e.weight_g}{e.unit} {pluralize(foodName, e.qty)}</span>
                                                                                ) : (
                                                                                    <span className="text-sm font-semibold text-slate-400">{pluralize(foodName, e.qty)}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-right">
                                                                                {e.label && e.weight_g != null && (
                                                                                    <span className="text-[10px] font-medium text-slate-400">{e.weight_g}{e.unit} each</span>
                                                                                )}
                                                                                {totalWeight != null && (
                                                                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{totalWeight.toLocaleString()}{e.unit} total</span>
                                                                                )}
                                                                                {e.weight_g == null && (
                                                                                    <span className="text-[10px] font-medium text-slate-400">no weight</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Inline quick-add panel */}
                                                {buyMoreItem?.id === food.id && (
                                                    <div className="mt-1 mb-0.5 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="flex flex-wrap items-end gap-3">
                                                            <div>
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Qty</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={buyMoreQty}
                                                                    onChange={(e) => setBuyMoreQty(e.target.value)}
                                                                    className="w-16 text-center h-9"
                                                                />
                                                            </div>

                                                            {buyMorePortions.length > 0 && !buyMoreSelectedPortion ? (
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const p = buyMorePortions.find(p => p.label === e.target.value);
                                                                            if (p) setBuyMoreSelectedPortion(p);
                                                                        }}
                                                                        className="px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        <option value="">Select serving...</option>
                                                                        {buyMorePortions.map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : buyMoreSelectedPortion ? (
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                    <select
                                                                        value={buyMoreSelectedPortion.label}
                                                                        onChange={(e) => {
                                                                            const p = buyMorePortions.find(p => p.label === e.target.value);
                                                                            if (p) setBuyMoreSelectedPortion(p);
                                                                        }}
                                                                        className="px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        {buyMorePortions.map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Weight</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={buyMoreWeight}
                                                                            onChange={(e) => setBuyMoreWeight(e.target.value)}
                                                                            placeholder="e.g. 100"
                                                                            className="w-20 text-center h-9"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Unit</Label>
                                                                        <select
                                                                            value={buyMoreUnit}
                                                                            onChange={(e) => setBuyMoreUnit(e.target.value)}
                                                                            className="w-20 px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            <option value="g">g</option>
                                                                            <option value="ml">ml</option>
                                                                            <option value="oz">oz</option>
                                                                            <option value="lb">lb</option>
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {buyMorePortions.length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (buyMoreSelectedPortion) {
                                                                            setBuyMoreWeight(`${buyMoreSelectedPortion.weight_g}`);
                                                                            setBuyMoreUnit('g');
                                                                            setBuyMoreSelectedPortion(null);
                                                                        } else {
                                                                            setBuyMoreSelectedPortion(buyMorePortions[0]);
                                                                        }
                                                                    }}
                                                                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors whitespace-nowrap pb-2"
                                                                >
                                                                    {buyMoreSelectedPortion ? 'Use Weight' : 'Use Serving'}
                                                                </button>
                                                            )}

                                                            <div>
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Destination</Label>
                                                                <select
                                                                    value={quickAddMode}
                                                                    onChange={(e) => setQuickAddMode(e.target.value as 'pantry' | 'shopping')}
                                                                    className="px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                >
                                                                    <option value="pantry">Pantry</option>
                                                                    <option value="shopping">Groceries</option>
                                                                </select>
                                                            </div>

                                                            <Button
                                                                onClick={handleBuyMoreAdd}
                                                                disabled={buyMoreAdding}
                                                                className="h-9 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px]"
                                                            >
                                                                <Plus size={14} />
                                                                {buyMoreAdding ? 'Adding...' : 'Add'}
                                                            </Button>

                                                            <button
                                                                onClick={() => setBuyMoreItem(null)}
                                                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-all pb-2"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

