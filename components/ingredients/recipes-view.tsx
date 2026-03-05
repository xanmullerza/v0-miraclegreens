'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heart,
    ChefHat,
    X,
    ChevronDown,
    Filter,
    Loader2,
    Pencil,
    Trash2,
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
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';
import { RecipeFormDialog } from '@/components/ingredients/recipe-form-dialog';

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
    showAddRecipe?: boolean;
    setShowAddRecipe?: React.Dispatch<React.SetStateAction<boolean>>;
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
    showAddRecipe = false,
    setShowAddRecipe
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

    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const [localIsFilterOpen, setLocalIsFilterOpen] = useState(false);

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
        router.push(`/dashboard/library/${isMix ? 'mixes' : 'meals'}/${recipeId}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* List Container */}
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                {showAddRecipe && setShowAddRecipe ? (
                    /* Recipe Form - replaces list when adding */
                    <RecipeFormDialog
                        onClose={() => setShowAddRecipe(false)}
                        onSave={() => fetchRecipes(0, true)}
                        isMix={isMix}
                    />
                ) : (
                <>
            {/* Controls Row */}
            {!hideControls && (
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    {/* Filter Controls */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Mobile Drawer Filter */}
                        <div className="flex md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className={cn(
                                        'flex items-center gap-2 h-8 px-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative',
                                        (showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length))
                                            ? isMix ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                    )}>
                                        <Filter size={11} />
                                        Filter
                                        {(showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length)) && (
                                            <span className={cn("w-4 h-4 flex items-center justify-center text-white text-[8px] font-black rounded-full", isMix ? "bg-indigo-600" : "bg-blue-600")}>
                                                {(selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length ? selectedTypes.length : 0) + (showFavoritesOnly ? 1 : 0)}
                                            </span>
                                        )}
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl px-6 pt-6 pb-10">
                                    <SheetHeader className="mb-4">
                                        <div className="flex items-center justify-between">
                                            {(showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length)) && (
                                                <button
                                                    onClick={() => { setShowFavoritesOnly(false); setSelectedTypes(MEAL_TYPES); }}
                                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </SheetHeader>

                                    {/* Favorites Toggle */}
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favorites only</span>
                                        <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className={isMix ? "data-[state=checked]:bg-indigo-600" : "data-[state=checked]:bg-blue-600"} />
                                    </div>

                                    {/* Meal Types */}
                                    <div className="mt-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Types</span>
                                        <div className="flex flex-wrap gap-2">
                                            {MEAL_TYPES.map(type => {
                                                const active = selectedTypes.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => {
                                                            if (active) setSelectedTypes(prev => prev.filter(t => t !== type));
                                                            else setSelectedTypes(prev => [...prev, type]);
                                                        }}
                                                        className={cn(
                                                            'h-8 px-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all',
                                                            active
                                                                ? isMix ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600'
                                                        )}
                                                    >
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        {/* Desktop Dropdown Filter */}
                        <div className="hidden md:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                        (showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length))
                                            ? isMix ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-200 hover:text-blue-600"
                                    )}>
                                        <Filter size={12} />
                                        <span className="hidden sm:inline">
                                            {showFavoritesOnly ? "Favorites" :
                                                (selectedTypes.length === 0 || selectedTypes.length === MEAL_TYPES.length ? "FILTER" :
                                                    `${selectedTypes.length} Types`)}
                                        </span>
                                        <ChevronDown size={10} className="opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="bottom"
                                    align="start"
                                    sideOffset={8}
                                    collisionPadding={20}
                                    className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 z-[100] flex flex-col max-h-[var(--radix-dropdown-menu-content-available-height)]"
                                >
                                    <div className="p-2 overflow-y-auto no-scrollbar">
                                        {/* Scope Section */}
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Scope</DropdownMenuLabel>
                                        <DropdownMenuCheckboxItem
                                            checked={showFavoritesOnly}
                                            onCheckedChange={setShowFavoritesOnly}
                                            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                        >
                                            <Heart size={12} className={cn("mr-2 transition-transform", showFavoritesOnly && "fill-current scale-110")} />
                                            Favorites Only
                                        </DropdownMenuCheckboxItem>

                                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />

                                        {/* Meal Type Section */}
                                        <div className="flex items-center justify-between pr-2">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Types</DropdownMenuLabel>
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
                                        <div className="py-1">
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
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="p-4 md:p-6">
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
                                onClick={() => router.push(`/dashboard/library/${isMix ? 'mixes' : 'meals'}/${recipe.id}`)}
                                className={cn(
                                    "group relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-500 cursor-pointer overflow-hidden",
                                    isMix ? "hover:border-indigo-400/50 hover:shadow-lg" : "hover:border-blue-400/50 hover:shadow-lg"
                                )}
                            >
                                <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_auto] gap-3 lg:gap-4 lg:items-center lg:px-10 py-1">
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
                                            <span className="text-amber-500">{recipe.carbs.toFixed(0)}g C</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-rose-500">{recipe.fat.toFixed(0)}g F</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="text-emerald-500">{recipe.protein.toFixed(0)}g P</span>
                                        </div>
                                    </div>

                                    {/* Stats (Desktop View) - Inline with dividers */}
                                    <div className="hidden lg:flex items-center justify-end gap-3">
                                        <span className={cn("font-black text-[11px]", isMix ? "text-indigo-500 dark:text-indigo-400" : "text-blue-500 dark:text-blue-400")}>{formatEnergy(recipe.calories, energyUnit)}</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{recipe.carbs.toFixed(1)}g</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{recipe.fat.toFixed(1)}g</span>
                                        <span className="text-slate-300 text-[8px]">•</span>
                                        <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{recipe.protein.toFixed(1)}g</span>
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
            </>
            )}
            </div>
        </div>
    );
}
