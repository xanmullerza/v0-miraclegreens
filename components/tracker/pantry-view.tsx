'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/lib/context/search-context';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Minus,
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
    List,
    Apple,
    Carrot,
    Leaf,
    Bean,
    Pill,
    Box,
    Flame,
    Package
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
import { usePantry } from '@/hooks/use-pantry';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { TrackerTabShell, SortOption } from './tracker-tab-shell';
import { mergeQuantityStrings, stripZeroEntries } from './pantry/pantry-types';

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
    dropdownContent?: React.ReactNode;
}

export function PantryView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false,
    refreshKey = 0,
    dropdownContent
}: PantryViewProps) {
    const router = useRouter();
    const { quantities, pantryItems: dbPantryItems, loading: pantryLoading, updateQuantity, addToPantry, removeFromPantry: dbRemoveFromPantry } = usePantry();
    const { addItem: addShoppingItem } = useShoppingList();

    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery, setSearchQuery } = useSearch();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const { dailyPlan, updateDailyPlan, energyUnit, measurementUnit } = useUserPreferences();

    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Category grouping for pantry - use actual DB categories
    const getCategoryGroup = (category?: string) => {
        if (!category) return 'Other';
        // Capitalize first letter and return the DB category as-is
        return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    };

    const getCategoryColor = (group: string) => {
        const normalized = group.toLowerCase();
        switch(normalized) {
            case 'fruit':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Apple };
            case 'vegetables':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Carrot };
            case 'proteins':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Beef };
            case 'legumes':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Bean };
            case 'grains':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Wheat };
            case 'oils':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Droplet };
            case 'flavour':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Flame };
            case 'nuts':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Leaf };
            case 'supplements':
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Pill };
            default:
                return { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-400', icon: Box };
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
    
    // Remove quantity state
    const [removeItem, setRemoveItem] = useState<FoodItem | null>(null);
    const [removeQty, setRemoveQty] = useState('1');
    const [removeWeight, setRemoveWeight] = useState('');
    const [removeUnit, setRemoveUnit] = useState('g');
    const [removePortions, setRemovePortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [removeSelectedPortion, setRemoveSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [removeRemoving, setRemoveRemoving] = useState(false);
    
    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; source: string } | null>(null);
    
    // Inline accordion state for add/remove panels
    const [expandedAddId, setExpandedAddId] = useState<string | null>(null);
    const [expandedRemoveId, setExpandedRemoveId] = useState<string | null>(null);
    
    const [expandedQuantityId, setExpandedQuantityId] = useState<string | null>(null);
    const [expandedStockBreakdownId, setExpandedStockBreakdownId] = useState<string | null>(null);

    // Sorting state
    const [sortField, setSortField] = useState('category');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const sortOptions: SortOption[] = [
        { id: 'category', label: 'Category', icon: <Package size={14} /> },
        { id: 'name', label: 'A-Z', icon: <List size={14} /> },
        { id: 'weight', label: 'Weight', icon: <Zap size={14} /> },
    ];

    interface QuantityEntry {
        qty: number;
        label: string | null;
        weight_g: number | null;
        unit: string | null;
        raw: string;
    }

    // Pluralize only the measurement unit label (e.g. "Cup" ? "Cups", "Tbsp" stays "Tbsp")
    const pluralizeUnit = (label: string, qty: number): string => {
        if (qty <= 1) return label;
        const l = label.toLowerCase().trim();
        // Units that already look plural or are abbreviations � leave unchanged
        const unchanged = ['tbsp', 'tsp', 'ml', 'g', 'kg', 'oz', 'lb', 'lbs'];
        if (unchanged.includes(l)) return label;
        if (/[^aeiou]y$/i.test(label)) return label.slice(0, -1) + 'ies'; // rarely needed
        if (/(s|sh|ch|x|z)$/i.test(label)) return label + 'es'; // Inch ? Inches
        if (/s$/i.test(label)) return label; // already plural
        return label + 's'; // Cup ? Cups, Slice ? Slices, Piece ? Pieces
    };

    const parseQuantityEntry = (s: string): QuantityEntry => {
        // Format: "5 Large (223g)"
        const labeled = s.trim().match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
        if (labeled) return { qty: parseFloat(labeled[1]), label: labeled[2], weight_g: parseFloat(labeled[3]), unit: 'g', raw: s };
        // Format: "1 x 100g"
        const weighted = s.trim().match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg)$/i);
        if (weighted) return { qty: parseFloat(weighted[1]), label: null, weight_g: weighted[3].toLowerCase() === 'kg' ? parseFloat(weighted[2]) * 1000 : parseFloat(weighted[2]), unit: 'g', raw: s };
        // Format: "10 kg", "0.7 kilograms", "1 kilogram", "300 grams", "1 gram"
        const textbased = s.trim().match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|g)$/i);
        if (textbased) {
            const qty = parseFloat(textbased[1]);
            const unit = textbased[2].toLowerCase();
            if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
                return { qty: 1, label: null, weight_g: qty * 1000, unit: 'g', raw: s };
            } else {
                return { qty: 1, label: null, weight_g: qty, unit: 'g', raw: s };
            }
        }
        // Plain qty - treat as kilograms (1000g)
        const plain = s.trim().match(/^(\d+(?:\.\d+)?)$/);
        if (plain) return { qty: parseFloat(plain[1]), label: null, weight_g: 1000, unit: 'g', raw: s };
        return { qty: 1, label: null, weight_g: 1000, unit: 'g', raw: s };
    };

    const parseQuantityEntries = (quantity: string | undefined): string[] => {
        if (!quantity) return [];
        return quantity.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
    };

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
            setIsAdmin(!!(user?.email && adminEmail && user.email === adminEmail));
        });
    }, []);

    // Synchronize local foods state with centralized hook data
    useEffect(() => {
        if (pantryLoading) return;
        
        const combined = dbPantryItems.map(item => ({
            id: item.food_item_id || item.id,
            name: item.name,
            common_name: item.food_items?.common_name || item.name,
            energy_kcal: item.food_items?.energy_kcal || 0,
            protein_g: item.food_items?.protein_g || 0,
            carbs_g: item.food_items?.carbs_g || 0,
            fat_g: item.food_items?.fat_g || 0,
            image: item.food_items?.image || null,
            is_in_pantry: true,
            is_favorite: item.food_items?.is_favorite || false,
            category: item.food_items?.category || 'General',
            source_table: 'pantry_items' as const,
            quantity: quantities[item.food_item_id || item.id] || ''
        }));
        
        setFoods(combined);
        setLoading(false);
    }, [dbPantryItems, quantities, pantryLoading]);

    // Fetch portions when a buyMoreItem is selected
    useEffect(() => {
        if (!buyMoreItem) { setBuyMorePortions([]); setBuyMoreSelectedPortion(null); return; }
        const foodId = buyMoreItem.source_table === 'food_items' ? buyMoreItem.id : null;
        if (!foodId) return;
        fetchFoodMeasures(foodId)
            .then(measures => setBuyMorePortions(measures || []))
            .catch(() => setBuyMorePortions([]));
    }, [buyMoreItem?.id]);

    // Fetch portions when a removeItem is selected
    useEffect(() => {
        if (!removeItem) { setRemovePortions([]); setRemoveSelectedPortion(null); return; }
        const foodId = removeItem.source_table === 'food_items' ? removeItem.id : null;
        if (!foodId) return;
        fetchFoodMeasures(foodId)
            .then(measures => setRemovePortions(measures || []))
            .catch(() => setRemovePortions([]));
    }, [removeItem?.id]);
    const openBuyMore = (food: FoodItem) => {
        if (expandedAddId === food.id) {
            setExpandedAddId(null);
            setBuyMoreItem(null);
            return;
        }
        setExpandedRemoveId(null);
        setRemoveItem(null);
        setBuyMoreItem(food);
        setBuyMoreQty('1');
        setBuyMoreWeight('');
        setBuyMoreUnit('g');
        setBuyMoreSelectedPortion(null);
        setQuickAddMode('pantry');
        setExpandedAddId(food.id);
    };

    const openRemove = (food: FoodItem) => {
        if (expandedRemoveId === food.id) {
            setExpandedRemoveId(null);
            setRemoveItem(null);
            return;
        }
        setExpandedAddId(null);
        setBuyMoreItem(null);
        setRemoveItem(food);
        setRemoveQty('1');
        setRemoveWeight('');
        setRemoveUnit('g');
        setRemoveSelectedPortion(null);
        setExpandedRemoveId(food.id);
    };

    const buildQuantityString = (qty: string, portion: { label: string; weight_g: number } | null, weight: string, unit: string): string => {
        if (portion) return `${qty} ${portion.label} (${portion.weight_g}g)`;
        if (weight) return `${qty} x ${weight}${unit}`;
        return qty;
    };
    const isWeightOnlyEntry = (entry: QuantityEntry): boolean => {
        if (!entry.label) return entry.weight_g != null && (entry.unit === 'g' || entry.unit === null);
        return /^(gram|kilogram)s?$/i.test(entry.label);
    };

    const entryTotalGrams = (entry: QuantityEntry): number => (entry.qty || 0) * (entry.weight_g || 0);

    const formatGramsEntry = (grams: number): string => {
        if (grams >= 1000) return `${parseFloat((grams / 1000).toFixed(3))} kg`;
        return `${Math.round(grams)} g`;
    };

    const handleBuyMoreAdd = async () => {
        if (!buyMoreItem) return;
        setBuyMoreAdding(true);
        try {
            const quantityString = buildQuantityString(buyMoreQty, buyMoreSelectedPortion, buyMoreWeight, buyMoreUnit);

            if (quickAddMode === 'pantry') {
                const currentQty = quantities[buyMoreItem.id] || '';
                const merged = mergeQuantityStrings(currentQty, quantityString);
                
                // Check if merged result is 0 - if so, move to shopping list
                const parseTest = parseQuantityEntry(merged);
                const totalGrams = (parseTest.qty || 0) * (parseTest.weight_g || 0);
                const isZero = totalGrams === 0 || merged === '0' || merged === '';
                
                if (isZero) {
                    await addShoppingItem({
                        name: buyMoreItem.common_name || buyMoreItem.name,
                        food_item_id: buyMoreItem.id,
                        quantity: 'As needed',
                        source: 'manual',
                    });
                    
                    await dbRemoveFromPantry(buyMoreItem.id);
                    toast.success(`${buyMoreItem.common_name || buyMoreItem.name} moved to shopping list`);
                } else {
                    const cleaned = stripZeroEntries(merged);
                    await updateQuantity(buyMoreItem.id, cleaned);
                    toast.success(`Updated quantity for ${buyMoreItem.common_name || buyMoreItem.name}`);
                }
            } else {
                await addShoppingItem({
                    name: buyMoreItem.common_name || buyMoreItem.name,
                    quantity: quantityString,
                    source: 'manual'
                });
                toast.success(`Added to groceries`);
            }
            setBuyMoreItem(null);
            setExpandedAddId(null);
        } catch (e) {
            toast.error('Failed to add item');
        } finally {
            setBuyMoreAdding(false);
        }
    };

    const handleRemove = async () => {
        if (!removeItem) return;
        setRemoveRemoving(true);
        try {
            const quantityString = buildQuantityString(removeQty, removeSelectedPortion, removeWeight, removeUnit);
            const currentQty = quantities[removeItem.id] || '0';
            
            // Parse current and remove quantities to get grams
            const currentRaw = currentQty.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
            let currentGrams = 0;
            for (const entry of currentRaw) {
                const parsed = parseQuantityEntry(entry);
                currentGrams += (parsed.qty || 0) * (parsed.weight_g || 0);
            }
            
            // Calculate grams to remove
            const removeEntry = parseQuantityEntry(quantityString);
            const removeGrams = (removeEntry.qty || 0) * (removeEntry.weight_g || 0);
            
            const remainingGrams = Math.max(0, currentGrams - removeGrams);
            if (remainingGrams === 0 || currentGrams === 0) {
                await addShoppingItem({
                    name: removeItem.common_name || removeItem.name,
                    food_item_id: removeItem.id,
                    quantity: 'As needed',
                    source: 'manual',
                });
                
                await dbRemoveFromPantry(removeItem.id);
                toast.success(`${removeItem.common_name || removeItem.name} depleted and moved to shopping list`);
            } else {
                // Subtract grams proportionally from each entry, then strip zeros
                let gramsToRemove = removeGrams;
                const updatedEntries: string[] = [];
                for (const entry of currentRaw) {
                    const parsed = parseQuantityEntry(entry);
                    const entryG = (parsed.qty || 0) * (parsed.weight_g || 0);
                    if (entryG <= 0) continue;
                    if (gramsToRemove >= entryG) {
                        gramsToRemove -= entryG;
                    } else if (gramsToRemove > 0 && parsed.weight_g && parsed.weight_g > 0) {
                        const remainingEntryG = entryG - gramsToRemove;
                        gramsToRemove = 0;
                        if (parsed.label && !isWeightOnlyEntry(parsed)) {
                            const newQty = Math.max(0, Math.round((remainingEntryG / parsed.weight_g) * 100) / 100);
                            if (newQty > 0) updatedEntries.push(`${newQty} ${parsed.label} (${parsed.weight_g}g)`);
                        } else {
                            updatedEntries.push(formatGramsEntry(remainingEntryG));
                        }
                    } else {
                        updatedEntries.push(entry);
                    }
                }
                const remainingStr = updatedEntries.length > 0 ? updatedEntries.join(' + ') : formatGramsEntry(remainingGrams);
                const cleaned = stripZeroEntries(remainingStr);
                await updateQuantity(removeItem.id, cleaned);
                toast.success(`Removed ${quantityString} from ${removeItem.common_name || removeItem.name}`);
            }
            
            setRemoveItem(null);
            setExpandedRemoveId(null);
        } catch (e) {
            console.error('[handleRemove] Error:', e);
            toast.error('Failed to remove quantity');
        } finally {
            setRemoveRemoving(false);
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


    const confirmDelete = (id: string, name: string, commonName: string = '', source: string = 'food_items') => {
        const displayName = commonName || name;
        setDeleteConfirm({ id, name, source });
        
        toast.custom(
            (t) => (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Remove <span className="font-black text-rose-600 dark:text-rose-400">{displayName}</span> from pantry?
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                setDeleteConfirm(null);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                removeFromPantryAction(id, name);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 rounded transition-colors"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const confirmDeleteCategory = (categoryName: string, items: FoodItem[]) => {
        if (items.length === 0) return;
        
        toast.custom(
            (t) => (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-lg max-w-sm">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        Remove all <span className="font-black text-rose-600 dark:text-rose-400">{items.length} {categoryName}</span> items?
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                deleteCategory(categoryName, items);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800 rounded transition-colors"
                        >
                            Delete All
                        </button>
                    </div>
                </div>
            ),
            { duration: Infinity }
        );
    };

    const deleteCategory = async (categoryName: string, items: FoodItem[]) => {
        try {
            for (const food of items) {
                await dbRemoveFromPantry(food.id);
            }
            toast.success(`${categoryName} category cleared`);
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error("Failed to delete category.");
        }
    };

    const removeFromPantryAction = async (id: string, name: string) => {
        try {
            await dbRemoveFromPantry(id);
            setDeleteConfirm(null);
            toast.success(`${name} removed from pantry`);
        } catch (error) {
            console.error('Error removing from pantry:', error);
            toast.error("Failed to remove item.");
        }
    };

    const clearPantry = async () => {
        if (!confirm('Remove all items from your pantry?')) return;
        try {
            for (const food of foods) {
                await dbRemoveFromPantry(food.id);
            }
            toast.success('Pantry cleared');
        } catch (error) {
            console.error('Error clearing pantry:', error);
            toast.error('Failed to clear pantry');
        }
    };

    const updatePantryQuantity = async (item: FoodItem, newQty: string, newWeight: string, newUnit: string) => {
        const quantityString = newWeight ? `${newQty} x ${newWeight}${newUnit}` : newQty;
        const parseTest = parseQuantityEntry(quantityString);
        const totalGrams = (parseTest.qty || 0) * (parseTest.weight_g || 0);
        const isZero = totalGrams === 0 || quantityString === '0' || quantityString === '';
        
        if (isZero) {
            await addShoppingItem({
                name: item.common_name || item.name,
                food_item_id: item.id,
                quantity: 'As needed',
                source: 'manual',
            });
            await dbRemoveFromPantry(item.id);
            toast.success(`${item.common_name || item.name} moved to shopping list`);
            return;
        }

        await updateQuantity(item.id, quantityString);
        setBuyMoreItem(null);
        toast.success(`Updated quantity for "${item.name}"`);
    };

    const addToShoppingList = (food: FoodItem) => {
        const itemName = food.common_name || food.name;
        const foodId = food.id;
        const qtyStr = buyMoreWeight ? `${buyMoreQty} x ${buyMoreWeight}${buyMoreUnit}` : buyMoreQty;

        addShoppingItem({
            name: itemName,
            quantity: qtyStr,
            food_item_id: foodId,
            source: 'manual'
        });
        toast.success(`Added ${qtyStr} "${itemName}" to groceries`);
        setBuyMoreItem(null);
        setBuyMoreQty('1');
    };

    const filteredFoods = foods.filter(food => {
        const matchesSearch = (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorites = !externalShowFavoritesOnly || food.is_favorite;
        const matchesCategory = !externalSelectedCategories || externalSelectedCategories.length === 0 || externalSelectedCategories.includes(food.category || 'General');

        return matchesSearch && matchesFavorites && matchesCategory;
    }).sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
            comparison = (a.common_name || a.name).localeCompare(b.common_name || b.name);
        } else if (sortField === 'category') {
            comparison = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'weight') {
            // Need a tiny helper to get weight for comparison
            const getWeight = (f: FoodItem) => {
                const entries = (f.quantity || '').split(' + ');
                let total = 0;
                for (const e of entries) {
                    const parsed = parseQuantityEntry(e);
                    total += (parsed.qty || 0) * (parsed.weight_g || 0);
                }
                return total;
            };
            comparison = getWeight(a) - getWeight(b);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Grouping logic - by category section (only if sorting by category)
    const groupedFoods = sortField === 'category' ? filteredFoods.reduce((acc, food) => {
        const categoryGroup = getCategoryGroup(food.category);
        if (!acc[categoryGroup]) acc[categoryGroup] = [];
        acc[categoryGroup].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>) : { 'All Items': filteredFoods };

    // Sort groups - use actual DB category names
    const categoryOrder = ['Fruit', 'Vegetables', 'Grains', 'Legumes', 'Proteins', 'Nuts', 'Oils', 'Flavour', 'Supplements', 'Other'];
    const groupNames = Object.keys(groupedFoods).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    return (
        <TrackerTabShell
            title="Pantry"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            sortOptions={sortOptions}
            showFilters={true}
            onFilterClick={() => {
                // Filter by category
                setSortField('category');
            }}
            hasActiveFilters={sortField === 'category'}
            dropdownContent={dropdownContent}
        >
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
                        onClick={() => router.push('/foods')}
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
                                    <div className={cn("text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-400")}>
                                        {<colors.icon size={18} className="text-slate-600 dark:text-slate-500" />}
                                        {groupName}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); confirmDeleteCategory(groupName, items); }}
                                            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors flex-shrink-0"
                                            title="Delete all items in this category"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        {items.map((food) => (
                                            <div key={food.id}>
                                                {/* Main food item card - always visible */}
                                                <div
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedQuantityId(expandedQuantityId === food.id ? null : food.id);
                                                    }}
                                                >
                                                    {/* Food Image */}
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shrink-0 flex items-center justify-center">
                                                        {food.image ? (
                                                            <img src={food.image} alt={food.common_name || food.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Beef size={20} className="text-slate-400 dark:text-slate-500" />
                                                        )}
                                                    </div>

                                                    {/* Name - flex grow to take available space */}
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-black text-xs uppercase tracking-wide text-slate-900 dark:text-white truncate block">
                                                            {formatFoodName(food.common_name || food.name)}
                                                        </span>
                                                    </div>

                                                    {/* Weight badge */}
                                                    {(() => {
                                                        const rawEntries = parseQuantityEntries(food.quantity);
                                                        if (rawEntries.length === 0) return <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">In Stock</span>;
                                                        let weightGramsTotal = 0;
                                                        const nonWeightStrs: string[] = [];
                                                        for (const raw of rawEntries) {
                                                            const parsed = parseQuantityEntry(raw);
                                                            if (parsed.qty > 0 && isWeightOnlyEntry(parsed)) {
                                                                weightGramsTotal += entryTotalGrams(parsed);
                                                            } else if (parsed.qty > 0) {
                                                                nonWeightStrs.push(raw);
                                                            }
                                                        }
                                                        let totalGramsAll = weightGramsTotal;
                                                        for (const raw of nonWeightStrs) {
                                                            const p = parseQuantityEntry(raw);
                                                            if (p.weight_g != null) totalGramsAll += p.qty * p.weight_g;
                                                        }
                                                        if (totalGramsAll > 0) return <span className="text-xs font-black text-white bg-emerald-900 px-3 py-1 rounded-md whitespace-nowrap shrink-0">{formatGramsEntry(totalGramsAll)}</span>;
                                                        return null;
                                                    })()}

                                                    {/* Expand/collapse chevron */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setExpandedQuantityId(expandedQuantityId === food.id ? null : food.id); }}
                                                        className={cn("p-1.5 rounded-lg transition-all flex-shrink-0", expandedQuantityId === food.id ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40" : "text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:text-emerald-500")}
                                                        title="Expand actions"
                                                    >
                                                        <ChevronDown size={14} className={cn("transition-transform", expandedQuantityId === food.id && "rotate-180")} />
                                                    </button>
                                                </div>

                                                {/* Expanded action buttons - shown when expanded */}
                                                {expandedQuantityId === food.id && (
                                                    <div className="flex items-center gap-2 justify-center px-3 py-3 bg-slate-50 dark:bg-slate-900/30 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openBuyMore(food); }}
                                                            className={cn("p-2.5 rounded-lg transition-all flex-shrink-0", expandedAddId === food.id ? "text-amber-500 bg-amber-100 dark:bg-amber-950/40" : "text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500")}
                                                            title="Update quantity / add to list"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openRemove(food); }}
                                                            className={cn("p-2.5 rounded-lg transition-all flex-shrink-0", expandedRemoveId === food.id ? "text-rose-500 bg-rose-100 dark:bg-rose-950/40" : "text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-500")}
                                                            title="Remove/discard quantity"
                                                        >
                                                            <Minus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setExpandedStockBreakdownId(expandedStockBreakdownId === food.id ? null : food.id); }}
                                                            className={cn("p-2.5 rounded-lg transition-all flex-shrink-0", expandedStockBreakdownId === food.id ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/40" : "text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500")}
                                                            title="View stock breakdown"
                                                        >
                                                            <List size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                confirmDelete(food.id, food.name, food.common_name || '', food.source_table || 'food_items');
                                                            }}
                                                            className="p-2.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-all flex-shrink-0"
                                                            title="Remove from pantry"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Inline Add accordion */}
                                                {expandedAddId === food.id && buyMoreItem && (
                                                    <div className="mt-1 mb-0.5 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 animate-in slide-in-from-top-2 duration-200">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">Add Stock</p>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Qty</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={buyMoreQty}
                                                                    onChange={(e) => setBuyMoreQty(e.target.value)}
                                                                    className="w-full h-9 text-sm"
                                                                    onClick={(e) => e.stopPropagation()}
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
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        <option value="">Weight...</option>
                                                                        {(() => { const seen = new Set<number>(); return buyMorePortions.filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label)).filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; }).map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        )); })()}
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
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        {(() => { const seen = new Set<number>(); return buyMorePortions.filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label)).filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; }).map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        )); })()}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2">
                                                                    <div className="flex-1">
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Weight</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={buyMoreWeight}
                                                                            onChange={(e) => setBuyMoreWeight(e.target.value)}
                                                                            placeholder="e.g. 100"
                                                                            className="w-full h-9 text-sm"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Unit</Label>
                                                                        <select
                                                                            value={buyMoreUnit}
                                                                            onChange={(e) => setBuyMoreUnit(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-20 px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            <option value="g">g</option>
                                                                            <option value="ml">ml</option>
                                                                            <option value="oz">oz</option>
                                                                            <option value="lb">lb</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <Button
                                                                onClick={(e) => { e.stopPropagation(); handleBuyMoreAdd(); }}
                                                                disabled={buyMoreAdding}
                                                                className="w-full h-10 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs"
                                                            >
                                                                <Plus size={16} />
                                                                {buyMoreAdding ? 'Adding...' : 'Add'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Inline Remove accordion */}
                                                {expandedRemoveId === food.id && removeItem && (
                                                    <div className="mt-1 mb-0.5 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/20 animate-in slide-in-from-top-2 duration-200">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3">Remove Stock</p>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Qty</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={removeQty}
                                                                    onChange={(e) => setRemoveQty(e.target.value)}
                                                                    className="w-full h-9 text-sm"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>

                                                            {removePortions.length > 0 && !removeSelectedPortion ? (
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const p = removePortions.find(p => p.label === e.target.value);
                                                                            if (p) setRemoveSelectedPortion(p);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        <option value="">Weight...</option>
                                                                        {(() => { const seen = new Set<number>(); return removePortions.filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label)).filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; }).map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        )); })()}
                                                                    </select>
                                                                </div>
                                                            ) : removeSelectedPortion ? (
                                                                <div>
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Serving</Label>
                                                                    <select
                                                                        value={removeSelectedPortion.label}
                                                                        onChange={(e) => {
                                                                            const p = removePortions.find(p => p.label === e.target.value);
                                                                            if (p) setRemoveSelectedPortion(p);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                    >
                                                                        {(() => { const seen = new Set<number>(); return removePortions.filter(p => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label)).filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; }).map(p => (
                                                                            <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                                                                        )); })()}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2">
                                                                    <div className="flex-1">
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Weight</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={removeWeight}
                                                                            onChange={(e) => setRemoveWeight(e.target.value)}
                                                                            placeholder="e.g. 100"
                                                                            className="w-full h-9 text-sm"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Unit</Label>
                                                                        <select
                                                                            value={removeUnit}
                                                                            onChange={(e) => setRemoveUnit(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-20 px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                                                        >
                                                                            <option value="g">g</option>
                                                                            <option value="ml">ml</option>
                                                                            <option value="oz">oz</option>
                                                                            <option value="lb">lb</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <Button
                                                                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                                                                disabled={removeRemoving}
                                                                className="w-full h-10 gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs"
                                                            >
                                                                <Minus size={16} />
                                                                {removeRemoving ? 'Removing...' : 'Remove'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quantity breakdown accordion */}
                                                {expandedStockBreakdownId === food.id && (() => {
                                                    const rawEntries = parseQuantityEntries(food.quantity).map(e => parseQuantityEntry(e)).filter(e => e.qty > 0);
                                                    // Consolidate pure-weight entries (gram, kilogram, "1 x Ng") into one line
                                                    let weightGramsTotal = 0;
                                                    const nonWeightEntries: QuantityEntry[] = [];
                                                    for (const e of rawEntries) {
                                                        if (isWeightOnlyEntry(e)) {
                                                            weightGramsTotal += entryTotalGrams(e);
                                                        } else {
                                                            // Consolidate non-weight entries with same label (e.g. merge multiple "1 Cup (21g)" into "3 Cup (21g)")
                                                            const existing = nonWeightEntries.find(n =>
                                                                n.label && e.label &&
                                                                n.label.toLowerCase() === e.label.toLowerCase() &&
                                                                n.weight_g != null && e.weight_g != null &&
                                                                Math.abs(n.weight_g - e.weight_g) < 1
                                                            );
                                                            if (existing) {
                                                                existing.qty += e.qty;
                                                            } else {
                                                                nonWeightEntries.push({ ...e });
                                                            }
                                                        }
                                                    }
                                                    const entries = [...nonWeightEntries];
                                                    if (weightGramsTotal > 0) {
                                                        entries.push(parseQuantityEntry(formatGramsEntry(weightGramsTotal)));
                                                    }
                                                    const foodName = formatFoodName(food.common_name || food.name);
                                                    return (
                                                        <div className="mt-1 mb-0.5 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">Stock Breakdown</p>
                                                            <div className="space-y-2">
                                                                {entries.map((e, i) => {
                                                                    const totalWeight = e.weight_g != null ? e.qty * e.weight_g : null;
                                                                    const isBulkWeight = isWeightOnlyEntry(e);
                                                                    return (
                                                                        <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-emerald-100 dark:border-emerald-900/40 last:border-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                                                {isBulkWeight ? (
                                                                                    <>
                                                                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">{totalWeight != null ? formatGramsEntry(totalWeight) : ''}</span>
                                                                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{foodName}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">{e.qty}</span>
                                                                                        {e.label ? (
                                                                                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{pluralizeUnit(e.label, e.qty)} {foodName}</span>
                                                                                        ) : e.weight_g != null ? (
                                                                                            <span className="text-sm font-semibold text-slate-400">� {e.weight_g}{e.unit} {foodName}</span>
                                                                                        ) : (
                                                                                            <span className="text-sm font-semibold text-slate-400">{foodName}</span>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-3 text-right">
                                                                                {!isBulkWeight && e.label && e.weight_g != null && (
                                                                                    <span className="text-[10px] font-medium text-slate-400">{e.weight_g}{e.unit} each</span>
                                                                                )}
                                                                                {!isBulkWeight && totalWeight != null && (
                                                                                    <span className="text-[11px] font-black text-white bg-emerald-500 px-2 py-1 rounded-md">{totalWeight.toLocaleString()}{e.unit} total</span>
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
        </TrackerTabShell>
    );
}