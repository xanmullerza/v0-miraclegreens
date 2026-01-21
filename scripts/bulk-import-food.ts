
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Force load env
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY || !USDA_API_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_PATH = 'Food_Macros.csv';
// Rate limit: 1000 per hour => ~16 per minute => ~1 per 3.6 seconds.
// We'll go slightly conservative: 1 request every 4 seconds.
const DELAY_MS = 4000;

// Helper to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Parse CSV line respecting quotes
function parseCsvLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Convert common units to kJ
function kJFromKcal(kcal: number) {
    return Math.round(kcal * 4.184);
}

// Search USDA
async function searchUSDA(query: string) {
    // Sanitize query for USDA API (Fix 400 Errors)
    // Remove special chars that might break the URL or search
    const cleanQuery = query.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(cleanQuery)}&pageSize=5&dataType=Foundation,SR Legacy`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`USDA API Status: ${res.status}`);
        const data = await res.json();
        return data.foods || [];
    } catch (err) {
        console.error(`USDA Error for ${query} (Clean: ${cleanQuery}):`, err);
        return [];
    }
}

// Get detailed info for a specific FDC ID
async function getUSDADetails(fdcId: number) {
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`USDA Details API Status: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`USDA Details Error for ${fdcId}:`, err);
        return null;
    }
}


// Normalize macros to per 100g/ml if possible, but for search comparison we look for "ratio" similarity
// Target is checking if "Protein" is high or low compared to total calories
function getMacroProfile(cals: number, p: number, c: number, f: number) {
    if (cals === 0) return { p: 0, c: 0, f: 0 };
    return {
        p: (p * 4) / cals,
        c: (c * 4) / cals,
        f: (f * 9) / cals
    };
}

