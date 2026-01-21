import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixLemonZest() {
    // Search for "lemon peel raw"
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=lemon%20peel%20raw&pageSize=5&dataType=Foundation,SR Legacy`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    console.log("\n🔍 Search results for 'lemon peel raw':");
    data.foods.slice(0, 3).forEach((f: any, i: number) => {
        console.log(`${i + 1}. ${f.description} (FDC: ${f.fdcId})`);
    });

    // Use the first match
    const match = data.foods[0];
    const fdcId = match.fdcId;

    // Fetch details
    const detailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();
    const nutrients = details.foodNutrients || [];

    const getValue = (nIds: number[]) => {
        for (const nId of nIds) {
            const n = nutrients.find((x: any) => x.nutrient?.id === nId);
            if (n && n.amount > 0) return n.amount;
        }
        return 0;
    };

    const usdaCals = getValue([2047, 2048, 1008, 208]);
    const usdaProt = getValue([1003, 203]);
    const usdaFat = getValue([1004, 204]);
    const usdaCarb = getValue([1005, 205]);
    const usdaKj = Math.round(usdaCals * 4.184);

    console.log(`\n✅ Using: "${match.description}"`);
    console.log(`   Macros: ${usdaCals} kcal, P:${usdaProt}g, F:${usdaFat}g, C:${usdaCarb}g`);

    // Update DB
    const { data: existing } = await supabase
        .from('food_items')
        .select('micronutrients')
        .eq('name', 'Lemon zest')
        .single();

    const micros = existing?.micronutrients || {};
    micros._meta_fdc_id = fdcId;

    await supabase.from('food_items').update({
        energy_kcal: usdaCals,
        energy_kj: usdaKj,
        protein_g: usdaProt,
        fat_g: usdaFat,
        carbs_g: usdaCarb,
        micronutrients: micros
    }).eq('name', 'Lemon zest');

    console.log(`   💾 Updated!`);
}

fixLemonZest().catch(console.error);
