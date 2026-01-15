
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

async function fixVegetarianBreakfast() {
    // 1. Update egg recipe to be ONLY vegetarian (remove 'anything')
    console.log('Updating Raw Egg to be vegetarian-only...');
    const { error: eggError } = await supabase
        .from('recipes')
        .update({ diet: ['vegetarian'] })
        .eq('id', 'egg-raw-1');

    if (eggError) {
        console.error('Error updating egg:', eggError);
    } else {
        console.log('✓ Egg is now vegetarian-only');
    }

    // 2. Get all other breakfast recipes
    console.log('\nFinding other breakfast recipes...');
    const { data: breakfasts, error: fetchError } = await supabase
        .from('recipes')
        .select('id, title, diet')
        .eq('type', 'breakfast')
        .neq('id', 'egg-raw-1');

    if (fetchError) {
        console.error('Error fetching breakfasts:', fetchError);
        return;
    }

    console.log(`Found ${breakfasts?.length || 0} other breakfast recipes`);

    // 3. Remove 'vegetarian' from their diet arrays
    for (const recipe of breakfasts || []) {
        const currentDiet = recipe.diet as string[];
        if (currentDiet.includes('vegetarian')) {
            const newDiet = currentDiet.filter(d => d !== 'vegetarian');
            console.log(`  Removing 'vegetarian' from "${recipe.title}"`);
            console.log(`    Before: [${currentDiet.join(', ')}]`);
            console.log(`    After:  [${newDiet.join(', ')}]`);

            const { error: updateError } = await supabase
                .from('recipes')
                .update({ diet: newDiet })
                .eq('id', recipe.id);

            if (updateError) {
                console.error(`    Error: ${updateError.message}`);
            }
        }
    }

    console.log('\n✅ Done! Raw Egg is now the ONLY vegetarian breakfast option.');
}

fixVegetarianBreakfast().catch(console.error);
