/**
 * Spice Conversion Utility
 * Handles the transformation of nutritional data and portion weights 
 * when converting spices between whole (seeds/pods) and ground (powder) forms.
 */

export type SpiceState = 'whole' | 'ground';

export interface SpiceTransformationFactor {
    name: string;
    vToG: number; // Volume yield: 1 unit whole -> X units ground
    concentrationFactor: number; // Nutritional concentration per gram (e.g. 1.2 means 1g ground = 1.2g whole nutrients)
    gPerTspGround: number; // Density: grams per 1 tsp of ground powder
    gPerTspWhole?: number; // Density: grams per 1 tsp of whole spice
}

/**
 * Standard transformation factors based on culinary and clinical benchmarks.
 * Source: McCormick Culinary, Food52, USDA FoodData Central.
 */
export const SPICE_TRANSFORMATIONS: Record<string, SpiceTransformationFactor> = {
    'Black Pepper': { name: 'Black Pepper', vToG: 1.5, concentrationFactor: 1.0, gPerTspGround: 2.6, gPerTspWhole: 3.1 },
    'Coriander': { name: 'Coriander', vToG: 1.25, concentrationFactor: 1.0, gPerTspGround: 2.36, gPerTspWhole: 1.8 },
    'Cumin': { name: 'Cumin', vToG: 1.25, concentrationFactor: 1.0, gPerTspGround: 1.96, gPerTspWhole: 2.1 },
    'Fennel': { name: 'Fennel', vToG: 1.25, concentrationFactor: 1.0, gPerTspGround: 2.0, gPerTspWhole: 1.9 },
    'Mustard': { name: 'Mustard', vToG: 1.5, concentrationFactor: 1.0, gPerTspGround: 2.4, gPerTspWhole: 2.8 },
    'Cardamom': { name: 'Cardamom', vToG: 1.0, concentrationFactor: 1.0, gPerTspGround: 2.31, gPerTspWhole: 2.0 },
    'Cinnamon': { name: 'Cinnamon', vToG: 1.0, concentrationFactor: 1.0, gPerTspGround: 2.6, gPerTspWhole: 2.5 },
    'Cloves': { name: 'Cloves', vToG: 0.75, concentrationFactor: 1.0, gPerTspGround: 2.6, gPerTspWhole: 2.2 },
    'Ginger': { name: 'Ginger', vToG: 1.0, concentrationFactor: 4.5, gPerTspGround: 2.0, gPerTspWhole: 5.0 },
    'Turmeric': { name: 'Turmeric', vToG: 1.0, concentrationFactor: 5.0, gPerTspGround: 2.74, gPerTspWhole: 4.8 },
    'Nutmeg': { name: 'Nutmeg', vToG: 1.0, concentrationFactor: 1.0, gPerTspGround: 2.6, gPerTspWhole: 2.6 },
    'Star Anise': { name: 'Star Anise', vToG: 1.0, concentrationFactor: 1.0, gPerTspGround: 2.1, gPerTspWhole: 2.1 },
};

export const DEFAULT_TRANSFORMATION: SpiceTransformationFactor = {
    name: 'Generic',
    vToG: 1.25,
    concentrationFactor: 1.0,
    gPerTspGround: 2.3,
    gPerTspWhole: 2.5
};

/**
 * Finds the best matching transformation factor for a given food name.
 */
export function findSpiceFactor(name: string): SpiceTransformationFactor {
    const upperName = name.toUpperCase();
    for (const [key, factor] of Object.entries(SPICE_TRANSFORMATIONS)) {
        if (upperName.includes(key.toUpperCase())) {
            return factor;
        }
    }
    return DEFAULT_TRANSFORMATION;
}

/**
 * Checks if a given food name matches a known spice in our transformation library.
 */
export function isSpice(name: string): boolean {
    const upperName = (name || '').toUpperCase();
    return Object.keys(SPICE_TRANSFORMATIONS).some(key => upperName.includes(key.toUpperCase()));
}

/**
 * Calculates new portion weights when transforming a spice.
 * @param currentPortions Array of existing portions {label, weight_g}
 * @param factor The transformation factors to apply
 * @param toState The target state ('whole' or 'ground')
 */
export function transformPortions(
    currentPortions: { label: string, weight_g: number }[],
    factor: SpiceTransformationFactor,
    toState: SpiceState
) {
    return currentPortions.map(p => {
        const labelLower = p.label.toLowerCase();

        // If the portion is mass-based (g, kg, oz), it stays the same (mass is conserved)
        if (labelLower === 'g' || labelLower === 'gram' || labelLower === 'kg' || labelLower === 'kilogram' || labelLower === 'oz' || labelLower === 'ounce') {
            return { ...p };
        }

        // If it's volume-based (tsp, tbsp, cup), we need to adjust weight based on density change
        // We assume '1 tsp whole' weights 'gPerTspWhole' and '1 tsp ground' weights 'gPerTspGround'
        let weightFactor = 1;

        if (toState === 'ground') {
            // Converting WHOLE to GROUND
            // A teaspoon of whole spice vs a teaspoon of ground spice
            // We use the density ratio
            if (factor.gPerTspWhole && factor.gPerTspWhole > 0) {
                weightFactor = factor.gPerTspGround / factor.gPerTspWhole;
            }
        } else {
            // Converting GROUND to WHOLE
            if (factor.gPerTspGround && factor.gPerTspGround > 0 && factor.gPerTspWhole) {
                weightFactor = factor.gPerTspWhole / factor.gPerTspGround;
            }
        }

        return {
            ...p,
            weight_g: Number((p.weight_g * weightFactor).toFixed(2))
        };
    });
}

/**
 * Calculates new nutritional values per 100g.
 * Most spices have a 1:1 mass concentration when ground from dry states.
 * However, roots (ginger/turmeric) become much more concentrated per gram.
 */
export function transformNutritionPer100g(
    food: any,
    factor: SpiceTransformationFactor,
    toState: SpiceState
) {
    const scale = toState === 'ground' ? factor.concentrationFactor : (1 / factor.concentrationFactor);
    if (scale === 1) return {
        protein_g: food.protein_g,
        carbs_g: food.carbs_g,
        fat_g: food.fat_g,
        energy_kcal: food.energy_kcal,
        energy_kj: food.energy_kj,
        micronutrients: { ...food.micronutrients }
    };

    const newNutrition = {
        protein_g: Number((food.protein_g * scale).toFixed(2)),
        carbs_g: Number((food.carbs_g * scale).toFixed(2)),
        fat_g: Number((food.fat_g * scale).toFixed(2)),
        energy_kcal: Number((food.energy_kcal * scale).toFixed(0)),
        energy_kj: Number((food.energy_kj * scale).toFixed(0)),
        micronutrients: {} as Record<string, number>
    };

    if (food.micronutrients) {
        Object.entries(food.micronutrients).forEach(([key, val]) => {
            newNutrition.micronutrients[key] = Number(((val as number) * scale).toFixed(3));
        });
    }

    return newNutrition;
}
