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
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

    useEffect(() => {
        fetchPantry();
    }, [refreshKey]);

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
                                            <div
                                                key={food.id}
                                                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:bg-white dark:hover:bg-slate-800"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Could add selection state here for multi-select
                                                }}
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
                                                            {food.common_name || food.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{food.quantity || 'In Stock'}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setBuyMoreItem(food); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/40 text-slate-400 hover:text-blue-500 transition-all"
                                                    title="Add more to shopping list"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(food, e); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition-all"
                                                    title="Favorite"
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

