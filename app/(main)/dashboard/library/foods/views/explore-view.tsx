'use client';

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Check, Beef, Filter, ChevronDown, Leaf, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { cn, formatFoodName, formatEnergy, type FoodItem } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet';
import { FoodFormDialog } from '@/components/ingredients/food-form-dialog';

const CATEGORIES = ['General', 'Vegetables', 'Grains', 'Legumes', 'Oils', 'Proteins', 'Fruit', 'Nuts', 'Flavour', 'Supplements', 'Mixes'];
const PAGE_SIZE = 20;

interface ExploreViewProps {
    showAddFood?: boolean;
    setShowAddFood?: Dispatch<SetStateAction<boolean>>;
}

export function ExploreView({ showAddFood = false, setShowAddFood }: ExploreViewProps) {
    const { energyUnit } = useUserPreferences();
    const { searchQuery } = useSearch();

    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(false);

    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Auth — getSession bootstraps authReady for SSR/HttpOnly-cookie configs where
    // onAuthStateChange may not fire INITIAL_SESSION. A resolved flag prevents the
    // onAuthStateChange INITIAL_SESSION from triggering a redundant second setUser.
    useEffect(() => {
        let resolvedViaGetSession = false;
        supabase.auth.getSession().then(({ data: { session } }) => {
            resolvedViaGetSession = true;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Skip INITIAL_SESSION if getSession already handled it
            if (event === 'INITIAL_SESSION' && resolvedViaGetSession) return;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Single fetch function — explicit params avoid stale closure issues
    const fetchFoods = useCallback(async (
        pageNum: number,
        opts: { q: string; favOnly: boolean; cats: string[]; currentUser: User | null },
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
            query = query.range(from, from + PAGE_SIZE - 1).order('name', { ascending: true });

            const { data, error, count } = await query;
            if (error) throw error;

            let fetchedItems = (data ?? []) as FoodItem[];
            const dbTotal = count ?? 0;
            const dbFetched = fetchedItems.length; // snapshot before local foods are prepended

            // Prepend local (guest) foods — these are always fully loaded, no pagination
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
                        // Guard: only prepend on new searches — on Load More they're already in state
                        if (isNewSearch) fetchedItems = [...localFoods, ...fetchedItems];
                    }
                } catch { /* ignore */ }
            }

            // Merge locally-stored pantry quantities — use map+spread to avoid mutating DB objects
            try {
                const raw = localStorage.getItem('pantry_quantities');
                if (raw) {
                    const quantities: Record<string, string> = JSON.parse(raw);
                    fetchedItems = fetchedItems.map(item =>
                        quantities[item.id]
                            ? { ...item, quantity: quantities[item.id], is_in_pantry: true }
                            : item
                    );
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
            // hasMore is based on DB pagination only (local foods are always fully loaded)
            setHasMore(from + dbFetched < dbTotal);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load foods');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch immediately when filters or user changes (but only after auth is ready)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchQuery intentionally omitted; the search effect owns it
    useEffect(() => {
        if (!authReady) return;
        fetchFoods(1, { q: searchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user }, true);
    }, [authReady, showFavoritesOnly, selectedCategories, user, fetchFoods]);

    // Debounced fetch on search change
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!authReady) return;
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            fetchFoods(1, { q: searchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user }, true);
        }, 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery, authReady, fetchFoods]);

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
                            {/* Mobile filter bar */}
                            <div className="flex lg:hidden items-center justify-between px-4 py-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button className={cn(
                                            'flex items-center gap-2 h-8 px-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative',
                                            (showFavoritesOnly || selectedCategories.length > 0)
                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                        )}>
                                            <Filter size={11} />
                                            Filter
                                            {(showFavoritesOnly || selectedCategories.length > 0) && (
                                                <span className="w-4 h-4 flex items-center justify-center bg-emerald-600 text-white text-[8px] font-black rounded-full">
                                                    {selectedCategories.length + (showFavoritesOnly ? 1 : 0)}
                                                </span>
                                            )}
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl px-6 pt-6 pb-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Filter Foods</span>
                                            <div className="flex items-center gap-3">
                                                {(showFavoritesOnly || selectedCategories.length > 0) && (
                                                    <button
                                                        onClick={() => { setShowFavoritesOnly(false); setSelectedCategories([]); }}
                                                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                                <SheetClose
                                                    aria-label="Close filter sheet"
                                                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <X size={12} />
                                                </SheetClose>
                                            </div>
                                        </div>

                                        {/* Favourites toggle */}
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favourites only</span>
                                            <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
                                        </div>

                                        {/* Category grid */}
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
                            </div>

                            {/* Desktop header row */}
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
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favourites Only</span>
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
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {(showFavoritesOnly || selectedCategories.length > 0 || searchQuery)
                                            ? 'No foods match your filters'
                                            : 'No foods found'}
                                    </p>
                                </div>
                            )}

                            {foods.map((food) => (
                                <Link
                                    key={food.id}
                                    href={`/dashboard/library/foods/${food.id}`}
                                    className="group block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
                                >
                                    <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_100px_80px_80px_80px] gap-3 lg:gap-4 lg:items-center lg:px-6 py-1 w-full">
                                        {/* Thumbnail */}
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

                                        {/* Name + mobile stats */}
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
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Load more */}
            {hasMore && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        onClick={() => fetchFoods(page + 1, { q: searchQuery, favOnly: showFavoritesOnly, cats: selectedCategories, currentUser: user })}
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

