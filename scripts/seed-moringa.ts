
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

const MORINGA_DATA = {
    name: 'Moringa Powder',
    // Per 100g
    energy_kcal: 250.00,
    energy_kj: 1046.70,
    protein_g: 25.00,
    carbs_g: 40.00,
    fat_g: 2.25,

    micronutrients: {
        // Vitamins
        vitamin_a_ug: 5625.00,
        vitamin_c_mg: 225.00,
        vitamin_d_iu: 0.00,
        thiamine_mg: 2.63,     // B1
        riboflavin_mg: 20.40,  // B2
        niacin_mg: 10.00,      // B3

        // Minerals
        calcium_mg: 2000.00,
        iron_mg: 38.00,
        magnesium_mg: 367.50,
        potassium_mg: 1325.00,
        sodium_mg: 25.00,

        // Carbs Breakdown
        fiber_g: 40.00,
        sugars_g: 0.00,
        added_sugars_g: 0.00,

        // Fats Breakdown
        saturated_fat_g: 0.00,
        trans_fats_g: 0.00,
        cholesterol_mg: 0.00,
    }
};

// Standard density for powders
// 1 tsp ≈ 2-3g
// 1 tbsp ≈ 6-9g
const MORINGA_MEASURES = [
    { label: 'tsp', weight_g: 2.0 },
    { label: 'tbsp', weight_g: 6.0 },
    { label: 'scoop', weight_g: 10.0 }, // Common supplement scoop
    { label: 'cup', weight_g: 100.0 },  // Loose powder
];

async function seedMoringa() {
    console.log(`Seeding food item: ${MORINGA_DATA.name}...`);

    // 1. Check if exists to avoid duplicates (optional, but good practice)
    // For now we just insert
    const { data: foodItemLink, error: foodError } = await supabase
        .from('food_items')
        .insert({
            name: MORINGA_DATA.name,
            energy_kcal: MORINGA_DATA.energy_kcal,
            energy_kj: MORINGA_DATA.energy_kj,
            protein_g: MORINGA_DATA.protein_g,
            carbs_g: MORINGA_DATA.carbs_g,
            fat_g: MORINGA_DATA.fat_g,
            micronutrients: MORINGA_DATA.micronutrients
        })
        .select()
        .single();

    if (foodError) {
        console.error('Error inserting food item:', foodError);
        return;
    }

    const foodId = foodItemLink.id;
    console.log(`Included '${MORINGA_DATA.name}' with ID: ${foodId}`);

    // 2. Insert Measures
    console.log('Inserting measures...');
    const measures = MORINGA_MEASURES.map(m => ({
        food_item_id: foodId,
        label: m.label,
        weight_g: m.weight_g
    }));

    const { error: measureError } = await supabase
        .from('food_measures')
        .insert(measures);

    if (measureError) {
        console.error('Error inserting measures:', measureError);
    } else {
        console.log(`✅ Successfully added ${measures.length} measures for ${MORINGA_DATA.name}`);
    }
}

seedMoringa().catch(console.error);
