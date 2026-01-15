
import { createClient } from '@supabase/supabase-js';
import { RECIPES } from '../lib/data/recipes';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRecipes() {
    console.log(`Starting seed of ${RECIPES.length} recipes...`);

    for (const recipe of RECIPES) {
        console.log(`Processing recipe: ${recipe.title}`);

        // 1. Insert Recipe
        const { error: recipeError } = await supabase
            .from('recipes')
            .upsert({
                id: recipe.id,
                title: recipe.title,
                type: recipe.type,
                calories: recipe.calories,
                protein: recipe.protein,
                carbs: recipe.carbs,
                fat: recipe.fat,
                diet: recipe.diet,
                image: recipe.image,
                prep_time: recipe.prepTime
            });

        if (recipeError) {
            console.error(`Error inserting recipe ${recipe.id}:`, recipeError);
            continue;
        }

        // 2. Insert Ingredients
        // First delete existing to avoid duplicates on re-run
        await supabase.from('ingredients').delete().eq('recipe_id', recipe.id);

        const ingredientsData = recipe.ingredients.map(ing => ({
            recipe_id: recipe.id,
            item: ing.item,
            amount: ing.amount,
            is_miracle_product: ing.isMiracleProduct || false
        }));

        const { error: ingError } = await supabase
            .from('ingredients')
            .insert(ingredientsData);

        if (ingError) {
            console.error(`Error inserting ingredients for ${recipe.id}:`, ingError);
        }

        // 3. Insert Instructions
        // First delete existing
        await supabase.from('instructions').delete().eq('recipe_id', recipe.id);

        const instructionsData = recipe.instructions.map((step, index) => ({
            recipe_id: recipe.id,
            step_text: step,
            step_order: index + 1
        }));

        const { error: instError } = await supabase
            .from('instructions')
            .insert(instructionsData);

        if (instError) {
            console.error(`Error inserting instructions for ${recipe.id}:`, instError);
        }
    }

    console.log('Seeding complete!');
    process.exit(0); // Add explicit exit
}

seedRecipes().catch(e => {
    console.error(e);
    process.exit(1);
});
