import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DELAY_MS = 4000; // 4s delay for rate limits
const NUTRIENT_MAP: Record<string, number> = {
    'Calcium': 1087,
    'Iron': 1089,
    'Magnesium': 1090,
    'Phosphorus': 1091,
    'Potassium': 1092,
    'Sodium': 1093,
    'Zinc': 1095,
    'Vitamin C': 1162,
    'Vitamin B-12': 1178,
    'Vitamin A': 1106,
    'Vitamin D': 1114,
    'Vitamin E': 1109,
    'Folate': 1177,
    'Fiber': 1079,
    'Sugar': 2000
};

// --- USDA SEARCH & MATCH LOGIC (Reused/Simplified) ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function kJFromKcal(kcal: number) {
    return Math.round(kcal * 4.184);
}

// 1. Search USDA
async function searchUSDA(query: string) {
    const cleanQuery = query.replace(/[^\w\s]/g, '').trim();
    if (!cleanQuery) return [];

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(cleanQuery)}&pageSize=8&dataType=Foundation,SR Legacy`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Error: USDA Search API Status: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return data.foods || [];
    } catch (err) {
        console.error("USDA Search Failed:", err);
        return [];
    }
}

// 2. Process a single item
async function processItem(item: any) {
    const name = item.name;
    const cals = item.energy_kcal || 0;
    const protein = item.protein_g || 0;
    const fats = item.fat_g || 0;
    const carbs = item.carbs_g || 0;

    console.log(`\nProcessing: ${name} (C:${cals} P:${protein} F:${fats} C:${carbs})`);

    // Search USDA
    const results = await searchUSDA(name);

    // Find Match (Simplified Macro Identity)
    // We reuse the core logic but simplified for brevity
    let bestMatch = null;
    let bestScore = -Infinity;

    const targetName = name.toLowerCase().replace(/[^\w\s]/g, '');
    const vecUser = [protein, fats, carbs];
    const magUser = Math.sqrt(vecUser[0] ** 2 + vecUser[1] ** 2 + vecUser[2] ** 2);

    const PENALTY_WORDS = ['overripe', 'powder', 'baby food', 'juice', 'sauce', 'prepared with', 'mix', 'dip', 'spread'];

    const scoredCandidates = results.map((r: any) => {
        const desc = r.description.toLowerCase();

        // Basic filter
        if (targetName.includes('raw') && desc.includes('cooked')) return null;
        if (targetName.includes('cooked') && desc.includes('raw')) return null;

        // Penalty check
        let penalty = 0;
        for (const w of PENALTY_WORDS) {
            if (desc.includes(w) && !targetName.includes(w)) penalty += 0.3;
        }

        // Macros
        const getNutrient = (id: number) => {
            const n = r.foodNutrients.find((x: any) => x.nutrientId === id);
            return n ? n.value : 0;
        };
        const iProt = getNutrient(1003) || getNutrient(203) || 0;
        const iFat = getNutrient(1004) || getNutrient(204) || 0;
        const iCarb = getNutrient(1005) || getNutrient(205) || 0;

        const vecItem = [iProt, iFat, iCarb];
        const magItem = Math.sqrt(vecItem[0] ** 2 + vecItem[1] ** 2 + vecItem[2] ** 2);

        // Cosine Similarity
        let similarity = 0;
        if (magUser > 0 && magItem > 0) {
            const dot = vecUser[0] * vecItem[0] + vecUser[1] * vecItem[1] + vecUser[2] * vecItem[2];
            similarity = dot / (magUser * magItem);
        } else if (magUser === 0 && magItem === 0) {
            similarity = 1;
        }

        // Name Similarity (Jaccard)
        const s1 = new Set(targetName.split(' '));
        const s2 = new Set(desc.split(' '));
        const intersection = new Set([...s1].filter(x => s2.has(x)));
        const union = new Set([...s1, ...s2]);
        const nameSim = intersection.size / union.size;

        const totalScore = (similarity * 0.7) + (nameSim * 0.3) - penalty;

        return { item: r, score: totalScore, identity: Math.round(similarity * 100) };
    }).filter((x: any) => x !== null);

    scoredCandidates.sort((a: any, b: any) => b.score - a.score);

    if (scoredCandidates.length > 0 && scoredCandidates[0].score > 0.65) {
        bestMatch = scoredCandidates[0];
    }

    if (!bestMatch) {
        console.log(`   -> ⚠️ SKIPPING: No valid match found.`);
        return;
    }

    console.log(`   -> MATCHED: "${bestMatch.item.description}" (Score: ${Math.round(bestMatch.score * 100)}%)`);

    // Fetch Details & Update
    const detailsUrl = `https://api.nal.usda.gov/fdc/v1/food/${bestMatch.item.fdcId}?api_key=${USDA_API_KEY}`;
    const dRes = await fetch(detailsUrl);
    if (!dRes.ok) {
        console.error("   -> USDA Details Error");
        return;
    }
    const details = await dRes.json();
    const nutrients = details.foodNutrients || [];

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

    console.log(`   -> 📏 NORMALIZING: User Input (${cals} kcal) replaced by USDA 100g Standard (${usdaCals} kcal).`);

    const micros: any = item.micronutrients || {};
    for (const [key, id] of Object.entries(NUTRIENT_MAP)) {
        const val = getValue([id]);
        if (val > 0) micros[key] = val;
    }

    micros._meta_fdc_id = bestMatch.item.fdcId;
    micros._meta_source = 'usda_100g_standard';
    micros._meta_original_name = name;

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
        .eq('id', item.id);

    if (updateError) console.error("   -> DB Error:", updateError.message);
    else console.log("   -> Saved 100g Standard to DB ✅");
}


// --- MAIN LOOP ---

async function cleanup() {
    console.log("🧹 Starting Clean-Up Pass for Unprocessed Items...");

    // 1. Fetch pending items
    const { data: pendingItems, error } = await supabase
        .from('food_items')
        .select('*')
        .not('micronutrients->_meta_source', 'eq', '"usda_100g_standard"') // Note: JSONB query syntax
        .limit(100); // Check 100 at a time to be safe

    if (error) {
        console.error("Error fetching pending items:", error);
        return;
    }

    if (!pendingItems || pendingItems.length === 0) {
        console.log("🎉 No pending items found! The database is clean.");
        return;
    }

    console.log(`found ${pendingItems.length} unmatched items in this batch.`);

    for (const item of pendingItems) {
        await processItem(item);
        await delay(DELAY_MS);
    }

    console.log("\n✅ Clean-up batch complete. Run again if more items remain.");
}

cleanup();
