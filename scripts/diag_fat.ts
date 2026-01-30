
import { supabase } from '../lib/supabase';
import { calculateRecipeNutrition, calculateNutrition } from '../lib/utils/nutrition-calculator';

async function test() {
    const recipeId = '1769600509377';
    console.log('Testing Recipe ID:', recipeId);

    const { data: recipe } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

    if (!recipe) {
        console.log('Recipe not found');
        return;
    }

    const { data: ingredients } = await supabase
        .from('ingredients')
        .select('*, food_item:food_items(*)')
        .eq('recipe_id', recipeId);

    if (!ingredients || ingredients.length === 0) {
        console.log('No ingredients found');
        return;
    }

    console.log(`\n--- RECIPE: ${recipe.title} ---`);
    console.log(`Stored Macros: Fat=${recipe.fat}g, Carbs=${recipe.carbs}g, Protein=${recipe.protein}g`);

    let summedFat = 0;
    const fatMicros: Record<string, number> = {
        'Saturated Fat': 0,
        'Monounsaturated Fat': 0,
        'Polyunsaturated Fat': 0,
        'Trans Fat': 0,
        'Omega-3': 0,
        'Omega-6': 0,
        'Cholesterol': 0
    };

    ingredients.forEach((ing: any) => {
        const nutr = calculateNutrition(ing.food_item, ing.weight_g || 0);
        console.log(`\nIngredient: ${ing.food_item.name} (${ing.weight_g}g)`);
        console.log(`  Fat Macro: ${nutr.fat}g`);

        summedFat += nutr.fat;

        const m = nutr.micronutrients || {};
        // Standardized matching used in the app
        const getStandardized = (target: string) => {
            for (const [key, val] of Object.entries(m)) {
                // Approximate what findNutrientMatch would do
                const kL = key.toLowerCase();
                const tL = target.toLowerCase();
                if (kL === tL) return val;
                if (kL.includes(tL.split(' ')[0]) && kL.includes('fat') && tL.includes('fat')) return val;
            }
            return 0;
        };

        const sat = m['Saturated Fat'] || 0;
        const mono = m['Monounsaturated Fat'] || 0;
        const poly = m['Polyunsaturated Fat'] || 0;
        const trans = m['Trans Fat'] || 0;
        const o3 = m['Omega-3'] || 0;
        const o6 = m['Omega-6'] || 0;
        const chol = m['Cholesterol'] || 0;

        console.log(`  Breakdown: Sat=${sat.toFixed(3)}, Mono=${mono.toFixed(3)}, Poly=${poly.toFixed(3)}, O3=${o3.toFixed(3)}, O6=${o6.toFixed(3)}, Trans=${trans.toFixed(3)}, Chol=${chol.toFixed(1)}mg`);

        fatMicros['Saturated Fat'] += sat;
        fatMicros['Monounsaturated Fat'] += mono;
        fatMicros['Polyunsaturated Fat'] += poly;
        fatMicros['Trans Fat'] += trans;
        fatMicros['Omega-3'] += o3;
        fatMicros['Omega-6'] += o6;
        fatMicros['Cholesterol'] += chol;
    });

    console.log(`\n--- FINAL SUMMED TOTALS ---`);
    console.log(`Fat Macro Sum: ${summedFat.toFixed(1)}g`);
    Object.entries(fatMicros).forEach(([k, v]) => {
        console.log(`${k}: ${v.toFixed(3)} ${k === 'Cholesterol' ? 'mg' : 'g'}`);
    });

    // Run the actual app calculation logic
    const finalNutr = calculateRecipeNutrition(ingredients.map((ing: any) => ({
        food_item: ing.food_item,
        weight_g: ing.weight_g || 0
    })));

    console.log(`\n--- ACTUAL CALCULATOR OUTPUT (JSONB) ---`);
    const finalM = finalNutr.micronutrients || {};
    Object.keys(finalM).filter(k => k.includes('Fat') || k.includes('Omega') || k.includes('Cholesterol')).sort().forEach(k => {
        console.log(`${k}: ${finalM[k]}`);
    });
}
test();
