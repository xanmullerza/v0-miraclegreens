import { supabase } from '@/lib/supabase';
import { COOKING_STATES, CookingState } from './cooking-states';
import { findSpiceFactor, SpiceState } from './spice-conversion';

export interface FoodItemNutrition {
    id: string;
    name: string;
    energy_kcal: number;
    energy_kj?: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    micronutrients?: Record<string, number>;
    phytonutrients?: Record<string, string>;
}

export type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type NutrientStrategy = 'balanced' | 'low-carb' | 'high-protein' | 'keto' | 'high-carb';

export interface UserTargetParams {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activityLevel: ActivityLevel;
    goal: GoalType;
    nutrientStrategy: NutrientStrategy;
    measurementUnit?: 'metric' | 'imperial';
}

export function calculateIndividualTargets(params: UserTargetParams) {
    const { weight: wInput, height: hInput, age, gender, activityLevel, goal, nutrientStrategy, measurementUnit } = params;

    // Convert to metric for formula if needed
    const weight = measurementUnit === 'imperial' ? wInput * 0.453592 : wInput;
    const height = measurementUnit === 'imperial' ? hInput * 2.54 : hInput;

    // BMR (Mifflin-St Jeor)
    const s = gender === 'male' ? 5 : -161;
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s;

    // Activity Factor
    const activityFactors: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725
    };
    const factor = activityFactors[activityLevel] || 1.2;
    let tdee = bmr * factor;

    // Goal Adjustment
    if (goal === 'lose-fat') tdee -= 500;
    if (goal === 'build-muscle') tdee += 500;
    tdee = Math.max(tdee, 1200);

    // Strategy Allocation
    let pPct = 0.25, cPct = 0.45, fPct = 0.30;

    switch (nutrientStrategy) {
        case 'low-carb':
            pPct = 0.35; cPct = 0.15; fPct = 0.50;
            break;
        case 'high-protein':
            pPct = 0.40; cPct = 0.35; fPct = 0.25;
            break;
        case 'keto':
            pPct = 0.25; cPct = 0.05; fPct = 0.70;
            break;
        case 'high-carb':
            pPct = 0.20; cPct = 0.60; fPct = 0.20;
            break;
    }

    // Child logic override for protein (approx 1g/kg)
    let protein: number;
    if (age < 14) {
        protein = weight * 1.0;
        const remainingCals = tdee - (protein * 4);
        // Distribute remaining cals based on strategy ratios
        const macroRatioSum = cPct + fPct;
        const adjustedCPct = cPct / macroRatioSum;
        const adjustedFPct = fPct / macroRatioSum;
        return {
            energy: tdee,
            protein,
            carbs: (remainingCals * adjustedCPct) / 4,
            fat: (remainingCals * adjustedFPct) / 9
        };
    }

    return {
        energy: tdee,
        protein: (tdee * pPct) / 4,
        carbs: (tdee * cPct) / 4,
        fat: (tdee * fPct) / 9
    };
}

export interface CalculatedNutrition {
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients?: Record<string, number>;
    phytonutrients?: Record<string, string>;
}

/**
 * Calculate nutrition for a given weight of a food item
 * @param foodItem - The food item with per-100g nutrition data
 * @param weightGrams - The weight in grams
 * @returns Calculated nutrition values
 */
