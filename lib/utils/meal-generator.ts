import { supabase } from '../supabase';
import { Recipe, DietType } from '../data/recipes';

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
}

/**
 * Randomly select an item from an array.
 */
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

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

        for (const ing of ingredients) {
            // If ingredient is linked to food_items, calculate from there
            if (ing.food_items && ing.weight_g) {
                const foodItem = ing.food_items;
                const ratio = ing.weight_g / 100; // Convert to per-100g basis

                totalCalories += (foodItem.energy_kcal || 0) * ratio;
                totalProtein += (foodItem.protein_g || 0) * ratio;
                totalCarbs += (foodItem.carbs_g || 0) * ratio;
                totalFat += (foodItem.fat_g || 0) * ratio;
            }
            // Otherwise, we have no data - this ingredient doesn't contribute
            // (In the future, you could fall back to stored recipe values or throw a warning)
        }

        return {
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat
        };
    };

    // Transform Supabase data to match Recipe interface
    // IMPORTANT: Nutrition is now CALCULATED from ingredients, not stored values
    const allRecipes: Recipe[] = recipesData.map((r: any) => {
        const calculatedNutrition = calculateNutrition(r.ingredients);

        return {
            id: r.id,
            title: r.title,
            type: r.type,
            // Use calculated values if available, otherwise fall back to stored values
            calories: calculatedNutrition.calories || r.calories || 0,
            protein: calculatedNutrition.protein || r.protein || 0,
            carbs: calculatedNutrition.carbs || r.carbs || 0,
            fat: calculatedNutrition.fat || r.fat || 0,
            diet: r.diet,
            image: r.image,
            prepTime: r.prep_time,
            ingredients: r.ingredients.map((i: any) => ({
                item: i.item,
                amount: i.amount,
                isMiracleProduct: i.is_miracle_product
            })),
            instructions: r.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text)
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
            }
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
    const allIngredients = [
        ...plan.breakfast.ingredients,
        ...plan.lunch.ingredients,
        ...plan.dinner.ingredients,
        ...plan.snacks.flatMap(s => s.ingredients)
    ];

    const itemMap = new Map<string, ShoppingItem>();

    allIngredients.forEach(ing => {
        const existing = itemMap.get(ing.item);
        if (existing) {
            existing.amounts.push(ing.amount);
        } else {
            itemMap.set(ing.item, {
                name: ing.item,
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
