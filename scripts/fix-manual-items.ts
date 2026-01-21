import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchAndUpdate(itemName: string, searchQuery: string) {
    console.log(`\n🔍 Searching USDA for: "${searchQuery}"`);

    // 1. Search USDA
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=5&dataType=Foundation,SR Legacy`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
        console.error(`❌ Search failed: ${searchRes.status}`);
        return;
    }

    const searchData = await searchRes.json();
    const foods = searchData.foods || [];

    if (foods.length === 0) {
        console.error(`❌ No results found for "${searchQuery}"`);
        return;
    }

    // Take the first result
    const match = foods[0];
    console.log(`   Found: "${match.description}" (FDC ID: ${match.fdcId})`);

    // 2. Fetch details
    const detailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${match.fdcId}?api_key=${USDA_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);

    if (!detailsRes.ok) {
        console.error(`❌ Details fetch failed: ${detailsRes.status}`);
        return;
    }

    const details = await detailsRes.json();
    const nutrients = details.foodNutrients || [];

    // Helper with new logic
    const getValue = (nIds: number[]) => {
        for (const nId of nIds) {
            const n = nutrients.find((x: any) => x.nutrient?.id === nId);
            if (n && n.amount > 0) return n.amount;
        }
        return 0;
    };

    // Extract macros
    const usdaCals = getValue([2047, 2048, 1008, 208]);
    const usdaProt = getValue([1003, 203]);
    const usdaFat = getValue([1004, 204]);
    const usdaCarb = getValue([1005, 205]);
    const usdaKj = Math.round(usdaCals * 4.184);

    console.log(`   ✅ Extracted: ${usdaCals} kcal, P:${usdaProt}g, F:${usdaFat}g, C:${usdaCarb}g`);

    // 3. Get existing micronutrients and update metadata
    const { data: existing } = await supabase
        .from('food_items')
        .select('micronutrients')
        .eq('name', itemName)
        .single();

    const micros = existing?.micronutrients || {};
    micros._meta_fdc_id = match.fdcId;
    micros._meta_source = 'usda_100g_standard';
    micros._meta_original_name = itemName;

    // 4. Update the database
    const { error: updateError } = await supabase
        .from('food_items')
        .update({
            energy_kcal: usdaCals,
            energy_kj: usdaKj,
            protein_g: usdaProt,
            fat_g: usdaFat,
            carbs_g: usdaCarb,
            micronutrients: micros
        })
        .eq('name', itemName);

    if (updateError) {
        console.error(`❌ Update Error: ${updateError.message}`);
    } else {
        console.log(`   💾 Updated "${itemName}" in DB!`);
    }
}

async function main() {
    console.log("🔧 Fixing Bay Leaf and Lemon Zest...\n");

    await searchAndUpdate("Bay leaf dried", "Spices bay leaf");
    await new Promise(resolve => setTimeout(resolve, 2000));

    await searchAndUpdate("Lemon zest", "lemon zest");

    console.log("\n✅ Done!");
}

main().catch(console.error);
