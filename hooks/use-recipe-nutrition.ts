import { useMemo } from 'react';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';

interface UseRecipeNutritionProps {
    recipe: any;
    viewMode: 'per-recipe' | 'per-serving';
    energyUnit: string;
    userRDAs?: Record<string, number> | null;
    nutrientDisplayMode?: string;
}

export function useRecipeNutrition({
    recipe,
    viewMode = 'per-recipe',
    energyUnit,
    userRDAs = {},
    nutrientDisplayMode = 'both',
}: UseRecipeNutritionProps) {
    const nutrition = useMemo(() => {
        if (!recipe) return null;

        const s = Math.max(recipe.servings || 1, 1);
        const sf = viewMode === 'per-serving' ? 1 / s : 1;
        const m = recipe.micronutrients || {};

        // Helper to find nutrient value by multiple possible keys
        const findByKeys = (keys: string[]): number => {
            for (const k of keys) {
                if (m[k] !== undefined) return m[k];
            }
            const firstMatch = findNutrientMatch(m, keys[0]);
            if (firstMatch && m[firstMatch] !== undefined) return m[firstMatch];
            return 0;
        };

        // Macros
        const eV = (energyUnit === 'kJ' ? (recipe.energy_kj || (recipe.calories || 0) * 4.184) : (recipe.calories || 0)) * sf;
        const pV = (recipe.protein || 0) * sf;
        const cV = (recipe.carbs || 0) * sf;
        const fV = (recipe.fat || 0) * sf;

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
            starch: findByKeys(['Starch', 'starch_g']) * sf,
            fiber: findByKeys(['Fiber', 'fiber_g']) * sf,
            sugar: findByKeys(['Sugars', 'sugars_g']) * sf,
        };

        // Fat breakdown
        const fatBreakdown = {
            saturated: findByKeys(['Saturated Fat']) * sf,
            monounsaturated: findByKeys(['Monounsaturated Fat']) * sf,
            polyunsaturated: findByKeys(['Polyunsaturated Fat']) * sf,
            omega3: findByKeys(['Omega-3']) * sf,
            omega6: findByKeys(['Omega-6']) * sf,
            cholesterol: findByKeys(['Cholesterol']) * sf,
        };

        // Micronutrients
        const elData = [
            { l: 'Sodium', k: ['Sodium', 'sodium_mg'] },
            { l: 'Potassium', k: ['Potassium', 'potassium_mg'] },
            { l: 'Magnesium', k: ['Magnesium', 'magnesium_mg'] },
            { l: 'Calcium', k: ['Calcium', 'calcium_mg'] },
            { l: 'Phosphorus', k: ['Phosphorus', 'phosphorus_mg'] },
        ].map(({ l, k }) => {
            const v = findByKeys(k) * sf;
            const r = userRDAs?.[l] || 0;
            return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const trData = [
            { l: 'Iron', k: ['Iron', 'iron_mg'] },
            { l: 'Zinc', k: ['Zinc', 'zinc_mg'] },
            { l: 'Copper', k: ['Copper', 'copper_mg'] },
            { l: 'Manganese', k: ['Manganese', 'manganese_mg'] },
            { l: 'Selenium', k: ['Selenium', 'selenium_ug'] },
        ].map(({ l, k }) => {
            const v = findByKeys(k) * sf;
            const r = userRDAs?.[l] || 0;
            return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const wsData = [
            { l: 'B1 (Thiamine)', fn: 'Vitamin B1', sub: 'Thiamine' },
            { l: 'B2 (Riboflavin)', fn: 'Vitamin B2', sub: 'Riboflavin' },
            { l: 'B3 (Niacin)', fn: 'Vitamin B3', sub: 'Niacin' },
            { l: 'B5 (Pantothenic Acid)', fn: 'Vitamin B5', sub: 'Pantothenic Acid' },
            { l: 'B6 (Pyridoxine)', fn: 'Vitamin B6', sub: 'Pyridoxine' },
            { l: 'B9 (Folate)', fn: 'Vitamin B9', sub: 'Folate' },
            { l: 'B12 (Cobalamin)', fn: 'Vitamin B12', sub: 'Cobalamin' },
            { l: 'C', fn: 'Ascorbic Acid', sub: 'Immune & collagen' },
        ].map(({ l, fn, sub }) => {
            const keys = l === 'C' ? ['Vitamin C', 'vitamin_c_mg', 'Ascorbic Acid'] : [l];
            const v = findByKeys(keys) * sf;
            const r = userRDAs?.[l === 'C' ? 'Vitamin C' : l] || 0;
            return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const stData = [
            { l: 'Vitamin A', fn: 'Vitamin A', sub: 'Retinol' },
            { l: 'Vitamin D', fn: 'Vitamin D', sub: 'Calciferol' },
            { l: 'Vitamin E', fn: 'Vitamin E', sub: 'Tocopherol' },
            { l: 'Vitamin K', fn: 'Vitamin K', sub: 'Phylloquinone' },
        ].map(({ l, fn, sub }) => {
            const v = findByKeys([l]) * sf;
            const r = userRDAs?.[l] || 0;
            return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const cholineVal = findByKeys(['Choline', 'choline_mg']) * sf;
        const cholineRDA = userRDAs?.['Choline'] || 0;
        const cholineData = { label: 'Choline', val: cholineVal, pct: cholineRDA > 0 ? Math.round((cholineVal / cholineRDA) * 100) : 0 };

        return {
            servings: s,
            viewMode,
            scaleFactor: sf,
            energy: { value: eV, percent: 0 },
            protein: { value: pV, percent: pP, rda: pR },
            carbs: { value: cV, percent: cP, rda: cR },
            fat: { value: fV, percent: fP, rda: fR },
            aminoAcids: aminoAcids.map(aa => ({
                name: aa,
                value: findByKeys([aa, `${aa.toLowerCase()}_g`]) * sf,
            })),
            carbBreakdown,
            fatBreakdown,
            micronutrients: {
                electrolytes: elData,
                trace: trData,
                waterSoluble: wsData,
                fatSoluble: stData,
                choline: cholineData,
            },
        };
    }, [recipe, viewMode, energyUnit, userRDAs]);

    return nutrition;
}
