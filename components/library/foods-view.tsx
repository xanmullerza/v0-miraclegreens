'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Search,
    X,
    Plus,
    Activity,
    Beef,
    Zap,
    Droplet,
    Gem,
    Battery,
    Heart,
    Info,
    ArrowRight,
    Star,
    Share2,
    Calendar,
    ChevronRight,
    Library,
    Edit2,
    Camera,
    Upload,
    Save,
    Loader2,
    Wheat,
    Filter,
    Check,
    ChevronDown,
    Scale,
    ChefHat,
    Globe,
    Beaker,
    ShoppingBasket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';
import { useSearch, SearchResult } from '@/lib/context/search-context';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    micronutrients: Record<string, number>;
    is_favorite?: boolean;
    is_in_pantry?: boolean;
    category?: string;
    quantity?: string;
}

export const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

interface FoodsViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategories?: string[];
    setSelectedCategories?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
}

export function FoodsView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    hideControls = false
}: FoodsViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setResults, setIsLoading: setGlobalLoading, registerResultClickHandler } = useSearch();

    const PAGE_SIZE = 20;
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { searchQuery, setSearchQuery } = useSearch();
    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(CATEGORIES);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);

    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories !== undefined ? externalSetSelectedCategories : setLocalSelectedCategories;
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortField, setSortField] = useState<string>('common_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

    // Initial load and filter/search changes
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) setCurrentUserEmail(user.email);
            fetchFoods(0, true);
        };
        init();
    }, [searchQuery, selectedCategories, showFavoritesOnly, sortField, sortDirection]);

    const fetchFoods = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('food_items')
                .select('*', { count: 'exact' })
                .order(sortField, { ascending: sortDirection === 'asc' });

            if (searchQuery.trim()) {
                query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
            }

            if (selectedCategories.length < CATEGORIES.length) {
                query = query.in('category', selectedCategories);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            if (count !== null) setTotalCount(count);

            const newItems = data || [];

            // Merge in locally-stored quantities (persists without login)
            try {
                const savedQuantities = localStorage.getItem('pantry_quantities');
                if (savedQuantities) {
                    const quantities: Record<string, string> = JSON.parse(savedQuantities);
                    newItems.forEach(item => {
                        if (quantities[item.id]) {
                            item.quantity = quantities[item.id];
                            item.is_in_pantry = true;
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load saved quantities', e);
            }

            if (isNewSearch) {
                setFoods(newItems);
                setPage(0);
            } else {
                setFoods(prev => [...prev, ...newItems]);
                setPage(pageNum);
            }

            setHasMore(count ? (isNewSearch ? newItems.length : foods.length + newItems.length) < count : false);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error(`Failed to load ingredient library`);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchFoods(page + 1);
        }
    };

    const toggleFavorite = async (item: FoodItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !item.is_favorite;
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: newStatus } as any)
                .eq('id', item.id);

            if (error) throw error;
            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_favorite: newStatus } : f));
            toast.success(newStatus ? 'Added to collections' : 'Removed from collections');
        } catch (error: any) {
            toast.error(`Failed to update favorite`);
        }
    };

    const togglePantry = async (item: FoodItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !item.is_in_pantry;
            const { error } = await supabase
                .from('food_items')
                .update({ is_in_pantry: newStatus } as any)
                .eq('id', item.id);

            if (error) throw error;
            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_in_pantry: newStatus } : f));
            toast.success(newStatus ? 'Added to My Pantry' : 'Removed from My Pantry');
        } catch (error: any) {
            toast.error(`Failed to update pantry`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls Row */}
            {!hideControls && (
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* Favorites Switch Toggle */}
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shrink-0 shadow-sm">
                            <Globe
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(false)}
                            />
                            <Switch
                                id="favorites-mode"
                                checked={showFavoritesOnly}
                                onCheckedChange={setShowFavoritesOnly}
                                className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600 dark:data-[state=unchecked]:bg-blue-600"
                            />
                            <Heart
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(true)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar items-center h-14 shadow-sm w-fit transition-all duration-500">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0",
                                        isFilterOpen ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Filter size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter Groups</span>
                                    <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen && "rotate-180")} />
                                </button>

                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1 shrink-0" />

                                <div className={cn("flex items-center gap-1 transition-all duration-500 ease-in-out overflow-hidden", isFilterOpen ? "max-w-[1000px] opacity-100 px-1" : "max-w-0 opacity-0 px-0")}>
                                    {CATEGORIES.map(category => {
                                        const isActive = selectedCategories.includes(category);
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => isActive
                                                    ? setSelectedCategories(prev => prev.filter(c => c !== category))
                                                    : setSelectedCategories(prev => [...prev, category])
                                                }
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                    isActive
                                                        ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                                )}
                                            >
                                                {category}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!isFilterOpen && (
                                    <div className="px-4 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-slate-400 italic">
                                            {selectedCategories.length === CATEGORIES.length ? "All Ingredients" : `${selectedCategories.length} Categories Selected`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push('/dashboard/admin/add-food')}
                        className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-2 shadow-xl shadow-emerald-500/10"
                    >
                        <Plus size={18} />
                        Add Ingredient
                    </Button>
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Searching...</p>
                </div>
            ) : foods.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Library size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "No Favorites Yet" : "No ingredients found."}
                    </p>
                    <p className="text-sm text-slate-500 text-center max-w-xs">
                        Try adjusting your filters or search to find what you're looking for.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_120px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('image')}>
                            <Camera size={14} className={cn(sortField === 'image' && "text-emerald-500")} />
                        </div>
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('common_name')}>
                            <Info size={14} className={cn(sortField === 'common_name' && "text-emerald-500")} />
                            <span>Name</span>
                        </div>
                        <div className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('energy_kcal')}>
                            <Zap size={14} className="text-emerald-500" /> ENERGY
                        </div>
                        <div className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('carbs_g')}>
                            <Wheat size={14} className="text-amber-500" /> CARBS
                        </div>
                        <div className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('fat_g')}>
                            <Droplet size={14} className="text-amber-900" /> FAT
                        </div>
                        <div className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => handleSort('protein_g')}>
                            <Beef size={14} className="text-rose-500" /> PROTEIN
                        </div>
                        <div className="flex justify-end lg:justify-center items-center gap-1.5">
                            <Activity size={14} className="text-slate-400" /> CONTROL
                        </div>
                    </div>

                    {/* Food Items List */}
                    <div className="space-y-3">
                        {foods.map((food) => (
                            <div
                                key={food.id}
                                onClick={() => router.push(`/dashboard/library/ingredients/${food.id}`)}
                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                            >
                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_120px] gap-4 lg:items-center lg:px-8">
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {food.image ? (
                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Beef size={24} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 lg:p-0">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                            {food.common_name || food.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {/* Quantity badge - always visible if present */}
                                            {food.quantity && (
                                                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] border-none uppercase font-black tracking-tight">
                                                    {food.quantity}
                                                </Badge>
                                            )}
                                            {/* Category badge - desktop only */}
                                            {food.category && (
                                                <Badge className="hidden lg:inline-flex bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase tracking-widest font-black">
                                                    {food.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats (Desktop View) */}
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">{Math.round(food.energy_kcal)}</div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">{food.carbs_g.toFixed(1)}</div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">{food.fat_g.toFixed(1)}</div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">{food.protein_g.toFixed(1)}</div>

                                    {/* Action Buttons */}
                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center gap-2">
                                        <button
                                            onClick={(e) => togglePantry(food, e)}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                food.is_in_pantry
                                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 border-slate-100 dark:border-slate-700"
                                            )}
                                        >
                                            <ShoppingBasket size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => toggleFavorite(food, e)}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                food.is_favorite
                                                    ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 border-slate-100 dark:border-slate-700"
                                            )}
                                        >
                                            <Heart size={14} fill={food.is_favorite ? "currentColor" : "none"} />
                                        </button>
                                        <button className="w-8 h-8 rounded-full flex items-center justify-center border bg-emerald-500 text-white shadow-lg shadow-emerald-500/10">
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {hasMore && (
                        <div className="flex justify-center pt-8">
                            <Button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl group transition-all"
                            >
                                {loadingMore ? <Loader2 className="animate-spin mr-3" size={18} /> : "Load More Samples"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
