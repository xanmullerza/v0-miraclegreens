
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

async function updateEggRecipePrecise() {
    console.log('Fetching "Egg, Raw" from food database...');

    const { data: foodItem, error: foodError } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', 'Egg, Raw')
        .single();

    if (foodError || !foodItem) {
        console.error('Error fetching food item:', foodError);
        return;
    }

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

    // Calculate with FULL precision (no rounding)
    const weight_g = measure.weight_g; // 50g
    const ratio = weight_g / 100; // 0.5

    const calories = foodItem.energy_kcal * ratio; // 77.5
    const protein = foodItem.protein_g * ratio;   // 6.29
    const carbs = foodItem.carbs_g * ratio;       // 0.56
    const fat = foodItem.fat_g * ratio;           // 5.305

    console.log('\nPrecise Nutrition (1 large egg, NO rounding):');
    console.log(`  Calories: ${calories} kcal`);
    console.log(`  Protein: ${protein}g`);
    console.log(`  Carbs: ${carbs}g`);
    console.log(`  Fat: ${fat}g`);

    // Update the recipe with precise values
    console.log('\nUpdating recipe with precise values...');
    const { error: updateError } = await supabase
        .from('recipes')
        .update({
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat
        })
        .eq('id', 'egg-raw-1');

    if (updateError) {
        console.error('Error updating recipe:', updateError);
        return;
    }

    console.log('\n✅ Recipe updated with PRECISE values (no rounding)!');
    console.log('   The app will now show these exact decimal values.');
}

updateEggRecipePrecise().catch(console.error);
