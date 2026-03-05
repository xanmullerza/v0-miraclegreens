const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create client as anonymous (no auth)
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnonymousVsAuth() {
    console.log('=== Testing as ANONYMOUS user ===');
    const { count: anonCount, error: anonError } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true });

    if (anonError) {
        console.log('Anonymous Error:', anonError.message);
    } else {
        console.log('Anonymous can see:', anonCount, 'foods');
    }

    // Check if there's a user_id column
    const { data: sample } = await supabase
        .from('food_items')
        .select('*')
        .limit(1);

    if (sample && sample[0]) {
        console.log('\nColumns in food_items:', Object.keys(sample[0]));
        if ('user_id' in sample[0]) {
            console.log('⚠️  user_id column EXISTS - RLS might be filtering by user');
        }
        if ('owner_id' in sample[0]) {
            console.log('⚠️  owner_id column EXISTS - RLS might be filtering by owner');
        }
    }
}

testAnonymousVsAuth();
