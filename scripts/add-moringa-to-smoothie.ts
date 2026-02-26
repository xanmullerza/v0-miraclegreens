
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

async function addMoringaToSmoothie() {
    console.log('Adding Moringa Powder to Kale & Egg Smoothie...\n');

    const RECIPE_ID = 'kale-egg-smoothie';

    // 1. Get Moringa food item
    const { data: moringa } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', 'Moringa Powder')
        .single();

    if (!moringa) {
        console.error('Moringa Powder not found in food_items table!');
        return;
    }

    // 2. Get measure for 'tsp'
    const { data: measure } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', moringa.id)
        .eq('label', 'tsp')
        .single();

    if (!measure) {
        console.error('Measure "tsp" not found for Moringa Powder!');
        return;
    }

    // 3. Add to ingredients table
    const ingredient = {
        recipe_id: RECIPE_ID,
        item: 'Moringa Powder',
        base_ingredient: 'Moringa Powder', // Buying base form
        amount: '1 tsp',
        is_miracle_product: true,          // It's the miracle product!
        food_item_id: moringa.id,
        measure_label: 'tsp',
        quantity: 1,
        weight_g: measure.weight_g         // 2.0g
    };

    const { error } = await supabase
        .from('ingredients')
        .insert(ingredient);

    if (error) {
        console.error('Error adding ingredient:', error);
        return;
    }

    // 4. Update instructions to mention adding powder
    const { error: instructionError } = await supabase
        .from('instructions')
        .update({ step_text: 'Add chopped kale and moringa powder.' })
        .eq('recipe_id', RECIPE_ID)
        .eq('step_order', 2);

    if (instructionError) {
        console.error('Error updating instruction:', instructionError);
    }

    console.log('✅ Added 1 tsp Moringa Powder (2g) to recipe!');
    console.log('   Expected nutrition boost:');
    console.log(`   + ${(moringa.energy_kcal * 0.02).toFixed(2)} kcal`);
    console.log(`   + ${(moringa.protein_g * 0.02).toFixed(2)}g protein`);
    console.log(`   + ${(moringa.micronutrients.calcium_mg * 0.02).toFixed(2)}mg Calcium`);
    console.log(`   + ${(moringa.micronutrients.iron_mg * 0.02).toFixed(2)}mg Iron`);
    console.log(`   + ${(moringa.micronutrients.vitamin_a_ug * 0.02).toFixed(2)}µg Vitamin A`);
}

addMoringaToSmoothie().catch(console.error);
