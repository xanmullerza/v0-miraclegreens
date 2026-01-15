
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

const ITEMS = [
    {
        name: 'Lentils, Cooked',
        energy_kcal: 116.00,
        energy_kj: 485.67,
        protein_g: 9.02,
        carbs_g: 20.13,
        fat_g: 0.38,
        micronutrients: {
            // Vitamins
            thiamine_mg: 0.17,
            riboflavin_mg: 0.07,
            niacin_mg: 1.06,
            pantothenic_acid_mg: 0.64,
            vitamin_b6_mg: 0.18,
            folate_ug: 181.00,
            vitamin_e_mg: 0.11,
            vitamin_k_ug: 1.70,
            choline_mg: 32.70,
            vitamin_c_mg: 1.50,
            vitamin_a_ug: 0.42,

            // Minerals
            calcium_mg: 19.00,
            copper_mg: 0.25,
            iron_mg: 3.33,
            magnesium_mg: 36.00,
            manganese_mg: 0.49,
            phosphorus_mg: 180.00,
            potassium_mg: 369.00,
            selenium_ug: 2.80,
            sodium_mg: 2.00,
            zinc_mg: 1.27,

            // Breakdown
            fiber_g: 5.86,
            starch_g: 13.40,
            sugars_g: 0.39,
            saturated_fat_g: 0.05,
            monounsaturated_fat_g: 0.06,
            polyunsaturated_fat_g: 0.18,
            omega_3_g: 0.04,
            omega_6_g: 0.14
        }
    },
    {
        name: 'Spinach, Cooked',
        energy_kcal: 23.00,
        energy_kj: 96.30,
        protein_g: 2.97,
        carbs_g: 3.75,
        fat_g: 0.26,
        micronutrients: {
            // Vitamins
            thiamine_mg: 0.10,
            riboflavin_mg: 0.24,
            niacin_mg: 0.49,
            pantothenic_acid_mg: 0.15,
            vitamin_b6_mg: 0.24,
            folate_ug: 146.00,
            vitamin_e_mg: 2.08,
            vitamin_k_ug: 493.60,
            choline_mg: 19.70,
            vitamin_c_mg: 9.80,
            vitamin_a_ug: 524.00,

            // Minerals
            calcium_mg: 136.00,
            copper_mg: 0.17,
            iron_mg: 3.57,
            magnesium_mg: 87.00,
            manganese_mg: 0.94,
            phosphorus_mg: 56.00,
            potassium_mg: 466.00,
            selenium_ug: 1.50,
            sodium_mg: 70.00,
            zinc_mg: 0.76,
            iodine_ug: 3.90,

            // Breakdown
            fiber_g: 2.40,
            sugars_g: 0.43,
            saturated_fat_g: 0.04,
            polyunsaturated_fat_g: 0.11,
            omega_3_g: 0.09
        }
    }
];

const MEASURES = [
    { label: 'cup', weight_g: 180.0 },     // Standard cup cooked
    { label: 'serving', weight_g: 100.0 }, // 100g
    { label: 'tbsp', weight_g: 15.0 },
];

async function seedVeg() {
    console.log('Seeding Lentils/Spinach...');

    for (const item of ITEMS) {
        console.log(`Adding ${item.name}...`);

        const { data: foodItemLink, error: foodError } = await supabase
            .from('food_items')
            .insert({
                name: item.name,
                energy_kcal: item.energy_kcal,
                energy_kj: item.energy_kj,
                protein_g: item.protein_g,
                carbs_g: item.carbs_g,
                fat_g: item.fat_g,
                micronutrients: item.micronutrients
            })
            .select()
            .single();

        if (foodError) {
            console.error(`Error inserting ${item.name}:`, foodError);
            continue;
        }

        const foodId = foodItemLink.id;

        const formattedMeasures = MEASURES.map(m => ({
            food_item_id: foodId,
            label: m.label,
            weight_g: m.weight_g
        }));

        const { error: measureError } = await supabase
            .from('food_measures')
            .insert(formattedMeasures);

        if (measureError) {
            console.error(`Error inserting measures for ${item.name}:`, measureError);
        } else {
            console.log(`✅ Added ${item.name} with measures`);
        }
    }
}

seedVeg().catch(console.error);