async function processRow(row: string[], rowIndex: number) {
    // Columns: Food Item, Calories, Carbs (g), Fat (g), Protein (g)
    const name = row[0];
    const cals = parseFloat(row[1]) || 0;
    const carbs = parseFloat(row[2]) || 0;
    const fats = parseFloat(row[3]) || 0;
    const protein = parseFloat(row[4]) || 0;
    const kj = kJFromKcal(cals);

    console.log(`[${rowIndex}] Processing: ${name} (C:${cals} P:${protein} F:${fats} C:${carbs})`);

    // 1. Search USDA
    const results = await searchUSDA(name);

    // 2. Find best match based on MACRO IDENTITY (Fingerprinting)
    let bestMatch = null;
    let bestScore = -Infinity; // Higher is better (Cosine Similarity)

    // Normalize user name for checking
    const targetName = name.toLowerCase().replace(/[^\w\s]/g, '');
    const isRaw = targetName.includes('raw');
    const isCooked = targetName.includes('cooked') || targetName.includes('roasted') || targetName.includes('boiled') || targetName.includes('fried');

    // Calculate User's Macro Vector (Normalized to length 1)
    // Vector = [Protein, Fat, Carbs]
    const vecUser = [protein, fats, carbs];
    // We compare macro ratios to find the "closest" food variant
    const targetProfile = getMacroProfile(cals, protein, carbs, fats);
    const magUser = Math.sqrt(vecUser[0] * vecUser[0] + vecUser[1] * vecUser[1] + vecUser[2] * vecUser[2]);

    // Penalize undesirable words unless expected
    // e.g. "Overripe" should be avoided if user just said "Banana"
    const PENALTY_WORDS = [
        'overripe', 'powder', 'baby food', 'juice', 'sauce', 'prepared with', 'mix', 'dip', 'spread',
        'mcdonalds', 'kraft', 'tostitos', 'campbells', 'kelloggs', 'tacobell', 'wendys', 'burger king',
        'pizza hut', 'dominos', 'starbucks', 'dunkin'
    ];

    // Store ALL valid candidates in an array, sorted by score
    const scoredCandidates = results.map((item: any) => {
        const desc = item.description.toLowerCase();

        // A. Basic Name Safety
        // If user says "Raw", result MUST NOT be "Cooked"
        if (isRaw && (desc.includes('cooked') || desc.includes('roasted') || desc.includes('fried'))) return null;
        if (isCooked && desc.includes('raw')) return null;

        // B. Keyword Check (Relaxed)
        // Ensure at least one MAJOR noun matches (e.g. "Chicken")
        // We split by space and check if *some* significant word matches
        const coreWords = targetName.split(' ').filter(w => w.length > 3);
        const hasCoreMatch = coreWords.some(w => desc.includes(w));
        if (!hasCoreMatch && coreWords.length > 0) return null;

        // C. Penalty Checks
        let penalty = 0;
        for (const badWord of PENALTY_WORDS) {
            if (desc.includes(badWord) && !targetName.includes(badWord)) {
                penalty += 0.3; // Check matches for undesired adjectives
            }
        }

        // Prefer "Standard" items (SR Legacy usually better than Foundation for generic)
        // Adjust score if description is excessively long (often means hyper-specific scientific sample)
        if (desc.length > 60) penalty += 0.1;

        // Specific bonus for "Chicken Breast"
        if (targetName.includes('chicken breast') && desc.includes('breast') && desc.indexOf('breast') < 15) {
            penalty -= 0.1; // Small bonus for early "breast" in chicken
        }

        // Extract macros
        const getNutrient = (id: number) => {
            const n = item.foodNutrients.find((x: any) => x.nutrientId === id);
            return n ? n.value : 0;
        };

        const iCals = getNutrient(1008) || getNutrient(208) || 1;
        const iProt = getNutrient(1003) || getNutrient(203) || 0;
        const iFat = getNutrient(1004) || getNutrient(204) || 0;
        const iCarb = getNutrient(1005) || getNutrient(205) || 0;

        // D. Macro Fingerprint (Cosine Sim)
        // This compares the *Direction* of the vector (Identity) regardless of Magnitude (Serving Size)
        const vecItem = [iProt, iFat, iCarb];
        const magItem = Math.sqrt(vecItem[0] * vecItem[0] + vecItem[1] * vecItem[1] + vecItem[2] * vecItem[2]);

        let similarity = 0;
        if (magUser > 0 && magItem > 0) {
            const dotProduct = vecUser[0] * vecItem[0] + vecUser[1] * vecItem[1] + vecUser[2] * vecItem[2];
            similarity = dotProduct / (magUser * magItem);
        } else if (magUser === 0 && magItem === 0) {
            // Both are water/salt (no macros). Match!
            similarity = 1;
        } else {
            // One has macros, one doesn't. Bad match.
            similarity = 0;
        }

        // Penalties/Bonuses
        // Bonus for name matching MORE words
        const matchCount = coreWords.filter(w => desc.includes(w)).length;
        const nameScore = matchCount / (coreWords.length || 1);

        // Weighted Ranking:
        // 60% Macro Identity
        // 40% Name match
        // Minus penalties
        const finalScore = (similarity * 0.6) + (nameScore * 0.4) - penalty;

        return { ...item, _macros: { iCals, iProt, iFat, iCarb }, _score: finalScore, _sim: similarity };
    }).filter((x: any) => x !== null).sort((a: any, b: any) => b._score - a._score);

    // Try candidates in order until one has valid details
    let finalDetails = null;
    let chosenMatch = null;

    for (const match of scoredCandidates) {
        if (match._sim < 0.70) continue; // Skip bad identity matches

        console.log(`   -> Trying: "${match.description}" (Score: ${(match._score * 100).toFixed(0)}%)`);
        const details = await getUSDADetails(match.fdcId);

        if (details) {
            finalDetails = details;
            chosenMatch = match;
            break; // Found one!
        }
        console.log(`   -> ⚠️ FDC ID ${match.fdcId} failed (404/Error). Trying next best...`);
    }

    if (!chosenMatch || !finalDetails) {
        console.log(`   -> ⚠️ SKIPPING: No valid match found for "${name}"`);
        return;
    }

    console.log(`   -> MATCHED: "${chosenMatch.description}" (Match Score: ${(chosenMatch._score * 100).toFixed(0)}% | Identity: ${(chosenMatch._sim * 100).toFixed(0)}%)`);

    // 3. Fetch Full Details for Micronutrients - AND MACROS!
    const details = await getUSDADetails(chosenMatch.fdcId);
    if (!details) return;

    const nutrients = details.foodNutrients || [];

    // Helper: Find value by ID (with fallbacks for different USDA databases)
    const getValue = (nIds: number[]) => {
        for (const nId of nIds) {
            const n = nutrients.find((x: any) => x.nutrient?.id === nId || x.nutrient?.number === nId.toString());
            if (n && n.amount > 0) return n.amount;
        }
        return 0;
    };

    // 4. EXTRACT VALUES FROM USDA (Per 100g Standard)
    // We overwrite the user's input with the standardized values.
    // USDA uses different nutrient IDs across databases (Foundation vs SR Legacy)
    const usdaCals = getValue([2047, 2048, 1008, 208]); // Energy - multiple formats
    const usdaProt = getValue([1003, 203]); // Protein
    const usdaFat = getValue([1004, 204]); // Total lipid (fat)
    const usdaCarb = getValue([1005, 205]); // Carbohydrate
    const usdaKj = Math.round(usdaCals * 4.184);

    console.log(`   -> 📏 NORMALIZING: User Input (${cals} kcal) replaced by USDA 100g Standard (${usdaCals} kcal).`);

    // 5. Map Micronutrients
    const NUTRIENT_MAP: Record<string, number> = {
        'Vitamin A': 318, 'Vitamin C': 401, 'Vitamin D': 324, 'Vitamin E': 323, 'Vitamin K': 430,
        'Thiamine': 404, 'Riboflavin': 405, 'Niacin': 406, 'Vitamin B6': 415, 'Folate': 417, 'Vitamin B12': 418,
        'Calcium': 301, 'Iron': 303, 'Magnesium': 304, 'Phosphorus': 305, 'Potassium': 306, 'Sodium': 307,
        'Zinc': 309, 'Copper': 312, 'Manganese': 315, 'Selenium': 317, 'Cholesterol': 601, 'Fiber': 291,
        'Sugar': 269
    };

    const micros: any = {};
    for (const [key, id] of Object.entries(NUTRIENT_MAP)) {
        const val = getValue([id]); // Use array format for consistency
        if (val > 0) micros[key] = val;
    }

    // 6. Insert into Database using USDA VALUES
    const finalMicros = {
        ...micros,
        _meta_fdc_id: chosenMatch.fdcId,
        _meta_source: 'usda_100g_standard', // Mark as standardized
        _meta_original_name: name // Keep user name for reference
    };

    // Check if item exists to update or insert? (We assume insert for bulk import, maybe delete first?)
    // For now, simple insert. The 'revert' script cleans up.

    // We use the USER NAME (so it's readable in inventory) but USDA MACROS.
    const { error } = await supabase.from('food_items').insert({
        name: name,
        energy_kcal: usdaCals,
        energy_kj: usdaKj,
        protein_g: usdaProt,
        carbs_g: usdaCarb,
        fat_g: usdaFat,
        micronutrients: finalMicros
    });

    if (error) {
        console.error('   -> DB Insert Error:', error.message);
    } else {
        console.log('   -> Saved 100g Standard to DB ✅');
    }
}

async function main() {
    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Skip header and process checks
    // We process in chunks to avoid overwhelming anything locally, though rate limit is key.
    // Start from index 1 (skip header)

    const BATCH_SIZE = 100; // Next 100 items
    let processedCount = 0;

    console.log(`Found ${lines.length - 1} items. Starting Items 201-300 | WHOLE FOODS & STAPLES PRIORITY...`);

    // Resume from index 201 (Process 201-300)
    for (let i = 201; i < lines.length; i++) {
        if (processedCount >= BATCH_SIZE) {
            console.log('--- Batch limit (100) reached. ---');
            break;
        }

        const row = parseCsvLine(lines[i]);
        if (row.length < 5) continue;

        await processRow(row, i);
        processedCount++;
        await delay(DELAY_MS);
    }
}

main().catch(console.error);
