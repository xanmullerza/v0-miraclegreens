/**
 * Spice Conversion Utility
 * Handles the transformation of nutritional data and portion weights 
 * when converting spices between whole (seeds/pods) and ground (powder) forms.
 */

export type SpiceState = 'whole' | 'ground';

export interface SpiceTransformationFactor {
    name: string;
    vToG: number; // Volume yield: 1 unit whole -> X units ground
    gPerTspGround: number; // Density: grams per 1 tsp of ground powder
    gPerTspWhole?: number; // Density: grams per 1 tsp of whole spice
}

/**
 * Standard transformation factors based on culinary and clinical benchmarks.
 * Source: McCormick Culinary, Food52, USDA FoodData Central.
 */
export const SPICE_TRANSFORMATIONS: Record<string, SpiceTransformationFactor> = {
    'Black Pepper': { name: 'Black Pepper', vToG: 1.5, gPerTspGround: 2.6, gPerTspWhole: 3.1 },
    'Coriander': { name: 'Coriander', vToG: 1.25, gPerTspGround: 2.36, gPerTspWhole: 1.8 },
    'Cumin': { name: 'Cumin', vToG: 1.25, gPerTspGround: 1.96, gPerTspWhole: 2.1 },
    'Fennel': { name: 'Fennel', vToG: 1.25, gPerTspGround: 2.0, gPerTspWhole: 1.9 },
    'Mustard': { name: 'Mustard', vToG: 1.5, gPerTspGround: 2.4, gPerTspWhole: 2.8 },
    'Cardamom': { name: 'Cardamom', vToG: 1.0, gPerTspGround: 2.31, gPerTspWhole: 2.0 }, // pods vary
    'Cinnamon': { name: 'Cinnamon', vToG: 1.0, gPerTspGround: 2.6, gPerTspWhole: 2.5 }, // sticks vary
    'Cloves': { name: 'Cloves', vToG: 0.75, gPerTspGround: 2.6, gPerTspWhole: 2.2 },
    'Ginger': { name: 'Ginger', vToG: 1.0, gPerTspGround: 2.0, gPerTspWhole: 5.0 }, // root vs powder
    'Nutmeg': { name: 'Nutmeg', vToG: 2.5, gPerTspGround: 2.6, gPerTspWhole: 3.0 },
    'Turmeric': { name: 'Turmeric', vToG: 1.0, gPerTspGround: 2.74, gPerTspWhole: 4.8 }, // root vs powder
};

export const DEFAULT_TRANSFORMATION: SpiceTransformationFactor = {
    name: 'Generic',
    vToG: 1.25,
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
 * Usually, the 100g clinical sample is identical for whole vs ground (mass is mass),
 * UNLESS there is a yield loss or significant moisture change.
 * In culinary context, we assume the per-100g data remains identical as it refers to the composition of the matter.
 */
export function transformNutritionPer100g(nutrition: any) {
    // In our case, spices are usually processed via grinding without loss of nutrients vs total mass.
    // So 100g of cumin seeds has the same nutrition as 100g of cumin powder.
    // However, we return a copy to avoid mutation.
    return { ...nutrition };
}
