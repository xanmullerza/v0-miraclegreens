/**
 * Nutrition Utilities
 * 
 * Centralized logic for calculating and aggregating macronutrients, 
 * micronutrients, and phytonutrients for recipes and meal plans.
 */

export const CAL_TO_KJ = 4.184;

export type EnergyUnit = 'kcal' | 'kJ';

/**
 * Format energy values based on preference.
 */
export const formatEnergyValue = (calories: number, unit: EnergyUnit, energy_kj?: number) => {
    if (unit === 'kJ') {
        const value = energy_kj !== undefined ? energy_kj : calories * CAL_TO_KJ;
        return `${Math.round(value).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};

/**
 * Aggregates nutrition data from a list of ingredients.
 * Each ingredient should have its matched food_item data and a calculated weight_g.
 */
export const calculateAggregatedNutrition = (ingredients: any[]): {
    calories: number;
    energy_kj: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients: Record<string, number>;
    phytonutrients: Record<string, string | { description: string; sources: string[] }>;
} => {
    let totalCalories = 0;
    let totalEnergyKj = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const aggregatedMicros: Record<string, number> = {};
    const aggregatedPhytos: Record<string, { description: string; sources: string[] }> = {};

    ingredients.forEach(ing => {
        // Skip if no food item or no weight
        const food = ing.food_items || ing.food_item;
        const weight = ing.weight_g || 0;
        const foodName = food?.name || 'Unknown';
        
        if (food && weight > 0) {
            const ratio = weight / 100; // Database values are typically per 100g
            
            totalCalories += (food.energy_kcal || 0) * ratio;
            totalEnergyKj += (food.energy_kj || 0) * ratio;
            totalProtein += (food.protein_g || 0) * ratio;
            totalCarbs += (food.carbs_g || 0) * ratio;
            totalFat += (food.fat_g || 0) * ratio;

            // Aggregate micronutrients
            if (food.micronutrients && typeof food.micronutrients === 'object') {
                Object.entries(food.micronutrients).forEach(([key, val]) => {
                    const numVal = Number(val);
                    if (!isNaN(numVal)) {
                        aggregatedMicros[key] = (aggregatedMicros[key] || 0) + (numVal * ratio);
                    }
                });
            }

            // Aggregate phytonutrients with sources tracking
            if (food.phytonutrients && typeof food.phytonutrients === 'object') {
                Object.entries(food.phytonutrients).forEach(([key, val]) => {
                    if (val) {
                        if (!aggregatedPhytos[key]) {
                            aggregatedPhytos[key] = {
                                description: String(val),
                                sources: []
                            };
                        }
                        // Add source if not already present
                        if (!aggregatedPhytos[key].sources.includes(foodName)) {
                            aggregatedPhytos[key].sources.push(foodName);
                        }
                    }
                });
            }
        }
    });

    return {
        calories: totalCalories,
        energy_kj: totalEnergyKj,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        micronutrients: aggregatedMicros,
        phytonutrients: aggregatedPhytos
    };
};

/**
 * Format a nutrient value for display based on its common unit.
 */
export const formatNutrientValue = (value: number, unit: string) => {
    if (value === 0) return '0' + unit;
    if (value < 0.1) return value.toFixed(3) + unit;
    if (value < 1) return value.toFixed(2) + unit;
    return value.toFixed(1) + unit;
};
