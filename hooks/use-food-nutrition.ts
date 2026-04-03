import { useState, useMemo } from 'react';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';

interface UseFoodNutritionProps {
    food: any;
    selectedPortion: any;
    amount: number;
    energyUnit: string;
    userRDAs?: Record<string, number> | null;
    nutrientDisplayMode?: string;
}

export function useFoodNutrition({
    food,
    selectedPortion,
    amount,
    energyUnit,
    userRDAs = {},
    nutrientDisplayMode = 'both',
}: UseFoodNutritionProps) {
    const [macroGrams, setMacroGrams] = useState(100);

    // Get value from food at default portion
    const getVal = (keys: string[]) => {
        if (!food) return 0;
        const m = food.micronutrients || {};
        let baseVal = 0;

        for (const k of keys) {
            let val = 0;
            if (k === 'energy_kcal') {
                if (energyUnit === 'kJ' && food.energy_kj) val = food.energy_kj;
                else val = food.energy_kcal || 0;
            }
            else if (k === 'energy_kj') {
                if (energyUnit === 'kcal' && food.energy_kcal) val = food.energy_kcal;
                else val = food.energy_kj || 0;
            }
            else if (k === 'Energy' || k === 'Calories' || k === 'calories') {
                if (energyUnit === 'kJ') val = food.energy_kj || (food.energy_kcal ? food.energy_kcal * 4.184 : 0);
                else val = food.energy_kcal || (food.energy_kj ? food.energy_kj / 4.184 : 0);
            }
            else if (k === 'protein_g') val = food.protein_g || 0;
            else if (k === 'carbs_g') val = food.carbs_g || 0;
            else if (k === 'fat_g') val = food.fat_g || 0;
            else {
                if (m[k] !== undefined) val = m[k];
                else {
                    const match = findNutrientMatch(m, k);
                    if (match) val = m[match];
                }
            }

            if (val > 0) {
                baseVal = val;
                break;
            }
        }

        if (baseVal === 0 && (keys.includes('fat_g') || keys.includes('Fat'))) {
            const sat = m['Saturated Fat'] || 0;
            const mono = m['Monounsaturated Fat'] || 0;
            const poly = m['Polyunsaturated Fat'] || 0;
            const trans = m['Trans Fat'] || 0;
            const sum = sat + mono + poly + trans;
            if (sum > 0) baseVal = sum;
        }

        if (baseVal === 0 && keys.some(k => k.toLowerCase().includes('energy') || k.toLowerCase().includes('calorie'))) {
            const p = food.protein_g || 0;
            const c = food.carbs_g || 0;
            const f = food.fat_g || 0;
            if (p > 0 || c > 0 || f > 0) {
                const kcal = (p * 4) + (c * 4) + (f * 9);
                baseVal = energyUnit === 'kJ' ? kcal * 4.184 : kcal;
            }
        }

        const currentWeight = selectedPortion ? (amount * selectedPortion.weight_g) : amount;
        return (baseVal * currentWeight) / 100;
    };

    // Get value from food at custom gram amount
    const getValForCustomGrams = (keys: string[], grams: number = 100) => {
        if (!food) return 0;
        const m = food.micronutrients || {};
        let baseVal = 0;

        for (const k of keys) {
            let val = 0;
            if (k === 'energy_kcal') {
                if (energyUnit === 'kJ' && food.energy_kj) val = food.energy_kj;
                else val = food.energy_kcal || 0;
            }
            else if (k === 'energy_kj') {
                if (energyUnit === 'kcal' && food.energy_kcal) val = food.energy_kcal;
                else val = food.energy_kj || 0;
            }
            else if (k === 'Energy' || k === 'Calories' || k === 'calories') {
                if (energyUnit === 'kJ') val = food.energy_kj || (food.energy_kcal ? food.energy_kcal * 4.184 : 0);
                else val = food.energy_kcal || (food.energy_kj ? food.energy_kj / 4.184 : 0);
            }
            else if (k === 'protein_g') val = food.protein_g || 0;
            else if (k === 'carbs_g') val = food.carbs_g || 0;
            else if (k === 'fat_g') val = food.fat_g || 0;
            else {
                if (m[k] !== undefined) val = m[k];
                else {
                    const match = findNutrientMatch(m, k);
                    if (match) val = m[match];
                }
            }

            if (val > 0) {
                baseVal = val;
                break;
            }
        }

        if (baseVal === 0 && (keys.includes('fat_g') || keys.includes('Fat'))) {
            const sat = m['Saturated Fat'] || 0;
            const mono = m['Monounsaturated Fat'] || 0;
            const poly = m['Polyunsaturated Fat'] || 0;
            const trans = m['Trans Fat'] || 0;
            const sum = sat + mono + poly + trans;
            if (sum > 0) baseVal = sum;
        }

        if (baseVal === 0 && keys.some(k => k.toLowerCase().includes('energy') || k.toLowerCase().includes('calorie'))) {
            const p = food.protein_g || 0;
            const c = food.carbs_g || 0;
            const f = food.fat_g || 0;
            if (p > 0 || c > 0 || f > 0) {
                const kcal = (p * 4) + (c * 4) + (f * 9);
                baseVal = energyUnit === 'kJ' ? kcal * 4.184 : kcal;
            }
        }

        return (baseVal * grams) / 100;
    };

    // Calculate all macros and micros at current gram amount
    const nutrition = useMemo(() => {
        if (!food) return null;

        const m = food.micronutrients || {};
        const eV = getValForCustomGrams(['Energy', 'Calories', 'calories'], macroGrams);
        const pV = getValForCustomGrams(['protein_g'], macroGrams);
        const cV = getValForCustomGrams(['carbs_g'], macroGrams);
        const fV = getValForCustomGrams(['fat_g'], macroGrams);

        const pR = userRDAs?.['Protein'] || 50;
        const cR = userRDAs?.['Carbs'] || 250;
        const fR = userRDAs?.['Fat'] || 70;

        const pP = Math.min(Math.round((pV / pR) * 100), 100);
        const cP = Math.min(Math.round((cV / cR) * 100), 100);
        const fP = Math.min(Math.round((fV / fR) * 100), 100);

        // Amino acids
        const aminoAcids = [
            'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine',
            'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'
        ];

        // Carb breakdown
        const carbBreakdown = {
            starch: getValForCustomGrams(['Starch', 'starch_g'], macroGrams),
            fiber: getValForCustomGrams(['Fiber', 'fiber_g'], macroGrams),
            sugar: getValForCustomGrams(['Sugars', 'sugars_g'], macroGrams),
        };

        // Fat breakdown
        const fatBreakdown = {
            saturated: getValForCustomGrams(['Saturated Fat'], macroGrams),
            monounsaturated: getValForCustomGrams(['Monounsaturated Fat'], macroGrams),
            polyunsaturated: getValForCustomGrams(['Polyunsaturated Fat'], macroGrams),
            omega3: getValForCustomGrams(['Omega-3'], macroGrams),
            omega6: getValForCustomGrams(['Omega-6'], macroGrams),
            cholesterol: getValForCustomGrams(['Cholesterol'], macroGrams),
        };

        // Micronutrients
        const electrolytes = [
            { label: 'Sodium', keys: ['Sodium'], rda: 2300 },
            { label: 'Potassium', keys: ['Potassium'], rda: 3500 },
            { label: 'Calcium', keys: ['Calcium'], rda: 1000 },
            { label: 'Magnesium', keys: ['Magnesium'], rda: 400 },
        ].map(({ label, keys, rda }) => {
            const val = getValForCustomGrams(keys, macroGrams);
            return { label, val, pct: Math.round((val / rda) * 100) };
        });

        const trace = [
            { label: 'Iron', keys: ['Iron'], rda: 18 },
            { label: 'Zinc', keys: ['Zinc'], rda: 11 },
            { label: 'Copper', keys: ['Copper'], rda: 0.9 },
            { label: 'Manganese', keys: ['Manganese'], rda: 2.3 },
            { label: 'Iodine', keys: ['Iodine'], rda: 0.15 },
            { label: 'Selenium', keys: ['Selenium'], rda: 0.055 },
        ].map(({ label, keys, rda }) => {
            const val = getValForCustomGrams(keys, macroGrams);
            return { label, val, pct: Math.round((val / rda) * 100) };
        });

        const waterSoluble = [
            { label: 'B1', fullName: 'Thiamine', subtitle: 'Carb metabolism', keys: ['Thiamine', 'Vitamin B1'], rda: 1.2 },
            { label: 'B2', fullName: 'Riboflavin', subtitle: 'Energy production', keys: ['Riboflavin', 'Vitamin B2'], rda: 1.3 },
            { label: 'B3', fullName: 'Niacin', subtitle: 'DNA repair', keys: ['Niacin', 'Vitamin B3'], rda: 16 },
            { label: 'B5', fullName: 'Pantothenic Acid', subtitle: 'Hormone synthesis', keys: ['Pantothenic Acid', 'Vitamin B5'], rda: 5 },
            { label: 'B6', fullName: 'Pyridoxine', subtitle: 'Brain development', keys: ['Pyridoxine', 'Vitamin B6'], rda: 1.7 },
            { label: 'B7', fullName: 'Biotin', subtitle: 'Hair & nail health', keys: ['Biotin', 'Vitamin B7'], rda: 0.03 },
            { label: 'B9', fullName: 'Folate', subtitle: 'Cell division', keys: ['Folate', 'Vitamin B9'], rda: 0.4 },
            { label: 'B12', fullName: 'Cobalamin', subtitle: 'Nerve function', keys: ['Cobalamin', 'Vitamin B12'], rda: 0.0024 },
            { label: 'C', fullName: 'Ascorbic Acid', subtitle: 'Immune & collagen', keys: ['Ascorbic Acid', 'Vitamin C'], rda: 90 },
        ].map(({ label, fullName, subtitle, keys, rda }) => {
            const val = getValForCustomGrams(keys, macroGrams);
            return { label, fullName, subtitle, val, pct: Math.round((val / rda) * 100) };
        });

        const fatSoluble = [
            { label: 'A', fullName: 'Retinol', subtitle: 'Vision & immunity', keys: ['Retinol', 'Vitamin A'], rda: 0.9 },
            { label: 'D', fullName: 'Calciferol', subtitle: 'Bone & immune', keys: ['Calciferol', 'Vitamin D'], rda: 0.02 },
            { label: 'E', fullName: 'Tocopherol', subtitle: 'Antioxidant', keys: ['Tocopherol', 'Vitamin E'], rda: 15 },
            { label: 'K', fullName: 'Phylloquinone', subtitle: 'Blood clotting', keys: ['Phylloquinone', 'Vitamin K'], rda: 0.12 },
        ].map(({ label, fullName, subtitle, keys, rda }) => {
            const val = getValForCustomGrams(keys, macroGrams);
            return { label, fullName, subtitle, val, pct: Math.round((val / rda) * 100) };
        });

        const cholineVal = getValForCustomGrams(['Choline'], macroGrams);

        return {
            energy: { value: eV, percent: 0 },
            protein: { value: pV, percent: pP, rda: pR },
            carbs: { value: cV, percent: cP, rda: cR },
            fat: { value: fV, percent: fP, rda: fR },
            aminoAcids: aminoAcids.map(aa => ({
                name: aa,
                value: getValForCustomGrams([aa, `${aa.toLowerCase()}_g`], macroGrams),
            })),
            carbBreakdown,
            fatBreakdown,
            micronutrients: {
                electrolytes,
                trace,
                waterSoluble,
                fatSoluble,
                choline: { label: 'Choline', val: cholineVal, pct: Math.round((cholineVal / 550) * 100) },
            },
        };
    }, [food, macroGrams, energyUnit, userRDAs]);

    return {
        macroGrams,
        setMacroGrams,
        nutrition,
        getVal,
        getValForCustomGrams,
    };
}
