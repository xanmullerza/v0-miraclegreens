import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function mergeAndCleanup() {
    console.log("🧬 Starting Smart Merge & Cleanup...");

    // 1. Fetch ALL items (with pagination)
    let allItems: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('food_items')
            .select('id, name, created_at, micronutrients')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error("❌ Error fetching page:", error);
            break;
        }

        if (!data || data.length === 0) break;

        allItems = allItems.concat(data);
        console.log(`   Fetched page ${page}: ${data.length} items (Total: ${allItems.length})`);

        if (data.length < PAGE_SIZE) break;
        page++;
    }

    console.log(`📦 Loaded ${allItems.length} items from database.`);

    // 2. Group by Name
    const groups: Record<string, any[]> = {};
    for (const item of allItems) {
        if (!groups[item.name]) groups[item.name] = [];
        groups[item.name].push(item);
    }

    let mergedCount = 0;
    let deletedCount = 0;

    // 3. Analyze Groups
    for (const [name, items] of Object.entries(groups)) {
        if (items.length < 2) continue;

        // Sort: Winner first (Standardized + Newest)
        items.sort((a, b) => {
            const aIsStandard = a.micronutrients?._meta_source === 'usda_100g_standard';
            const bIsStandard = b.micronutrients?._meta_source === 'usda_100g_standard';

            if (aIsStandard && !bIsStandard) return -1;
            if (!aIsStandard && bIsStandard) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const winner = items[0];
        const losers = items.slice(1);

        // console.log(`   Merging duplicates for: "${name}" (${items.length} total)`);
        // console.log(`      Winner: ${winner.id} (${winner.micronutrients?._meta_source})`);

        for (const loser of losers) {
            // A. Re-link Ingredients
            const { error: relinkError } = await supabase
                .from('ingredients')
                .update({ food_item_id: winner.id })
                .eq('food_item_id', loser.id);

            if (relinkError) {
                console.error(`      ❌ Failed to re-link ingredients for ${loser.id}: ${relinkError.message}`);
                continue; // Skip deletion if re-link failed
            }

            // B. Delete Loser
            const { error: delError } = await supabase
                .from('food_items')
                .delete()
                .eq('id', loser.id);

            if (delError) {
                console.error(`      ❌ Failed to delete duplicate ${loser.id}: ${delError.message}`);
            } else {
                deletedCount++;
            }
        }
        mergedCount++;
    }

    console.log(`\n🎉 Merge Complete!`);
    console.log(`   - Food Groups Merged:    ${mergedCount}`);
    console.log(`   - Duplicate Rows Deleted: ${deletedCount}`);
    console.log(`   - Database is now fully normalized.`);
}

mergeAndCleanup();
