import { supabase } from '@/lib/supabase';

export interface FoodItemNutrition {
    id: string;
    name: string;
    energy_kcal: number;
    energy_kj?: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    micronutrients?: Record<string, number>;
}

export interface CalculatedNutrition {
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients?: Record<string, number>;
}

/**
 * Calculate nutrition for a given weight of a food item
 * @param foodItem - The food item with per-100g nutrition data
 * @param weightGrams - The weight in grams
 * @returns Calculated nutrition values
 */
export function calculateNutrition(
    foodItem: FoodItemNutrition,
    weightGrams: number
): CalculatedNutrition {
    const multiplier = weightGrams / 100;

    // Fallback helper to find macros in the micronutrients JSON
    const getMacro = (mainVal: number | undefined, keys: string[]) => {
        if (mainVal && mainVal > 0) return mainVal;
        if (!foodItem.micronutrients) return mainVal || 0;
        for (const k of keys) {
            const val = foodItem.micronutrients[k];
            if (typeof val === 'number') return val;
        }
        return mainVal || 0;
    };

    const calories = getMacro(foodItem.energy_kcal, ['Energy', 'Calories', 'energy_kcal']);
    const protein = getMacro(foodItem.protein_g, ['Protein', 'protein_g']);
    const carbs = getMacro(foodItem.carbs_g, ['Carbohydrates', 'carbs_g']);
    const fat = getMacro(foodItem.fat_g, ['Fat', 'fat_g']);
    const energyKj = getMacro(foodItem.energy_kj, ['energy_kj']);

    const result: CalculatedNutrition = {
        calories: Math.round(calories * multiplier),
        energy_kj: Math.round((energyKj || (calories * 4.184)) * multiplier),
        protein: Math.round(protein * multiplier * 10) / 10,
        fat: Math.round(fat * multiplier * 10) / 10,
        carbs: Math.round(carbs * multiplier * 10) / 10,
    };

    // Calculate micronutrients
    if (foodItem.micronutrients) {
        result.micronutrients = {};
        for (const [key, value] of Object.entries(foodItem.micronutrients)) {
            if (typeof value === 'number') {
                result.micronutrients[key] = value * multiplier;
            }
        }
    }

    return result;
}

/**
 * Helper to find a matching nutrient key in a record, handling case-insensitivity and common aliases
 */
