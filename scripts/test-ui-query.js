const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUIQuery() {
    // This mirrors the exact query the Foods Hub makes
    const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];
    const selectedCategories = CATEGORIES; // All selected
    const searchQuery = ''; // No search
    const showFavoritesOnly = false; // Globe mode (all foods)
    const sortField = 'common_name';
    const sortDirection = 'asc';
    const PAGE_SIZE = 20;

    let query = supabase
        .from('food_items')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' });

    if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
    }

    // This is the key line - when ALL categories are selected, this condition is FALSE
    // and no category filter is applied
    if (selectedCategories.length < CATEGORIES.length) {
        query = query.in('category', selectedCategories);
    }

    if (showFavoritesOnly) {
        query = query.eq('is_favorite', true);
    }

    query = query.range(0, PAGE_SIZE - 1);

    console.log('Testing UI query...');
    const { data, error, count } = await query;

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log(`Total count: ${count}`);
        console.log(`Items returned: ${data?.length}`);
        if (data && data.length > 0) {
            console.log('\nFirst 3 items:');
            data.slice(0, 3).forEach((item, i) => {
                console.log(`${i + 1}. ${item.common_name || item.name} (${item.category})`);
            });
        } else {
            console.log('NO DATA RETURNED!');
        }
    }
}

testUIQuery();
