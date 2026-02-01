const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const searchQuery = '';
    let query = supabase
        .from('food_items')
        .select('id, name', { count: 'exact' });

    if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query;

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Query result count without filter:', count);
    }

    // Test with the filter as if it were an empty string (ilike %%)
    let queryWithFilter = supabase
        .from('food_items')
        .select('id, name', { count: 'exact' })
        .or(`name.ilike.%%,common_name.ilike.%%`);

    const { count: count2, error: error2 } = await queryWithFilter;
    if (error2) {
        console.error('Error 2:', error2);
    } else {
        console.log('Query result count with .or("name.ilike.%%,common_name.ilike.%%"):', count2);
    }
}

testQuery();
