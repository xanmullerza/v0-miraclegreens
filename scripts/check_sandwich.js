
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecipe() {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('recipe_id', 'recipe-1770203173316');

    if (error) {
        console.error('Error fetching ingredients:', error);
        return;
    }

    console.log('Raw Ingredients:', JSON.stringify(data, null, 2));
}

checkRecipe();
