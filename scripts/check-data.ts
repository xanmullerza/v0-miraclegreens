
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImages() {
    console.log('Fetching recipes from Supabase...');

    // Select id, title, image column
    const { data, error } = await supabase
        .from('recipes')
        .select('id, title, image');

    if (error) {
        console.error('Error fetching recipes:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No recipes found in DB.');
        return;
    }

    console.log('\n--- Recipe Image URLs ---');
    data.forEach(r => {
        console.log(`[${r.id}] ${r.title}`);
        console.log(`     Image: ${r.image || 'NULL'}`);
    });
}

checkImages().catch(console.error);
