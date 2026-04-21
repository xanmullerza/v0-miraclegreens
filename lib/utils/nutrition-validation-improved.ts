/**
 * IMPROVED Nutrition Calculation & Validation
 * Ensures matched ingredients have proper nutrition data before saving
 */

import { supabase } from '@/lib/supabase';

export interface NutritionData {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    saturated_fat_g?: number;
    sodium_mg?: number;
    sugar_g?: number;
}

export interface IngredientWithNutrition {
    food_item_id: string;
    food_name: string;
    quantity: number;
    measure_label: string;
    weight_g: number;
    nutrition: NutritionData;
    confidence: 'high' | 'medium' | 'low';
}

export interface RecipeNutritionSummary {
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    total_fiber_g: number;
    per_serving: {
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        fiber_g: number;
    };
    unmatchedIngredients: string[];
    lowConfidenceMatches: Array<{ ingredient: string; confidence: string }>;
    calculationAccuracy: 'high' | 'medium' | 'low';
}

/**
 * Verify that food item has nutrition data
 */
async function getFoodItemNutrition(foodItemId: string): Promise<NutritionData | null> {
    try {
        const { data, error } = await supabase
            .from('food_items')
            .select(`
                calories_per_100g,
                protein_per_100g,
                carbs_per_100g,
                fat_per_100g,
                fiber_per_100g,
                saturated_fat_per_100g,
                sodium_per_100g,
                sugar_per_100g
            `)
            .eq('id', foodItemId)
            .single();

        if (error || !data) return null;

        // Verify essential fields are populated
        if (!data.calories_per_100g || !data.protein_per_100g) {
            return null; // Insufficient nutrition data
        }

        return {
            calories: data.calories_per_100g,
            protein_g: data.protein_per_100g,
            carbs_g: data.carbs_per_100g || 0,
            fat_g: data.fat_per_100g || 0,
            fiber_g: data.fiber_per_100g,
            saturated_fat_g: data.saturated_fat_per_100g,
            sodium_mg: data.sodium_per_100g,
            sugar_g: data.sugar_per_100g,
        };
    } catch (error) {
        console.error(`Error fetching nutrition for ${foodItemId}:`, error);
        return null;
    }
}

/**
 * Calculate nutrition for a single ingredient
 */
function calculateIngredientNutrition(
    nutrition: NutritionData,
    weightG: number,
    servings: number
): NutritionData {
    const totalWeight = weightG; // Per ingredient amount
    const perGram = {
        calories: nutrition.calories / 100,
        protein_g: nutrition.protein_g / 100,
        carbs_g: nutrition.carbs_g / 100,
        fat_g: nutrition.fat_g / 100,
        fiber_g: (nutrition.fiber_g || 0) / 100,
        saturated_fat_g: (nutrition.saturated_fat_g || 0) / 100,
        sodium_mg: (nutrition.sodium_mg || 0) / 100,
        sugar_g: (nutrition.sugar_g || 0) / 100,
    };

    return {
        calories: (perGram.calories * totalWeight) / servings,
        protein_g: (perGram.protein_g * totalWeight) / servings,
        carbs_g: (perGram.carbs_g * totalWeight) / servings,
        fat_g: (perGram.fat_g * totalWeight) / servings,
        fiber_g: (perGram.fiber_g * totalWeight) / servings,
        saturated_fat_g: (perGram.saturated_fat_g * totalWeight) / servings,
        sodium_mg: (perGram.sodium_mg * totalWeight) / servings,
        sugar_g: (perGram.sugar_g * totalWeight) / servings,
    };
}

/**
 * Validate quantity makes sense
 */
function validateQuantity(quantity: number, measure: string): {
    valid: boolean;
    warning?: string;
} {
    // Sanity checks
    if (quantity <= 0 || quantity > 1000) {
        return { valid: false, warning: `Quantity ${quantity}${measure} is outside reasonable range (0-1000)` };
    }

    // Specific measure bounds
    const volumeWarnings: Record<string, [number, number]> = {
        'cup': [0.1, 50],
        'tbsp': [0.1, 100],
        'tsp': [0.1, 200],
        'ml': [1, 2000],
        'l': [0.01, 10],
    };

    if (volumeWarnings[measure]) {
        const [min, max] = volumeWarnings[measure];
        if (quantity < min || quantity > max) {
            return { valid: false, warning: `${quantity}${measure} is unusually ${quantity < min ? 'small' : 'large'}` };
        }
    }

    return { valid: true };
}

/**
 * Validate measure can be converted to weight
 */
function canConvertToWeight(measure: string): boolean {
    const convertibleMeasures = new Set([
        'g', 'kg', 'oz', 'lb',
        'cup', 'tbsp', 'tsp', 'ml', 'l',
        'item', 'clove', 'slice', 'piece'
    ]);
    return convertibleMeasures.has(measure);
}

/**
 * Calculate complete recipe nutrition with validation
 */
