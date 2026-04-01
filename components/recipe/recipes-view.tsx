'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heart,
    ChefHat,
    ChevronDown,
    Filter,
    Loader2,
    Pencil,
    Trash2,
    CheckSquare,
    Square,
    Search,
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';
import { RecipeFormDialog } from '@/components/admin/ingredients/recipe-form-dialog';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { supabase } from '@/lib/supabase';
import { PANTRY_QUANTITIES_KEY } from '@/components/tracker/pantry/pantry-types';
import { inferEquipmentFromRecipe } from '@/lib/utils/equipment-inference';
import { usePantry } from '@/hooks/use-pantry';


interface RecipeWithIngredients extends Recipe {
    ingredients?: any[];
}


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
    isRemix?: boolean;
    onlyMyRecipes?: boolean;
    showAddRecipe?: boolean;
    setShowAddRecipe?: React.Dispatch<React.SetStateAction<boolean>>;
    onRecipeClick?: (recipeId: string) => void;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    isPremium?: boolean;
    noContainer?: boolean;
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
    isRemix = false,
    onlyMyRecipes = false,
    showAddRecipe = false,
    setShowAddRecipe,
    onRecipeClick,
    sortField: externalSortField,
    sortDirection: externalSortDirection,
    searchQuery: externalSearchQuery,
    onSearchChange,
    isPremium: externalIsPremium,
    noContainer = false
}: RecipesViewProps) {
    const router = useRouter();
    const PAGE_SIZE = 20;
    const { profile } = useUserPreferences();
    
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { searchQuery } = useSearch();
    const { energyUnit } = useUserPreferences();
    const { filters } = useRecipeFilter();

    const { user, fetchRecipes: fetchRecipesBridge, saveRecipe, deleteRecipe, loading: authLoading } = useDataPersistence();
    const { pantryItems, loading: pantryLoading } = usePantry();


    const [localSelectedTypes, setLocalSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);
    const [localIsFilterOpen, setLocalIsFilterOpen] = useState(false);

    const selectedTypes = externalSelectedTypes !== undefined ? externalSelectedTypes : localSelectedTypes;
    const setSelectedTypes = externalSetSelectedTypes !== undefined ? externalSetSelectedTypes : setLocalSelectedTypes;
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavoritesOnly !== undefined ? externalSetShowFavoritesOnly : setLocalShowFavoritesOnly;

    const isFilterOpen = externalIsFilterOpen !== undefined ? externalIsFilterOpen : localIsFilterOpen;
    const setIsFilterOpen = externalSetIsFilterOpen !== undefined ? externalSetIsFilterOpen : setLocalIsFilterOpen;

    const [localSortField, setLocalSortField] = useState<string>('title');
    const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');
    
    const sortField = externalSortField !== undefined ? externalSortField : localSortField;
    const sortDirection = externalSortDirection !== undefined ? externalSortDirection : localSortDirection;
    
    // Use external searchQuery if provided, otherwise use internal from useSearch
    const effectiveSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : searchQuery;
    
    const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(onlyMyRecipes);
    
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
    }, [effectiveSearchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection, authLoading, filters.pantryMode, filters.selectedDietType, filters.selectedExclusions, filters.showFlavours, filters.showSupplements, filters.selectedTags, filters.selectedDifficulty, showOnlyMyRecipes, isMix, isRemix]);


    const fetchRecipes = async (pageToLoad: number, isNewSearch = false) => {
        if (pageToLoad === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            // No longer need to manually fetch pantry items as they are provided by the usePantry hook
            const currentPantry = pantryItems;

            const needsIngredients = filters.pantryMode === 'pantry-only' || 
                                    filters.selectedExclusions.length > 0 || 
                                    filters.selectedDietType !== 'anything' ||
                                    filters.selectedEquipment.length > 0;


            const { recipes: fetchedRecipes, count } = await fetchRecipesBridge({
                searchQuery: effectiveSearchQuery,
                selectedTypes,
                showFavoritesOnly,
                page: 0,
                pageSize: 1000, // Fetch all for local filtering
                sortField,
                sortDirection,
                isMix,
                isRemix,
                includeDetails: needsIngredients
            });

            // LOCAL FILTERING (for things we can't do easily in Supabase)
            let filteredItems = fetchedRecipes.filter(r => {
                // 1. Ownership check
                if (showOnlyMyRecipes) {
                    const isMine = user 
                        ? (r.user_id === user.id && !r.is_curated)
                        : (r.id.toString().startsWith('local-') || !r.user_id);
                    if (!isMine) return false;
                }
                
                // 2. Tab filtering (Remixes, Mixes, or base Recipes)
                if (isRemix !== undefined) {
                    const rIsRemix = !!(r as any).is_remix;
                    if (rIsRemix !== isRemix) return false;
                }
                if (isMix !== undefined) {
                    const rIsMix = !!(r as any).is_mix;
                    if (rIsMix !== isMix) return false;
                }
                return true;
            });
            
            // 1. Dietary Preference Filter
            if (filters.selectedDietType && filters.selectedDietType !== 'anything') {
                filteredItems = filteredItems.filter(r => 
                    r.diet && r.diet.map((d: string) => d.toLowerCase()).includes(filters.selectedDietType.toLowerCase())
                );
            }

            // 1b. Health Conditions Filter
            if (filters.selectedHealthConditions.length > 0) {
                filteredItems = filteredItems.filter(r => 
                    r.diet && filters.selectedHealthConditions.some(hc => 
                        r.diet.map((d: string) => d.toLowerCase()).includes(hc.toLowerCase())
                    )
                );
            }

            // 2. Exclusions Filter
            if (filters.selectedExclusions.length > 0) {
                const searchExclusions = filters.selectedExclusions.map(exc => exc.toLowerCase());
                
                filteredItems = filteredItems.filter(r => {
                    // Check Title and Type first (for things like "Spice Mix")
                    const titleMatch = searchExclusions.some(exc => (r.title || '').toLowerCase().includes(exc));
                    const typeMatch = searchExclusions.some(exc => (r.type || '').toLowerCase().includes(exc));
                    if (titleMatch || typeMatch) return false;

                    const recipeIngredients = (r as any).ingredients || [];
                    return !recipeIngredients.some((ing: any) => {
                        const category = ing.food_item?.category?.toLowerCase() || '';
                        if (!filters.showFlavours && category === 'flavour') return false;
                        if (!filters.showSupplements && category === 'supplements') return false;

                        const name = (ing.item || '').toLowerCase();
                        return searchExclusions.some(exc => name.includes(exc));
                    });
                });
            }

            // 3. Equipment Filter
            if (filters.selectedEquipment.length > 0) {
                filteredItems = filteredItems.filter(r => {
                    const inferred = inferEquipmentFromRecipe(
                        (r as any).ingredients?.map((ing: any) => ({
                            food_item_name: ing.item,
                            modifier: ing.modifier,
                            cooking_state: ing.cooking_state
                        })) || [],
                        (r as any).instructions?.map((i: any) => i.step_text) || []
                    );
                    
                    // Recipe is OK if ALL its required equipment is in the selected list
                    return inferred.every(e => filters.selectedEquipment.includes(e));
                });
            }

            // 4. Pantry Filter
            if (filters.pantryMode === 'pantry-only') {
                const pantryIds = new Set(currentPantry.map(pi => pi.food_item_id || pi.id));
                const pantryNames = new Set(currentPantry.map(pi => (pi.name || '').toLowerCase().trim()).filter(Boolean));

                filteredItems = filteredItems.filter(r => {
                    const recipeIngredients = (r as any).ingredients || [];
                    
                    // If no ingredients, it's makeable
                    if (recipeIngredients.length === 0) return true;

                    const missingIngredients = recipeIngredients.filter((ing: any) => {
                        const category = ing.food_item?.category?.toLowerCase() || '';
                        if (!filters.showFlavours && category === 'flavour') return false;
                        if (!filters.showSupplements && category === 'supplements') return false;

                        const inPantry = pantryIds.has(ing.food_item_id) || 
                                       pantryNames.has((ing.item || '').toLowerCase().trim());

                        return !inPantry;
                    });

                    return missingIngredients.length === 0;
                });
            }

            // 5. Difficulty Filter
            if (filters.selectedDifficulty && filters.selectedDifficulty.length > 0) {
                filteredItems = filteredItems.filter(r => 
                    r.difficulty && filters.selectedDifficulty.includes(r.difficulty)
                );
            }

            // 6. Tags Filter
            if (filters.selectedTags && filters.selectedTags.length > 0) {
                filteredItems = filteredItems.filter(r => 
                    r.tags && filters.selectedTags.some(tag => r.tags.includes(tag))
                );
            }

            // --- LOCAL SORTING ---
            const difficultyOrder: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
            
            let sortedItems = [...filteredItems].sort((a, b) => {
                let valA: any, valB: any;
                
                switch (sortField) {
                    case 'title':
                        valA = (a.title || '').toLowerCase();
                        valB = (b.title || '').toLowerCase();
                        break;
                    case 'prep_time':
                        valA = a.prep_time || 0;
                        valB = b.prep_time || 0;
                        break;
                    case 'difficulty':
                        valA = difficultyOrder[a.difficulty || 'Medium'] || 2;
                        valB = difficultyOrder[b.difficulty || 'Medium'] || 2;
                        break;
                    case 'calories':
                        valA = a.calories || 0;
                        valB = b.calories || 0;
                        break;
                    default:
                        valA = (a.title || '').toLowerCase();
                        valB = (b.title || '').toLowerCase();
                }

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            const processedRecipes = sortedItems;
            setTotalCount(processedRecipes.length);

            if (isNewSearch) {
                // For new search/filter, show the first page
                const firstSlice = processedRecipes.slice(0, PAGE_SIZE);
                setRecipes(firstSlice);
                setPage(0);
                setHasMore(firstSlice.length < processedRecipes.length);
            } else {
                // For 'Load More', show the next slice
                const startIdx = pageToLoad * PAGE_SIZE;
                const endIdx = startIdx + PAGE_SIZE;
                const nextSlice = processedRecipes.slice(startIdx, endIdx);
                setRecipes((prev: Recipe[]) => [...prev, ...nextSlice]);
                setPage(pageToLoad);
                setHasMore(recipes.length + nextSlice.length < processedRecipes.length);
            }

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
            setLocalSortDirection((prev: 'asc' | 'desc') => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setLocalSortField(field);
            setLocalSortDirection('asc');
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

            setRecipes((prev: Recipe[]) => prev.map(r =>
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
        router.push(`/recipes/${recipeId}`);
    };

    const renderRecipesList = () => {
        if (loading) {
            return (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Loader2 className={cn("animate-spin", isMix ? "text-indigo-500" : "text-blue-500")} size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading {isMix ? 'mixes' : 'meals'}...</p>
                </div>
            );
        }
        
        if (recipes.length === 0) {
            return (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ChefHat size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "Collection Empty" : `No ${isMix ? 'mixes' : 'meals'} found.`}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => {
                                if (onRecipeClick) {
                                    onRecipeClick(recipe.id);
                                } else {
                                    router.push(`/recipes/${recipe.id}`);
                                }
                            }}
                            className={cn(
                                "group relative rounded-xl border transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm",
                                isMix 
                                    ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400 hover:shadow-indigo-500/10 hover:shadow-xl" 
                                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 hover:shadow-emerald-500/10 hover:shadow-xl"
                            )}
                        >
                            <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr_auto] gap-3 lg:gap-4 lg:items-center lg:px-10 py-1">
                                <div className="aspect-square w-16 lg:w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative group-hover:scale-105 transition-transform duration-500">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ChefHat size={24} className="opacity-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 lg:p-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight line-clamp-2">
                                            {recipe.title.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h3>
                                    </div>
                                    {(recipe.calories > 0 || recipe.protein > 0) && (
                                        <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                            {(() => {
                                                const multiplier = filters.nutritionViewMode === 'per-serving' ? 1 / (recipe.servings || 1) : 1;
                                                return (
                                                    <>
                                                        <span className="text-blue-500">{formatEnergy(recipe.calories * multiplier, energyUnit)}</span>
                                                        <span className="text-slate-300 text-[8px]">•</span>
                                                        <span className="text-amber-500">{Math.round(recipe.carbs * multiplier)}g C</span>
                                                        <span className="text-slate-300 text-[8px]">•</span>
                                                        <span className="text-rose-500">{Math.round(recipe.fat * multiplier)}g F</span>
                                                        <span className="text-slate-300 text-[8px]">•</span>
                                                        <span className="text-emerald-500">{Math.round(recipe.protein * multiplier)}g P</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {(recipe.calories > 0 || recipe.protein > 0) && (
                                    <div className="hidden lg:flex items-center justify-end gap-3">
                                        {(() => {
                                            const multiplier = filters.nutritionViewMode === 'per-serving' ? 1 / (recipe.servings || 1) : 1;
                                            return (
                                                <>
                                                    <span className="font-black text-[11px] text-blue-500 dark:text-blue-400">{formatEnergy(recipe.calories * multiplier, energyUnit)}</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{(recipe.carbs * multiplier).toFixed(1)}g</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{(recipe.fat * multiplier).toFixed(1)}g</span>
                                                    <span className="text-slate-300 text-[8px]">•</span>
                                                    <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{(recipe.protein * multiplier).toFixed(1)}g</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {hasMore ? (
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className={cn(
                                "h-12 px-8 rounded-full border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40",
                                isMix 
                                    ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                            )}
                        >
                            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                            Load More
                        </button>
                    </div>
                ) : recipes.length > 0 && (
                    <div className="flex justify-center pt-8">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {totalCount} {totalCount === 1 ? (isMix ? 'mix' : 'meal') : (isMix ? 'mixes' : 'meals')} found
                         </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn("space-y-8 animate-in fade-in duration-500", noContainer && "space-y-0")}>
            {!noContainer ? (
                <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    {showAddRecipe && setShowAddRecipe ? (
                        <RecipeFormDialog
                            onClose={() => setShowAddRecipe(false)}
                            onSave={() => fetchRecipes(0, true)}
                            isMix={isMix}
                        />
                    ) : (
                        <>
                            {!hideControls && (
                                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 rounded-t-[2rem]">
                                    <div className="flex md:hidden items-center gap-2 px-4 py-3">
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <button className={cn(
                                                    'flex items-center gap-2 h-9 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0',
                                                    (showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length))
                                                        ? isMix ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-600 shadow-sm'
                                                )}>
                                                    <Filter size={11} />
                                                    Filter
                                                </button>
                                            </SheetTrigger>
                                            <SheetContent side="bottom" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl px-6 pt-6 pb-10">
                                                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Favorites only</span>
                                                    <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className={isMix ? "data-[state=checked]:bg-indigo-600" : "data-[state=checked]:bg-blue-600"} />
                                                </div>
                                                <div className="mt-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Types</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {MEAL_TYPES.map(type => (
                                                            <button
                                                                key={type}
                                                                onClick={() => {
                                                                    if (selectedTypes.includes(type)) setSelectedTypes(prev => prev.filter(t => t !== type));
                                                                    else setSelectedTypes(prev => [...prev, type]);
                                                                }}
                                                                className={cn(
                                                                    'h-8 px-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all',
                                                                    selectedTypes.includes(type)
                                                                        ? isMix ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-blue-500 border-blue-500 text-white'
                                                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600'
                                                                )}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                            <input
                                                type="text"
                                                value={effectiveSearchQuery ?? ''}
                                                onChange={(e) => onSearchChange?.(e.target.value)}
                                                placeholder="Search..."
                                                className="w-full h-9 pl-9 pr-4 rounded-full border text-[10px] font-semibold bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="hidden md:flex gap-4 justify-between items-center px-10 py-4">
                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 outline-none shadow-sm">
                                                        <Filter size={12} />
                                                        Filter
                                                        <ChevronDown size={10} className="opacity-50" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent side="bottom" align="start" className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                                    <div className="p-2">
                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Scope</DropdownMenuLabel>
                                                        <DropdownMenuCheckboxItem checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer">
                                                            Favorites Only
                                                        </DropdownMenuCheckboxItem>
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                            <input
                                                type="text"
                                                value={effectiveSearchQuery ?? ''}
                                                onChange={(e) => onSearchChange?.(e.target.value)}
                                                placeholder="Search recipes..."
                                                className="w-64 h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:bg-emerald-50 focus:border-emerald-200 transition-all outline-none shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 md:p-6">
                                {renderRecipesList()}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="p-0">
                    {renderRecipesList()}
                </div>
            )}
        </div>
    );
}
