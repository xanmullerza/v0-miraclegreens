'use client';

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
    ArrowDownUp, Loader2, Check, Beef, Filter, ChevronDown, Leaf, Search, ShoppingCart, List, Package,
    Info, Activity, Settings, FlaskConical, ChevronRight
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { cn, formatFoodName, formatEnergy, type FoodItem } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { CATEGORIES, FoodFiltersPanel } from '@/components/foods/food-filters-panel';
import { FoodFormDialog } from '@/components/admin/ingredients/food-form-dialog';
import { usePantry } from '@/hooks/use-pantry';
import { TrackerTabShell, SortOption } from '@/components/tracker/tracker-tab-shell';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PAGE_SIZE = 20;

const FOOD_SORT_OPTIONS = [
    { id: 'name', label: 'A-Z' },
    { id: 'energy_kcal', label: 'Energy' },
    { id: 'protein_g', label: 'Protein' },
    { id: 'carbs_g', label: 'Carbs' },
    { id: 'fat_g', label: 'Fat' },
] as const;

interface FoodsViewProps {
    showAddFood?: boolean;
    setShowAddFood?: Dispatch<SetStateAction<boolean>>;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    hideControls?: boolean;
    noContainer?: boolean;
    dropdownContent?: React.ReactNode;
}

