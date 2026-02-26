/**
 * patch-portions-gram-kg.ts
 *
 * Adds gram (1g) and kilogram (1000g) entries to the food_items.portions JSONB
 * column for every food that is missing them.
 *
 * fetchFoodMeasures() reads portions JSONB first and short-circuits before
 * checking the food_measures table, so this is the correct place to patch.
 *
 * Run with:
 *   npx ts-node --esm scripts/patch-portions-gram-kg.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function run() {
    // Fetch all food items that have a non-null portions array
    const { data: foods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, portions');

    if (error || !foods) {
        console.error('Error fetching food_items:', error);
        process.exit(1);
    }

    let updated = 0;
    let skipped = 0;

    for (const food of foods) {
        const existing: { label: string; weight_g: number }[] = Array.isArray(food.portions)
            ? food.portions
            : [];

        const labels = new Set(existing.map((p: any) => p.label?.toLowerCase()));
        const toAdd: { label: string; weight_g: number }[] = [];

        if (!labels.has('gram')) toAdd.push({ label: 'gram', weight_g: 1 });
        if (!labels.has('kilogram')) toAdd.push({ label: 'kilogram', weight_g: 1000 });

        if (toAdd.length === 0) {
            skipped++;
            continue;
        }

        const newPortions = [...existing, ...toAdd];
        const foodName = food.common_name || food.name;

        const { error: updateError } = await supabase
            .from('food_items')
            .update({ portions: newPortions })
            .eq('id', food.id);

        if (updateError) {
            console.error(`  ❌ Failed to update ${foodName}:`, updateError.message);
        } else {
            const added = toAdd.map(p => `${p.label} (${p.weight_g}g)`).join(', ');
            console.log(`  ✅ ${foodName}: added ${added}`);
            updated++;
        }
    }

    console.log(`\nDone. Updated ${updated} foods, skipped ${skipped} (already had gram + kilogram).`);
}

run().catch(console.error);
