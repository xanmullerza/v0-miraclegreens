
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEggRecipe() {
    console.log('Checking egg recipe in database...\n');

    const { data, error } = await supabase
        .from('recipes')
        .select('id, title, calories, protein, carbs, fat')
        .eq('id', 'egg-raw-1')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('=== EGG RECIPE VALUES IN DATABASE ===');
    console.log(`ID: ${data.id}`);
    console.log(`Title: ${data.title}`);
    console.log(`Calories: ${data.calories}`);
    console.log(`Protein: ${data.protein}`);
    console.log(`Carbs: ${data.carbs}`);
    console.log(`Fat: ${data.fat}`);

    console.log('\n=== EXPECTED VALUES (from 50g of Egg, Raw) ===');
    console.log('Calories: 77.5');
    console.log('Protein: 6.29');
    console.log('Carbs: 0.56');
    console.log('Fat: 5.305');
}

checkEggRecipe().catch(console.error);
