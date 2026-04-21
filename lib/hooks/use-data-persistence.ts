import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { calculateRecipeNutritionImproved, getAccuracyReport } from '@/lib/utils/nutrition-validation-improved';

export interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    cook_time: number;
    servings: number;
    image: string | null;
    is_favorite: boolean;
    diet: string[];
    tags: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    user_id?: string | null;
    is_curated?: boolean;
    is_mix?: boolean;
    is_remix?: boolean;
    meal_type?: string;
}

export function useDataPersistence() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recipeRefreshVersion, setRecipeRefreshVersion] = useState(0);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: any) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchRecipes = async (options: {
        searchQuery?: string,
        selectedTypes?: string[],
        showFavoritesOnly?: boolean,
        page?: number,
        pageSize?: number,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        includeDetails?: boolean,
        isMix?: boolean,
        isRemix?: boolean,
        onlyMyRecipes?: boolean
    } = {}) => {
        const {
            searchQuery = '',
            selectedTypes = [],
            showFavoritesOnly = false,
            page = 0,
            pageSize = 20,
            sortField = 'title',
            sortDirection = 'asc',
            includeDetails = false,
            isMix = undefined,
            isRemix = undefined,
            onlyMyRecipes = false
        } = options;

        try {
            // 1. Fetch from Supabase (Curated + User's own)
            let query = includeDetails 
                ? supabase.from('recipes').select('*, ingredients(*, food_item:food_items(*))', { count: 'exact' })
                : supabase.from('recipes').select('*', { count: 'exact' });

            if (includeDetails) {
                // Supabase doesn't support easy nested fetch in a single 'select *' for unrelated tables 
                // in the same way, but we can handle it if needed. 
                // For 'fetchRecipes' (list view), we usually don't need details.
            }

            // Filtering
            if (onlyMyRecipes) {
                // ONLY show user's own recipes
                if (user) {
                    query = query.eq('user_id', user.id);
                } else {
                    // Anonymous users can't have "My Recipes"
                    query = query.eq('id', ''); // Returns empty result
                }
            } else {
                // Show public recipes + user's own (for logged in users)
                if (user) {
                    query = query.or(`is_curated.eq.true,user_id.eq.${user.id}`);
                } else {
                    query = query.eq('is_curated', true);
                }
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

            // Don't cache recipe lists in localStorage - it causes cross-user pollution
            // Users should only see their own recipes via database, not cached data

            return { recipes: finalRecipes, count: finalCount };
        } catch (error) {
            console.error('Error in useDataPersistence.fetchRecipes:', error);
            throw error;
        }
    };

    const generateId = () => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const saveRecipe = async (recipe: any, ingredients?: any[], instructions?: any[]) => {
        try {
            if (user) {
                // SAVE TO CLOUD
                const recipeId = recipe.id || generateId();
                
                // IMPROVED: Calculate and validate nutrition before saving
                let nutritionSummary = null;
                let accuracyReport = null;
                if (ingredients && ingredients.length > 0) {
                    try {
                        nutritionSummary = await calculateRecipeNutritionImproved(
                            ingredients,
                            recipe.servings || 4
                        );
                        accuracyReport = getAccuracyReport(nutritionSummary);
                        
                        // Show accuracy report to user
                        console.log('📊 Nutrition Accuracy:', accuracyReport);
                        toast({
                            title: accuracyReport.message,
                            description: 
                                accuracyReport.details.length > 0 
                                    ? accuracyReport.details.join('\n') 
                                    : 'Recipe nutrition calculated successfully',
                            variant: accuracyReport.color === 'green' ? 'default' : accuracyReport.color === 'yellow' ? 'default' : 'destructive'
                        });
                    } catch (error) {
                        console.warn('Nutrition calculation failed, proceeding without validation', error);
                    }
                }
                
                // Strip fields that don't exist on the 'recipes' table before saving
                const { 
                    phytonutrients, 
                    ingredients: _ingredients, 
                    instructions: _instructions,
                    food_item,
                    ...cleanRecipe 
                } = recipe;
                const recipeData = {
                    ...cleanRecipe,
                    id: recipeId,
                    user_id: user.id,
                    is_curated: false,
                    type: recipe.type || recipe.meal_type || 'dinner',
                    // Use calculated nutrition if available, otherwise use recipe values
                    calories: nutritionSummary?.per_serving.calories || recipe.calories || 0,
                    protein: nutritionSummary?.per_serving.protein_g || recipe.protein || 0,
                    carbs: nutritionSummary?.per_serving.carbs_g || recipe.carbs || 0,
                    fat: nutritionSummary?.per_serving.fat_g || recipe.fat || 0,
                    // Only set defaults if NOT provided
                    tags: recipe.tags !== undefined ? recipe.tags : [],
                    difficulty: recipe.difficulty !== undefined ? recipe.difficulty : 'Medium'
                };

                // DEBUG: Log what we're saving to database
                console.log('💾 Saving to database:', {
                    title: recipeData.title,
                    prep_time: recipeData.prep_time,
                    cook_time: recipeData.cook_time,
                    difficulty: recipeData.difficulty,
                    tags: recipeData.tags,
                    calculatedNutrition: {
                        calories: recipeData.calories,
                        protein: recipeData.protein,
                        carbs: recipeData.carbs,
                        fat: recipeData.fat
                    }
                });

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
                        // Ensure we have a descriptive item name
                        const itemName = ing.food_item_name || ing.item || 'Ingredient';
                        
                        // Generate a smarter amount string
                        let amountStr = '';
                        const unit = ing.measure_label || '';
                        
                        // Only scale down if we have actual weight data (raw imports won't have this)
                        const hasWeightData = ing.weight_g > 0;
                        const scaledQty = ing.quantity;
                        const scaledWeight = ing.weight_g;

                        if (unit && !['unit', 'item', 'whole', 'g', 'gram', 'grams', 'ml'].includes(unit.toLowerCase())) {
                            amountStr = `${scaledQty} ${unit}`;
                        } else if (scaledWeight > 0) {
                            amountStr = `${scaledWeight}g`;
                        } else if (scaledQty > 1 || unit !== 'item') {
                            // Only include quantity if it's not just "1 item"
                            amountStr = scaledQty !== 1 ? `${scaledQty} ${unit || 'item'}` : unit || 'item';
                        } else {
                            // For simple "1 item" without weight data, just show as needed
                            amountStr = unit || 'item';
                        }

                        return {
                            recipe_id: recipeId,
                            food_item_id: ing.food_item_id && !ing.food_item_id.startsWith('raw-') && !ing.food_item_id.startsWith('temp-') ? ing.food_item_id : null, 
                            item: itemName,
                            amount: amountStr,
                            weight_g: ing.weight_g,
                            quantity: ing.quantity,
                            measure_label: ing.measure_label || 'item',
                            base_ingredient: itemName,
                            modifier: ing.modifier || null,
                        };
                    });

                    const { error: ingError } = await supabase.from('ingredients').insert(ingredientsData);
                    if (ingError) {
                        console.error('Ingredient save error:', ingError);
                        console.error('Attempted data:', ingredientsData);
                        throw new Error(`Failed to save ingredients: ${ingError.message}`);
                    }
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
                    if (insError) {
                        console.error('Instruction save error:', insError);
                        throw new Error(`Failed to save instructions: ${insError.message}`);
                    }
                }

                // NEW: Mix to Food Item Sync
                if (recipeData.is_mix) {
                    const totalWeight = ingredients?.reduce((sum, ing) => sum + (ing.weight_g || 0), 0) || 0;
                    // Only sync if there's weight data, otherwise we can't calculate density
                    if (totalWeight > 0) {
                        const density = 100 / totalWeight; // per 100g

                        const totals = ingredients?.reduce((acc, ing) => {
                            const multiplier = (ing.weight_g || 0) / 100;
                            return {
                                calories: acc.calories + ((ing.calories || 0) * multiplier),
                                energy_kj: acc.energy_kj + ((ing.energy_kj || 0) * multiplier),
                                protein: acc.protein + ((ing.protein || 0) * multiplier),
                                fat: acc.fat + ((ing.fat || 0) * multiplier),
                                carbs: acc.carbs + ((ing.carbs || 0) * multiplier),
                            };
                        }, { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 }) || { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 };

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

                setRecipeRefreshVersion(prev => prev + 1);
                return { ...recipeData, ingredients, instructions };
            } else {
                // Save to LocalStorage
                const localData = localStorage.getItem('local_recipes');
                let localRecipes: Recipe[] = localData ? JSON.parse(localData) : [];

                const recipeId = recipe.id || `local-${generateId()}`;

                // Standardize ingredients for local storage to match cloud structure (include nesting)
                const servings = recipe.servings || 1;
                // Standardize ingredients for local storage to match cloud structure (include nesting)
                const mappedIngredients = ingredients?.map(ing => ({
                    ...ing,
                    item: ing.food_item_name || (ing as any).item || 'Ingredient', // Map to expected 'item' field
                    weight_g: ing.weight_g,
                    quantity: ing.quantity,
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
                    is_mix: recipe.is_mix ?? false,
                    tags: recipe.tags || [],
                    difficulty: recipe.difficulty || 'Medium'
                } as Recipe;

                const existingIndex = localRecipes.findIndex(r => r.id === recipeId);
                if (existingIndex > -1) {
                    localRecipes[existingIndex] = newRecipe;
                } else {
                    localRecipes.push(newRecipe);
                }

                localStorage.setItem('local_recipes', JSON.stringify(localRecipes));
                setRecipeRefreshVersion(prev => prev + 1);
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

    const fetchAllTags = async () => {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('tags');

            if (error) throw error;

            // Flatten and deduplicate tags
            const uniqueTags = new Set<string>();
            data?.forEach(r => {
                if (r.tags && Array.isArray(r.tags)) {
                    r.tags.forEach(tag => uniqueTags.add(tag));
                }
            });

            return Array.from(uniqueTags).sort();
        } catch (error) {
            console.error('Error in useDataPersistence.fetchAllTags:', error);
            return [];
        }
    };

    return {
        user,
        loading,
        fetchRecipes,
        saveRecipe,
        deleteRecipe,
        getRecipe,
        fetchAllTags,
        recipeRefreshVersion
    };
}
