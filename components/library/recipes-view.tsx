'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Activity,
    CheckSquare,
    Square
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';

const CAL_TO_KJ = 4.184;
const formatEnergy = (calories: number, unit: 'kcal' | 'kJ') => {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kC`;
};

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

interface RecipesViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    isMix?: boolean;
    showHero?: boolean;
}

export function RecipesView({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedTypes: externalSelectedTypes,
    setSelectedTypes: externalSetSelectedTypes,
    hideControls = false,
    isFilterOpen: externalIsFilterOpen,
    setIsFilterOpen: externalSetIsFilterOpen,
    isMix = false,
    showHero = true
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
    const { user, fetchRecipes: fetchRecipesBridge, saveRecipe, deleteRecipe, loading: authLoading } = useDataPersistence();

    // Hero Search State
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroResults, setHeroResults] = useState<Recipe[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const heroSearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);

    const selectedTypes = externalSelectedTypes !== undefined ? externalSelectedTypes : localSelectedTypes;
    const setSelectedTypes = externalSetSelectedTypes !== undefined ? externalSetSelectedTypes : setLocalSelectedTypes;
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const isFilterOpen = externalIsFilterOpen !== undefined ? externalIsFilterOpen : localIsFilterOpen;
    const setIsFilterOpen = externalSetIsFilterOpen !== undefined ? externalSetIsFilterOpen : setLocalIsFilterOpen;

    const [sortField, setSortField] = useState<string>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user) {
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(user.email?.toLowerCase() === adminEmail.toLowerCase());
        } else {
            setIsAdmin(false);
        }
    }, [user]);

    // Hero Search Logic
    const performHeroSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setHeroResults([]);
            return;
        }
        setIsHeroSearching(true);
        try {
            const { recipes: results } = await fetchRecipesBridge({
                searchQuery: query,
                pageSize: 8,
                isMix
            });
            setHeroResults(results || []);
        } catch (error) {
            console.error('Hero search error:', error);
        } finally {
            setIsHeroSearching(false);
        }
    };

    const handleHeroSearchInput = (val: string) => {
        setHeroSearchQuery(val);
        if (heroSearchTimeoutRef.current) clearTimeout(heroSearchTimeoutRef.current);
        heroSearchTimeoutRef.current = setTimeout(() => performHeroSearch(val), 300);
    };

    useEffect(() => {
        if (!authLoading) {
            fetchRecipes(0, true);
        }
    }, [searchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection, authLoading]);

    const fetchRecipes = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            const { recipes: newItems, count } = await fetchRecipesBridge({
                searchQuery,
                selectedTypes,
                showFavoritesOnly,
                page: pageNum,
                pageSize: PAGE_SIZE,
                sortField,
                sortDirection,
                isMix
            });

            if (count !== null) setTotalCount(count);

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
            await saveRecipe({
                ...recipe,
                is_favorite: newStatus
            });

            setRecipes(prev => prev.map(r =>
                r.id === recipe.id ? { ...r, is_favorite: newStatus } : r
            ));
            toast.success(newStatus ? 'Added to collections' : 'Removed from collections');
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    const handleDelete = async (e: React.MouseEvent, recipe: Recipe) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
            try {
                await deleteRecipe(recipe.id);
                setRecipes(prev => prev.filter(r => r.id !== recipe.id));
                toast.success('Recipe deleted successfully');
            } catch (error) {
                toast.error('Failed to delete recipe');
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, recipeId: string) => {
        e.stopPropagation();
        router.push(`/dashboard/library/meals/new?edit=${recipeId}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Recipe Search Hero Workspace */}
            {showHero && (
                <div className="w-full md:max-w-[900px] mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col mb-10">
                    <div className="h-[180px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                        {isHeroActive ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {isHeroSearching ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="relative">
                                            <Activity className="animate-spin text-blue-500" size={32} />
                                            <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-full" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Searching Recipes...</p>
                                    </div>
                                ) : heroResults.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {heroResults.map(recipe => (
                                            <button
                                                key={recipe.id}
                                                onClick={() => router.push(`/dashboard/library/meals/${recipe.id}`)}
                                                className="w-full p-4 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 text-left"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                                        {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover" /> : <ChefHat className="m-auto opacity-10 h-full w-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{recipe.title}</h4>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {formatEnergy(recipe.calories, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {recipe.type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors shrink-0" size={20} />
                                            </button>
                                        ))}
                                    </div>
                                ) : heroSearchQuery.length > 1 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                            <Search size={24} className="opacity-20" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching recipes found</p>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Enter recipe name to explore</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-start pt-8 md:pt-10 text-center h-full animate-in fade-in duration-700">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 relative">
                                    <Library size={24} className="text-blue-500" />
                                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1">Ready to Explore?</h3>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">
                                    Search below to find your next meal
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2 rounded-b-[2.5rem]">
                        <div className="flex-1 relative flex items-center">
                            <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-blue-500/50" : "text-slate-300")}>
                                <Search size={16} className="md:w-5 md:h-5" />
                            </div>
                            <input
                                placeholder={isHeroActive ? "SEARCH MEAL LIBRARY..." : "CLICK TO SEARCH..."}
                                className={cn(
                                    "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-12 md:h-14 rounded-[1.5rem] md:rounded-[2rem] pl-12 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300",
                                    isHeroActive
                                        ? "border-blue-500/30 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-800/80"
                                        : "border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500/20"
                                )}
                                value={heroSearchQuery}
                                onFocus={() => setIsHeroActive(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsHeroActive(false);
                                        setHeroSearchQuery('');
                                        setHeroResults([]);
                                    }
                                }}
                                onChange={(e) => {
                                    if (!isHeroActive) setIsHeroActive(true);
                                    handleHeroSearchInput(e.target.value);
                                }}
                            />
                        </div>
                        {isHeroActive ? (
                            <button
                                onClick={() => {
                                    setIsHeroActive(false);
                                    setHeroSearchQuery("");
                                    setHeroResults([]);
                                }}
                                className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                                title="Close Search"
                            >
                                <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                            </button>
                        ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-300 flex items-center justify-center">
                                <Search size={18} className="md:w-6 md:h-6" />
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Controls Row */}
            {!hideControls && (
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Unified Filter Bar */}
                    <div className="flex items-center gap-2">
                        {/* Scope/Favorites Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 shrink-0 shadow-sm group outline-none",
                                    showFavoritesOnly
                                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-200 hover:text-blue-500"
                                )}>
                                    <Heart size={12} className={cn("transition-transform group-hover:scale-110", showFavoritesOnly && "fill-current")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                                        {showFavoritesOnly ? "Favorites" : "All Collections"}
                                    </span>
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Filter Scope</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                <DropdownMenuCheckboxItem
                                    checked={!showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(false)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-slate-50 py-2.5 cursor-pointer"
                                >
                                    Show All Collections
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(true)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                >
                                    Favorites Only
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Meal Type Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                    selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length
                                        ? isMix ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-200 hover:text-blue-600"
                                )}>
                                    <Filter size={12} />
                                    <span className="hidden sm:inline">
                                        {selectedTypes.length === 0 || selectedTypes.length === MEAL_TYPES.length ? "All Types" :
                                            `${selectedTypes.length} Types`}
                                    </span>
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                <div className="flex items-center justify-between pr-2">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Types</DropdownMenuLabel>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault(); e.stopPropagation();
                                                setSelectedTypes(MEAL_TYPES);
                                            }}
                                            className={cn("w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", isMix ? "text-indigo-500" : "text-blue-500")}
                                            title="Select All"
                                        >
                                            <CheckSquare size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault(); e.stopPropagation();
                                                setSelectedTypes([]);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                            title="Select None"
                                        >
                                            <Square size={14} />
                                        </button>
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                <div className="py-1 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {MEAL_TYPES.map(type => {
                                        const isActive = selectedTypes.includes(type);
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={isActive}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedTypes(prev => [...prev, type]);
                                                    } else {
                                                        setSelectedTypes(prev => prev.filter(t => t !== type));
                                                    }
                                                }}
                                                className={cn("rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer", isMix ? "focus:bg-indigo-50 dark:focus:bg-indigo-900/10 focus:text-indigo-600" : "focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600")}
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button
                        onClick={() => router.push(`/dashboard/library/meals/new${isMix ? '?is_mix=true' : ''}`)}
                        className={cn(
                            "h-14 px-8 rounded-2xl text-white font-black uppercase tracking-widest gap-2 shadow-xl",
                            isMix ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
                        )}
                    >
                        <Plus size={18} />
                        {isMix ? 'Add Mix' : 'Add Meal'}
                    </Button>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Loader2 className={cn("animate-spin", isMix ? "text-indigo-500" : "text-blue-500")} size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading {isMix ? 'mixes' : 'meals'}...</p>
                </div>
            ) : recipes.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ChefHat size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "Collection Empty" : `No ${isMix ? 'mixes' : 'meals'} found.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Recipe List */}
                    <div className="space-y-2">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => router.push(`/dashboard/library/meals/${recipe.id}`)}
                                className={cn(
                                    "group relative bg-transparent rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all duration-500 cursor-pointer overflow-hidden",
                                    isMix ? "hover:border-indigo-500/30 hover:shadow-lg" : "hover:border-blue-500/30 hover:shadow-lg"
                                )}
                            >
                                <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_100px_80px_80px_80px_150px] gap-3 lg:gap-4 lg:items-center lg:px-10 py-1">
                                    {/* Thumbnail */}
                                    <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ChefHat size={24} className="opacity-10" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 lg:p-0">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize line-clamp-2">
                                            {recipe.title}
                                        </h3>

                                        {/* Mobile-only stats row */}
                                        <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                            <span className={isMix ? "text-indigo-500" : "text-blue-500"}>{formatEnergy(recipe.calories, energyUnit)}</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-emerald-500">{recipe.protein.toFixed(0)}g P</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-amber-500">{recipe.carbs.toFixed(0)}g C</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-rose-500">{recipe.fat.toFixed(0)}g F</span>
                                        </div>
                                    </div>

                                    {/* Stats (Desktop View) */}
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[8px] uppercase font-black text-slate-400">Energy</span>
                                        <span className="font-black text-[11px] text-slate-900 dark:text-white">{formatEnergy(recipe.calories, energyUnit)}</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[8px] uppercase font-black text-slate-400">Carbs</span>
                                        <span className="font-black text-[11px] text-slate-900 dark:text-white">{recipe.carbs.toFixed(1)}g</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[8px] uppercase font-black text-slate-400">Fat</span>
                                        <span className="font-black text-[11px] text-slate-900 dark:text-white">{recipe.fat.toFixed(1)}g</span>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                        <span className="text-[8px] uppercase font-black text-slate-400">Protein</span>
                                        <span className="font-black text-[11px] text-slate-900 dark:text-white">{recipe.protein.toFixed(1)}g</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center lg:justify-end gap-1 px-2 lg:px-0">
                                        {(String(recipe.id).startsWith('local-') || recipe.is_curated === false || isAdmin) && (
                                            <>
                                                <button
                                                    onClick={(e) => handleEdit(e, recipe.id)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                        isMix ? "hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700" : "hover:text-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                                                    )}
                                                    title="Edit Recipe"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, recipe)}
                                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all border bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 border-slate-100 dark:border-slate-700"
                                                    title="Delete Recipe"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}

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
                                className={cn(
                                    "h-14 px-8 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-xl group transition-all",
                                    isMix ? "bg-indigo-900 hover:bg-indigo-800" : "bg-slate-900 hover:bg-slate-800"
                                )}
                            >
                                {loadingMore ? <Loader2 className="animate-spin mr-3" size={18} /> : `View More ${isMix ? 'Mixes' : 'Meals'}`}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
