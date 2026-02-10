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
}

export function PantryView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false
}: PantryViewProps) {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchQuery } = useSearch();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const { dailyPlan, updateDailyPlan, energyUnit } = useUserPreferences();

    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories !== undefined ? externalSetSelectedCategories : setLocalSelectedCategories;

    // Shopping list quick-add state
    const [buyMoreItem, setBuyMoreItem] = useState<FoodItem | null>(null);
    const [buyMoreQty, setBuyMoreQty] = useState('1');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

    useEffect(() => {
        fetchPantry();
    }, []);

    const toggleFavorite = async (item: FoodItem, e: React.MouseEvent) => {
        e.stopPropagation();
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
                    category: fi?.category || sp?.category || 'General',
                    source_table: 'pantry_items',
                    quantity: item.quantity
                } as FoodItem;
            });

            const combined = [
                ...curatedFoods.map(f => ({ ...f, source_table: 'food_items' as const })),
                ...personalFoods
            ];

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
            const newQty = parseQty(buyMoreQty);

            if (oldQty && newQty && oldQty.unit === newQty.unit) {
                const sum = oldQty.num + newQty.num;
                manualItems[existingIndex].quantity = oldQty.unit ? `${sum} ${oldQty.unit}` : `${sum}`;
            } else {
                // Different units, concatenate
                manualItems[existingIndex].quantity = `${existing.quantity} + ${buyMoreQty}`;
            }

            toast.success(`Updated "${itemName}" quantity in shopping list`);
        } else {
            // Add new item
            const newItem = {
                id: `manual-${Date.now()}`,
                name: itemName,
                quantity: buyMoreQty,
                unit: '',
                checked: false,
                source: 'manual',
                food_item_id: foodId
            };
            manualItems.push(newItem);
            toast.success(`Added ${buyMoreQty}× "${itemName}" to shopping list`);
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

    // Grouping logic
    const groupedFoods = filteredFoods.reduce((acc, food) => {
        const key = food.common_name || food.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>);

    const groupNames = Object.keys(groupedFoods).sort();
    return (
        <div className="space-y-8">
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
                        onClick={() => router.push('/dashboard/ingredients')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        Stock Up Now
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Food Items Grouped List */}
                    <div className="space-y-6">
                        {groupNames.map((groupName) => {
                            const items = groupedFoods[groupName];
                            const isExpanded = expandedGroups[groupName] || (searchQuery.length > 0 && items.length > 0);
                            const hasMultiple = items.length > 1;

                            return (
                                <div key={groupName} className="space-y-2">
                                    {/* Group Header */}
                                    {hasMultiple && (
                                        <div
                                            onClick={(e) => toggleGroup(groupName, e)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all shadow-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group/header",
                                                isExpanded && "border-emerald-500/30 ring-1 ring-emerald-500/10"
                                            )}
                                        >
                                            {/* Thumbnail for group */}
                                            <div className="w-16 h-12 rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-inner group-hover/header:scale-105 transition-transform duration-300">
                                                {items[0]?.image ? (
                                                    <img src={items[0].image} alt={groupName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Beef size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                        {groupName}
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0 shrink-0">
                                                            {items.length} options
                                                        </Badge>
                                                    </h2>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-70">
                                                        {items.map(i => i.name).join(' • ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Items in Group */}
                                    <div className={cn("space-y-3", hasMultiple && "pl-6 lg:pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-3 lg:ml-7")}>
                                        {(isExpanded || !hasMultiple) && items.map((food) => (
                                            <div
                                                key={food.id}
                                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all overflow-hidden"
                                            >
                                                {/* Desktop Grid */}
                                                <div className="flex items-center justify-between p-4 lg:p-0 lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_180px] gap-4 lg:items-center lg:px-8">
                                                    {/* Thumbnail */}
                                                    <div className="hidden lg:block aspect-square w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                                        {food.image ? (
                                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Beef size={24} className="opacity-20" />
                                                            </div>
                                                        )}

                                                        <div className="absolute bottom-1 left-1 right-1 z-10">
                                                            <div className="bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-black px-1.5 py-1 rounded-lg text-center truncate uppercase tracking-tighter shadow-lg border border-white/20">
                                                                {food.quantity || '1'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 lg:flex-none lg:p-0">
                                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                                            {food.name}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase font-black">
                                                                {food.category}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Stats (Desktop View) */}
                                                    <div className="hidden lg:flex flex-col items-end">
                                                        <span className="text-[9px] uppercase font-black text-slate-400">Energy</span>
                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                            {formatEnergy(food.energy_kcal, energyUnit)}
                                                        </span>
                                                    </div>
                                                    <div className="hidden lg:flex flex-col items-end">
                                                        <span className="text-[9px] uppercase font-black text-slate-400">Carbs</span>
                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                            {food.carbs_g.toFixed(1)}g
                                                        </span>
                                                    </div>
                                                    <div className="hidden lg:flex flex-col items-end">
                                                        <span className="text-[9px] uppercase font-black text-slate-400">Fat</span>
                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                            {food.fat_g.toFixed(1)}g
                                                        </span>
                                                    </div>
                                                    <div className="hidden lg:flex flex-col items-end">
                                                        <span className="text-[9px] uppercase font-black text-slate-400">Protein</span>
                                                        <span className="font-black text-sm text-slate-900 dark:text-white">
                                                            {food.protein_g.toFixed(1)}g
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="lg:p-0 flex justify-end lg:justify-center">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn("h-9 w-9 rounded-xl transition-all bg-transparent", food.is_favorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                                                                onClick={(e) => toggleFavorite(food, e)}
                                                                title="Favorite"
                                                            >
                                                                <Heart size={16} fill={food.is_favorite ? "currentColor" : "none"} />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setBuyMoreItem(buyMoreItem?.id === food.id ? null : food);
                                                                    setBuyMoreQty('1');
                                                                }}
                                                                className={cn(
                                                                    "h-9 w-9 rounded-xl transition-colors",
                                                                    buyMoreItem?.id === food.id
                                                                        ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                                                        : "text-slate-400 hover:text-emerald-500 transition-all"
                                                                )}
                                                                title="Quick Add"
                                                            >
                                                                <Plus size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFromPantry(food.id, food.name, food.source_table)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => router.push(`/dashboard/ingredients/${food.id}`)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                            >
                                                                <ArrowRight size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Action Slide-out */}
                                                {buyMoreItem?.id === food.id && (
                                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300">
                                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                                                    <ShoppingBasket size={24} className="text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Quick Action</p>
                                                                    <h4 className="font-black text-sm uppercase italic">Add to {quickAddMode === 'pantry' ? 'Pantry' : 'Groceries'}</h4>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setQuickAddMode('pantry'); }}
                                                                        className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'pantry' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400")}
                                                                    >
                                                                        Pantry
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setQuickAddMode('shopping'); }}
                                                                        className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", quickAddMode === 'shopping' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400")}
                                                                    >
                                                                        Groceries
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 h-11">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Qty</span>
                                                                    <input
                                                                        type="text"
                                                                        value={buyMoreQty}
                                                                        onChange={(e) => setBuyMoreQty(e.target.value)}
                                                                        className="w-12 bg-transparent border-none text-center font-black text-sm focus:ring-0"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (quickAddMode === 'shopping') {
                                                                            addToShoppingList(food);
                                                                        } else {
                                                                            toast.success(`"${food.name}" quantity updated in kitchen`);
                                                                            setBuyMoreItem(null);
                                                                        }
                                                                    }}
                                                                    className={cn("h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl", quickAddMode === 'pantry' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white")}
                                                                >
                                                                    Add to {quickAddMode === 'pantry' ? 'Pantry' : 'Groceries'}
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setBuyMoreItem(null); }} className="h-11 w-11 rounded-xl"><X size={18} /></Button>
                                                            </div>
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
