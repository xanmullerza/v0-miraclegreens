'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Beef, Filter, ChevronDown, Leaf } from 'lucide-react';

import { cn, formatFoodName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { FoodFormDialog } from '@/components/ingredients/food-form-dialog';

const CAL_TO_KJ = 4.184;
const CATEGORIES = ['General', 'Vegetables', 'Grains', 'Legumes', 'Oils', 'Proteins', 'Fruit', 'Nuts', 'Flavour', 'Supplements', 'Mixes'];
const PAGE_SIZE = 20;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    return `${Math.round(calories).toLocaleString()} kC`;
}

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_favorite: boolean;
    is_in_pantry: boolean;
    category?: string;
    quantity?: string;
    user_id?: string | null;
    is_curated?: boolean;
}


interface ExploreViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategories?: string[];
    setSelectedCategories?: React.Dispatch<React.SetStateAction<string[]>>;
    showAddFood?: boolean;
    setShowAddFood?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ExploreView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    showAddFood = false,
    setShowAddFood,
}: ExploreViewProps) {
    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const { searchQuery } = useSearch();

    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [user, setUser] = useState<any>(null);

    // Allow controlled or uncontrolled filter state
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly ?? setLocalShowFavoritesOnly;

    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories ?? setLocalSelectedCategories;

    const hasMore = foods.length < totalCount;

    // Auth
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
        return () => subscription.unsubscribe();
    }, []);

    // Fetch on filter/user change (immediate)
    useEffect(() => {
        fetchFoods(1, true);
    }, [showFavoritesOnly, selectedCategories, user]);

    // Fetch on search change (debounced)
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => fetchFoods(1, true), 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery]);

    const fetchFoods = async (pageNum: number, isNewSearch = false) => {
        setLoading(true);
        try {
            let query = supabase.from('food_items').select('*', { count: 'exact' });

            // 1. Scoping: Curated OR User's own
            if (user) {
                query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
            } else {
                query = query.eq('is_curated', true);
            }

            // 2. Filtering
            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length) {
                query = query.in('category', selectedCategories);
            }

            const from = (pageNum - 1) * PAGE_SIZE;
            query = query.range(from, from + PAGE_SIZE - 1).order('name', { ascending: true });

            const { data, error, count } = await query;
            if (error) throw error;

            let fetchedItems = (data as FoodItem[]) || [];

            // Merge local (guest) foods
            if (!user) {
                try {
                    const raw = localStorage.getItem('local_foods');
                    if (raw) {
                        let localFoods: FoodItem[] = JSON.parse(raw);
                        if (searchQuery.trim()) {
                            localFoods = localFoods.filter(f =>
                                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (f.common_name && f.common_name.toLowerCase().includes(searchQuery.toLowerCase()))
                            );
                        }
                        if (showFavoritesOnly) localFoods = localFoods.filter(f => f.is_favorite);
                        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES.length) {
                            localFoods = localFoods.filter(f => f.category && selectedCategories.includes(f.category));
                        }
                        fetchedItems = [...localFoods, ...fetchedItems];
                    }
                } catch { /* ignore */ }
            }

            // Merge locally-stored pantry quantities
            try {
                const raw = localStorage.getItem('pantry_quantities');
                if (raw) {
                    const quantities: Record<string, string> = JSON.parse(raw);
                    fetchedItems.forEach(item => {
                        if (quantities[item.id]) {
                            item.quantity = quantities[item.id];
                            item.is_in_pantry = true;
                        }
                    });
                }
            } catch { /* ignore */ }

            if (isNewSearch) {
                setFoods(fetchedItems);
                setPage(1);
            } else {
                setFoods(prev => {
                    const existingIds = new Set(prev.map(f => f.id));
                    return [...prev, ...fetchedItems.filter(f => !existingIds.has(f.id))];
                });
                setPage(pageNum);
            }
            setTotalCount(count ?? 0);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load foods');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* List Container */}
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                {showAddFood && setShowAddFood ? (
                    <FoodFormDialog onClose={() => setShowAddFood(false)} />
                ) : (
                    <>
                        {/* Sticky Header */}
                        <div className="border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 bg-slate-100 dark:bg-slate-900/80 rounded-t-[2rem]">
                            <div className="hidden lg:grid lg:grid-cols-[60px_1fr_100px_80px_80px_80px] gap-3 lg:gap-4 lg:items-center lg:px-10 py-1 w-full">
                                <div className="flex items-center justify-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center transition-all border relative',
                                                (showFavoritesOnly || selectedCategories.length > 0)
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                            )}>
                                                <Filter size={13} />
                                                {(selectedCategories.length > 0 || showFavoritesOnly) && (
                                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center bg-emerald-600 text-white text-[7px] font-black rounded-full">
                                                        {selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                                                    </span>
                                                )}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-2">
                                            <div className="px-2 py-1.5">
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favorites Only</span>
                                                    <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                                            <div className="px-2">
                                                <div className="flex items-center justify-between py-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 px-0">Categories</DropdownMenuLabel>
                                                    {selectedCategories.length > 0 && (
                                                        <button onClick={() => setSelectedCategories([])} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">Clear</button>
                                                    )}
                                                </div>
                                                <div className="py-1">
                                                    {CATEGORIES.map(category => (
                                                        <DropdownMenuCheckboxItem
                                                            key={category}
                                                            checked={selectedCategories.includes(category)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setSelectedCategories(prev => [...prev, category]);
                                                                else setSelectedCategories(prev => prev.filter(c => c !== category));
                                                            }}
                                                            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-emerald-50 dark:focus:bg-emerald-900/10 focus:text-emerald-600 py-2.5 cursor-pointer"
                                                        >
                                                            {category}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </div>
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Energy</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Carbs</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Fat</div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Protein</div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-2 p-4">
                            {loading && foods.length === 0 && (
                                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Foods...</p>
                                </div>
                            )}

                            {!loading && foods.length === 0 && (
                                <div className="py-16 text-center">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                        <Leaf size={22} className="opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No foods match your filters</p>
                                </div>
                            )}

                            {foods.map((food) => (
                                <div
                                    key={food.id}
                                    onClick={() => router.push(`/dashboard/ingredients/foods/${food.id}`)}
                                    className="group bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                                >
                                    <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_100px_80px_80px_80px] gap-3 lg:gap-4 lg:items-center lg:px-6 py-1 w-full">
                                        {/* Thumbnail */}
                                        <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Beef size={24} className="opacity-10" />
                                                </div>
                                            )}
                                            {food.is_in_pantry && (
                                                <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                                                    <Check size={8} strokeWidth={4} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Name + mobile stats */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize truncate">
                                                {formatFoodName(food.common_name || food.name)}
                                            </h3>
                                            {food.quantity && (
                                                <Badge className="mt-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] border-none uppercase font-black tracking-tight">
                                                    {food.quantity}
                                                </Badge>
                                            )}
                                            <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                                <span className="text-blue-500">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-emerald-500">{food.protein_g.toFixed(0)}g P</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-amber-500">{food.carbs_g.toFixed(0)}g C</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-rose-500">{food.fat_g.toFixed(0)}g F</span>
                                            </div>
                                        </div>

                                        {/* Desktop stats */}
                                        <div className="hidden lg:flex items-center justify-end">
                                            <span className="font-black text-[11px] text-blue-500 dark:text-blue-400">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                        </div>
                                        <div className="hidden lg:flex items-center justify-end">
                                            <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{food.carbs_g.toFixed(1)}g</span>
                                        </div>
                                        <div className="hidden lg:flex items-center justify-end">
                                            <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{food.fat_g.toFixed(1)}g</span>
                                        </div>
                                        <div className="hidden lg:flex items-center justify-end">
                                            <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{food.protein_g.toFixed(1)}g</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        onClick={() => fetchFoods(page + 1)}
                        disabled={loading}
                        className="h-12 px-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-40"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}

