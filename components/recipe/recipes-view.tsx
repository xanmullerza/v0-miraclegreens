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
    Coffee,
    Sun,
    Moon,
    Apple,
    Pill,
    Gauge,
    UtensilsCrossed,
    Plus,
    Minus
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
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
import { RecipeTabShell } from './recipe-tab-shell';
import { getSharedNavOptions, getCookbookNavOptions } from '@/lib/constants/nav-options';
import { useActionPanel } from '@/lib/context/action-panel-context';


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
    const { navigateTo } = useActionPanel();
    
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { searchQuery, setSearchQuery } = useSearch();
    const { energyUnit } = useUserPreferences();
    const { filters, updateFilter } = useRecipeFilter();

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
    const [localIsMix, setLocalIsMix] = useState(isMix);
    const [localIsRemix, setLocalIsRemix] = useState(isRemix);
    
    const activeIsMix = isMix !== undefined ? isMix : localIsMix;
    const activeIsRemix = isRemix !== undefined ? isRemix : localIsRemix;

    
    const [isAdmin, setIsAdmin] = useState(false);
    const servingsOverrides = filters.servingsOverrides || {};

    const handleUpdateServings = (e: React.MouseEvent, recipeId: string, delta: number, currentServings: number) => {
        e.preventDefault();
        e.stopPropagation();
        const next = Math.max(0.5, currentServings + delta);
        updateFilter('servingsOverrides', { ...servingsOverrides, [recipeId]: next });
    };



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
    }, [effectiveSearchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection, authLoading, filters.pantryMode, filters.selectedDietType, filters.selectedExclusions, filters.showFlavours, filters.showSupplements, filters.selectedTags, filters.selectedDifficulty, showOnlyMyRecipes, activeIsMix, activeIsRemix, user]);



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
                onlyMyRecipes: showOnlyMyRecipes,
                includeDetails: needsIngredients
            });

            // LOCAL FILTERING (for things we can't do easily in Supabase)
            let filteredItems = fetchedRecipes.filter(r => {
                // Ownership check is now handled in fetchRecipesBridge with onlyMyRecipes param
                
                // Tab filtering (Remixes, Mixes, or base Recipes)
                if (activeIsRemix !== undefined) {
                    const rIsRemix = !!(r as any).is_remix;
                    if (rIsRemix !== activeIsRemix) return false;
                }
                if (activeIsMix !== undefined) {
                    const rIsMix = !!(r as any).is_mix;
                    if (rIsMix !== activeIsMix) return false;
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
            
            let sortedItems = [...filteredItems].sort((a, b) => {
                let valA: any, valB: any;
                
                switch (sortField) {
                    case 'title':
                        valA = (a.title || '').toLowerCase();
                        valB = (b.title || '').toLowerCase();
                        break;
                    case 'calories':
                        valA = a.calories || 0;
                        valB = b.calories || 0;
                        break;
                    case 'protein':
                        valA = a.protein || 0;
                        valB = b.protein || 0;
                        break;
                    case 'carbs':
                        valA = a.carbs || 0;
                        valB = b.carbs || 0;
                        break;
                    case 'fat':
                        valA = a.fat || 0;
                        valB = b.fat || 0;
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
            toast.error('Failed to load recipe library');
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
        router.push(`/?recipeId=${recipeId}`);
    };

    const renderRecipesList = () => {
        if (loading) {
            return (
                <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem]">
                    <Loader2 className={cn("animate-spin", isMix ? "text-indigo-500" : "text-blue-500")} size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading {isMix ? 'mixes' : 'recipes'}...</p>
                </div>

            );
        }
        
        if (recipes.length === 0) {
            return (
                <div className="h-96 flex flex-col items-center justify-center rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">

                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ChefHat size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "Collection Empty" : `No ${isMix ? 'mixes' : 'recipes'} found.`}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="space-y-4">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            className={cn(
                                'group relative rounded-[2.5rem] transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm',
                                'shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] hover:-translate-y-1',
                                isMix 
                                    ? 'bg-gradient-to-br from-indigo-950 via-indigo-950 to-slate-900' 
                                    : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/90'
                            )}


                            onClick={() => onRecipeClick ? onRecipeClick(recipe.id) : router.push(`/?recipeId=${recipe.id}`)}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 sm:p-4">
                                <div className="relative shrink-0 flex items-center">
                                    <div className="aspect-[16/9] sm:aspect-square w-full sm:w-24 bg-slate-100 dark:bg-slate-800 overflow-hidden relative rounded-2xl shadow-xl ring-1 ring-white/5">


                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <ChefHat size={28} />
                                            </div>
                                        )}
                                        {(recipe.type || recipe.meal_type) && (
                                            <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[7px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase">

                                                {(recipe.type || recipe.meal_type)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white capitalize leading-tight group-hover:text-emerald-400 transition-colors truncate">
                                            {recipe.title.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h3>
                                    </div>

                                     <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const baseServings = recipe.servings || 1;
                                            const currentServings = servingsOverrides[recipe.id] !== undefined 
                                                ? servingsOverrides[recipe.id] 
                                                : (filters.globalServings !== null ? filters.globalServings : baseServings);
                                            // If the user has explicitly overridden servings or there's a global servings override, we show the total for that amount.
                                            // Otherwise, we respect the global nutritionViewMode.
                                            const multiplier = (servingsOverrides[recipe.id] !== undefined || filters.globalServings !== null)
                                                ? (currentServings / baseServings)
                                                : (filters.nutritionViewMode === 'per-serving' ? (1 / baseServings) : 1);
                                            return (
                                                <>
                                                    <div className="bg-transparent px-2 py-2 flex flex-col items-center flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Energy</span>
                                                        <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">
                                                            {formatEnergy(recipe.calories * multiplier, energyUnit)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-transparent px-2 py-2 flex flex-col items-center flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest leading-none mb-2">Carbs</span>
                                                        <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">
                                                            {(recipe.carbs * multiplier).toFixed(1)}g
                                                        </span>
                                                    </div>
                                                    <div className="bg-transparent px-2 py-2 flex flex-col items-center flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest leading-none mb-2">Protein</span>
                                                        <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">
                                                            {(recipe.protein * multiplier).toFixed(1)}g
                                                        </span>
                                                    </div>
                                                    <div className="bg-transparent px-2 py-2 flex flex-col items-center flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest leading-none mb-2">Fat</span>
                                                        <span className="font-black text-[11px] sm:text-xs tracking-tight text-slate-900 dark:text-white leading-none w-full text-center">
                                                            {(recipe.fat * multiplier).toFixed(1)}g
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
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
                                "h-12 px-8 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40",
                                isMix 
                                    ? "bg-white dark:bg-slate-800/50 text-slate-500 hover:text-indigo-600 shadow-sm"
                                    : "bg-white dark:bg-slate-800/50 text-slate-500 hover:text-blue-600 shadow-sm"
                            )}

                        >
                            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                            Load More
                        </button>
                    </div>
                ) : recipes.length > 0 && (
                    <div className="flex justify-center pt-8">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            {totalCount} {totalCount === 1 ? (isMix ? 'mix' : 'recipe') : (isMix ? 'mixes' : 'recipes')} found
                         </p>
                    </div>
                )}
            </div>
        );
    };

    const recipeList = (
        <div className="space-y-4">
            {renderRecipesList()}
        </div>
    );

    return (
        <div className={cn("space-y-8 animate-in fade-in duration-500", noContainer && "space-y-0")}>
            {!noContainer ? (
                <RecipeTabShell
                    title="Cookbook"
                    searchQuery={effectiveSearchQuery}
                    onSearchChange={(q) => onSearchChange ? onSearchChange(q) : setSearchQuery(q)}
                    sortField={sortField}
                    setSortField={(f) => handleSort(f)}
                    sortDirection={sortDirection}
                    setSortDirection={setLocalSortDirection}
                >
                    {recipeList}
                </RecipeTabShell>
            ) : (
                recipeList
            )}
        </div>
    );
}