export function calculateNutrition(
    foodItem: FoodItemNutrition,
    weightGrams: number,
    cookingState: CookingState = 'raw'
): CalculatedNutrition {
    const multiplier = weightGrams / 100;
    const stateFactor = COOKING_STATES[cookingState] || COOKING_STATES['raw'];

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
    let fat = getMacro(foodItem.fat_g, ['Fat', 'fat_g', 'fat']);

    // Extra fallback: If fat is 0 but we have constituents, sum them
    if (fat === 0 && foodItem.micronutrients) {
        const m = foodItem.micronutrients;
        const sat = m['Saturated Fat'] || m['saturated_fat_g'] || 0;
        const mono = m['Monounsaturated Fat'] || m['monounsaturated_fat_g'] || 0;
        const poly = m['Polyunsaturated Fat'] || m['polyunsaturated_fat_g'] || 0;
        const trans = m['Trans Fat'] || m['trans_fat_g'] || 0;
        const totalSum = sat + mono + poly + trans;
        if (totalSum > 0) fat = totalSum;
    }

    const energyKj = getMacro(foodItem.energy_kj, ['energy_kj']);

    // APPLY COOKING STATE SCALING
    // We scale the per-100g density based on the cooking method
    const scaledCalories = calories * stateFactor.energy;
    const scaledProtein = protein * stateFactor.protein;
    const scaledFat = fat * stateFactor.fat;
    const scaledCarbs = carbs * stateFactor.carbs;

    const result: CalculatedNutrition = {
        calories: Math.round(scaledCalories * multiplier),
        energy_kj: Math.round((energyKj || (scaledCalories * 4.184)) * multiplier),
        protein: Math.round(scaledProtein * multiplier * 10) / 10,
        fat: Math.round(scaledFat * multiplier * 10) / 10,
        carbs: Math.round(scaledCarbs * multiplier * 10) / 10,
    };

    // Calculate micronutrients
    if (foodItem.micronutrients) {
        result.micronutrients = {};
        for (const [key, value] of Object.entries(foodItem.micronutrients)) {
            if (typeof value === 'number') {
                result.micronutrients[key] = value * multiplier * stateFactor.micros;
            }
        }
    }

    // Pass through phytonutrients (they don't scale by weight, they are just "present")
    if (foodItem.phytonutrients) {
        result.phytonutrients = { ...foodItem.phytonutrients };
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

    // 2. Strict Word-Boundary Fat Matching (Prevent cross-matching "Saturated" into "Monounsaturated")
    const isSaturated = /\bsaturated\b/i.test(kL) && !/\bmono\b/i.test(kL) && !/\bpoly\b/i.test(kL);
    const isMono = /\bmonounsaturated\b/i.test(kL) || (/\bmono\b/i.test(kL) && /\bfat\b/i.test(kL));
    const isPoly = /\bpolyunsaturated\b/i.test(kL) || (/\bpoly\b/i.test(kL) && /\bfat\b/i.test(kL));
    const isTrans = /\btrans\b/i.test(kL);
    const isCholesterol = /\bcholesterol\b/i.test(kL);

    if (isSaturated) {
        const match = mKeys.find(mk => /\bsaturated\b/i.test(mk) && !/\bmono\b/i.test(mk) && !/\bpoly\b/i.test(mk));
        if (match) return match;
    }
    if (isMono) {
        const match = mKeys.find(mk => /\bmonounsaturated\b/i.test(mk) || (/\bmono\b/i.test(mk) && /\bfat\b/i.test(mk)));
        if (match) return match;
    }
    if (isPoly) {
        const match = mKeys.find(mk => /\bpolyunsaturated\b/i.test(mk) || (/\bpoly\b/i.test(mk) && /\bfat\b/i.test(mk)));
        if (match) return match;
    }
    if (isTrans) {
        const match = mKeys.find(mk => /\btrans\b/i.test(mk));
        if (match) return match;
    }
    if (isCholesterol) {
        const match = mKeys.find(mk => /\bcholesterol\b/i.test(mk));
        if (match) return match;
    }

    // Omega specifics (Keep separate from general Poly-sum)
    const omega3Match = /\bomega[- ]?3\b/i.test(kL) || /\bn-3\b/i.test(kL);
    const omega6Match = /\bomega[- ]?6\b/i.test(kL) || /\bn-6\b/i.test(kL);

    if (omega3Match) {
        const match = mKeys.find(mk => /\bomega[- ]?3\b/i.test(mk) || /\bn-3\b/i.test(mk));
        if (match) return match;
    }
    if (omega6Match) {
        const match = mKeys.find(mk => /\bomega[- ]?6\b/i.test(mk) || /\bn-6\b/i.test(mk));
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
    if (/\bthiamine\b/i.test(kL) || /\bb1\b/i.test(kL)) {
        const match = mKeys.find(mk => /\bthiamine\b/i.test(mk) || /\bb1\b/i.test(mk));
        if (match) return match;
    }
    if (/\briboflavin\b/i.test(kL) || /\bb2\b/i.test(kL)) {
        const match = mKeys.find(mk => /\briboflavin\b/i.test(mk) || /\bb2\b/i.test(mk));
        if (match) return match;
    }
    if (/\bniacin\b/i.test(kL) || /\bb3\b/i.test(kL)) {
        const match = mKeys.find(mk => /\bniacin\b/i.test(mk) || /\bb3\b/i.test(mk));
        if (match) return match;
    }
    if (/\bfolate\b/i.test(kL) || /\bfolic\b/i.test(kL) || /\bb9\b/i.test(kL)) {
        const match = mKeys.find(mk => /\bfolate\b/i.test(mk) || /\bfolic\b/i.test(mk) || /\bb9\b/i.test(mk));
        if (match) return match;
    }

    // 4. Fuzzy word matching (Very restricted fallback)
    const firstWord = kL.split(/[\s_]/)[0];
    if (firstWord.length > 5 && !['vitamin', 'saturated', 'monounsaturated', 'polyunsaturated', 'total'].includes(firstWord)) {
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
        cooking_state?: CookingState;
    }>
): CalculatedNutrition {
    return ingredients.reduce(
        (total, ing) => {
            const nutrition = calculateNutrition(ing.food_item, ing.weight_g, ing.cooking_state);

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

            // Aggregated Phytonutrients
            const newPhytos = { ...(total.phytonutrients || {}) };
            if (nutrition.phytonutrients) {
                Object.entries(nutrition.phytonutrients).forEach(([key, val]) => {
                    newPhytos[key] = val; // Add or preserve description
                });
            }

            return {
                calories: total.calories + nutrition.calories,
                energy_kj: total.energy_kj + nutrition.energy_kj,
                protein: total.protein + nutrition.protein,
                fat: total.fat + nutrition.fat,
                carbs: total.carbs + nutrition.carbs,
                micronutrients: newMicros,
                phytonutrients: newPhytos
            };
        },
        {
            calories: 0,
            energy_kj: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            micronutrients: {} as Record<string, number>,
            phytonutrients: {} as Record<string, string>
        }
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