export const findNutrientMatch = (record: Record<string, any>, key: string) => {
    const mKeys = Object.keys(record);
    const kL = key.toLowerCase();

    // 1. Exact case-insensitive match (highest priority)
    const exact = mKeys.find(mk => mk.toLowerCase() === kL);
    if (exact) return exact;

    // 2. Strict Macro/Fat matching (Prevent cross-matching)
    if (kL.includes('saturated') && !kL.includes('mono') && !kL.includes('poly')) {
        const match = mKeys.find(mk => {
            const mkL = mk.toLowerCase();
            return mkL.includes('saturated') && !mkL.includes('mono') && !mkL.includes('poly');
        });
        if (match) return match;
    }
    if (kL.includes('monounsaturated')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('monounsaturated'));
        if (match) return match;
    }
    if (kL.includes('polyunsaturated')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('polyunsaturated'));
        if (match) return match;
    }
    if (kL.includes('trans') && (kL.includes('fat') || kL.includes('acid'))) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('trans'));
        if (match) return match;
    }
    if (kL.includes('cholesterol')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('cholesterol'));
        if (match) return match;
    }
    if (kL.includes('omega-3') || kL.includes('omega 3') || kL.includes('n-3')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('omega-3') || mk.toLowerCase().includes('omega 3'));
        if (match) return match;
    }
    if (kL.includes('omega-6') || kL.includes('omega 6') || kL.includes('n-6')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('omega-6') || mk.toLowerCase().includes('omega 6'));
        if (match) return match;
    }

    // 3. Vitamins with numbers (B1, B2, etc)
    const vitMatch = kL.match(/vitamin\s*([a-z]\d*)/i);
    const snakeVitMatch = kL.match(/vitamin_([a-z]\d*)/i);
    const targetVit = (vitMatch?.[1] || snakeVitMatch?.[1])?.toLowerCase();

    if (targetVit) {
        const match = mKeys.find(mk => {
            const mkL = mk.toLowerCase();
            const mkVitMatch = mkL.match(/vitamin\s*([a-z]\d*)/i);
            const mkSnakeVitMatch = mkL.match(/vitamin_([a-z]\d*)/i);
            const mkVit = (mkVitMatch?.[1] || mkSnakeVitMatch?.[1])?.toLowerCase();
            return mkVit === targetVit;
        });
        if (match) return match;
    }

    // B-Vitamin Specifics
    if (kL.includes('thiamine') || kL.includes('b1')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('thiamine') || mk.toLowerCase().includes('b1'));
        if (match) return match;
    }
    if (kL.includes('riboflavin') || kL.includes('b2')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('riboflavin') || mk.toLowerCase().includes('b2'));
        if (match) return match;
    }
    if (kL.includes('niacin') || kL.includes('b3')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('niacin') || mk.toLowerCase().includes('b3'));
        if (match) return match;
    }
    if (kL.includes('folate') || kL.includes('folic') || kL.includes('b9')) {
        const match = mKeys.find(mk => mk.toLowerCase().includes('folate') || mk.toLowerCase().includes('folic') || mk.toLowerCase().includes('b9'));
        if (match) return match;
    }

    // 4. Fuzzy word matching (lower priority, restricted)
    const firstWord = kL.split(/[\s_]/)[0];
    if (firstWord.length > 4 && !['vitamin', 'saturated', 'monounsaturated', 'polyunsaturated', 'fatty', 'total'].includes(firstWord)) {
        const fuzzy = mKeys.find(mk => mk.toLowerCase().includes(firstWord));
        if (fuzzy) return fuzzy;
    }
    return null;
};

/**
 * Calculate total nutrition for a recipe from its ingredients
 * @param ingredients - Array of ingredients with their food items and weights
 * @returns Total nutrition for the recipe
 */
const PREFERRED_KEYS: Record<string, string> = {
    // Electrolytes
    'Sodium': 'Sodium',
    'Potassium': 'Potassium',
    'Magnesium': 'Magnesium',
    'Calcium': 'Calcium',
    'Phosphorus': 'Phosphorus',
    // Minerals
    'Iron': 'Iron',
    'Zinc': 'Zinc',
    'Selenium': 'Selenium',
    'Copper': 'Copper',
    'Manganese': 'Manganese',
    'Iodine': 'Iodine',
    'Chromium': 'Chromium',
    'Molybdenum': 'Molybdenum',
    // Vitamins
    'Vitamin A': 'Vitamin A',
    'Vitamin C': 'Vitamin C',
    'Vitamin D': 'Vitamin D',
    'Vitamin E': 'Vitamin E',
    'Vitamin K': 'Vitamin K',
    'B1 (Thiamine)': 'B1 (Thiamine)',
    'B2 (Riboflavin)': 'B2 (Riboflavin)',
    'B3 (Niacin)': 'B3 (Niacin)',
    'B5 (Pantothenic Acid)': 'B5 (Pantothenic Acid)',
    'B6 (Pyridoxine)': 'B6 (Pyridoxine)',
    'B9 (Folate)': 'B9 (Folate)',
    'B12 (Cobalamin)': 'B12 (Cobalamin)',
    'Choline': 'Choline',
    // Fats (Standardized)
    'Saturated Fat': 'Saturated Fat',
    'Monounsaturated Fat': 'Monounsaturated Fat',
    'Polyunsaturated Fat': 'Polyunsaturated Fat',
    'Trans Fat': 'Trans Fat',
    'Cholesterol': 'Cholesterol',
    'Omega-3': 'Omega-3',
    'Omega-6': 'Omega-6',
    // Carbs
    'Fiber': 'Fiber',
    'Starch': 'Starch',
    'Sugars': 'Sugars',
    // Special
    'Lutein + Zeaxanthin': 'Lutein + Zeaxanthin',
    'Beta-carotene': 'Beta-carotene',
    'Alpha-carotene': 'Alpha-carotene',
    'Lycopene': 'Lycopene'
};

