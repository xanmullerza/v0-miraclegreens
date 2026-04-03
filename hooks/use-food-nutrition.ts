import { useState, useMemo } from 'react';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';

interface UseFoodNutritionProps {
    food: any;
    selectedPortion: any;
    amount: number;
    energyUnit: string;
    userRDAs?: Record<string, number>;
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
