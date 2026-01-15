
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

async function diagnoseBreakfasts() {
    console.log('=== CHECKING ALL BREAKFAST RECIPES ===\n');

    const { data: allBreakfasts, error } = await supabase
        .from('recipes')
        .select('id, title, type, diet')
        .eq('type', 'breakfast')
        .order('title');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${allBreakfasts?.length || 0} breakfast recipes:\n`);

    for (const recipe of allBreakfasts || []) {
        const diets = recipe.diet as string[];
        const isVegetarian = diets.includes('vegetarian');
        const marker = isVegetarian ? '✓ VEGETARIAN' : '';
        console.log(`[${recipe.id}] ${recipe.title}`);
        console.log(`  Diets: [${diets.join(', ')}] ${marker}\n`);
    }

    console.log('\n=== VEGETARIAN-ONLY BREAKFASTS ===\n');
    const vegBreakfasts = allBreakfasts?.filter(r => (r.diet as string[]).includes('vegetarian'));
    if (vegBreakfasts && vegBreakfasts.length > 0) {
        vegBreakfasts.forEach(r => {
            console.log(`- ${r.title} (${r.id})`);
        });
    } else {
        console.log('⚠️ NO VEGETARIAN BREAKFASTS FOUND!');
    }
}

diagnoseBreakfasts().catch(console.error);
