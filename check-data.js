const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    const { data, error } = await supabase
        .from('food_items')
        .select('name, common_name')
        .order('common_name', { ascending: true })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Top 10 items (sorted by common_name):');
        console.table(data);
    }
}

checkData();
