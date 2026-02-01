const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in food_items:', Object.keys(data[0]));
    } else {
        console.log('No data found in food_items table.');
    }
}

checkColumns();
