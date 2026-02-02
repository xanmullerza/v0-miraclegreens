const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNullCategories() {
    const { count, error } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true })
        .is('category', null);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Items with NULL category:', count);
    }

    // Also check for items with category = 'Nuts' (which doesn't exist in DB)
    const { count: nutsCount } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'Nuts');

    console.log('Items with category "Nuts":', nutsCount);
}

checkNullCategories();
