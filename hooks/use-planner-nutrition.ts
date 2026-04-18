import { useMemo } from 'react';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';

interface UsePlannerNutritionProps {
    plan: any;
    energyUnit: string;
    userRDAs?: Record<string, number> | null;
    nutrientDisplayMode?: string;
    selectedServings?: number;
}

export function usePlannerNutrition({
    plan,
    energyUnit,
    userRDAs = {},
    nutrientDisplayMode = 'both',
    selectedServings = 1,
}: UsePlannerNutritionProps) {
    const nutrition = useMemo(() => {
        if (!plan) return null;

        // Aggregate nutrition from all meals
        const mealsArray = [];
        if (plan.breakfast && typeof plan.breakfast === 'object') mealsArray.push(plan.breakfast);
        if (plan.lunch && typeof plan.lunch === 'object') mealsArray.push(plan.lunch);
        if (plan.dinner && typeof plan.dinner === 'object') mealsArray.push(plan.dinner);
        if (plan.snacks && Array.isArray(plan.snacks)) {
            plan.snacks.forEach((snack: any) => {
                if (snack && typeof snack === 'object') mealsArray.push(snack);
            });
        }

        // Calculate totals from individual items (more reliable than summary object)
        const totals = mealsArray.reduce(
            (acc: any, recipe: any) => {
                acc.calories += (recipe.calories || 0) * selectedServings;
                acc.energy_kj += (recipe.energy_kj || 0) * selectedServings;
                acc.protein += (recipe.protein || 0) * selectedServings;
                acc.fat += (recipe.fat || 0) * selectedServings;
                acc.carbs += (recipe.carbs || 0) * selectedServings;

                Object.entries(recipe.micronutrients || {}).forEach(([key, val]) => {
                    acc.micronutrients[key] = (acc.micronutrients[key] || 0) + (val as number) * selectedServings;
                });

                Object.entries(recipe.phytonutrients || {}).forEach(([key, val]) => {
                    // Accumulate rather than overwrite
                    if (typeof val === 'string') {
                        acc.phytonutrients[key] = val;
                    } else if (val && typeof val === 'object') {
                         acc.phytonutrients[key] = val;
                    }
                });

                return acc;
            },
            { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {}, phytonutrients: {} }
        );

        const micro = totals.micronutrients || {};

        // Helper to find nutrient value by multiple possible keys
        const findByKeys = (keys: string[]): number => {
            for (const k of keys) {
                if (micro[k] !== undefined) return micro[k];
            }
            const firstMatch = findNutrientMatch(micro, keys[0]);
            if (firstMatch && micro[firstMatch] !== undefined) return micro[firstMatch];
            return 0;
        };

        // Macros
        const eV = totals.calories;
        const pV = totals.protein;
        const cV = totals.carbs;
        const fV = totals.fat;

        const pR = userRDAs?.['Protein'] || 50;
        const cR = userRDAs?.['Carbs'] || 250;
        const fR = userRDAs?.['Fat'] || 70;
        const eR = userRDAs?.['Energy'] || 2000;

        const pP = Math.min(Math.round((pV / pR) * 100), 150); // Allow over 100%
        const cP = Math.min(Math.round((cV / cR) * 100), 150);
        const fP = Math.min(Math.round((fV / fR) * 100), 150);
        const eP = Math.min(Math.round(((energyUnit === 'kJ' ? totals.energy_kj : totals.calories) / eR) * 100), 150);

        // Amino acids
        const aminoAcids = [
            'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine',
            'Phenylalanine', 'Threonine', 'Tryptophan', 'Valine'
        ];

        // Carb breakdown
        const carbBreakdown = {
            starch: findByKeys(['Starch', 'starch_g']),
            fiber: findByKeys(['Fiber', 'fiber_g']),
            sugar: findByKeys(['Sugars', 'sugars_g']),
        };

        // Fat breakdown
        const fatBreakdown = {
            saturated: findByKeys(['Saturated Fat']),
            monounsaturated: findByKeys(['Monounsaturated Fat']),
            polyunsaturated: findByKeys(['Polyunsaturated Fat']),
            omega3: findByKeys(['Omega-3']),
            omega6: findByKeys(['Omega-6']),
            cholesterol: findByKeys(['Cholesterol']),
        };

        // Micronutrients
        const elData = [
            { l: 'Sodium', k: ['Sodium', 'sodium_mg'] },
            { l: 'Potassium', k: ['Potassium', 'potassium_mg'] },
            { l: 'Magnesium', k: ['Magnesium', 'magnesium_mg'] },
            { l: 'Calcium', k: ['Calcium', 'calcium_mg'] },
            { l: 'Phosphorus', k: ['Phosphorus', 'phosphorus_mg'] },
        ].map(({ l, k }) => {
            const v = findByKeys(k);
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
            const v = findByKeys(k);
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
        ].map(({ l, fn, sub }) => {
            const v = findByKeys([l]);
            const r = userRDAs?.[l] || 0;
            return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const stData = [
            { l: 'Vitamin A', fn: 'Vitamin A', sub: 'Retinol' },
            { l: 'Vitamin D', fn: 'Vitamin D', sub: 'Calciferol' },
            { l: 'Vitamin E', fn: 'Vitamin E', sub: 'Tocopherol' },
            { l: 'Vitamin K', fn: 'Vitamin K', sub: 'Phylloquinone' },
        ].map(({ l, fn, sub }) => {
            const v = findByKeys([l]);
            const r = userRDAs?.[l] || 0;
            return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
        });

        const cholineVal = findByKeys(['Choline', 'choline_mg']);
        const cholineRDA = userRDAs?.['Choline'] || 0;
        const cholineData = { label: 'Choline', val: cholineVal, pct: cholineRDA > 0 ? Math.round((cholineVal / cholineRDA) * 100) : 0 };

        const finalEnergyValue = energyUnit === 'kJ' ? totals.energy_kj : totals.calories;

        return {
            energy: { value: finalEnergyValue, percent: eP },
            protein: { value: pV, percent: pP, rda: pR },
            carbs: { value: cV, percent: cP, rda: cR },
            fat: { value: fV, percent: fP, rda: fR },
            aminoAcids: aminoAcids.map(aa => ({
                name: aa,
                value: findByKeys([aa, `${aa.toLowerCase()}_g`]),
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
            phytonutrients: totals.phytonutrients,
        };
    }, [plan, energyUnit, userRDAs, selectedServings]);

    return nutrition;
}
