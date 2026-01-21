import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createInterface } from 'readline';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FIX_LIST = [
    { name: "Mocha powder mix with whitener, with low-calorie sweetener", query: "Coffee instant with whitener" },
    { name: "Apples cooked, boiled, peeled", query: "Apples cooked without skin" },
    { name: "Sweet potato raw", query: "Sweet potato raw" },
    { name: "Curry paste", query: "Curry powder" }, // USDA doesn't have paste, powder is closest proxy
    { name: "Green hot chili peppers canned, pods, seedless, solids and liquids", query: "Peppers chili green canned" },
    { name: "Pinto beans raw, mature", query: "Beans pinto mature raw" },
    { name: "Olive oil", query: "Oil olive salad or cooking" } // Fix the mayo match
];

async function fixSpecificItems() {
    console.log("🔧 Starting Targeted Corrections...");

    for (const item of FIX_LIST) {
        console.log(`\n🔎 Fixing: "${item.name}"`);
        console.log(`   Running Query: "${item.query}"`);

        // 1. Search USDA
        const searchRes = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(item.query)}&pageSize=3`
        );
        const searchData = await searchRes.json();
        const foods = searchData.foods || [];

        if (foods.length === 0) {
            console.log("   ❌ No USDA match found.");
            continue;
        }

        const match = foods[0];
        console.log(`   ✅ Found: "${match.description}" (FDC: ${match.fdcId})`);

        // 2. Fetch Details
        const detailsRes = await fetch(
            `https://api.nal.usda.gov/fdc/v1/food/${match.fdcId}?api_key=${USDA_API_KEY}`
        );
        const details = await detailsRes.json();
        const nutrients = details.foodNutrients || [];

        // 3. Extract Macros
        const getValue = (nIds: number[]) => {
            for (const nId of nIds) {
                const n = nutrients.find((x: any) => x.nutrient?.id === nId || x.nutrient?.number === nId.toString());
                if (n && n.amount > 0) return n.amount;
            }
            return 0;
        };

        const usdaCals = getValue([2047, 2048, 1008, 208]);
        const usdaProt = getValue([1003, 203]);
        const usdaFat = getValue([1004, 204]);
        const usdaCarb = getValue([1005, 205]);
        const usdaKj = Math.round(usdaCals * 4.184);

        console.log(`   📝 Updating DB: ${usdaCals} kcal/100g`);

        // 4. Update Database
        const { error } = await supabase
            .from('food_items')
            .update({
                energy_kcal: usdaCals,
                energy_kj: usdaKj,
                protein_g: usdaProt,
                fat_g: usdaFat,
                carbs_g: usdaCarb,
                // Update metadata to reflect manual fix
                micronutrients: {
                    _meta_fdc_id: match.fdcId,
                    _meta_source: 'usda_100g_standard_FIXED',
                    _meta_original_name: item.name
                }
            })
            .eq('name', item.name);

        if (error) console.error(`   ❌ DB Error: ${error.message}`);
        else console.log("   💾 Saved!");

        // Rate limit
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log("\n✅ All corrections done.");
}

fixSpecificItems();
