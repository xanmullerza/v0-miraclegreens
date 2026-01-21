import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Items to fix (name from DB -> FDC ID from previous match)
const BROKEN_ITEMS = [
    { name: "Almonds raw", dbName: "Almonds raw" },
    { name: "Sweet potato raw", dbName: "Sweet potato raw" },
    { name: "Potato raw, with skin", dbName: "Potato raw, with skin" },
    { name: "Black beans canned, low-sodium, drained", dbName: "Black beans canned, low-sodium, drained" },
    { name: "Asparagus raw", dbName: "Asparagus raw" }
];

async function fixItem(itemName: string) {
    console.log(`\n🔧 Fixing: ${itemName}`);

    // 1. Get the item from DB to find the FDC ID
    const { data: items, error: fetchError } = await supabase
        .from('food_items')
        .select('*')
        .eq('name', itemName)
        .limit(1);

    if (fetchError || !items || items.length === 0) {
        console.error(`❌ Could not find item in DB: ${itemName}`);
        return;
    }

    const item = items[0];
    const fdcId = item.micronutrients?._meta_fdc_id;

    if (!fdcId) {
        console.error(`❌ No FDC ID found for: ${itemName}`);
        return;
    }

    console.log(`   Found FDC ID: ${fdcId}`);

    // 2. Fetch fresh data from USDA
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
        console.error(`❌ USDA API Error: ${res.status}`);
        return;
    }

    const details = await res.json();
    const nutrients = details.foodNutrients || [];

    // Helper with new logic
    const getValue = (nIds: number[]) => {
        for (const nId of nIds) {
            const n = nutrients.find((x: any) => x.nutrient?.id === nId);
            if (n && n.amount > 0) return n.amount;
        }
        return 0;
    };

    // Extract macros with new IDs
    const usdaCals = getValue([2047, 2048, 1008, 208]);
    const usdaProt = getValue([1003, 203]);
    const usdaFat = getValue([1004, 204]);
    const usdaCarb = getValue([1005, 205]);
    const usdaKj = Math.round(usdaCals * 4.184);

    console.log(`   ✅ Extracted: ${usdaCals} kcal, P:${usdaProt}g, F:${usdaFat}g, C:${usdaCarb}g`);

    // 3. Update the database
    const { error: updateError } = await supabase
        .from('food_items')
        .update({
            energy_kcal: usdaCals,
            energy_kj: usdaKj,
            protein_g: usdaProt,
            fat_g: usdaFat,
            carbs_g: usdaCarb
        })
        .eq('name', itemName);

    if (updateError) {
        console.error(`❌ Update Error: ${updateError.message}`);
    } else {
        console.log(`   💾 Updated in DB!`);
    }
}

async function main() {
    console.log("🔧 Fixing 5 broken items with missing USDA nutrients...\n");

    for (const item of BROKEN_ITEMS) {
        await fixItem(item.dbName);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Small delay
    }

    console.log("\n✅ Done!");
}

main().catch(console.error);
