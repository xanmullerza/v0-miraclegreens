import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanLabel(label: string): string {
    if (!label) return '';

    // 1. Truncate at common separators
    let cleaned = label.split(',')[0].split('-')[0].split('(')[0];

    // 2. Trim whitespace
    cleaned = cleaned.trim();

    // 3. Capitalize first letter of each word (Title Case / InitCap)
    cleaned = cleaned.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');

    return cleaned;
}

async function runTruncationMigration() {
    console.log("🚀 Starting comprehensive Portions Truncation Migration...");

    // Step 1: Handle food_items.portions (JSONB)
    const { data: items, error: itemsError } = await supabase
        .from('food_items')
        .select('id, portions')
        .not('portions', 'is', null);

    if (itemsError) throw itemsError;

    console.log(`📦 Found ${items.length} items with JSON portions.`);
    let updatedItems = 0;

    for (const item of items) {
        if (!Array.isArray(item.portions)) continue;

        const newPortions: any[] = [];
        const seenLabels = new Set();
        let changed = false;

        for (const p of item.portions) {
            const originalLabel = p.label;
            const truncatedLabel = cleanLabel(originalLabel);

            if (truncatedLabel !== originalLabel) changed = true;

            // Only add if we haven't seen this simplified label for this item yet
            if (!seenLabels.has(truncatedLabel)) {
                newPortions.push({
                    ...p,
                    label: truncatedLabel
                });
                seenLabels.add(truncatedLabel);
            } else {
                changed = true; // We are removing a duplicate
            }
        }

        if (changed) {
            await supabase
                .from('food_items')
                .update({ portions: newPortions })
                .eq('id', item.id);
            updatedItems++;
        }
    }
    console.log(`✅ Updated ${updatedItems} food items (JSONB portions).`);

    // Step 2: Handle food_measures table (Standalone rows)
    console.log("🧼 Cleaning food_measures table...");
    const { data: measures, error: measuresError } = await supabase
        .from('food_measures')
        .select('*');

    if (measuresError) throw measuresError;
    console.log(`📏 Found ${measures.length} individual measure rows.`);

    // Group by food_item_id to handle uniqueness
    const measuresByItem: Record<string, any[]> = {};
    measures.forEach(m => {
        if (!measuresByItem[m.food_item_id]) measuresByItem[m.food_item_id] = [];
        measuresByItem[m.food_item_id].push(m);
    });

    for (const foodItemId in measuresByItem) {
        const itemMeasures = measuresByItem[foodItemId];
        const seenLabels = new Set();

        for (const m of itemMeasures) {
            const truncatedLabel = cleanLabel(m.label);

            if (!seenLabels.has(truncatedLabel)) {
                // Update this one
                await supabase
                    .from('food_measures')
                    .update({ label: truncatedLabel })
                    .eq('id', m.id);
                seenLabels.add(truncatedLabel);
            } else {
                // Delete this one as it's now a duplicate for this item
                await supabase
                    .from('food_measures')
                    .delete()
                    .eq('id', m.id);
            }
        }
    }

    console.log("🏁 Migration Complete!");
}

runTruncationMigration().catch(console.error);