export function FoodsView({
    showAddFood = false,
    setShowAddFood,
    searchQuery: externalSearchQuery,
    onSearchChange,
    hideControls = false,
    noContainer = false,
    dropdownContent
}: FoodsViewProps) {
    const { energyUnit } = useUserPreferences();
    const { searchQuery, setSearchQuery } = useSearch();
    const { quantities, pantryItems, loading: pantryLoading } = usePantry();

    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(false);
    const [cartLoading, setCartLoading] = useState<string | null>(null);

    const { showFavoritesOnly, setShowFavoritesOnly, selectedCategories, setSelectedCategories } = useFoodFilter();
    const { setIsActionPanelOpen, setActiveView } = useActionPanel();
    const [sortField, setSortField] = useState<'name' | 'energy_kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortOptions, setShowSortOptions] = useState(false);

    const currentSortLabel = FOOD_SORT_OPTIONS.find(opt => opt.id === sortField)?.label || 'Sort';

    const handleAddToCart = (e: React.MouseEvent, food: FoodItem) => {
        e.preventDefault();
        e.stopPropagation();
        setCartLoading(food.id);

        // Simulate adding to cart
        setTimeout(() => {
            toast.success(`${food.common_name || food.name} added to cart (R${food.price?.toFixed(2) || '0.00'})`);
            setCartLoading(null);
        }, 300);
    };

    // Use external searchQuery if provided, otherwise use internal from useSearch
    const effectiveSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;

    // Auth logic
    useEffect(() => {
        let resolvedViaGetSession = false;
        supabase.auth.getSession().then(({ data: { session } }) => {
            resolvedViaGetSession = true;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' && resolvedViaGetSession) return;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Single fetch function
    const fetchFoods = useCallback(async (
        pageNum: number,
        opts: { q: string; favOnly: boolean; cats: string[]; currentUser: User | null; sortField: string; sortDirection: 'asc' | 'desc' },
        isNewSearch = false,
    ) => {
        setLoading(true);
        try {
            let query = supabase.from('food_items').select('*', { count: 'exact' });

            if (opts.currentUser) {
                query = query.or(`is_curated.eq.true,user_id.eq.${opts.currentUser.id}`);
            } else {
                query = query.eq('is_curated', true);
            }
            if (opts.q) {
                query = query.or(`name.ilike.%${opts.q}%,common_name.ilike.%${opts.q}%`);
            }
            if (opts.favOnly) {
                query = query.eq('is_favorite', true);
            }
            if (opts.cats.length > 0 && opts.cats.length < CATEGORIES.length) {
                query = query.in('category', opts.cats);
            }

            const from = (pageNum - 1) * PAGE_SIZE;
            query = query.range(from, from + PAGE_SIZE - 1).order(opts.sortField, { ascending: opts.sortDirection === 'asc' });

            const { data, error, count } = await query;
            if (error) throw error;

            let fetchedItems = (data ?? []) as FoodItem[];
            const dbTotal = count ?? 0;
            const dbFetched = fetchedItems.length;

            // Prepend local (guest) foods
            if (!opts.currentUser) {
                try {
                    const raw = localStorage.getItem('local_foods');
                    if (raw) {
                        let localFoods: FoodItem[] = JSON.parse(raw);
                        if (opts.q.trim()) {
                            localFoods = localFoods.filter(f =>
                                f.name.toLowerCase().includes(opts.q.toLowerCase()) ||
                                (f.common_name && f.common_name.toLowerCase().includes(opts.q.toLowerCase()))
                            );
                        }
                        if (opts.favOnly) localFoods = localFoods.filter(f => f.is_favorite);
                        if (opts.cats.length > 0 && opts.cats.length < CATEGORIES.length) {
                            localFoods = localFoods.filter(f => f.category && opts.cats.includes(f.category));
                        }
                        if (isNewSearch) fetchedItems = [...localFoods, ...fetchedItems];
                    }
                } catch { /* ignore */ }
            }

            const sortFoods = (items: FoodItem[]) => {
                return [...items].sort((a, b) => {
                    if (opts.sortField === 'name') {
                        return opts.sortDirection === 'asc'
                            ? a.name.localeCompare(b.name)
                            : b.name.localeCompare(a.name);
                    }
                    const aVal = Number(a[opts.sortField as keyof FoodItem] ?? 0);
                    const bVal = Number(b[opts.sortField as keyof FoodItem] ?? 0);
                    return opts.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });
            };
            fetchedItems = sortFoods(fetchedItems);

            // Merge pantry quantities from hook
            fetchedItems = fetchedItems.map(item =>
                quantities[item.id]
                    ? { ...item, quantity: quantities[item.id], is_in_pantry: true }
                    : item
            );

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
            setHasMore(from + dbFetched < dbTotal);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load foods');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (!authReady) return;
        fetchFoods(1, { q: effectiveSearchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user, sortField, sortDirection }, true);
    }, [authReady, showFavoritesOnly, selectedCategories, user, sortField, sortDirection, fetchFoods]);

    // Debounced search
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!authReady) return;
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            fetchFoods(1, { q: effectiveSearchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user, sortField, sortDirection }, true);
        }, 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [effectiveSearchQuery, authReady, showFavoritesOnly, selectedCategories, user, sortField, sortDirection, fetchFoods]);

    const defaultDropdown = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="h-10 px-4 rounded-xl bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Leaf size={14} className="animate-pulse" />
                    <span className="hidden sm:inline">Foods</span>
                    <ChevronDown size={10} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 p-2 rounded-2xl shadow-2xl">
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-white font-bold tracking-widest uppercase text-[10px] rounded-xl mb-1"
                >
                    <Leaf size={14} className="text-cyan-500" />
                    Foods
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300 font-bold tracking-widest uppercase text-[10px] rounded-xl mb-1"
                    onClick={() => {
                        setActiveView('nutridex');
                        setIsActionPanelOpen(true);
                    }}
                >
                    <Activity size={14} className="text-fuchsia-500" />
                    Nutridex
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300 font-bold tracking-widest uppercase text-[10px] rounded-xl mb-1"
                    onClick={() => {
                        setActiveView('planner');
                        setIsActionPanelOpen(true);
                    }}
                >
                    <List size={14} className="text-indigo-500" />
                    List
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300 font-bold tracking-widest uppercase text-[10px] rounded-xl mb-1"
                    onClick={() => {
                        setActiveView('pantry');
                        setIsActionPanelOpen(true);
                    }}
                >
                    <Package size={14} className="text-amber-500" />
                    Pantry
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300 font-bold tracking-widest uppercase text-[10px] rounded-xl"
                    onClick={() => {
                        setActiveView('shopping');
                        setIsActionPanelOpen(true);
                    }}
                >
                    <ShoppingCart size={14} className="text-rose-500" />
                    Cart
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const foodList = (
        <div className="space-y-4">
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {(showFavoritesOnly || selectedCategories.length > 0 || effectiveSearchQuery)
                            ? 'No ingredients match your filters'
                            : 'Library is empty'}
                    </p>
                </div>
            )}

            {foods.map((food) => (
                <div
                    key={food.id}
                    className={cn(
                        'group relative rounded-[2rem] border transition-all cursor-pointer overflow-hidden backdrop-blur-sm shadow-sm',
                        'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5'
                    )}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4">
                        {/* Image Section */}
                        <div className="relative shrink-0 flex items-center">
                            <div className="aspect-[16/9] sm:aspect-square w-full sm:w-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative rounded-2xl border border-slate-200 dark:border-slate-700">
                                {food.image ? (
                                    <Image src={food.image} alt={food.name} fill className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <Beef size={28} />
                                    </div>
                                )}
                                {food.is_in_pantry && (
                                    <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-lg z-10 border border-emerald-400">
                                        <Check size={8} strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                            <div className="space-y-0.5">
                                <h3 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white capitalize leading-tight group-hover:text-blue-500 transition-colors truncate">
                                    {formatFoodName(food.common_name || food.name)}
                                </h3>
                            </div>

                            {/* Stats Grid - MATCHING PLANNER STYLE EXACTLY */}
                            <div className="flex flex-wrap gap-2.5">
                                <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center min-w-[65px]">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Energy</span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white leading-none">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center min-w-[65px]">
                                    <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest leading-none mb-2">Carbs</span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white leading-none">{food.carbs_g.toFixed(1)}g</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center min-w-[65px]">
                                    <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none mb-2">Fat</span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white leading-none">{food.fat_g.toFixed(1)}g</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center min-w-[65px]">
                                    <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-2">Protein</span>
                                    <span className="font-black text-sm text-slate-900 dark:text-white leading-none">{food.protein_g.toFixed(1)}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions Section - MATCHING PLANNER STRUCTURE + FOOD DETAIL TABS */}
                        <div className="flex flex-row lg:flex-col items-stretch gap-2 pt-2 lg:pt-0 lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-4 lg:w-48 justify-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-slate-950/40 dark:bg-slate-800/60 border border-white/5 shadow-inner">
                                {[
                                    { label: 'About', active: true },
                                    { label: 'Nutrition', hasDot: true },
                                    { label: 'Recipes' },
                                    { label: 'Management' },
                                ].map((tab) => (
                                    <button
                                        key={tab.label}
                                        className={cn(
                                            'py-1.5 px-2.5 text-[7px] font-black uppercase tracking-[0.15em] rounded-lg transition-all duration-300 whitespace-nowrap flex-1 min-w-[45%]',
                                            tab.active
                                                ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10"
                                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="relative inline-block">
                                            {tab.label}
                                            {tab.hasDot && (
                                                <span className="absolute -top-1 -right-2 w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            <Link 
                                href={`/foods/${food.id}`}
                                className="lg:w-full text-[9px] font-black uppercase tracking-[0.15em] h-10 rounded-xl transition-all flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/20 px-4 group/btn"
                            >
                                <span>Details</span>
                                <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform"/>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={cn("space-y-8 animate-in fade-in duration-500", noContainer && "space-y-0")}>
            {/* List Container */}
            {!noContainer ? (
                <TrackerTabShell
                    title="Foods"
                    searchQuery={effectiveSearchQuery}
                    onSearchChange={(q) => onSearchChange ? onSearchChange(q) : setSearchQuery(q)}
                    sortField={sortField}
                    setSortField={(f: any) => setSortField(f)}
                    sortDirection={sortDirection}
                    setSortDirection={setSortDirection}
                    sortOptions={[
                        { id: 'name', label: 'A-Z', icon: <ArrowDownUp size={14} /> },
                        { id: 'energy_kcal', label: 'Energy', icon: <ArrowDownUp size={14} /> },
                        { id: 'protein_g', label: 'Protein', icon: <ArrowDownUp size={14} /> },
                        { id: 'carbs_g', label: 'Carbs', icon: <ArrowDownUp size={14} /> },
                        { id: 'fat_g', label: 'Fat', icon: <ArrowDownUp size={14} /> },
                    ]}
                    showFilters={!hideControls}
                    onFilterClick={() => {
                        setActiveView('food-filters');
                        setIsActionPanelOpen(true);
                    }}
                    hasActiveFilters={showFavoritesOnly || selectedCategories.length > 0}
                    activeFilterCount={selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                    dropdownContent={dropdownContent || defaultDropdown}
                >
                    {foodList}
                </TrackerTabShell>
            ) : (
                foodList
            )}

            {hasMore && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        onClick={() => fetchFoods(page + 1, { q: effectiveSearchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user, sortField, sortDirection })}
                        disabled={loading}
                        className="h-12 px-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all disabled:opacity-40 shadow-xl"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
