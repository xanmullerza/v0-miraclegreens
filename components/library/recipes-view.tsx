'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    Search,
    ArrowRight,
    ChefHat,
    Clock,
    Users,
    ChevronRight,
    Loader2,
    Plus,
    Filter,
    X,
    Check,
    ChevronDown,
    Zap,
    Scale,
    Library,
    Globe,
    Pencil,
    Calendar,
    Wheat,
    Beef,
    Droplet,
    Camera,
    Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;
const formatEnergy = (calories: number, unit: 'kcal' | 'kJ') => {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};

interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    servings: number;
    image: string | null;
    is_favorite: boolean;
    diet: string[];
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

interface RecipesViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function RecipesView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedTypes: externalSelectedTypes,
    setSelectedTypes: externalSetSelectedTypes,
    hideControls = false,
    isFilterOpen: externalIsFilterOpen,
    setIsFilterOpen: externalSetIsFilterOpen
}: RecipesViewProps) {
    const router = useRouter();
    const PAGE_SIZE = 20;
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { searchQuery } = useSearch();
    const { energyUnit } = useUserPreferences();
    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);

    const selectedTypes = externalSelectedTypes !== undefined ? externalSelectedTypes : localSelectedTypes;
    const setSelectedTypes = externalSetSelectedTypes !== undefined ? externalSetSelectedTypes : setLocalSelectedTypes;
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const [localIsFilterOpen, setLocalIsFilterOpen] = useState(false);
    const isFilterOpen = externalIsFilterOpen !== undefined ? externalIsFilterOpen : localIsFilterOpen;
    const setIsFilterOpen = externalSetIsFilterOpen !== undefined ? externalSetIsFilterOpen : setLocalIsFilterOpen;

    const [sortField, setSortField] = useState<string>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                setIsAdmin(user.email?.toLowerCase() === adminEmail.toLowerCase());
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        fetchRecipes(0, true);
    }, [searchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection]);

    const fetchRecipes = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('recipes')
                .select('*', { count: 'exact' })
                .order(sortField, { ascending: sortDirection === 'asc' });

            if (searchQuery.trim()) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            if (selectedTypes.length < MEAL_TYPES.length) {
                query = query.in('type', selectedTypes);
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
            if (isNewSearch) {
                setRecipes(newItems);
                setPage(0);
            } else {
                setRecipes(prev => [...prev, ...newItems]);
                setPage(pageNum);
            }

            setHasMore(count ? (isNewSearch ? newItems.length : recipes.length + newItems.length) < count : false);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            toast.error('Failed to load meal library');
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
            fetchRecipes(page + 1);
        }
    };

    const toggleFavorite = async (recipe: Recipe) => {
        const newStatus = !recipe.is_favorite;
        try {
            const { error } = await supabase
                .from('recipes')
                .update({ is_favorite: newStatus } as any)
                .eq('id', recipe.id);

            if (error) throw error;

            setRecipes(prev => prev.map(r =>
                r.id === recipe.id ? { ...r, is_favorite: newStatus } : r
            ));
            toast.success(newStatus ? 'Added to collections' : 'Removed from collections');
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Controls Row */}
            {!hideControls && (
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* Favorites Switch Toggle */}
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-all">
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

                        {/* Type Filter */}
                        <div className="relative">
                            <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar h-14 items-center shadow-sm w-fit transition-all duration-500">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0",
                                        isFilterOpen ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Filter size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter Types</span>
                                    <ChevronDown size={14} className={cn("transition-transform duration-300", isFilterOpen && "rotate-180")} />
                                </button>

                                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1 shrink-0" />

                                <div className={cn("flex items-center gap-1 transition-all duration-500 ease-in-out overflow-hidden", isFilterOpen ? "max-w-[1000px] opacity-100 px-1" : "max-w-0 opacity-0 px-0")}>
                                    {MEAL_TYPES.map(type => {
                                        const isActive = selectedTypes.includes(type);
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => isActive
                                                    ? setSelectedTypes(prev => prev.filter(t => t !== type))
                                                    : setSelectedTypes(prev => [...prev, type])
                                                }
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                    isActive
                                                        ? "bg-blue-600/10 text-blue-600 border border-blue-600/20"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!isFilterOpen && (
                                    <div className="px-4 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-slate-400 italic">
                                            {selectedTypes.length === MEAL_TYPES.length ? "All Meal Types" : `${selectedTypes.length} Types Selected`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push('/admin/recipebuilder')}
                        className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-500/10"
                    >
                        <Plus size={18} />
                        Add Meal
                    </Button>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading meals...</p>
                </div>
            ) : recipes.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ChefHat size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "Collection Empty" : "No meals found."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Recipe List */}
                    <div className="space-y-3">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => router.push(`/dashboard/library/recipes/${recipe.id}`)}
                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                            >
                                <div className="flex flex-row lg:grid lg:grid-cols-[120px_1fr_100px_80px_80px_80px_150px] gap-3 lg:gap-4 items-center lg:px-8">
                                    {/* Thumbnail */}
                                    <div className="aspect-square w-24 lg:w-30 shrink-0 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ChefHat size={24} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 lg:p-0">
                                        <h3 className="font-bold text-base lg:text-lg tracking-tight text-slate-900 dark:text-white leading-tight capitalize truncate">
                                            {recipe.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">
                                                <Clock size={10} /> {recipe.prep_time}m
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">
                                                <Users size={10} /> {recipe.servings}P
                                            </div>
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase tracking-widest px-1.5 py-0 shrink-0">
                                                {recipe.type}
                                            </Badge>
                                        </div>

                                        {/* Mobile-only stats row */}
                                        <div className="flex lg:hidden items-center gap-3 mt-2 text-[10px] font-black">
                                            <span className="text-blue-500">{formatEnergy(recipe.calories, energyUnit)}</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-emerald-500">{recipe.protein.toFixed(0)}g P</span>
                                        </div>
                                    </div>

                                    {/* Stats (Desktop View) */}
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[9px] uppercase font-black text-slate-400">Energy</span>
                                        <span className="font-black text-sm text-slate-900 dark:text-white">{formatEnergy(recipe.calories, energyUnit)}</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[9px] uppercase font-black text-slate-400">Carbs</span>
                                        <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.carbs.toFixed(1)}g</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[9px] uppercase font-black text-slate-400">Fat</span>
                                        <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.fat.toFixed(1)}g</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[9px] uppercase font-black text-slate-400">Protein</span>
                                        <span className="font-black text-sm text-slate-900 dark:text-white">{recipe.protein.toFixed(1)}g</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center lg:justify-end gap-1">
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/library/recipes/${recipe.id}/edit`);
                                                }}
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(recipe);
                                            }}
                                            className={cn(
                                                "w-8 h-8 rounded-full transition-all flex items-center justify-center",
                                                recipe.is_favorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                                            )}
                                        >
                                            <Heart size={14} fill={recipe.is_favorite ? "currentColor" : "none"} />
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
                                {loadingMore ? <Loader2 className="animate-spin mr-3" size={18} /> : "View More Meals"}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
