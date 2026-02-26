
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

const KALE_DATA = {
    name: 'Kale, Raw',
    // Per 100g
    energy_kcal: 35.00,
    energy_kj: 146.54,
    protein_g: 2.92,
    carbs_g: 4.42,
    fat_g: 1.49,

    micronutrients: {
        // General
        water_g: 89.63,
        ash_g: 1.54,
        alcohol_g: 0.00,
        caffeine_mg: 0.00,
        oxalate_mg: 20.70,
        cholesterol_mg: 0.00,

        // Fats breakdown
        saturated_fat_g: 0.18,
        monounsaturated_fat_g: 0.10,
        polyunsaturated_fat_g: 0.67,
        omega_3_g: 0.38,
        omega_6_g: 0.29,
        trans_fats_g: 0.00,

        // Carbs breakdown
        fiber_g: 4.10,
        sugars_g: 0.99,
        added_sugars_g: 0.00,

        // Minerals
        calcium_mg: 254.00,
        iron_mg: 1.60,
        magnesium_mg: 33.00,
        phosphorus_mg: 55.00,
        potassium_mg: 348.00,
        sodium_mg: 53.00,
        zinc_mg: 0.39,
        copper_mg: 0.05,
        manganese_mg: 0.92,
        selenium_ug: 0.90,

        // Vitamins
        vitamin_a_ug: 240.54,
        vitamin_c_mg: 93.40,
        vitamin_d_iu: 0.00,
        vitamin_e_mg: 0.66,
        vitamin_k_ug: 389.60,
        thiamine_mg: 0.11,
        riboflavin_mg: 0.35,
        niacin_mg: 1.18,
        pantothenic_acid_mg: 0.37,
        vitamin_b6_mg: 0.15,
        vitamin_b12_ug: 0.00,
        folate_ug: 62.00,
        choline_mg: 0.50,
    }
};

// Common kale measures
const KALE_MEASURES = [
    { label: 'cup, chopped', weight_g: 67.0 },
    { label: 'leaf', weight_g: 8.0 },
    { label: 'bunch', weight_g: 170.0 },
    { label: 'tbsp', weight_g: 4.2 },
];

async function seedKale() {
    console.log(`Seeding food item: ${KALE_DATA.name}...`);

    // Insert Food Item
    const { data: foodItemLink, error: foodError } = await supabase
        .from('food_items')
        .insert({
            name: KALE_DATA.name,
            energy_kcal: KALE_DATA.energy_kcal,
            energy_kj: KALE_DATA.energy_kj,
            protein_g: KALE_DATA.protein_g,
            carbs_g: KALE_DATA.carbs_g,
            fat_g: KALE_DATA.fat_g,
            micronutrients: KALE_DATA.micronutrients
        })
        .select()
        .single();

    if (foodError) {
        console.error('Error inserting food item:', foodError);
        return;
    }

    const foodId = foodItemLink.id;
    console.log(`Inserted '${KALE_DATA.name}' with ID: ${foodId}`);

    // Insert Measures
    console.log('Inserting measures...');
    const measures = KALE_MEASURES.map(m => ({
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
        console.log(`✅ Successfully added ${measures.length} measures for ${KALE_DATA.name}`);
    }
}

seedKale().catch(console.error);
