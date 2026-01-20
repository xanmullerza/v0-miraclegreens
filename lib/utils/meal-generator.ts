import { supabase } from '../supabase';
import { Recipe, DietType } from '../data/recipes';
import { scaleIngredient } from './recipe-scaling';

interface PlanSettings {
    targetCalories: number;
    diet: DietType;
    numMeals: number; // 3 or 4 or 5 (3 meals + 0/1/2 snacks)
}

export interface DailyPlan {
    breakfast: Recipe;
    lunch: Recipe;
    dinner: Recipe;
    snacks: Recipe[];
    totalCalories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    micronutrients: Record<string, number>;
    // Store individual recipe micronutrients keyed by recipe ID for dynamic recalculation
    recipeMicronutrients: Record<string, Record<string, number>>;
}

/**
 * Randomly select an item from an array.
 */
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get a random recipe of a specific type (for individual meal regeneration).
 * Optionally exclude a specific recipe ID to ensure variety.
 * Returns both the recipe and its calculated micronutrients.
 */
export const getRandomRecipeByType = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    diet: DietType,
    excludeId?: string
): Promise<{ recipe: Recipe; micronutrients: Record<string, number> } | null> => {
    const { data: recipesData, error } = await supabase
        .from('recipes')
        .select(`
            *,
            ingredients (
                *,
                food_items (*)
            ),
            instructions (*)
        `)
        .eq('type', mealType);

    if (error || !recipesData || recipesData.length === 0) {
        return null;
    }

    // Helper function to calculate nutrition including micronutrients
    const calculateNutrition = (ingredients: any[]) => {
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        const micronutrients: Record<string, number> = {};

        for (const ing of ingredients) {
            if (ing.food_items && ing.weight_g) {
                const foodItem = ing.food_items;
                const ratio = ing.weight_g / 100;
                totalCalories += (foodItem.energy_kcal || 0) * ratio;
                totalProtein += (foodItem.protein_g || 0) * ratio;
                totalCarbs += (foodItem.carbs_g || 0) * ratio;
                totalFat += (foodItem.fat_g || 0) * ratio;

                // Aggregate micronutrients
                if (foodItem.micronutrients && typeof foodItem.micronutrients === 'object') {
                    Object.entries(foodItem.micronutrients).forEach(([key, val]) => {
                        if (typeof val === 'number') {
                            micronutrients[key] = (micronutrients[key] || 0) + val * ratio;
                        }
                    });
                }
            }
        }
        return { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat, micronutrients };
    };

    // Transform and filter
    const recipesWithMicro: { recipe: Recipe; micronutrients: Record<string, number> }[] = recipesData
        .filter((r: any) => diet === 'anything' || r.diet.includes(diet))
        .filter((r: any) => r.id !== excludeId) // Exclude current recipe
        .map((r: any) => {
            const servings = r.servings || 1;
            const calculatedNutrition = calculateNutrition(r.ingredients);

            // Scale micros to per-serving
            const perServingMicros: Record<string, number> = {};
            Object.entries(calculatedNutrition.micronutrients).forEach(([k, v]) => {
                perServingMicros[k] = v / servings;
            });

            return {
                recipe: {
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    calories: (calculatedNutrition.calories / servings) || r.calories || 0,
                    protein: (calculatedNutrition.protein / servings) || r.protein || 0,
                    carbs: (calculatedNutrition.carbs / servings) || r.carbs || 0,
                    fat: (calculatedNutrition.fat / servings) || r.fat || 0,
                    diet: r.diet,
                    image: r.image,
                    prepTime: r.prep_time,
                    ingredients: r.ingredients.map((i: any) => ({
                        item: i.item,
                        amount: i.amount,
                        isMiracleProduct: i.is_miracle_product,
                        baseIngredient: i.base_ingredient,
                        weightG: i.weight_g,
                        measureLabel: i.measure_label
                    })),
                    instructions: r.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text),
                    servings: servings
                },
                micronutrients: perServingMicros
            };
        });

    if (recipesWithMicro.length === 0) return null;
    return getRandom(recipesWithMicro);
};

/**
 * Generates a single day meal plan trying to hit the calorie target.
 * Now Async to fetch from Supabase.
 */