export function calculateRecipeNutrition(
    ingredients: Array<{
        food_item: FoodItemNutrition;
        weight_g: number;
    }>
): CalculatedNutrition {
    return ingredients.reduce(
        (total, ing) => {
            const nutrition = calculateNutrition(ing.food_item, ing.weight_g);

            // Deduplicate within this single ingredient FIRST
            const ingredientMicrosMapped: Record<string, number> = {};
            if (nutrition.micronutrients) {
                Object.entries(nutrition.micronutrients).forEach(([key, val]) => {
                    const match = findNutrientMatch(PREFERRED_KEYS, key);
                    const standardKey = match ? PREFERRED_KEYS[match] : key;

                    if (ingredientMicrosMapped[standardKey] === undefined) {
                        ingredientMicrosMapped[standardKey] = val as number;
                    }
                });
            }

            // Now add to the recipe-wide accumulator
            const newMicros = { ...(total.micronutrients || {}) };
            Object.entries(ingredientMicrosMapped).forEach(([key, val]) => {
                const match = findNutrientMatch(newMicros, key) || key;
                newMicros[match] = (newMicros[match] || 0) + val;
            });

            return {
                calories: total.calories + nutrition.calories,
                energy_kj: total.energy_kj + nutrition.energy_kj,
                protein: total.protein + nutrition.protein,
                fat: total.fat + nutrition.fat,
                carbs: total.carbs + nutrition.carbs,
                micronutrients: newMicros
            };
        },
        { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> }
    );
}

/**
 * Fetch a recipe with all its ingredients and food item data
 * @param recipeId - The recipe ID
 * @returns Recipe with ingredients and calculated nutrition
 */
export async function fetchRecipeWithNutrition(recipeId: string) {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      *,
      ingredients (
        *,
        food_item:food_items (*)
      ),
      instructions (*)
    `)
        .eq('id', recipeId)
        .single();

    if (error) throw error;

    // Calculate fresh nutrition from ingredients
    if (data.ingredients && data.ingredients.length > 0) {
        const calculatedNutrition = calculateRecipeNutrition(
            data.ingredients.map((ing: any) => ({
                food_item: ing.food_item,
                weight_g: ing.weight_g || 100,
            }))
        );

        // Return recipe with both stored and calculated nutrition
        return {
            ...data,
            calculated_nutrition: calculatedNutrition,
        };
    }

    return data;
}

/**
 * Scale recipe nutrition for a specific number of servings
 * @param nutrition - Base nutrition values
 * @param baseServings - Original number of servings
 * @param targetServings - Desired number of servings
 * @returns Scaled nutrition values
 */
export function scaleNutrition(
    nutrition: CalculatedNutrition,
    baseServings: number,
    targetServings: number
): CalculatedNutrition {
    const multiplier = targetServings / baseServings;

    return {
        calories: Math.round(nutrition.calories * multiplier),
        energy_kj: Math.round(nutrition.energy_kj * multiplier),
        protein: Math.round(nutrition.protein * multiplier * 10) / 10,
        fat: Math.round(nutrition.fat * multiplier * 10) / 10,
        carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
    };
}

export interface FoodMeasure {
    id?: string;
    label: string;
    weight_g: number;
}

export async function fetchFoodMeasures(foodItemId: string): Promise<FoodMeasure[]> {
    // 1. Try reading from portions JSONB column first (New System)
    const { data: itemData } = await supabase
        .from('food_items')
        .select('portions')
        .eq('id', foodItemId)
        .single();

    if (itemData?.portions && Array.isArray(itemData.portions) && itemData.portions.length > 0) {
        return itemData.portions as FoodMeasure[];
    }

    // 2. Fallback to reading from food_measures table (Legacy System)
    const { data, error } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', foodItemId)
        .order('label');

    if (error) {
        console.error('Error fetching measures:', error);
        return [];
    }

    return data || [];
}
