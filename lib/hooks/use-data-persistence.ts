import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Recipe {
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
    user_id?: string | null;
    is_curated?: boolean;
    is_mix?: boolean;
}

export function useDataPersistence() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchRecipes = async (options: {
        searchQuery?: string,
        selectedTypes?: string[],
        showFavoritesOnly?: boolean,
        isMix?: boolean,
        page?: number,
        pageSize?: number,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        includeDetails?: boolean
    } = {}) => {
        const {
            searchQuery = '',
            selectedTypes = [],
            showFavoritesOnly = false,
            isMix = undefined,
            page = 0,
            pageSize = 20,
            sortField = 'title',
            sortDirection = 'asc',
            includeDetails = false
        } = options;

        try {
            // 1. Fetch from Supabase (Curated + User's own)
            let query = supabase
                .from('recipes')
                .select('*', { count: 'exact' });

            if (includeDetails) {
                // Supabase doesn't support easy nested fetch in a single 'select *' for unrelated tables 
                // in the same way, but we can handle it if needed. 
                // For 'fetchRecipes' (list view), we usually don't need details.
            }

            // Filtering
            if (user) {
                // If logged in, get curated OR user's own
                query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
            } else {
                // If not logged in, only get curated from cloud
                query = query.eq('is_curated', true);
            }

            if (searchQuery.trim()) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            if (selectedTypes.length > 0) {
                query = query.in('type', selectedTypes);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            if (isMix !== undefined) {
                query = query.eq('is_mix', isMix);
            }

            // Pagination & Sorting
            query = query.order(sortField, { ascending: sortDirection === 'asc' });
            const from = page * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data: cloudRecipes, error, count } = await query;
            if (error) throw error;

            let finalRecipes = (cloudRecipes as Recipe[]) || [];
            let finalCount = count || 0;

            // 2. If NOT logged in, merge with LocalStorage recipes
            if (!user) {
                const localData = localStorage.getItem('local_recipes');
                if (localData) {
                    let localRecipes: Recipe[] = JSON.parse(localData);

                    // Apply local filters/search
                    if (searchQuery.trim()) {
                        localRecipes = localRecipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    }
                    if (selectedTypes.length > 0) {
                        localRecipes = localRecipes.filter(r => selectedTypes.includes(r.type));
                    }
                    if (showFavoritesOnly) {
                        localRecipes = localRecipes.filter(r => r.is_favorite);
                    }

                    // For now, local storage doesn't support sophisticated pagination/sorting in this hook
                    // but we can merge them. To keep it simple, we'll just prepend local recipes.
                    finalRecipes = [...localRecipes, ...finalRecipes];
                    finalCount += localRecipes.length;
                }
            }

            return { recipes: finalRecipes, count: finalCount };
        } catch (error) {
            console.error('Error in useDataPersistence.fetchRecipes:', error);
            throw error;
        }
    };

    const saveRecipe = async (recipe: any, ingredients?: any[], instructions?: any[]) => {
        try {
            if (user) {
                // SAVE TO CLOUD
                const recipeId = recipe.id || `recipe-${Date.now()}`;
                const recipeData = {
                    ...recipe,
                    id: recipeId,
                    user_id: user.id,
                    is_curated: false
                };

                // 1. Save main recipe
                const { error: recipeError } = await supabase
                    .from('recipes')
                    .upsert(recipeData as any);

                if (recipeError) throw recipeError;

                // 2. Save ingredients if provided
                if (ingredients && ingredients.length > 0) {
                    // Delete old ingredients first if updating
                    if (recipe.id) {
                        await supabase.from('ingredients').delete().eq('recipe_id', recipe.id);
                    }

                    const servings = recipe.servings || 1;
                    const ingredientsData = ingredients.map(ing => {
                        // Ensure we have a descriptive item name and amount for legacy support/fallback
                        const itemName = ing.food_item_name || 'Ingredient';
                        const amountStr = `${ing.quantity / servings} ${ing.measure_label || 'unit'}`;

                        return {
                            recipe_id: recipeId,
                            food_item_id: ing.food_item_id,
                            item: itemName,
                            amount: amountStr,
                            weight_g: ing.weight_g / servings,
                            quantity: ing.quantity / servings,
                            measure_label: ing.measure_label,
                            base_ingredient: itemName, // Fallback
                            modifier: ing.modifier || null,
                        };
                    });

                    const { error: ingError } = await supabase.from('ingredients').insert(ingredientsData);
                    if (ingError) throw ingError;
                }

                // 3. Save instructions if provided
                if (instructions && instructions.length > 0) {
                    if (recipe.id) {
                        await supabase.from('instructions').delete().eq('recipe_id', recipe.id);
                    }

                    const instructionsData = instructions.map((ins, idx) => ({
                        recipe_id: recipeId,
                        step_text: typeof ins === 'string' ? ins : ins.step_text,
                        step_order: ins.step_order || idx + 1
                    }));

                    const { error: insError } = await supabase.from('instructions').insert(instructionsData);
                    if (insError) throw insError;
                }

                // NEW: Mix to Food Item Sync
                if (recipeData.is_mix) {
                    const totalWeight = ingredients?.reduce((sum, ing) => sum + (ing.weight_g || 0), 0) || 0;
                    // Only sync if there's weight data, otherwise we can't calculate density
                    if (totalWeight > 0) {
                        const density = 100 / totalWeight; // per 100g

                        const totals = ingredients?.reduce((acc, ing) => ({
                            calories: acc.calories + (ing.calories || 0),
                            energy_kj: acc.energy_kj + (ing.energy_kj || 0),
                            protein: acc.protein + (ing.protein || 0),
                            fat: acc.fat + (ing.fat || 0),
                            carbs: acc.carbs + (ing.carbs || 0),
                        }), { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 }) || { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 };

                        const foodItemData = {
                            name: recipeData.title,
                            common_name: recipeData.title,
                            energy_kcal: totals.calories * density,
                            energy_kj: totals.energy_kj * density,
                            protein_g: totals.protein * density,
                            fat_g: totals.fat * density,
                            carbs_g: totals.carbs * density,
                            image: recipeData.image,
                            category: 'Mixes',
                            source: 'mix',
                            recipe_id: recipeId,
                            micronutrients: Object.fromEntries(
                                Object.entries(ingredients?.reduce((acc, ing) => {
                                    if (ing.micronutrients) {
                                        Object.entries(ing.micronutrients).forEach(([k, v]) => {
                                            acc[k] = (acc[k] || 0) + (Number(v) || 0);
                                        });
                                    }
                                    return acc;
                                }, {} as Record<string, number>) || {}).map(([k, v]: [string, any]) => [k, (v as number) * density])
                            ),
                            phytonutrients: Object.fromEntries(
                                Object.entries(ingredients?.reduce((acc, ing) => {
                                    if (ing.phytonutrients) {
                                        Object.entries(ing.phytonutrients).forEach(([k, v]) => {
                                            acc[k] = (acc[k] || 0) + (Number(v) || 0);
                                        });
                                    }
                                    return acc;
                                }, {} as Record<string, number>) || {}).map(([k, v]: [string, any]) => [k, (v as number) * density])
                            )
                        };

                        const { error: foodError } = await supabase
                            .from('food_items')
                            .upsert(foodItemData, { onConflict: 'recipe_id' });

                        if (foodError) {
                            console.error('Error syncing mix to food_items:', foodError);
                            // We don't throw here to avoid breaking the recipe save, but log it
                        }
                    }
                }

                return { ...recipeData, ingredients, instructions };
            } else {
                // Save to LocalStorage
                const localData = localStorage.getItem('local_recipes');
                let localRecipes: Recipe[] = localData ? JSON.parse(localData) : [];

                const recipeId = recipe.id || `local-${Date.now()}`;

                // Standardize ingredients for local storage to match cloud structure (include nesting)
                const servings = recipe.servings || 1;
                // Standardize ingredients for local storage to match cloud structure (include nesting)
                const mappedIngredients = ingredients?.map(ing => ({
                    ...ing,
                    item: ing.food_item_name || (ing as any).item || 'Ingredient', // Map to expected 'item' field
                    weight_g: ing.weight_g / servings,
                    quantity: ing.quantity / servings,
                    food_item: ing.food_item || {
                        id: ing.food_item_id,
                        name: ing.food_item_name,
                        energy_kcal: ing.base_nutrition?.calories || 0,
                        energy_kj: ing.base_nutrition?.energy_kj,
                        protein_g: ing.base_nutrition?.protein || 0,
                        fat_g: ing.base_nutrition?.fat || 0,
                        carbs_g: ing.base_nutrition?.carbs || 0,
                        micronutrients: ing.base_nutrition?.micronutrients || {}
                    }
                }));

                // Standardize instructions to match DB structure
                const mappedInstructions = instructions?.map((ins: any, idx) => ({
                    step_text: typeof ins === 'string' ? ins : ins.step_text,
                    step_order: ins.step_order || idx + 1
                }));

                const newRecipe = {
                    ...recipe,
                    id: recipeId,
                    ingredients: mappedIngredients,
                    instructions: mappedInstructions,
                    is_favorite: recipe.is_favorite ?? false,
                    is_mix: recipe.is_mix ?? false
                } as Recipe;

                const existingIndex = localRecipes.findIndex(r => r.id === recipeId);
                if (existingIndex > -1) {
                    localRecipes[existingIndex] = newRecipe;
                } else {
                    localRecipes.push(newRecipe);
                }

                localStorage.setItem('local_recipes', JSON.stringify(localRecipes));
                return newRecipe;
            }
        } catch (error) {
            console.error('Error in useDataPersistence.saveRecipe:', error);
            throw error;
        }
    };

    const deleteRecipe = async (id: string) => {
        try {
            if (id.startsWith('local-')) {
                const localData = localStorage.getItem('local_recipes');
                if (localData) {
                    let localRecipes: Recipe[] = JSON.parse(localData);
                    localRecipes = localRecipes.filter(r => r.id !== id);
                    localStorage.setItem('local_recipes', JSON.stringify(localRecipes));
                }
            } else if (user) {
                const { error } = await supabase
                    .from('recipes')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id); // Ensure ownership

                if (error) throw error;
            } else {
                toast.error('Cannot delete cloud recipe while logged out');
            }
        } catch (error) {
            console.error('Error in useDataPersistence.deleteRecipe:', error);
            throw error;
        }
    };

    const getRecipe = async (id: string) => {
        try {
            if (id.startsWith('local-')) {
                const localData = localStorage.getItem('local_recipes');
                if (!localData) return null;
                const localRecipes: Recipe[] = JSON.parse(localData);
                return localRecipes.find(r => r.id === id) || null;
            } else {
                const { data: recipe, error } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        ingredients (*, food_item:food_items(*)),
                        instructions (*)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return recipe;
            }
        } catch (error) {
            console.error('Error in useDataPersistence.getRecipe:', error);
            throw error;
        }
    };

    return {
        user,
        loading,
        fetchRecipes,
        saveRecipe,
        deleteRecipe,
        getRecipe
    };
}
