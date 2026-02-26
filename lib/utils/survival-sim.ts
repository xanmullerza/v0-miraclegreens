export interface SurvivalProfile {
    energy_floor: number;
    water_floor: number;
    b1_floor: number;
    vit_c_floor: number;
    sodium_floor: number;
    potassium_floor: number;
}

export const SURVIVAL_PROFILES: Record<'maintenance' | 'starvation', SurvivalProfile> = {
    maintenance: {
        energy_floor: 2000,
        water_floor: 2.5,
        b1_floor: 1.2,
        vit_c_floor: 90,
        sodium_floor: 2300,
        potassium_floor: 3400
    },
    starvation: {
        energy_floor: 1200,
        water_floor: 1.5,
        b1_floor: 0.5,
        vit_c_floor: 10,
        sodium_floor: 1000,
        potassium_floor: 1500
    }
};

export const INITIAL_STORES = {
    energy: 40000, // Approx 5kg of fat = 45k kcal
    water: 1.5, // 1.5 days reserve
    b1: 7, // 7 days reserve
    vit_c: 14, // 14 days reserve
    sodium: 4, // 4 days reserve
    potassium: 4 // 4 days reserve
};

export const SYMPTOM_MAP = [
    {
        nutrient: 'water',
        threshold: 0,
        name: 'Dehydration',
        symptom: 'Severe lethargy, dark urine, confusion.',
        terminal: 'Vital organ failure imminent.'
    },
    {
        nutrient: 'energy',
        threshold: -5000,
        name: 'Hypoglycemia',
        symptom: 'Intense hunger, dizziness, cold sweats.',
        terminal: 'Ketosis exhaustion, system shutdown.'
    },
    {
        nutrient: 'b1',
        threshold: 0,
        name: 'Wernicke’s Encephalopathy',
        symptom: 'Ataxia, mental confusion, vision issues.',
        terminal: 'Irreversible neural damage.'
    },
    {
        nutrient: 'vit_c',
        threshold: 0,
        name: 'Scurvy Progression',
        symptom: 'Bleeding gums, joint pain, old wounds reopening.',
        terminal: 'Systemic hemorrhage.'
    },
    {
        nutrient: 'potassium',
        threshold: 0,
        name: 'Hypokalemia',
        symptom: 'Muscle cramps, extreme weakness.',
        terminal: 'Cardiac arrhythmia risks.'
    }
];

function getNutrient(nutrition: any, keys: string[]): number {
    if (!nutrition) return 0;

    // Check top level
    for (const k of keys) {
        if (typeof nutrition[k] === 'number') return nutrition[k];
    }

    // Check micronutrients
    if (nutrition.micronutrients) {
        for (const k of keys) {
            if (typeof nutrition.micronutrients[k] === 'number') return nutrition.micronutrients[k];
        }
    }

    return 0;
}

export function calculateSurvivalStatus(
    inventory: any[],
    days: number,
    profileType: 'maintenance' | 'starvation',
    initialWaterSecured: boolean = true
) {
    const profile = SURVIVAL_PROFILES[profileType];

    // Aggregated Inventory Nutrition (total weight-based)
    // For simplicity, we assume the user consumes their inventory evenly over the projected days?
    // No, if user is on Day X, they have used X days worth of BMR.

    const totalPantry = inventory.reduce((acc, item) => {
        const n = item.nutrition;
        const mult = item.weight_g / 100;

        acc.energy += getNutrient(n, ['energy_kcal', 'energy', 'Calories', 'Energy']) * mult;
        acc.b1 += getNutrient(n, ['B1 (Thiamine)', 'Thiamine', 'vitamin_b1']) * mult;
        acc.vit_c += getNutrient(n, ['Vitamin C', 'vitamin_c', 'Ascorbic Acid']) * mult;
        acc.sodium += getNutrient(n, ['Sodium', 'sodium']) * mult;
        acc.potassium += getNutrient(n, ['Potassium', 'potassium']) * mult;

        return acc;
    }, { energy: 0, b1: 0, vit_c: 0, sodium: 0, potassium: 0 });

    const results = {
        energy: (INITIAL_STORES.energy + totalPantry.energy) - (profile.energy_floor * days),
        water: (INITIAL_STORES.water + (initialWaterSecured ? days : 0)) - (1.0 * days), // 1.0 = burn rate
        b1: (INITIAL_STORES.b1 * profile.b1_floor + totalPantry.b1) - (profile.b1_floor * days),
        vit_c: (INITIAL_STORES.vit_c * profile.vit_c_floor + totalPantry.vit_c) - (profile.vit_c_floor * days),
        sodium: (INITIAL_STORES.sodium * profile.sodium_floor + totalPantry.sodium) - (profile.sodium_floor * days),
        potassium: (INITIAL_STORES.potassium * profile.potassium_floor + totalPantry.potassium) - (profile.potassium_floor * days)
    };

    const activeSymptoms = SYMPTOM_MAP.filter(s => {
        const val = (results as any)[s.nutrient];
        return val <= s.threshold;
    });

    return {
        results,
        activeSymptoms,
        isTerminal: results.energy < -20000 || results.water < -1 || activeSymptoms.length >= 3
    };
}
