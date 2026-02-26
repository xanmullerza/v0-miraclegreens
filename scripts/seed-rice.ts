
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

const RICE_ITEMS = [
    {
        name: 'Rice, White, Dry',
        energy_kcal: 374.00,
        energy_kj: 1565.86,
        protein_g: 7.51,
        carbs_g: 80.89,
        fat_g: 1.03,
        micronutrients: {
            // Vitamins
            thiamine_mg: 0.22,
            riboflavin_mg: 0.05,
            niacin_mg: 5.05,
            pantothenic_acid_mg: 0.67,
            vitamin_b6_mg: 0.45,
            folate_ug: 8.00,
            vitamin_e_mg: 0.03,
            vitamin_k_ug: 0.10,

            // Minerals
            calcium_mg: 71.00,
            copper_mg: 0.28,
            iron_mg: 0.74,
            magnesium_mg: 27.00,
            manganese_mg: 1.04,
            phosphorus_mg: 153.00,
            potassium_mg: 174.00,
            selenium_ug: 19.90,
            sodium_mg: 2.00,
            zinc_mg: 1.02,

            // Breakdown
            fiber_g: 1.80,
            starch_g: 68.29,
            sugars_g: 0.33,
            saturated_fat_g: 0.29,
            monounsaturated_fat_g: 0.26,
            polyunsaturated_fat_g: 0.32,
            omega_3_g: 0.02,
            omega_6_g: 0.31
        }
    },
    {
        name: 'Rice, White, Cooked',
        energy_kcal: 130.00,
        energy_kj: 544.28,
        protein_g: 2.69,
        carbs_g: 28.17,
        fat_g: 0.28,
        micronutrients: {
            // Vitamins
            thiamine_mg: 0.16,
            riboflavin_mg: 0.01,
            niacin_mg: 1.48,
            pantothenic_acid_mg: 0.39,
            vitamin_b6_mg: 0.09,
            folate_ug: 42.80,
            vitamin_e_mg: 0.04,
            choline_mg: 2.10,

            // Minerals
            calcium_mg: 10.00,
            copper_mg: 0.07,
            iron_mg: 1.20,
            magnesium_mg: 12.00,
            manganese_mg: 0.47,
            phosphorus_mg: 43.00,
            potassium_mg: 35.00,
            selenium_ug: 7.50,
            sodium_mg: 382.00, // Salted water
            zinc_mg: 0.49,

            // Breakdown
            fiber_g: 0.34,
            starch_g: 23.00,
            sugars_g: 0.03,
            saturated_fat_g: 0.08,
            monounsaturated_fat_g: 0.09,
            polyunsaturated_fat_g: 0.08,
            omega_3_g: 0.01,
            omega_6_g: 0.06
        }
    }
];

const MEASURES = [
    { label: 'cup', weight_g: 158.0 },     // 1 cup cooked
    { label: 'serving', weight_g: 100.0 }, // 100g serving
    { label: 'g', weight_g: 1.0 },
];

async function seedRice() {
    console.log('Seeding rice items...');

    for (const item of RICE_ITEMS) {
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

        // Add measures
        // For dry rice, cup is ~185g. For cooked, ~158g.
        // Simplified: Using generic measures but distinguishing if possible.
        // We'll use the measures array above but tweak weight for Dry if needed.
        let measuresToAdd = MEASURES;
        if (item.name.includes('Dry')) {
            measuresToAdd = [
                { label: 'cup', weight_g: 185.0 }, // Dry cup is heavier
                { label: 'serving', weight_g: 100.0 },
                { label: 'tbsp', weight_g: 12.0 }
            ];
        }

        const formattedMeasures = measuresToAdd.map(m => ({
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

seedRice().catch(console.error);