export const generateDailyPlan = async (settings: PlanSettings): Promise<DailyPlan> => {
    const { targetCalories, diet, numMeals } = settings;

    // Fetch all recipes from Supabase with their related data AND linked food items
    const { data: recipesData, error } = await supabase
        .from('recipes')
        .select(`
            *,
            ingredients (
                *,
                food_items (*)
            ),
            instructions (*)
        `);

    if (error || !recipesData) {
        console.error('Error fetching recipes:', error);
        throw new Error('Failed to fetch recipes');
    }

    // Helper function to calculate nutrition from ingredients
    const calculateNutrition = (ingredients: any[]) => {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        const micronutrients: Record<string, number> = {};

        for (const ing of ingredients) {
            // If ingredient is linked to food_items, calculate from there
            if (ing.food_items && ing.weight_g) {
                const foodItem = ing.food_items;
                const ratio = ing.weight_g / 100; // Convert to per-100g basis

                totalCalories += (foodItem.energy_kcal || 0) * ratio;
                totalProtein += (foodItem.protein_g || 0) * ratio;
                totalCarbs += (foodItem.carbs_g || 0) * ratio;
                totalFat += (foodItem.fat_g || 0) * ratio;

                // Aggregate micronutrients
                if (foodItem.micronutrients && typeof foodItem.micronutrients === 'object') {
                    Object.entries(foodItem.micronutrients).forEach(([key, val]) => {
                        if (typeof val === 'number') {
                            micronutrients[key] = (micronutrients[key] || 0) + val * ratio;
                        }
                    });
                }
            }
        }

        return {
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            micronutrients
        };
    };

    // Transform Supabase data to match Recipe interface
    // IMPORTANT: Nutrition is now CALCULATED from ingredients, not stored values
    // We also store micronutrients in a separate map for aggregation
    const recipeMicronutrients: Record<string, Record<string, number>> = {};

    const allRecipes: Recipe[] = recipesData.map((r: any) => {
        const servings = r.servings || 1;
        const calculatedNutrition = calculateNutrition(r.ingredients);

        // Store micronutrients keyed by recipe ID (scaled to per-serving)
        const perServingMicros: Record<string, number> = {};
        Object.entries(calculatedNutrition.micronutrients).forEach(([k, v]) => {
            perServingMicros[k] = v / servings;
        });
        recipeMicronutrients[r.id] = perServingMicros;

        return {
            id: r.id,
            title: r.title,
            type: r.type,
            // Use calculated values divided by servings if available, otherwise fall back to stored values
            calories: (calculatedNutrition.calories / servings) || r.calories || 0,
            protein: (calculatedNutrition.protein / servings) || r.protein || 0,
            carbs: (calculatedNutrition.carbs / servings) || r.carbs || 0,
            fat: (calculatedNutrition.fat / servings) || r.fat || 0,
            diet: r.diet,
            image: r.image,
            prepTime: r.prep_time,
            ingredients: r.ingredients.map((i: any) => ({
                item: i.item,
                amount: i.amount,
                isMiracleProduct: i.is_miracle_product,
                baseIngredient: i.base_ingredient,
                weightG: i.weight_g,
                measureLabel: i.measure_label
            })),
            instructions: r.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text),
            servings: servings
        };
    });

    // Filter helper
    const getRecipesByDiet = (params: { startRecipes: Recipe[], diet: DietType, type?: Recipe['type'] }) => {
        return params.startRecipes.filter(r =>
            (params.diet === 'anything' || r.diet.includes(params.diet)) &&
            (!params.type || r.type === params.type)
        );
    };

    // Get candidates
    const breakfastOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'breakfast' });
    const lunchOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'lunch' });
    const dinnerOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'dinner' });
    const snackOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'snack' });

    // Fallback if no recipes found for a category (shouldn't happen with seeded data but good safety)
    if (!breakfastOpts.length || !lunchOpts.length || !dinnerOpts.length) {
        throw new Error('Insufficient recipes for the selected criteria.');
    }

    // Helper to aggregate micronutrients from array of recipe IDs
    const aggregateMicronutrients = (recipeIds: string[]): Record<string, number> => {
        const result: Record<string, number> = {};
        recipeIds.forEach(id => {
            const micro = recipeMicronutrients[id];
            if (micro) {
                Object.entries(micro).forEach(([key, val]) => {
                    result[key] = (result[key] || 0) + val;
                });
            }
        });
        return result;
    };

    // Simple brute-force retry up to 20 times to find a "close enough" match
    let bestPlan: DailyPlan | null = null;
    let minDiff = Infinity;

    for (let i = 0; i < 20; i++) {
        const b = getRandom(breakfastOpts);
        const l = getRandom(lunchOpts);
        const d = getRandom(dinnerOpts);

        const snacks: Recipe[] = [];
        const numSnacks = Math.max(0, numMeals - 3);

        for (let j = 0; j < numSnacks; j++) {
            if (snackOpts.length > 0) {
                snacks.push(getRandom(snackOpts));
            }
        }

        const totalCalories = b.calories + l.calories + d.calories + snacks.reduce((acc, s) => acc + s.calories, 0);
        const diff = Math.abs(targetCalories - totalCalories);

        // Aggregate micronutrients for all selected recipes
        const allRecipeIds = [b.id, l.id, d.id, ...snacks.map(s => s.id)];
        const aggregatedMicro = aggregateMicronutrients(allRecipeIds);

        // Build recipeMicronutrients map for this specific plan
        const planRecipeMicros: Record<string, Record<string, number>> = {};
        allRecipeIds.forEach(id => {
            planRecipeMicros[id] = recipeMicronutrients[id] || {};
        });

        const currentPlan: DailyPlan = {
            breakfast: b,
            lunch: l,
            dinner: d,
            snacks,
            totalCalories,
            macros: {
                protein: b.protein + l.protein + d.protein + snacks.reduce((acc, s) => acc + s.protein, 0),
                carbs: b.carbs + l.carbs + d.carbs + snacks.reduce((acc, s) => acc + s.carbs, 0),
                fat: b.fat + l.fat + d.fat + snacks.reduce((acc, s) => acc + s.fat, 0),
            },
            micronutrients: aggregatedMicro,
            recipeMicronutrients: planRecipeMicros
        };

        if (diff < minDiff) {
            minDiff = diff;
            bestPlan = currentPlan;
        }

        // 10% tolerance
        if (diff / targetCalories < 0.1) {
            break;
        }
    }

    return bestPlan!;
};

