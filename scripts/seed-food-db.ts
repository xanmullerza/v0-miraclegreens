
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

const RAW_EGG_DATA = {
    name: 'Egg, Raw',
    // Per 100g
    energy_kcal: 155.00,
    energy_kj: 648.95,
    protein_g: 12.58,
    carbs_g: 1.12,
    fat_g: 10.61,

    micronutrients: {
        // General
        water_g: 74.62,
        ash_g: 1.08,
        alcohol_g: 0.00,
        caffeine_mg: 0.00,
        cholesterol_mg: 373.00,

        // Fats breakdown
        saturated_fat_g: 3.27,
        monounsaturated_fat_g: 4.08,
        polyunsaturated_fat_g: 1.41,
        omega_3_g: 0.07,
        omega_6_g: 1.31,
        trans_fats_g: 0.00,

        // Sugars breakdown
        sugars_g: 1.12,
        added_sugars_g: 0.00,

        // Minerals
        calcium_mg: 50.00,
        iron_mg: 1.19,
        magnesium_mg: 10.00,
        phosphorus_mg: 172.00,
        potassium_mg: 126.00,
        sodium_mg: 124.00,
        zinc_mg: 1.05,
        copper_mg: 0.01,
        manganese_mg: 0.03,
        selenium_ug: 30.80,
        iodine_ug: 49.20,

        // Vitamins
        vitamin_a_ug: 149.33,
        vitamin_c_mg: 0.00,
        vitamin_d_iu: 87.00,
        vitamin_e_mg: 1.03,
        vitamin_k_ug: 0.30,
        thiamine_mg: 0.07,
        riboflavin_mg: 0.51,
        niacin_mg: 0.06,
        pantothenic_acid_mg: 1.40,
        vitamin_b6_mg: 0.12,
        vitamin_b12_ug: 1.11,
        folate_ug: 44.00,
        choline_mg: 293.80,
    }
};

const RAW_EGG_MEASURES = [
    { label: 'cup', weight_g: 245.0 },
    { label: 'jumbo', weight_g: 63.0 },
    { label: 'extra large', weight_g: 56.0 },
    { label: 'large', weight_g: 50.0 },
    { label: 'medium', weight_g: 44.0 },
    { label: 'small', weight_g: 38.0 },
    { label: 'tbsp', weight_g: 15.31 },
    { label: 'tsp', weight_g: 5.1 }
];

async function seedFoodDB() {
    console.log(`Seeding food item: ${RAW_EGG_DATA.name}...`);

    // 1. Insert Food Item
    const { data: foodItemLink, error: foodError } = await supabase
        .from('food_items')
        .insert({
            name: RAW_EGG_DATA.name,
            energy_kcal: RAW_EGG_DATA.energy_kcal,
            energy_kj: RAW_EGG_DATA.energy_kj,
            protein_g: RAW_EGG_DATA.protein_g,
            carbs_g: RAW_EGG_DATA.carbs_g,
            fat_g: RAW_EGG_DATA.fat_g,
            micronutrients: RAW_EGG_DATA.micronutrients // Supabase will ensure this is stored as JSONB
        })
        .select()
        .single();

    if (foodError) {
        console.error('Error inserting food item:', foodError);
        return;
    }

    const foodId = foodItemLink.id;
    console.log(`Inserted '${RAW_EGG_DATA.name}' with ID: ${foodId}`);

    // 2. Insert Measures
    console.log('Inserting measures...');
    const measures = RAW_EGG_MEASURES.map(m => ({
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
        console.log(`Successfully added ${measures.length} measures for ${RAW_EGG_DATA.name}`);
    }
}

seedFoodDB().catch(console.error);
