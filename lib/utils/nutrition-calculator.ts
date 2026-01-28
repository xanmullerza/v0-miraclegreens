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

    const result: CalculatedNutrition = {
        calories: Math.round(foodItem.energy_kcal * multiplier),
        energy_kj: Math.round((foodItem.energy_kj || (foodItem.energy_kcal * 4.184)) * multiplier),
        protein: Math.round(foodItem.protein_g * multiplier * 10) / 10,
        fat: Math.round(foodItem.fat_g * multiplier * 10) / 10,
        carbs: Math.round(foodItem.carbs_g * multiplier * 10) / 10,
    };

    // Calculate micronutrients if available
    if (foodItem.micronutrients) {
        result.micronutrients = {};
        for (const [key, value] of Object.entries(foodItem.micronutrients)) {
            if (typeof value === 'number') {
                result.micronutrients[key] = Math.round(value * multiplier * 100) / 100;
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
    const exact = mKeys.find(mk => mk.toLowerCase() === kL);
    if (exact) return exact;
    if (kL.includes('vitamin')) {
        const letter = kL.split(' ')[1]?.toLowerCase();
        if (letter && letter.length === 1) {
            const match = mKeys.find(mk => {
                const mkL = mk.toLowerCase();
                return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
            });
            if (match) return match;
        }
    }
    if (kL.startsWith('b') && /\b[b]\d+\b/.test(kL)) {
        const bNum = kL.split(' ')[0].toLowerCase();
        const match = mKeys.find(mk => {
            const mkL = mk.toLowerCase();
            return mkL.includes(bNum) || (kL.includes('thiamine') && mkL.includes('thiamine')) || (kL.includes('riboflavin') && mkL.includes('riboflavin'));
        });
        if (match) return match;
    }
    const firstWord = kL.split(' ')[0];
    if (firstWord.length > 3) {
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
export function calculateRecipeNutrition(
    ingredients: Array<{
        food_item: FoodItemNutrition;
        weight_g: number;
    }>
): CalculatedNutrition {
    return ingredients.reduce(
        (total, ing) => {
            const nutrition = calculateNutrition(ing.food_item, ing.weight_g);
            const newMicros = { ...(total.micronutrients || {}) };

            if (nutrition.micronutrients) {
                Object.entries(nutrition.micronutrients).forEach(([key, val]) => {
                    const match = findNutrientMatch(newMicros, key) || key;
                    newMicros[match] = (newMicros[match] || 0) + (val as number);
                });
            }

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