export interface ShoppingItem {
    name: string;
    amounts: string[];
    isMiracleProduct: boolean;
}

export const generateShoppingList = (plan: DailyPlan): ShoppingItem[] => {
    const getScaledIngredients = (recipe: Recipe) => {
        const factor = recipe.servings || 1;
        return recipe.ingredients.map(ing => {
            const scaledAmount = scaleIngredient(ing.amount, factor);
            const fullAmount = (ing.measureLabel && !ing.amount.toLowerCase().includes(ing.measureLabel.toLowerCase()))
                ? `${scaledAmount} ${ing.measureLabel}`
                : scaledAmount;
            return {
                ...ing,
                amount: fullAmount
            };
        });
    };

    const allIngredients = [
        ...getScaledIngredients(plan.breakfast),
        ...getScaledIngredients(plan.lunch),
        ...getScaledIngredients(plan.dinner),
        ...plan.snacks.flatMap(s => getScaledIngredients(s))
    ];

    const itemMap = new Map<string, ShoppingItem>();

    allIngredients.forEach(ing => {
        // Use base_ingredient for shopping list grouping (e.g., "Egg" instead of "Egg, Scrambled")
        const shoppingName = ing.baseIngredient || ing.item;

        const existing = itemMap.get(shoppingName);
        if (existing) {
            existing.amounts.push(ing.amount);
        } else {
            itemMap.set(shoppingName, {
                name: shoppingName,
                amounts: [ing.amount],
                isMiracleProduct: ing.isMiracleProduct || false
            });
        }
    });

    return Array.from(itemMap.values()).sort((a, b) => {
        // Miracle products first, then alphabetical
        if (a.isMiracleProduct && !b.isMiracleProduct) return -1;
        if (!a.isMiracleProduct && b.isMiracleProduct) return 1;
        return a.name.localeCompare(b.name);
    });
};
