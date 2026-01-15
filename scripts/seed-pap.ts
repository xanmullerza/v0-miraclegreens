
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

// Based on Iwiza Dry Data
const DRY_DATA = {
    energy_kcal: 332.00,
    energy_kj: 1390.02,
    protein_g: 6.60,
    carbs_g: 77.70,
    fat_g: 1.20,
    micronutrients: {
        vitamin_a_ug: 2.00,
        thiamine_mg: 0.30,
        riboflavin_mg: 0.20,
        niacin_mg: 3.00,
        pantothenic_acid_mg: 0.80,
        vitamin_b6_mg: 0.40,
        vitamin_b12_ug: 0.01,
        folate_ug: 0.19,
        iron_mg: 3.70,
        sodium_mg: 6.40,
        fiber_g: 3.70,
        sugars_g: 1.90,
        saturated_fat_g: 0.20,
    }
};

// Ratio: 1 cup (160g) meal + 2 cups (500g) water = 660g cooked
// Multiplier: 160 / 660 = 0.2424...
const RATIO = 0.24;

const COOKED_DATA = {
    name: 'Maize Meal (Cooked Pap)',
    energy_kcal: DRY_DATA.energy_kcal * RATIO,
    energy_kj: DRY_DATA.energy_kj * RATIO,
    protein_g: DRY_DATA.protein_g * RATIO,
    carbs_g: DRY_DATA.carbs_g * RATIO,
    fat_g: DRY_DATA.fat_g * RATIO,
    micronutrients: {} as any
};

// Calculate micros
for (const [key, value] of Object.entries(DRY_DATA.micronutrients)) {
    COOKED_DATA.micronutrients[key] = (value as number) * RATIO;
}

const MEASURES = [
    { label: 'cup', weight_g: 240.0 },     // 1 cup cooked pap (heavier than dry meal)
    { label: 'serving', weight_g: 300.0 }, // A decent bowl
    { label: 'g', weight_g: 1.0 },
];

async function seedCookedPap() {
    console.log(`Seeding: ${COOKED_DATA.name}`);
    console.log(`Based on ratio: ${RATIO} (1 part meal : 2.x parts water)`);
    console.log(`Energy per 100g: ${COOKED_DATA.energy_kcal.toFixed(1)} kcal`);

    const { data: foodItemLink, error: foodError } = await supabase
        .from('food_items')
        .insert({
            name: COOKED_DATA.name,
            energy_kcal: COOKED_DATA.energy_kcal,
            energy_kj: COOKED_DATA.energy_kj,
            protein_g: COOKED_DATA.protein_g,
            carbs_g: COOKED_DATA.carbs_g,
            fat_g: COOKED_DATA.fat_g,
            micronutrients: COOKED_DATA.micronutrients
        })
        .select()
        .single();

    if (foodError) {
        console.error('Error inserting food item:', foodError);
        return;
    }

    const foodId = foodItemLink.id;
    console.log(`Included '${COOKED_DATA.name}' with ID: ${foodId}`);

    const formattedMeasures = MEASURES.map(m => ({
        food_item_id: foodId,
        label: m.label,
        weight_g: m.weight_g
    }));

    const { error: measureError } = await supabase
        .from('food_measures')
        .insert(formattedMeasures);

    if (measureError) {
        console.error('Error inserting measures:', measureError);
    } else {
        console.log(`✅ Successfully added measures for ${COOKED_DATA.name}`);
    }
}

seedCookedPap().catch(console.error);
