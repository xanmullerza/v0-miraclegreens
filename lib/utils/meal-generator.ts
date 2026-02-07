import { supabase } from '../supabase';
import { Recipe, DietType } from '../data/recipes';
import { scaleIngredient } from './recipe-scaling';

interface PlanSettings {
    targetCalories: number;
    diet: DietType;
    numMeals: number; // 3 or 4 or 5 (3 meals + 0/1/2 snacks)
    favoritesOnly?: boolean;
    pantryItems?: any[];
}

export interface DailyPlan {
    breakfast: Recipe;
    lunch: Recipe;
    dinner: Recipe;
    snacks: Recipe[];
    totalCalories: number;
    totalEnergyKj: number;
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
 * Helper function to calculate nutrition including micronutrients
 */
const calculateNutrition = (ingredients: any[]) => {
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalEnergyKj = 0;
    const micronutrients: Record<string, number> = {};

    for (const ing of ingredients) {
        if (ing.food_items && ing.weight_g) {
            const foodItem = ing.food_items;
            const ratio = ing.weight_g / 100;
            totalCalories += (foodItem.energy_kcal || 0) * ratio;
            totalEnergyKj += (foodItem.energy_kj || 0) * ratio;
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
    return { calories: totalCalories, energyKj: totalEnergyKj, protein: totalProtein, carbs: totalCarbs, fat: totalFat, micronutrients };
};

/**
 * Get a random recipe of a specific type (for individual meal regeneration).
 * Optionally exclude a specific recipe ID to ensure variety.
 * Returns both the recipe and its calculated micronutrients.
 */
export const getRandomRecipeByType = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    diet: DietType,
    excludeId?: string,
    favoritesOnly?: boolean
): Promise<{ recipe: Recipe; micronutrients: Record<string, number> } | null> => {
    let query = supabase
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

    if (favoritesOnly) {
        query = query.eq('is_favorite', true);
    }

    const { data: recipesData, error } = await query;

    if (error || !recipesData || recipesData.length === 0) {
        return null;
    }

    // Transform and filter
    const recipesWithMicro: { recipe: Recipe; micronutrients: Record<string, number> }[] = recipesData
        .filter((r: any) => {
            if (diet === 'anything') return true;
            if (diet === 'pescatarian') {
                return r.diet.includes('pescatarian') || r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            if (diet === 'vegetarian') {
                return r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            return r.diet.includes(diet);
        })
        .filter((r: any) => r.id !== excludeId) // Exclude current recipe
        .map((r: any) => {
            const calculatedNutrition = calculateNutrition(r.ingredients);

            return {
                recipe: {
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    calories: calculatedNutrition.calories || r.calories || 0,
                    energyKj: calculatedNutrition.energyKj || r.energy_kj || 0,
                    protein: calculatedNutrition.protein || r.protein || 0,
                    carbs: calculatedNutrition.carbs || r.carbs || 0,
                    fat: calculatedNutrition.fat || r.fat || 0,
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
                    servings: 1
                },
                micronutrients: calculatedNutrition.micronutrients
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
    const { favoritesOnly, targetCalories, diet, numMeals } = settings;

    // Fetch recipes from Supabase
    let query = supabase
        .from('recipes')
        .select(`
            *,
            ingredients (
                *,
                food_items (*)
            ),
            instructions (*)
        `);

    if (favoritesOnly) {
        query = query.eq('is_favorite', true);
    }

    const { data: recipesData, error } = await query;

    if (error || !recipesData) {
        console.error('Error fetching recipes:', error);
        throw new Error('Failed to fetch recipes');
    }

    // Transform Supabase data to match Recipe interface
    const recipeMicronutrients: Record<string, Record<string, number>> = {};

    const allRecipes: Recipe[] = recipesData.map((r: any) => {
        const calculatedNutrition = calculateNutrition(r.ingredients);

        // Store micronutrients keyed by recipe ID
        recipeMicronutrients[r.id] = calculatedNutrition.micronutrients;

        return {
            id: r.id,
            title: r.title,
            type: r.type,
            calories: calculatedNutrition.calories || r.calories || 0,
            energyKj: calculatedNutrition.energyKj || r.energy_kj || 0,
            protein: calculatedNutrition.protein || r.protein || 0,
            carbs: calculatedNutrition.carbs || r.carbs || 0,
            fat: calculatedNutrition.fat || r.fat || 0,
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
            servings: 1
        };
    });

    // Filter helper
    const getRecipesByDiet = (params: { startRecipes: Recipe[], diet: DietType, type?: Recipe['type'] }) => {
        return params.startRecipes.filter(r => {
            if (params.type && r.type !== params.type) return false;

            if (params.diet === 'anything') return true;
            if (params.diet === 'pescatarian') {
                return r.diet.includes('pescatarian') || r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            if (params.diet === 'vegetarian') {
                return r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            return r.diet.includes(params.diet);
        });
    };

    // Get candidates
    const breakfastOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'breakfast' });
    const lunchOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'lunch' });
    const dinnerOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'dinner' });
    const snackOpts = getRecipesByDiet({ startRecipes: allRecipes, diet, type: 'snack' });

    if (!breakfastOpts.length || !lunchOpts.length || !dinnerOpts.length) {
        throw new Error('Insufficient recipes for the selected criteria.');
    }

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

    let bestPlan: DailyPlan | null = null;
    let minDiff = Infinity;
    let maxMatchScore = -1;

    // Pantry lookup for scoring
    const pantryIds = new Set(settings.pantryItems?.map(f => f.id) || []);
    const pantryNames = new Set(settings.pantryItems?.map(f => (f.common_name || f.name).toLowerCase().trim()) || []);

    const calculateMatchScore = (recipe: Recipe) => {
        const ings = recipe.ingredients || [];
        if (ings.length === 0) return 0;
        let matches = 0;
        ings.forEach(ing => {
            const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
                (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
                (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));
            if (isMatch) matches++;
        });
        return matches / ings.length;
    };

    for (let i = 0; i < 50; i++) { // Increased iterations for pantry matching
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
        const totalEnergyKj = (b.energyKj || 0) + (l.energyKj || 0) + (d.energyKj || 0) + snacks.reduce((acc, s) => acc + (s.energyKj || 0), 0);
        const allRecipeIds = [b.id, l.id, d.id, ...snacks.map(s => s.id)];
        const aggregatedMicro = aggregateMicronutrients(allRecipeIds);

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
            totalEnergyKj,
            macros: {
                protein: b.protein + l.protein + d.protein + snacks.reduce((acc, s) => acc + s.protein, 0),
                carbs: b.carbs + l.carbs + d.carbs + snacks.reduce((acc, s) => acc + s.carbs, 0),
                fat: b.fat + l.fat + d.fat + snacks.reduce((acc, s) => acc + s.fat, 0),
            },
            micronutrients: aggregatedMicro,
            recipeMicronutrients: planRecipeMicros
        };

        const currentMatchScore = (calculateMatchScore(b) + calculateMatchScore(l) + calculateMatchScore(d) + (snacks.length ? snacks.reduce((acc, s) => acc + calculateMatchScore(s), 0) / snacks.length : 0)) / (3 + (snacks.length ? 1 : 0));

        const diff = Math.abs(targetCalories - totalCalories);
        const calScore = 1 - Math.min(1, diff / targetCalories);

        // Multi-objective score: balance calories and pantry matches
        // Weighting: 60% pantry, 40% calories if pantry is provided
        const finalScore = settings.pantryItems ? (currentMatchScore * 0.6 + calScore * 0.4) : calScore;

        if (finalScore > maxMatchScore) {
            maxMatchScore = finalScore;
            bestPlan = currentPlan;
        }

        // Short circuit if we found a near-perfect plan
        if (finalScore > 0.95) break;
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
        if (a.isMiracleProduct && !b.isMiracleProduct) return -1;
        if (!a.isMiracleProduct && b.isMiracleProduct) return 1;
        return a.name.localeCompare(b.name);
    });
};
