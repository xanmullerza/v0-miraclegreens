const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
    const { data: categories, error } = await supabase
        .from('food_items')
        .select('category');

    if (error) {
        console.error('Error:', error);
    } else {
        const counts = {};
        categories.forEach(f => {
            const cat = f.category || 'NULL';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        console.log('Category Distribution in DB:');
        console.table(counts);
    }
}

checkCategories();
