
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

const MAIZE_MEAL_DATA = {
    name: 'Maize Meal (Iwiza)',
    // Per 100g
    energy_kcal: 332.00,
    energy_kj: 1390.02,
    protein_g: 6.60,
    carbs_g: 77.70,
    fat_g: 1.20,

    micronutrients: {
        // Vitamins (Fortified Profile)
        vitamin_a_ug: 2.00,
        thiamine_mg: 0.30,     // B1
        riboflavin_mg: 0.20,   // B2
        niacin_mg: 3.00,       // B3
        pantothenic_acid_mg: 0.80, // B5
        vitamin_b6_mg: 0.40,
        vitamin_b12_ug: 0.01,
        folate_ug: 0.19,

        // Minerals
        iron_mg: 3.70,
        sodium_mg: 6.40,
        // Calcium/Magnesium/Zinc missing or low in this brand data

        // Carbs Breakdown
        fiber_g: 3.70,
        sugars_g: 1.90,

        // Fats Breakdown
        saturated_fat_g: 0.20,
    }
};

const MAIZE_MEASURES = [
    { label: 'cup', weight_g: 160.0 },     // Standard dry cup
    { label: 'serving', weight_g: 100.0 }, // Standard serving
    { label: 'tbsp', weight_g: 10.0 },
];

async function seedMaize() {
    console.log(`Seeding food item: ${MAIZE_MEAL_DATA.name}...`);

    const { data: foodItemLink, error: foodError } = await supabase
        .from('food_items')
        .insert({
            name: MAIZE_MEAL_DATA.name,
            energy_kcal: MAIZE_MEAL_DATA.energy_kcal,
            energy_kj: MAIZE_MEAL_DATA.energy_kj,
            protein_g: MAIZE_MEAL_DATA.protein_g,
            carbs_g: MAIZE_MEAL_DATA.carbs_g,
            fat_g: MAIZE_MEAL_DATA.fat_g,
            micronutrients: MAIZE_MEAL_DATA.micronutrients
        })
        .select()
        .single();

    if (foodError) {
        console.error('Error inserting food item:', foodError);
        return;
    }

    const foodId = foodItemLink.id;
    console.log(`Included '${MAIZE_MEAL_DATA.name}' with ID: ${foodId}`);

    const measures = MAIZE_MEASURES.map(m => ({
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
        console.log(`✅ Successfully added ${measures.length} measures for ${MAIZE_MEAL_DATA.name}`);
    }
}

seedMaize().catch(console.error);
