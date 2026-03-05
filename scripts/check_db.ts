import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking food_items table structure...');

    // Try a simple query with the new columns
    const { data, error } = await supabase
        .from('food_items')
        .select('name, is_curated, user_id')
        .limit(1);

    if (error) {
        console.error('Query failed:', error.message);
        if (error.message.includes('column') || error.message.includes('not found')) {
            console.log('CONFIRMED: One or more columns (is_curated, user_id) appear to be missing.');
        } else {
            console.log('Query failed but not necessarily due to missing columns. Error:', error.code);
        }
    } else {
        console.log('Query succeeded! Columns exist.');
        console.log('Sample data:', data);
    }
}

checkSchema();
