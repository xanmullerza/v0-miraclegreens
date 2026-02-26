/**
 * add-gram-kg-measures.ts
 *
 * For every food_item that already has at least one food_measure (named serving
 * like "cup", "tbsp", etc.) but is MISSING a "gram" or "kilogram" entry,
 * this script inserts:
 *   - { label: 'gram',     weight_g: 1    }
 *   - { label: 'kilogram', weight_g: 1000 }
 *
 * Nutrients in food_items are stored per 100 g, so the UI scales automatically
 * using weight_g / 100 — no nutrient data needs to change.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/add-gram-kg-measures.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Works whether run as CJS or ESM, as long as CWD is the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Fetch all food_measures grouped by food_item_id
    const { data: allMeasures, error: measuresError } = await supabase
        .from('food_measures')
        .select('food_item_id, label, weight_g');

    if (measuresError || !allMeasures) {
        console.error('Error fetching food_measures:', measuresError);
        process.exit(1);
    }

    // Build a map: food_item_id → Set of existing labels
    const measuresByFood = new Map<string, Set<string>>();
    for (const m of allMeasures) {
        if (!measuresByFood.has(m.food_item_id)) {
            measuresByFood.set(m.food_item_id, new Set());
        }
        measuresByFood.get(m.food_item_id)!.add(m.label.toLowerCase());
    }

    // 2. Fetch all food_items so we have names for logging
    const { data: allFoods, error: foodsError } = await supabase
        .from('food_items')
        .select('id, name, common_name');

    if (foodsError || !allFoods) {
        console.error('Error fetching food_items:', foodsError);
        process.exit(1);
    }


    // 3. For every food (with or without existing measures), ensure gram + kilogram exist
    const toInsert: { food_item_id: string; label: string; weight_g: number }[] = [];

    for (const food of allFoods) {
        const labels = measuresByFood.get(food.id) ?? new Set<string>();
        const foodName = food.common_name || food.name;
        const missing: string[] = [];

        if (!labels.has('gram')) {
            toInsert.push({ food_item_id: food.id, label: 'gram', weight_g: 1 });
            missing.push('gram (1g)');
        }
        if (!labels.has('kilogram')) {
            toInsert.push({ food_item_id: food.id, label: 'kilogram', weight_g: 1000 });
            missing.push('kilogram (1000g)');
        }

        if (missing.length > 0) {
            console.log(`  ${foodName}: adding ${missing.join(', ')}`);
        }
    }

    if (toInsert.length === 0) {
        console.log('✅ All foods already have gram and kilogram measures — nothing to do.');
        return;
    }

    console.log(`\nInserting ${toInsert.length} measure rows...`);

    const { error: insertError } = await supabase
        .from('food_measures')
        .insert(toInsert);

    if (insertError) {
        console.error('Error inserting measures:', insertError);
        process.exit(1);
    }

    console.log(`\n✅ Done. Added gram/kilogram measures for ${toInsert.length / 2} food(s).`);
}

run().catch(console.error);
