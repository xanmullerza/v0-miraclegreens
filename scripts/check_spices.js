
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function searchSpices() {
    const spices = ['Cumin', 'Coriander', 'Cardamom', 'Cinnamon', 'Clove', 'Black pepper', 'Nutmeg'];

    for (const spice of spices) {
        const { data, error } = await supabase
            .from('food_items')
            .select('*')
            .ilike('name', `%${spice}%`)
            .limit(1);

        if (error) {
            console.error(`Error searching for ${spice}:`, error);
            continue;
        }

        if (data && data.length > 0) {
            const item = data[0];
            const microCount = item.micronutrients ? Object.keys(item.micronutrients).length : 0;
            console.log(`Spice: ${item.name} | Micros Captured: ${microCount}`);
        } else {
            console.log(`Spice: ${spice} | NOT FOUND in local DB`);
        }
    }
}

searchSpices();
