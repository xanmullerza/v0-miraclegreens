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
    Square,
    Search
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
import { RecipeFormDialog } from '@/components/ingredients/recipe-form-dialog';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { supabase } from '@/lib/supabase';
import { PANTRY_QUANTITIES_KEY } from '@/components/pantry/pantry-types';
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
    isPremium: externalIsPremium
}: RecipesViewProps) {
    const router = useRouter();
    const PAGE_SIZE = 20;
    const { profile } = useUserPreferences();
    const isPremium = externalIsPremium ?? profile.isPremium;
    
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
    }, [effectiveSearchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection, authLoading, filters.pantryMode, filters.selectedDietType, filters.selectedExclusions, filters.showFlavours, filters.showSupplements, filters.selectedTags, filters.selectedDifficulty]);


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
                if (onlyMyRecipes) {
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* List Container */}
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
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
                <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-[2rem]">
                    {/* Mobile Filter & Search Bar (md:hidden) */}
                    <div className="flex md:hidden items-center gap-2 px-4 py-3">
                        {/* Mobile Drawer Filter */}
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
                                    {(showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length)) && (
                                        <span className={cn("w-3.5 h-3.5 flex items-center justify-center text-white text-[8px] font-black rounded-full border border-white dark:border-slate-900", isMix ? "bg-indigo-500" : "bg-blue-500")}>
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
                        
                        {/* Premium Tabs (Only shown if isPremium) */}
                        {isPremium && (
                            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                {[
                                    { id: 'all', label: 'Recipes' },
                                    { id: 'remixes', label: 'Remixes' },
                                    { id: 'mixes', label: 'Mixes' }
                                ].map((tab) => {
                                    const isActive = (tab.id === 'all' && !isMix && !isRemix) || 
                                                   (tab.id === 'mixes' && isMix) || 
                                                   (tab.id === 'remixes' && isRemix);
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                // If we had a router-based tab system, we'd use it here.
                                                // For now, these are usually controlled via props in the chatbot.
                                                // On the full page, we might need internal state or URL params.
                                                if (tab.id === 'all') router.push('/recipes');
                                                else if (tab.id === 'remixes') router.push('/recipes?tab=remixes');
                                                else if (tab.id === 'mixes') router.push('/recipes?tab=mixes');
                                            }}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                isActive 
                                                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Mobile Search Input */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                            <input
                                type="text"
                                value={effectiveSearchQuery ?? ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder="Search recipes..."
                                className={cn(
                                    "w-full h-9 pl-9 pr-4 rounded-full border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                    "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                    "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                    isMix ? "focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-600" : "focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400 dark:focus:border-blue-600"
                                )}
                            />
                        </div>
                    </div>

                    {/* Desktop Controls (hidden md:flex) */}
                    <div className="hidden md:flex gap-4 justify-between items-center px-10 py-4">
                        {/* Filter Button */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                    (showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length))
                                        ? isMix ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-200 hover:text-blue-600"
                                )}>
                                    <Filter size={12} />
                                    <span>
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

                        {/* Premium Tabs (Only shown if isPremium) */}
                        {isPremium && (
                            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                                {[
                                    { id: 'all', label: 'Recipes' },
                                    { id: 'remixes', label: 'Remixes' },
                                    { id: 'mixes', label: 'Mixes' }
                                ].map((tab) => {
                                    const isActive = (tab.id === 'all' && !isMix && !isRemix) || 
                                                   (tab.id === 'mixes' && isMix) || 
                                                   (tab.id === 'remixes' && isRemix);
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                if (tab.id === 'all') router.push('/recipes');
                                                else if (tab.id === 'remixes') router.push('/recipes?tab=remixes');
                                                else if (tab.id === 'mixes') router.push('/recipes?tab=mixes');
                                            }}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                isActive 
                                                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Desktop Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                            <input
                                type="text"
                                value={effectiveSearchQuery ?? ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder="Search recipes..."
                                className={cn(
                                    "w-64 h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                    "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                    "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                    isMix ? "focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 dark:focus:border-indigo-600" : "focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400 dark:focus:border-blue-600"
                                )}
                            />
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
                                onClick={() => {
                                    if (onRecipeClick) {
                                        onRecipeClick(recipe.id);
                                    } else {
                                        router.push(`/recipes/${recipe.id}`);
                                    }
                                }}
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
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight line-clamp-2">
                                            {recipe.title.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h3>
                                        
                                        {/* Mobile Macros */}
                                        {(recipe.calories > 0 || recipe.protein > 0) && (
                                            <div className="flex lg:hidden items-center gap-2 mt-1.5 text-[9px] font-black">
                                                <span className="text-blue-500">{formatEnergy(recipe.calories, energyUnit)}</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-amber-500">{Math.round(recipe.carbs)}g C</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-rose-500">{Math.round(recipe.fat)}g F</span>
                                                <span className="text-slate-300 text-[8px]">•</span>
                                                <span className="text-emerald-500">{Math.round(recipe.protein)}g P</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Macros */}
                                    {(recipe.calories > 0 || recipe.protein > 0) && (
                                        <div className="hidden lg:flex items-center justify-end gap-3">
                                            <span className="font-black text-[11px] text-blue-500 dark:text-blue-400">{formatEnergy(recipe.calories, energyUnit)}</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-amber-500 dark:text-amber-400">{recipe.carbs.toFixed(1)}g</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-rose-500 dark:text-rose-400">{recipe.fat.toFixed(1)}g</span>
                                            <span className="text-slate-300 text-[8px]">•</span>
                                            <span className="font-black text-[11px] text-emerald-500 dark:text-emerald-400">{recipe.protein.toFixed(1)}g</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
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
            )}
            </div>
            </>
            )}
            </div>
        </div>
    );
}
