const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Mocking some env vars if they exist or reading from a config if I can find it
// Usually these are in .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1];
    supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1];
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAndUpdateAlmonds() {
    const { data: foods, error: findError } = await supabase
        .from('food_items')
        .select('id, name, micronutrients')
        .or('name.ilike.%almond%,common_name.ilike.%almond%');

    if (findError) {
        console.error('Error finding almonds:', findError);
        return;
    }

    if (!foods || foods.length === 0) {
        console.log('No almond food items found');
        return;
    }

    console.log(`Found ${foods.length} almond records:`);
    foods.forEach(f => console.log(`- ID: ${f.id}, Name: ${f.name}`));

    let target = foods.find(f => f.name === 'Almonds raw');
    if (!target) {
        console.log('Target "Almonds raw" not found, using first available.');
        target = foods[0];
    }

    const newData = {
        "Iron": 3.741,
        "Zinc": 2.865,
        "Fiber": 10.78,
        "Copper": 0.9104,
        "Niacin": 3.77,
        "Calcium": 253.6,
        "Thiamine": 0.1605,
        "Magnesium": 257.6,
        "Manganese": 2.149,
        "Potassium": 732.8,
        "Phosphorus": 502.9,
        "Vitamin B6": 0.1008,
        "_meta_fdc_id": 2346393,
        "_meta_source": "usda_100g_standard",
        "_meta_original_name": "Almonds raw"
    };

    const combinedMicros = { ...target.micronutrients, ...newData };

    const { error: updateError } = await supabase
        .from('food_items')
        .update({ micronutrients: combinedMicros })
        .eq('id', target.id);

    if (updateError) {
        console.error('Error updating almond:', updateError);
    } else {
        console.log(`Successfully updated almond (ID: ${target.id}) with new nutrient data.`);
    }
}

findAndUpdateAlmonds();
