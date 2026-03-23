'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Heart,
    ChefHat,
    Filter,
    Loader2,
    Pencil,
    Trash2,
    CheckSquare,
    Square,
    Plus
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
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { supabase } from '@/lib/supabase';
import { PANTRY_QUANTITIES_KEY } from '@/components/pantry/pantry-types';
import { inferEquipmentFromRecipe } from '@/lib/utils/equipment-inference';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';

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

interface MyRecipesViewProps {
    onRecipeClick?: (recipeId: string) => void;
    hideControls?: boolean;
    isMix?: boolean;
}

export function MyRecipesView({ onRecipeClick, hideControls = false, isMix = false }: MyRecipesViewProps = {}) {
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
    const { filters } = useRecipeFilter();
    const { user, fetchRecipes: fetchRecipesBridge, saveRecipe, deleteRecipe, loading: authLoading, recipeRefreshVersion } = useDataPersistence();
    const [pantryItems, setPantryItems] = useState<any[]>([]);


    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [sortField, setSortField] = useState<string>('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Fetch user's personal recipes (cloud if logged in, local if not)
    useEffect(() => {
        if (!authLoading) {
            fetchMyRecipes(0, true);
        }
    }, [searchQuery, selectedTypes, showFavoritesOnly, sortField, sortDirection, authLoading, user, filters.pantryMode, filters.selectedDietType, filters.selectedExclusions, filters.showFlavours, filters.showSupplements, recipeRefreshVersion]);

    const getPantryItems = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const [foodItemsRes, pantryItemsRes] = await Promise.all([
                supabase.from('food_items').select('*').eq('is_in_pantry', true),
                user ? supabase.from('pantry_items').select('*, scanned_products(nutrition), food_items(*)').eq('user_id', user.id) : { data: [] }
            ]);

            let combined: any[] = [
                ...(foodItemsRes.data || []).map(f => ({ ...f, source_table: 'food_items' })),
                ...(pantryItemsRes.data || []).map((item: any) => ({
                    id: item.id,
                    food_item_id: item.food_item_id,
                    name: item.scanned_products?.name || item.food_items?.name || item.custom_name,
                    quantity: item.quantity,
                    source_table: 'pantry_items'
                }))
            ];

            const saved = localStorage.getItem(PANTRY_QUANTITIES_KEY);
            if (saved) {
                const quantities = JSON.parse(saved);
                combined = combined.map(item => ({
                    ...item,
                    quantity: quantities[item.id] || item.quantity
                }));
            }
            return combined;
        } catch (err) {
            console.error('Failed to fetch pantry items', err);
            return [];
        }
    };

    const fetchMyRecipes = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            // Fetch pantry items first if needed
            let currentPantry = pantryItems;
            if (filters.pantryMode === 'pantry-only') {
                currentPantry = await getPantryItems();
                setPantryItems(currentPantry);
            }

            const needsIngredients = filters.pantryMode === 'pantry-only' || 
                                    filters.selectedExclusions.length > 0 || 
                                    filters.selectedDietType !== 'anything' ||
                                    filters.selectedEquipment.length > 0;


            // Fetch recipes with ingredients if needed
            const { recipes: allRecipes, count } = await fetchRecipesBridge({
                searchQuery,
                selectedTypes,
                showFavoritesOnly,
                page: 0,
                pageSize: 1000,
                sortField,
                sortDirection,
                isMix: isMix,
                includeDetails: needsIngredients
            });

            // 1. Ownership logic
            let filteredItems = allRecipes.filter(r => {
                if (user) {
                    return r.user_id === user.id && !r.is_curated;
                } else {
                    return r.id.toString().startsWith('local-') || !r.user_id;
                }
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
                const pantryNames = new Set(currentPantry.map(pi => pi.name?.toLowerCase().trim()).filter(Boolean));

                filteredItems = filteredItems.filter(r => {
                    const recipeIngredients = (r as any).ingredients || [];
                    
                    // If no ingredients, it's makeable
                    if (recipeIngredients.length === 0) return true;

                    const missingIngredients = recipeIngredients.filter((ing: any) => {
                        const category = ing.food_item?.category?.toLowerCase() || '';
                        if (!filters.showFlavours && category === 'flavour') return false;
                        if (!filters.showSupplements && category === 'supplements') return false;

                        const inPantry = pantryIds.has(ing.food_item_id) || 
                                       pantryNames.has(ing.item?.toLowerCase().trim());

                        return !inPantry;
                    });

                    return missingIngredients.length === 0;
                });
            }

            const userRecipes = filteredItems;
            setTotalCount(userRecipes.length);

            if (isNewSearch) {
                // For new search/filter, show the first page
                const firstSlice = userRecipes.slice(0, PAGE_SIZE);
                setRecipes(firstSlice);
                setPage(0);
                setHasMore(firstSlice.length < userRecipes.length);
            } else {
                // For 'Load More', show the next slice
                const startIdx = pageNum * PAGE_SIZE;
                const endIdx = startIdx + PAGE_SIZE;
                const paginatedRecipes = userRecipes.slice(startIdx, endIdx);
                setRecipes(prev => [...prev, ...paginatedRecipes]);
                setPage(pageNum);
                setHasMore(recipes.length + paginatedRecipes.length < userRecipes.length);
            }
        } catch (error) {
            console.error('Error fetching personal recipes:', error);
            toast.error('Failed to load your recipes');
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
            fetchMyRecipes(page + 1);
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
            toast.success(newStatus ? 'Added to favorites' : 'Removed from favorites');
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
        router.push(`/dashboard/library/recipes/${recipeId}`);
    };

    const handleAddRecipeFromURL = () => {
        router.push('/dashboard/library/meals/new');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* List Container */}
            <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
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
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                    )}>
                                        <Filter size={11} />
                                        Filter
                                        {(showFavoritesOnly || (selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length)) && (
                                            <span className="w-4 h-4 flex items-center justify-center text-white text-[8px] font-black rounded-full bg-emerald-600">
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
                                        <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
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
                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
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
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-200 hover:text-emerald-600"
                                    )}>
                                        <Filter size={12} />
                                        <span className="hidden sm:inline">
                                            {showFavoritesOnly ? "Favorites" :
                                                (selectedTypes.length === 0 || selectedTypes.length === MEAL_TYPES.length ? "FILTER" :
                                                    `${selectedTypes.length} Types`)}
                                        </span>
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
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 transition-colors"
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
                                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/10 focus:text-emerald-600"
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

                    {/* Add Recipe Button */}
                    <Button
                        onClick={handleAddRecipeFromURL}
                        className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={12} />
                        Add Recipe
                    </Button>
                </div>
                )}

                {/* Content Area */}
                <div className="p-4 md:p-6">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading your recipes...</p>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                                <ChefHat size={32} />
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {showFavoritesOnly ? "No Favorite Recipes Yet" : "No Recipes Yet"}
                            </p>
                            <p className="text-sm text-slate-500 mb-6">Start by adding a recipe from a URL</p>
                            <Button
                                onClick={handleAddRecipeFromURL}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Plus size={14} />
                                Add Your First Recipe
                            </Button>
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
                                                router.push(`/dashboard/library/recipes/${recipe.id}`);
                                            }
                                        }}
                                        className={cn(
                                            "group relative bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-500 cursor-pointer overflow-hidden",
                                            "hover:border-emerald-400/50 hover:shadow-lg"
                                        )}
                                    >
                                        <div className="flex flex-row lg:grid lg:grid-cols-[60px_1fr] gap-3 lg:gap-4 lg:items-center lg:px-10 py-1">
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
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                    {/* Pagination */}
                    {hasMore ? (
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
            </div>
        </div>
    );
}
