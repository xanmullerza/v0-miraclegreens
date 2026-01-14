import { Recipe, RECIPES, DietType } from '../data/recipes';

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
 * Filter recipes by diet preference.
 */
const getRecipesByDiet = (diet: DietType, type?: Recipe['type']) => {
    return RECIPES.filter(r =>
        (diet === 'anything' || r.diet.includes(diet)) &&
        (!type || r.type === type)
    );
};

/**
 * Randomly select an item from an array.
 */
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a single day meal plan trying to hit the calorie target.
 * This is a simplified "random + validation" logic for MVP.
 */
export const generateDailyPlan = (settings: PlanSettings): DailyPlan => {
    const { targetCalories, diet, numMeals } = settings;

    // Get candidates
    const breakfastOpts = getRecipesByDiet(diet, 'breakfast');
    const lunchOpts = getRecipesByDiet(diet, 'lunch');
    const dinnerOpts = getRecipesByDiet(diet, 'dinner');
    const snackOpts = getRecipesByDiet(diet, 'snack');

    // Simple brute-force retry up to 10 times to find a "close enough" match
    // If not found, return the closest one.

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

    if (!bestPlan) {
        // Fallback if something fails drastically (e.g. no recipes found), return just first items
        // In real app, handle empty states.
        const b = breakfastOpts[0];
        const l = lunchOpts[0];
        const d = dinnerOpts[0];
        return {
            breakfast: b,
            lunch: l,
            dinner: d,
            snacks: [],
            totalCalories: b.calories + l.calories + d.calories,
            macros: { protein: 0, carbs: 0, fat: 0 } // simplified fallback
        };
    }

    return bestPlan;
};