export async function calculateRecipeNutritionImproved(
    ingredients: Array<{
        food_item_id?: string;
        food_name: string;
        quantity: number;
        measure_label: string;
        weight_g: number;
        confidence?: 'high' | 'medium' | 'low';
    }>,
    servings: number = 4
): Promise<RecipeNutritionSummary> {
    const valid: IngredientWithNutrition[] = [];
    const unmatchedIngredients: string[] = [];
    const lowConfidenceMatches: Array<{ ingredient: string; confidence: string }> = [];

    // Validate and fetch nutrition for each ingredient
    for (const ing of ingredients) {
        // Check quantity is valid
        const qtyValidation = validateQuantity(ing.quantity, ing.measure_label);
        if (!qtyValidation.valid) {
            console.warn(`Ingredient "${ing.food_name}": ${qtyValidation.warning}`);
        }

        // Check measure can be converted
        if (!canConvertToWeight(ing.measure_label)) {
            unmatchedIngredients.push(`${ing.food_name} (measure: ${ing.measure_label} - cannot convert to weight)`);
            continue;
        }

        // Check if we have food_item_id
        if (!ing.food_item_id) {
            unmatchedIngredients.push(ing.food_name);
            continue;
        }

        // Fetch nutrition data
        const nutrition = await getFoodItemNutrition(ing.food_item_id);
        if (!nutrition) {
            unmatchedIngredients.push(`${ing.food_name} (no nutrition data in DB)`);
            continue;
        }

        // Calculate per-serving nutrition
        const calculatedNutrition = calculateIngredientNutrition(nutrition, ing.weight_g, servings);

        valid.push({
            food_item_id: ing.food_item_id,
            food_name: ing.food_name,
            quantity: ing.quantity,
            measure_label: ing.measure_label,
            weight_g: ing.weight_g,
            nutrition: calculatedNutrition,
            confidence: ing.confidence || 'low',
        });

        if (ing.confidence === 'low' || ing.confidence === 'medium') {
            lowConfidenceMatches.push({
                ingredient: ing.food_name,
                confidence: ing.confidence,
            });
        }
    }

    // Sum up nutrition
    const totals = valid.reduce(
        (acc, ing) => ({
            calories: acc.calories + ing.nutrition.calories,
            protein_g: acc.protein_g + ing.nutrition.protein_g,
            carbs_g: acc.carbs_g + ing.nutrition.carbs_g,
            fat_g: acc.fat_g + ing.nutrition.fat_g,
            fiber_g: acc.fiber_g + (ing.nutrition.fiber_g || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    );

    // Determine calculation accuracy
    const unmatchedPortion = unmatchedIngredients.length / ingredients.length;
    let calculationAccuracy: 'high' | 'medium' | 'low' = 'high';
    if (unmatchedPortion > 0.5) {
        calculationAccuracy = 'low';
    } else if (unmatchedPortion > 0.2 || lowConfidenceMatches.length > ingredients.length * 0.3) {
        calculationAccuracy = 'medium';
    }

    return {
        total_calories: Math.round(totals.calories),
        total_protein_g: Math.round(totals.protein_g * 10) / 10,
        total_carbs_g: Math.round(totals.carbs_g * 10) / 10,
        total_fat_g: Math.round(totals.fat_g * 10) / 10,
        total_fiber_g: Math.round(totals.fiber_g * 10) / 10,
        per_serving: {
            calories: Math.round(totals.calories / servings),
            protein_g: Math.round((totals.protein_g / servings) * 10) / 10,
            carbs_g: Math.round((totals.carbs_g / servings) * 10) / 10,
            fat_g: Math.round((totals.fat_g / servings) * 10) / 10,
            fiber_g: Math.round(((totals.fiber_g || 0) / servings) * 10) / 10,
        },
        unmatchedIngredients,
        lowConfidenceMatches,
        calculationAccuracy,
    };
}

/**
 * Format accuracy summary for user
 */
export function getAccuracyReport(summary: RecipeNutritionSummary): {
    message: string;
    color: 'green' | 'yellow' | 'red';
    details: string[];
} {
    const details: string[] = [];

    if (summary.unmatchedIngredients.length > 0) {
        details.push(`⚠️ ${summary.unmatchedIngredients.length} ingredients couldn't be matched`);
    }

    if (summary.lowConfidenceMatches.length > 0) {
        details.push(`ℹ️ ${summary.lowConfidenceMatches.length} ingredients have low confidence matches`);
    }

    let color: 'green' | 'yellow' | 'red' = 'green';
    if (summary.calculationAccuracy === 'low') {
        color = 'red';
    } else if (summary.calculationAccuracy === 'medium') {
        color = 'yellow';
    }

    const message
        = summary.calculationAccuracy === 'high'
            ? '✅ High confidence nutrition data'
            : summary.calculationAccuracy === 'medium'
                ? '⚠️ Medium confidence - some ingredients not fully matched'
                : '❌ Low confidence - many ingredients unmatched';

    return { message, color, details };
}
