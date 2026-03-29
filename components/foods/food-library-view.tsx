'use client';

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDownUp, Loader2, Check, Beef, Filter, ChevronDown, Leaf, Search } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { cn, formatFoodName, formatEnergy, type FoodItem } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { FoodFormDialog } from '@/components/admin/ingredients/food-form-dialog';
import { usePantry } from '@/hooks/use-pantry';

export const CATEGORIES = ['General', 'Vegetables', 'Grains', 'Legumes', 'Oils', 'Proteins', 'Fruit', 'Nuts', 'Flavour', 'Supplements'];
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
}

export function FoodsView({ 
    showAddFood = false, 
    setShowAddFood, 
    searchQuery: externalSearchQuery, 
    onSearchChange,
    hideControls = false,
    noContainer = false
}: FoodsViewProps) {
    const { energyUnit } = useUserPreferences();
    const { searchQuery } = useSearch();
    const { quantities, pantryItems, loading: pantryLoading } = usePantry();

    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(false);

    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [sortField, setSortField] = useState<'name' | 'energy_kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortOptions, setShowSortOptions] = useState(false);

    const currentSortLabel = FOOD_SORT_OPTIONS.find(opt => opt.id === sortField)?.label || 'Sort';

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

    return (
        <div className={cn("space-y-8 animate-in fade-in duration-500", noContainer && "space-y-0")}>
            {/* List Container */}
            {!noContainer ? (
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                {showAddFood && setShowAddFood ? (
                    <FoodFormDialog onClose={() => setShowAddFood(false)} />
                ) : (
                    <>
                        {/* Sticky Header */}
                        {!hideControls && (
                            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-[2rem]">
                                {/* Mobile filter bar */}
                                <div className="flex md:hidden items-center justify-between gap-2 px-4 py-3">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button className={cn(
                                                'flex items-center gap-2 h-9 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0',
                                                (showFavoritesOnly || selectedCategories.length > 0)
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600 shadow-sm'
                                            )}>
                                                <Filter size={11} />
                                                Filter
                                                {(showFavoritesOnly || selectedCategories.length > 0) && (
                                                    <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-white dark:border-slate-900">
                                                        {selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                                                    </span>
                                                )}
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl px-6 pt-6 pb-10">
                                            <SheetHeader className="mb-4">
                                                <div className="flex items-center justify-between">
                                                    {(showFavoritesOnly || selectedCategories.length > 0) && (
                                                        <button
                                                            onClick={() => { setShowFavoritesOnly(false); setSelectedCategories([]); }}
                                                            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                                                        >
                                                            Clear all
                                                        </button>
                                                    )}
                                                </div>
                                            </SheetHeader>

                                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favourites only</span>
                                                <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
                                            </div>

                                            <div className="mt-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Category</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {CATEGORIES.map(cat => {
                                                        const active = selectedCategories.includes(cat);
                                                        return (
                                                            <button
                                                                key={cat}
                                                                onClick={() => {
                                                                    if (active) setSelectedCategories(prev => prev.filter(c => c !== cat));
                                                                    else setSelectedCategories(prev => [...prev, cat]);
                                                                }}
                                                                className={cn(
                                                                    'h-8 px-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all',
                                                                    active
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                                                )}
                                                            >
                                                                {cat}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSortOptions(prev => !prev)}
                                            className={cn(
                                                "h-9 px-4 rounded-full flex items-center gap-2 transition-all border text-[10px] font-black uppercase tracking-widest",
                                                showSortOptions
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200'
                                                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500'
                                            )}
                                            title="Sort Options"
                                        >
                                            <ArrowDownUp size={13} />
                                            <span className="hidden sm:inline">{currentSortLabel}</span>
                                        </button>
                                        {showSortOptions && (
                                            <div className="absolute left-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-20 p-1.5">
                                                {FOOD_SORT_OPTIONS.map(option => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            if (sortField === option.id) {
                                                                setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                            } else {
                                                                setSortField(option.id);
                                                                setSortDirection('asc');
                                                            }
                                                            setShowSortOptions(false);
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                            sortField === option.id
                                                                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                                                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                        )}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                        <input
                                            type="text"
                                            value={externalSearchQuery ?? ''}
                                            onChange={(e) => onSearchChange?.(e.target.value)}
                                            placeholder="Search ingredients..."
                                            className={cn(
                                                "w-full h-9 pl-9 pr-4 rounded-full border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                                "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                                "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                                "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Desktop header row */}
                                <div className="hidden md:flex md:items-center gap-4 px-10 py-4 w-full">
                                    <div className="flex items-center gap-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={cn(
                                                    'h-9 px-4 rounded-xl flex items-center gap-2 transition-all border relative shadow-sm text-[10px] font-black uppercase tracking-widest',
                                                    (showFavoritesOnly || selectedCategories.length > 0)
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                                )}>
                                                    <Filter size={13} />
                                                    Filter
                                                    {(selectedCategories.length > 0 || showFavoritesOnly) && (
                                                        <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[7px] font-black rounded-full border border-white dark:border-slate-900">
                                                            {selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                                                        </span>
                                                    )}
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl">
                                                <div className="px-2 py-1.5">
                                                    <div className="flex items-center justify-between py-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favourites Only</span>
                                                        <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
                                                    </div>
                                                </div>
                                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                                                <div className="px-2">
                                                    <div className="flex items-center justify-between py-2">
                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-0">Categories</DropdownMenuLabel>
                                                        {selectedCategories.length > 0 && (
                                                            <button onClick={() => setSelectedCategories([])} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">Clear</button>
                                                        )}
                                                    </div>
                                                    <div className="py-1 max-h-[300px] overflow-y-auto no-scrollbar">
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

                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSortOptions(prev => !prev)}
                                                className={cn(
                                                    "h-9 px-4 rounded-xl flex items-center gap-2 transition-all border text-[10px] font-black uppercase tracking-widest",
                                                    showSortOptions
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200'
                                                        : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500'
                                                )}
                                                title="Sort Options"
                                            >
                                                <ArrowDownUp size={13} />
                                                <span>{currentSortLabel}</span>
                                            </button>
                                            {showSortOptions && (
                                                <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-20 p-1.5">
                                                    {FOOD_SORT_OPTIONS.map(option => (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => {
                                                                if (sortField === option.id) {
                                                                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                                } else {
                                                                    setSortField(option.id);
                                                                    setSortDirection('asc');
                                                                }
                                                                setShowSortOptions(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                                sortField === option.id
                                                                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                                                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            )}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                            <input
                                                type="text"
                                                value={externalSearchQuery ?? ''}
                                                onChange={(e) => onSearchChange?.(e.target.value)}
                                                placeholder="Search ingredients..."
                                                className={cn(
                                                    "w-64 h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                                    "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                                    "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                                    "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50">Ingredients Library</div>
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="space-y-2 p-4">
                            {loading && foods.length === 0 && (
                                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Library...</p>
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
                                <Link
                                    key={food.id}
                                    href={`/foods/${food.id}`}
                                    className="group block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_auto] gap-3 lg:gap-4 lg:items-center lg:px-6 py-1 w-full">
                                        <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                                            {food.image ? (
                                                <Image src={food.image} alt={food.name} fill className="object-cover" />
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

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize truncate">
                                                {formatFoodName(food.common_name || food.name)}
                                            </h3>
                                            <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                                <span className="text-blue-500">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-amber-500">{food.carbs_g.toFixed(0)}g C</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-rose-500">{food.fat_g.toFixed(0)}g F</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-emerald-500">{food.protein_g.toFixed(0)}g P</span>
                                            </div>
                                        </div>

                                        <div className="hidden lg:flex items-center justify-end gap-3">
                                            <span className="font-black text-[11px] text-blue-500 dark:text-blue-400">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{food.carbs_g.toFixed(1)}g</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{food.fat_g.toFixed(1)}g</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{food.protein_g.toFixed(1)}g</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
            ) : (
                <div className="space-y-2 p-4">
                    {loading && foods.length === 0 && (
                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Loading Library...</p>
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
                        <Link
                            key={food.id}
                            href={`/foods/${food.id}`}
                            className="group block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                            <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_auto] gap-3 lg:gap-4 lg:items-center lg:px-6 py-1 w-full">
                                <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                                    {food.image ? (
                                        <Image src={food.image} alt={food.name} fill className="object-cover" />
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

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize truncate">
                                        {formatFoodName(food.common_name || food.name)}
                                    </h3>
                                    <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                        <span className="text-blue-500">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="text-amber-500">{food.carbs_g.toFixed(0)}g C</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="text-rose-500">{food.fat_g.toFixed(0)}g F</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="text-emerald-500">{food.protein_g.toFixed(0)}g P</span>
                                    </div>
                                </div>

                                <div className="hidden lg:flex items-center justify-end gap-3">
                                    <span className="font-black text-[11px] text-blue-500 dark:text-blue-400">{formatEnergy(food.energy_kcal, energyUnit)}</span>
                                    <span className="text-slate-300 text-[8px]">•</span>
                                    <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{food.carbs_g.toFixed(1)}g</span>
                                    <span className="text-slate-300 text-[8px]">•</span>
                                    <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{food.fat_g.toFixed(1)}g</span>
                                    <span className="text-slate-300 text-[8px]">•</span>
                                    <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{food.protein_g.toFixed(1)}g</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        onClick={() => fetchFoods(page + 1, { q: searchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user })}
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
