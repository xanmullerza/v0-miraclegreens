import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DELAY_MS = 1000; // Moderate delay

async function importMeasures() {
    console.log("📏 Starting Measure Import from USDA...");

    // 1. Fetch all items with FDC IDs
    const { data: items, error } = await supabase
        .from('food_items')
        .select('id, name, micronutrients')
        .not('micronutrients', 'is', null);

    if (error || !items) {
        console.error("❌ DB Error:", error);
        return;
    }

    console.log(`📦 Found ${items.length} items to check.`);

    // Filter for ones that have an FDC ID
    const validItems = items.filter(i => i.micronutrients?._meta_fdc_id);
    console.log(`🔍 ${validItems.length} items have USDA IDs.`);

    let processed = 0;
    let addedMeasures = 0;

    for (const item of validItems) {
        const fdcId = item.micronutrients._meta_fdc_id;

        // Skip if we already have measures (optimization check)
        const { count } = await supabase
            .from('food_measures')
            .select('id', { count: 'exact', head: true })
            .eq('food_item_id', item.id);

        if (count && count > 0) {
            process.stdout.write('.'); // Skip visual
            continue;
        }

        // Fetch USDA Details
        try {
            const res = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`);
            if (!res.ok) {
                if (res.status === 429) {
                    console.log("\n⏳ Rate limit hit. Waiting 30s...");
                    await new Promise(r => setTimeout(r, 30000));
                    continue; // Retry next loop? Actually skips this item. Safe enough.
                }
                continue;
            }

            const data = await res.json();
            const portions = data.foodPortions || [];

            if (portions.length === 0) {
                // Foundation foods sometimes don't have portions.
                // We can't do much unless we use a "density" map, but let's stick to official data first.
                // process.stdout.write('x');
            } else {
                // Determine best portions
                const meaningfulPortions = portions.filter((p: any) =>
                    p.gramWeight > 0 &&
                    p.modifier &&
                    p.modifier !== "quantity not specified"
                );

                for (const p of meaningfulPortions) {
                    // Create label: "1 cup" or "1 slice"
                    // USDA formats: amount=1, modifier="cup", gramWeight=240

                    let label = p.modifier;
                    // Clean up label
                    label = label.toLowerCase();

                    // If amount is not 1, maybe include it? Usually we normalize to "1 unit"
                    // But if USDA says "1 cup = 240g", we store label="cup", weight=240
                    // If USDA says "0.5 cup = 120g", we calculate for 1 unit used in our UI?
                    // For simplicity, let's store exactly what USDA says, but normalized to 1 unit if possible.

                    // Actually, simpler: Store the unit label (e.g. "cup") and the weight of 1 of those units.
                    // If USDA says "0.5 cup = 60g", then "1 cup = 120g".

                    if (p.amount > 0) {
                        const weightPerUnit = p.gramWeight / p.amount;
                        const unitLabel = label; // e.g. "cup"

                        // Insert
                        await supabase.from('food_measures').insert({
                            food_item_id: item.id,
                            label: unitLabel,
                            weight_g: weightPerUnit
                        });
                        addedMeasures++;
                    }
                }
                // process.stdout.write('+');
            }
        } catch (err) {
            console.error("\nAPI Error:", err);
        }

        processed++;
        if (processed % 10 === 0) console.log(`\nVerified ${processed}/${validItems.length} items... (+${addedMeasures} measures)`);

        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log(`\n✅ Done! Added ${addedMeasures} new measures.`);
}

importMeasures();
