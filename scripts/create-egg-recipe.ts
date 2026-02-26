
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEggRecipe() {
    console.log('Fetching "Egg, Raw" from food database...');

    // 1. Get the food item
    const { data: foodItem, error: foodError } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', 'Egg, Raw')
        .single();

    if (foodError || !foodItem) {
        console.error('Error fetching food item:', foodError);
        return;
    }

    console.log(`Found: ${foodItem.name}`);

    // 2. Get the "large" measure
    const { data: measure, error: measureError } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', foodItem.id)
        .eq('label', 'large')
        .single();

    if (measureError || !measure) {
        console.error('Error fetching measure:', measureError);
        return;
    }

    console.log(`Measure: 1 ${measure.label} = ${measure.weight_g}g`);

    // 3. Calculate nutrition for 1 large egg
    const weight_g = measure.weight_g; // 50g
    const ratio = weight_g / 100; // 0.5

    const calories = Math.round(foodItem.energy_kcal * ratio);
    const protein = Math.round(foodItem.protein_g * ratio);
    const carbs = Math.round(foodItem.carbs_g * ratio);
    const fat = Math.round(foodItem.fat_g * ratio);

    console.log('\nCalculated Nutrition (1 large egg):');
    console.log(`  Calories: ${calories} kcal`);
    console.log(`  Protein: ${protein}g`);
    console.log(`  Carbs: ${carbs}g`);
    console.log(`  Fat: ${fat}g`);

    // 4. Create the recipe
    const RECIPE_ID = 'egg-raw-1';
    const IMAGE_URL = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/keto-eggs.png';

    console.log('\nCreating recipe...');
    const { error: recipeError } = await supabase
        .from('recipes')
        .insert({
            id: RECIPE_ID,
            title: 'Raw Egg (1 Large)',
            type: 'breakfast',
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            diet: ['anything', 'vegetarian'], // Available for both
            image: IMAGE_URL,
            prep_time: 0
        });

    if (recipeError) {
        console.error('Error creating recipe:', recipeError);
        return;
    }

    console.log('Recipe created!');

    // 5. Link the ingredient to the food database
    const { error: ingredientError } = await supabase
        .from('ingredients')
        .insert({
            recipe_id: RECIPE_ID,
            item: 'Egg, Raw',
            amount: '1 large',
            is_miracle_product: false,
            food_item_id: foodItem.id, // Link to food database
            measure_label: 'large',
            quantity: 1,
            weight_g: weight_g
        });

    if (ingredientError) {
        console.error('Error linking ingredient:', ingredientError);
        return;
    }

    console.log('Ingredient linked to food database!');

    // 6. Add instruction
    const { error: instructionError } = await supabase
        .from('instructions')
        .insert({
            recipe_id: RECIPE_ID,
            step_order: 1,
            step_text: 'Crack egg into a bowl and consume raw (if desired).'
        });

    if (instructionError) {
        console.error('Error adding instruction:', instructionError);
        return;
    }

    console.log('\n✅ Recipe "Raw Egg (1 Large)" created successfully with verified nutrition data!');
}

createEggRecipe().catch(console.error);
