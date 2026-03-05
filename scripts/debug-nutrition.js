
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function check() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('food_items').select('*').or('name.ilike.%spinach%,name.ilike.%kale%,name.ilike.%egg%');

    data.forEach(f => {
        console.log(`=== ${f.name} ===`);
        console.log("Macros:", { kcal: f.energy_kcal, p: f.protein_g, c: f.carbs_g, f: f.fat_g });
        console.log("Micros:", JSON.stringify(f.micronutrients, null, 2));
    });
}
check();
