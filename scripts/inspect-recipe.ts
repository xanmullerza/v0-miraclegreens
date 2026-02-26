
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectRecipe() {
    console.log('--- Inspecting Recipe: Cream Cheese and Tomato Toast ---');

    // 1. Get Recipe
    const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .ilike('title', '%cream cheese%')
        .single();

    if (recipeError || !recipe) {
        console.error('Error fetching recipe:', recipeError?.message || 'Not found');
        return;
    }

    console.log('\n[Recipe Details]');
    console.log(JSON.stringify(recipe, null, 2));

    // 2. Get Ingredients
    const { data: ingredients, error: ingError } = await supabase
        .from('ingredients')
        .select('*, food_items(*)')
        .eq('recipe_id', recipe.id);

    if (ingError) {
        console.error('Error fetching ingredients:', ingError.message);
        return;
    }

    console.log('\n[Ingredients & Nutritional Sources]');
    ingredients.forEach((ing: any, idx: number) => {
        console.log(`\nIngredient #${idx + 1}: ${ing.item}`);
        console.log(`- Amount: ${ing.amount} (${ing.weight_g}g)`);
        console.log(`- Food Item: ${ing.food_items?.name || 'NOT MATCHED'}`);
        if (ing.food_items) {
            console.log(`- Food Item Energy: ${ing.food_items.energy_kcal}kcal / ${ing.food_items.energy_kj}kJ`);
            console.log(`- Food Item Macros: P:${ing.food_items.protein_g}g, C:${ing.food_items.carbs_g}g, F:${ing.food_items.fat_g}g`);
        }
    });

    // 3. Check for anomalies
    const totalMacros = ingredients.reduce((acc: any, ing: any) => {
        if (!ing.food_items || !ing.weight_g) return acc;
        const ratio = ing.weight_g / 100;
        acc.kcal += (ing.food_items.energy_kcal || 0) * ratio;
        acc.kj += (ing.food_items.energy_kj || 0) * ratio;
        acc.protein += (ing.food_items.protein_g || 0) * ratio;
        acc.carbs += (ing.food_items.carbs_g || 0) * ratio;
        acc.fat += (ing.food_items.fat_g || 0) * ratio;
        return acc;
    }, { kcal: 0, kj: 0, protein: 0, carbs: 0, fat: 0 });

    console.log('\n[Recalculated Totals (Bulk)]');
    console.log(JSON.stringify(totalMacros, null, 2));

    const perServing = {
        kcal: Math.round(totalMacros.kcal / recipe.servings),
        kj: Math.round(totalMacros.kj / recipe.servings),
        protein: Math.round(totalMacros.protein / recipe.servings),
        carbs: Math.round(totalMacros.carbs / recipe.servings),
        fat: Math.round(totalMacros.fat / recipe.servings),
    };

    console.log('\n[Calculated Per Serving (vs DB)]');
    console.log('Calculated:', perServing);
    console.log('DB Values: ', {
        kcal: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat
    });

    if (perServing.kcal !== recipe.calories || perServing.protein !== recipe.protein) {
        console.warn('\n⚠️ ANOMALY DETECTED: DB values do not match recalculation!');
    } else {
        console.log('\n✅ Data consistency check passed.');
    }
}

inspectRecipe();
