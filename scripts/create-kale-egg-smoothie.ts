
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createKaleEggSmoothie() {
    console.log('Creating Kale & Egg Smoothie recipe...\n');

    // 1. Get food items
    const { data: kale } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', 'Kale, Raw')
        .single();

    const { data: egg } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', 'Egg, Raw')
        .single();

    if (!kale || !egg) {
        console.error('Missing food items!');
        return;
    }

    // 2. Get measures
    const { data: kaleMeasure } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', kale.id)
        .eq('label', 'cup, chopped')
        .single();

    const { data: eggMeasure } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', egg.id)
        .eq('label', 'large')
        .single();

    // Recipe: 1 cup kale (67g) + 1 large egg (50g)
    const kaleWeight = kaleMeasure.weight_g; // 67g
    const eggWeight = eggMeasure.weight_g;   // 50g

    // Calculate nutrition
    const kaleRatio = kaleWeight / 100;
    const eggRatio = eggWeight / 100;

    const totalCalories = (kale.energy_kcal * kaleRatio) + (egg.energy_kcal * eggRatio);
    const totalProtein = (kale.protein_g * kaleRatio) + (egg.protein_g * eggRatio);
    const totalCarbs = (kale.carbs_g * kaleRatio) + (egg.carbs_g * eggRatio);
    const totalFat = (kale.fat_g * kaleRatio) + (egg.fat_g * eggRatio);

    console.log('=== CALCULATED NUTRITION ===');
    console.log(`Kale (1 cup, ${kaleWeight}g):`);
    console.log(`  ${(kale.energy_kcal * kaleRatio).toFixed(2)} kcal, ${(kale.protein_g * kaleRatio).toFixed(2)}g protein, ${(kale.carbs_g * kaleRatio).toFixed(2)}g carbs, ${(kale.fat_g * kaleRatio).toFixed(2)}g fat`);
    console.log(`Egg (1 large, ${eggWeight}g):`);
    console.log(`  ${(egg.energy_kcal * eggRatio).toFixed(2)} kcal, ${(egg.protein_g * eggRatio).toFixed(2)}g protein, ${(egg.carbs_g * eggRatio).toFixed(2)}g carbs, ${(egg.fat_g * eggRatio).toFixed(2)}g fat`);
    console.log(`\nTOTAL:`);
    console.log(`  Calories: ${totalCalories.toFixed(2)} kcal`);
    console.log(`  Protein: ${totalProtein.toFixed(2)}g`);
    console.log(`  Carbs: ${totalCarbs.toFixed(2)}g`);
    console.log(`  Fat: ${totalFat.toFixed(2)}g\n`);

    // 3. Create recipe
    const RECIPE_ID = 'kale-egg-smoothie';
    const IMAGE_URL = 'https://qvbfdqxrvrbjorwiaksn.supabase.co/storage/v1/object/public/recipes/green-smoothie.png';

    const { error: recipeError } = await supabase
        .from('recipes')
        .insert({
            id: RECIPE_ID,
            title: 'Kale & Egg Power Smoothie',
            type: 'breakfast',
            calories: totalCalories,
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            diet: ['vegetarian', 'anything'],
            image: IMAGE_URL,
            prep_time: 5
        });

    if (recipeError) {
        console.error('Error creating recipe:', recipeError);
        return;
    }

    console.log('✅ Recipe created!');

    // 4. Add ingredients (linked to food database)
    const ingredients = [
        {
            recipe_id: RECIPE_ID,
            item: 'Kale, Raw',
            amount: '1 cup, chopped',
            is_miracle_product: false,
            food_item_id: kale.id,
            measure_label: 'cup, chopped',
            quantity: 1,
            weight_g: kaleWeight
        },
        {
            recipe_id: RECIPE_ID,
            item: 'Egg, Raw',
            amount: '1 large',
            is_miracle_product: false,
            food_item_id: egg.id,
            measure_label: 'large',
            quantity: 1,
            weight_g: eggWeight
        }
    ];

    const { error: ingError } = await supabase
        .from('ingredients')
        .insert(ingredients);

    if (ingError) {
        console.error('Error adding ingredients:', ingError);
        return;
    }

    console.log('✅ Ingredients linked to food database!');

    // 5. Add instructions
    const instructions = [
        { recipe_id: RECIPE_ID, step_order: 1, step_text: 'Crack egg into blender.' },
        { recipe_id: RECIPE_ID, step_order: 2, step_text: 'Add chopped kale.' },
        { recipe_id: RECIPE_ID, step_order: 3, step_text: 'Add 1/2 cup water or almond milk (optional).' },
        { recipe_id: RECIPE_ID, step_order: 4, step_text: 'Blend until smooth.' }
    ];

    const { error: instError } = await supabase
        .from('instructions')
        .insert(instructions);

    if (instError) {
        console.error('Error adding instructions:', instError);
        return;
    }

    console.log('✅ Instructions added!');
    console.log('\n🎉 Kale & Egg Power Smoothie created successfully!');
    console.log('   This recipe will calculate nutrition DYNAMICALLY from the food database.');
}

createKaleEggSmoothie().catch(console.error);
