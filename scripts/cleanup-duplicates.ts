import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function removeDuplicates() {
    console.log("🧹 Starting Safe Deduplication Process...");

    // 1. Fetch all items (Name, ID, Source, CreatedAt)
    // We need to fetch all to group them in memory (1884 items is small enough for memory)
    const { data: allItems, error } = await supabase
        .from('food_items')
        .select('id, name, created_at, micronutrients');

    if (error) {
        console.error("❌ Error fetching items:", error);
        return;
    }

    console.log(`📦 Loaded ${allItems.length} items from database.`);

    // 2. Group by Name
    const groups: Record<string, any[]> = {};
    for (const item of allItems) {
        const name = item.name; // Case sensitive grouping? Or normalize? Let's assume names are exact from CSV.
        if (!groups[name]) groups[name] = [];
        groups[name].push(item);
    }

    const idsToDelete: string[] = [];
    let keptCount = 0;
    let duplicateGroupsFound = 0;

    // 3. Analyze Groups
    for (const [name, items] of Object.entries(groups)) {
        if (items.length === 1) {
            keptCount++;
            continue; // Unique item, nothing to do
        }

        duplicateGroupsFound++;

        // Sort items to prioritize the best one
        // Priority 1: Has 'usda_100g_standard' tag
        // Priority 2: Latest created_at
        items.sort((a, b) => {
            const aIsStandard = a.micronutrients?._meta_source === 'usda_100g_standard';
            const bIsStandard = b.micronutrients?._meta_source === 'usda_100g_standard';

            if (aIsStandard && !bIsStandard) return -1; // a comes first (keep)
            if (!aIsStandard && bIsStandard) return 1;  // b comes first (keep)

            // If both same status, prefer NEWER
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // The first item is the "Winner"
        const winner = items[0];
        const losers = items.slice(1);

        // console.log(`   Duplicate: "${name}" (${items.length} copies) -> Keeping ID: ${winner.id}`);

        for (const loser of losers) {
            idsToDelete.push(loser.id);
        }
        keptCount++;
    }

    console.log(`\n📊 Analysis Complete:`);
    console.log(`   - Unique Groups (Foods): ${keptCount}`);
    console.log(`   - Duplicate Groups:      ${duplicateGroupsFound}`);
    console.log(`   - Rows to DELETE:        ${idsToDelete.length}`);

    if (idsToDelete.length === 0) {
        console.log("✅ No duplicates found! Table is clean.");
        return;
    }

    // 4. Batch Delete
    console.log(`\n🗑️  Deleting ${idsToDelete.length} duplicate rows...`);

    // Delete in chunks of 100 to be safe
    const CHUNK_SIZE = 100;
    for (let i = 0; i < idsToDelete.length; i += CHUNK_SIZE) {
        const chunk = idsToDelete.slice(i, i + CHUNK_SIZE);
        const { error: delError } = await supabase
            .from('food_items')
            .delete()
            .in('id', chunk);

        if (delError) {
            console.error(`❌ Error deleting chunk ${i}:`, delError.message);
        } else {
            console.log(`   - Deleted rows ${i + 1} to ${Math.min(i + CHUNK_SIZE, idsToDelete.length)}`);
        }
    }

    console.log("\n🎉 Cleanup Finished! The table contains only unique, standardized items.");
}

removeDuplicates();
