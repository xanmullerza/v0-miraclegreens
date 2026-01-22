import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DELAY_MS = 500; // Faster batching

async function importRemainingMeasures() {
    console.log("📏 Starting Part 2: Importing Remaining Measures...");

    // 1. Get IDs of items that ALREADY have measures to avoid double-checking
    const { data: existingMeasures } = await supabase
        .from('food_measures')
        .select('food_item_id');
    const processedIds = new Set(existingMeasures?.map(m => m.food_item_id));
    console.log(`💡 Skipping ${processedIds.size} items that already have measures.`);

    // 2. Fetch ALL items with FDC IDs using pagination
    let allItems: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('food_items')
            .select('id, name, micronutrients')
            .not('micronutrients', 'is', null)
            .range(page * PAGE_SIZE, (page * PAGE_SIZE) + PAGE_SIZE - 1);

        if (error) break;
        if (!data || data.length === 0) break;

        allItems = allItems.concat(data);
        if (data.length < PAGE_SIZE) break;
        page++;
    }

    // 3. Filter for items needing check
    const pendingItems = allItems.filter(i =>
        i.micronutrients?._meta_fdc_id && !processedIds.has(i.id)
    );

    console.log(`📦 Found ${pendingItems.length} items remaining to process.`);

    let addedMeasures = 0;
    let count = 0;

    for (const item of pendingItems) {
        const fdcId = item.micronutrients._meta_fdc_id;

        try {
            const res = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`);
            if (!res.ok) {
                if (res.status === 429) {
                    console.log("\n⏳ Rate limit hit. Waiting 30s...");
                    await new Promise(r => setTimeout(r, 30000));
                    continue;
                }
                continue;
            }

            const data = await res.json();
            const portions = data.foodPortions || [];

            if (portions.length > 0) {
                for (const p of portions) {
                    if (p.gramWeight > 0 && p.modifier && p.modifier !== "quantity not specified") {
                        const unitLabel = p.modifier.toLowerCase();
                        const weightPerUnit = p.gramWeight / (p.amount || 1);

                        await supabase.from('food_measures').insert({
                            food_item_id: item.id,
                            label: unitLabel,
                            weight_g: weightPerUnit
                        });
                        addedMeasures++;
                    }
                }
            }
        } catch (err) {
            console.error(`\n❌ Error processing ${item.name}:`, err);
        }

        count++;
        if (count % 20 === 0) {
            console.log(`✅ Processed ${count}/${pendingItems.length} items... (+${addedMeasures} measures)`);
        }

        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`\n🎉 Part 2 Complete! Added ${addedMeasures} new measures for the remaining items.`);
}

importRemainingMeasures();
