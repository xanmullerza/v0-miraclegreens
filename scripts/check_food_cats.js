
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    const names = ['Ground Sage', 'Thyme', 'Mustard Seed Ground', 'Olive Oil'];
    for (const name of names) {
        const { data, error } = await supabase
            .from('food_items')
            .select('name, common_name, category')
            .or(`name.ilike.%${name}%,common_name.ilike.%${name}%`)
            .limit(1);

        if (data && data.length > 0) {
            console.log(`Food: ${data[0].name} | Category: ${data[0].category}`);
        } else {
            console.log(`Food: ${name} not found`);
        }
    }
}

checkCategories();
