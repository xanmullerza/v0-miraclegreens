import { UnitType, NutrientBreakdownDef } from './types';

export const CAL_TO_KJ = 4.184;

export const BOOSTABLE_NUTRIENTS = [
    'Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Iron', 'Vitamin A',
    'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'Vitamin C',
    'Fiber', 'Energy', 'Protein', 'Carbs', 'Fat',
];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export const formatEnergy = (calories: number, unit: UnitType, energyKj?: number) => {
    if (unit === 'kJ') {
        const value = energyKj !== undefined ? energyKj : calories * CAL_TO_KJ;
        return `${Math.round(value).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};

export const parseTotalGrams = (quantityStr: string): number | null => {
    if (!quantityStr) return null;
    const entries = quantityStr.split(/\s*\+\s*/).map((s) => s.trim()).filter(Boolean);
    let total = 0;
    let hasWeight = false;
    for (const entry of entries) {
        const labeled = entry.match(/^(\d+(?:\.\d+)?)\s+.+?\s+\((\d+(?:\.\d+)?)g\)$/);
        if (labeled) {
            total += parseFloat(labeled[1]) * parseFloat(labeled[2]);
            hasWeight = true;
            continue;
        }
        const weighted = entry.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml)$/i);
        if (weighted) {
            total += parseFloat(weighted[1]) * parseFloat(weighted[2]);
            hasWeight = true;
            continue;
        }
        const kgFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:kg|kilograms?|kilogrammes?)$/i);
        if (kgFmt) {
            total += parseFloat(kgFmt[1]) * 1000;
            hasWeight = true;
            continue;
        }
        const gramFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:g|grams?|grammes?)$/i);
        if (gramFmt) {
            total += parseFloat(gramFmt[1]);
            hasWeight = true;
            continue;
        }
        const mlFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:ml|millilitres?|milliliters?)$/i);
        if (mlFmt) {
            total += parseFloat(mlFmt[1]);
            hasWeight = true;
            continue;
        }
        const lbFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)$/i);
        if (lbFmt) {
            total += parseFloat(lbFmt[1]) * 453.592;
            hasWeight = true;
            continue;
        }
        const ozFmt = entry.match(/^(\d+(?:\.\d+)?)\s*(?:oz|ounces?)$/i);
        if (ozFmt) {
            total += parseFloat(ozFmt[1]) * 28.3495;
            hasWeight = true;
            continue;
        }
        const plainNum = entry.match(/^(\d+(?:\.\d+)?)$/);
        if (plainNum) {
            total += parseFloat(plainNum[1]) * 1000;
            hasWeight = true;
            continue;
        }
    }
    return hasWeight ? total : null;
};

export const formatWeightStr = (grams: number): string => {
    if (grams >= 1000) {
        const kg = grams / 1000;
        const kgStr = parseFloat(kg.toFixed(3)).toString();
        const unit = parseFloat(kgStr) === 1 ? 'kilogram' : 'kilograms';
        return `${kgStr} ${unit}`;
    }
    const gramsNum = Math.round(grams);
    const unit = gramsNum === 1 ? 'gram' : 'grams';
    return `${gramsNum} ${unit}`;
};

export const findNutrientMatch = (record: Record<string, any>, key: string) => {
    const mKeys = Object.keys(record);
    const kL = key.toLowerCase();
    const exact = mKeys.find((mk) => mk.toLowerCase() === kL);
    if (exact) return exact;
    if (kL.includes('vitamin')) {
        const letter = kL.split(' ')[1]?.toLowerCase();
        if (letter && letter.length === 1) {
            const match = mKeys.find((mk) => {
                const mkL = mk.toLowerCase();
                return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
            });
            if (match) return match;
        }
    }
    if (kL.startsWith('b') && /\b[b]\d+\b/.test(kL)) {
        const bNum = kL.split(' ')[0].toLowerCase();
        const match = mKeys.find((mk) => {
            const mkL = mk.toLowerCase();
            return (
                mkL.includes(bNum) ||
                (kL.includes('thiamine') && mkL.includes('thiamine')) ||
                (kL.includes('riboflavin') && mkL.includes('riboflavin'))
            );
        });
        if (match) return match;
    }
    const firstWord = kL.split(' ')[0];
    if (firstWord.length > 3) {
        const fuzzy = mKeys.find((mk) => mk.toLowerCase().includes(firstWord));
        if (fuzzy) return fuzzy;
    }
    return null;
};

export const MORINGA_TSP = {
    energy_kcal: 5.0, energy_kj: 20.93, protein_g: 0.5, carbs_g: 0.8, fat_g: 0.05,
    micronutrients: {
        'Vitamin A': 112.5, 'Vitamin C': 4.5, 'B1 (Thiamine)': 0.05, 'B2 (Riboflavin)': 0.41,
        'B3 (Niacin)': 0.2, Calcium: 40.0, Iron: 0.76, Magnesium: 7.35, Potassium: 26.5,
        Sodium: 0.5, Fiber: 0.8,
    },
};

export const NUTRIENT_BREAKDOWNS: Record<string, NutrientBreakdownDef[]> = {
    'Vitamin A': [
        { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'g' },
        { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'g' },
        { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'g' },
        { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'g' },
        { label: 'Lutein+Zeaxanthin', keys: ['Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'g' },
        { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'g' },
    ],
    'Vitamin E': [
        { label: 'Alpha-tocopherol', keys: ['Vitamin E', 'vitamin_e_mg', 'alpha_tocopherol_mg'], unit: 'mg' },
        { label: 'Beta-tocopherol', keys: ['Beta Tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
        { label: 'Delta-tocopherol', keys: ['Delta Tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
        { label: 'Gamma-tocopherol', keys: ['Gamma Tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
    ],
    Protein: [
        { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
        { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
        { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
        { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
        { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
        { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
        { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
        { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
        { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
        { label: 'Alanine', keys: ['Alanine', 'alanine_g'], unit: 'g' },
        { label: 'Arginine', keys: ['Arginine', 'arginine_g'], unit: 'g' },
        { label: 'Aspartic acid', keys: ['Aspartic acid', 'aspartic_acid_g'], unit: 'g' },
        { label: 'Cystine', keys: ['Cystine', 'cystine_g'], unit: 'g' },
        { label: 'Glutamic acid', keys: ['Glutamic acid', 'glutamic_acid_g'], unit: 'g' },
        { label: 'Glycine', keys: ['Glycine', 'glycine_g'], unit: 'g' },
        { label: 'Proline', keys: ['Proline', 'proline_g'], unit: 'g' },
        { label: 'Serine', keys: ['Serine', 'serine_g'], unit: 'g' },
        { label: 'Tyrosine', keys: ['Tyrosine', 'tyrosine_g'], unit: 'g' },
    ],
    Carbs: [
        { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
        { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
        { label: 'Sugars (Total)', keys: ['Sugars', 'sugars_g', 'sugar_g'], unit: 'g', isExpandable: true },
        { label: 'Fructose', keys: ['Fructose', 'fructose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Glucose', keys: ['Glucose', 'glucose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Sucrose', keys: ['Sucrose', 'sucrose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Lactose', keys: ['Lactose', 'lactose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Maltose', keys: ['Maltose', 'maltose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Galactose', keys: ['Galactose', 'galactose_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Added Sugars', keys: ['Added Sugars', 'added_sugars_g'], unit: 'g', hiddenByDefault: true },
    ],
    Fat: [
        { label: 'Saturated Fat', keys: ['Saturated', 'saturated_fat_g', 'saturated_g'], unit: 'g' },
        { label: 'Monounsaturated', keys: ['Monounsaturated', 'monounsaturated_fat_g'], unit: 'g' },
        { label: 'Polyunsaturated', keys: ['Polyunsaturated', 'polyunsaturated_fat_g'], unit: 'g' },
        { label: 'Omega-3', keys: ['Omega-3', 'omega3_g', 'omega_3_g'], unit: 'g', isExpandable: true },
        { label: 'ALA', keys: ['ALA', 'alpha_linolenic_acid_g'], unit: 'g', hiddenByDefault: true },
        { label: 'EPA', keys: ['EPA', 'eicosapentaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
        { label: 'DHA', keys: ['DHA', 'docosahexaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
        { label: 'Omega-6', keys: ['Omega-6', 'omega6_g', 'omega_6_g'], unit: 'g' },
        { label: 'Trans Fat', keys: ['Trans-Fats', 'trans_fat_g'], unit: 'g' },
        { label: 'Cholesterol', keys: ['Cholesterol', 'cholesterol_mg'], unit: 'mg' },
    ],
};
