
import { supabase } from '@/lib/supabase';

export interface FoodItemMatch {
    id?: string;
    name: string;
    common_name?: string;
    image?: string | null; // some searches include an image URL
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients: Record<string, number>;
    phytonutrients?: Record<string, string>;
    source: 'local' | 'usda';
    fdcId?: number;
    portions?: FoodMeasure[];
}

import { FoodMeasure } from '@/lib/utils/nutrition-calculator';
export type { FoodMeasure };

// USDA API Key - Uses environment variable with fallback to DEMO_KEY
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Basic singularization for ingredient matching.
 */
function singularize(word: string): string {
    const lower = word.toLowerCase();
    if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y';
    if (lower.endsWith('es')) {
        if (lower.endsWith('atoes') || lower.endsWith('oatoes')) return lower.slice(0, -2);
        return lower.slice(0, -2);
    }
    if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1);
    return lower;
}

/**
 * Searches for food items in the local Supabase database.
 */
export async function searchLocalFood(query: string): Promise<FoodItemMatch[]> {
    const cleanQuery = query.trim().toLowerCase();

    // Skip terms that are likely non-ingredient junk from timing/headings
    const SKIP_TERMS = [
        'min', 'mins', 'minutes', 'hr', 'hour', 'hours', 'sec', 'seconds',
        'yield', 'yields', 'servings', 'makes', 'instruction', 'direction'
    ];
    if (SKIP_TERMS.includes(cleanQuery)) return [];

    // 1. Literal ilike match (First Choice)
    // This handles "Olive Oil" matching "Olive Oil" or "Some Olive Oil"
    let { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`name.ilike.%${cleanQuery}%,common_name.ilike.%${cleanQuery}%`)
        .limit(10);

    // 2. Singularization Fallback
    // If "Potatoes" yields nothing, try "Potato"
    if (!data || data.length === 0) {
        const singular = singularize(cleanQuery);
        if (singular !== cleanQuery && singular.length >= 3) {
            const { data: sData } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${singular}%,common_name.ilike.%${singular}%`)
                .limit(10);
            if (sData && sData.length > 0) data = sData;
        }
    }

    // 3. Multi-word AND Fallback
    // If "Ground Cumin" yields nothing, try name containing BOTH "Ground" AND "Cumin"
    // (This handles "Cumin, Ground" in the DB)
    if (!data || data.length === 0) {
        const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 1) {
            let chain = supabase.from('food_items').select('*');
            words.forEach(w => {
                chain = chain.or(`name.ilike.%${w}%,common_name.ilike.%${w}%`);
            });
            // Note: In Postgrest, chaining multiple .or() or .ilike() usually results in AND or OR depending on implementation.
            // For true AND word search, we use multiple filters on 'name'.

            let andChain = supabase.from('food_items').select('*');
            words.forEach(w => {
                // Postgrest allows multiple filters on same column to be ANDed
                andChain = andChain.ilike('name', `%${w}%`);
            });

            const { data: andData } = await andChain.limit(10);
            if (andData && andData.length > 0) data = andData;
        }
    }

    // 4. Last Resort: Longest Word Search
    // If "Olive Oil" still fails, try just "Olive" (or whichever word is longest/most specific)
    if (!data || data.length === 0) {
        const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
            const longestWord = words.sort((a, b) => b.length - a.length)[0];
            const { data: lwData } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${longestWord}%,common_name.ilike.%${longestWord}%`)
                .limit(10);
            if (lwData && lwData.length > 0) data = lwData;
        }
    }

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        name: item.name,
        common_name: item.common_name,
        image: item.image || null,
        energy_kcal: item.energy_kcal || Math.round((item.energy_kj || 0) / 4.184),
        energy_kj: item.energy_kj || Math.round((item.energy_kcal || 0) * 4.184),
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        micronutrients: item.micronutrients || {},
        phytonutrients: item.phytonutrients || {},
        portions: item.portions || [], // Use JSONB column
        source: 'local' as const
    })).sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aCommon = (a.common_name || "").toLowerCase();
        const bCommon = (b.common_name || "").toLowerCase();

        // 1. Literal Exact Match (Highest Priority)
        if (aName === cleanQuery || aCommon === cleanQuery) return -1;
        if (bName === cleanQuery || bCommon === cleanQuery) return 1;

        // 2. Singularized Exact Match
        const singular = singularize(cleanQuery);
        if (aName === singular || aCommon === singular) return -1;
        if (bName === singular || bCommon === singular) return 1;

        // 3. Raw/Fresh/Base Priority Boost
        // We want to prefer the base ingredient over processed versions (Baked, Cooked, Fried)
        const rawKeywords = ['raw', 'fresh', 'whole', 'unsalted'];
        const processedKeywords = ['baked', 'cooked', 'boiled', 'fried', 'roasted', 'canned', 'stewed'];

        const isAProcessed = processedKeywords.some(k => aName.includes(k));
        const isBProcessed = processedKeywords.some(k => bName.includes(k));
        const isARaw = rawKeywords.some(k => aName.includes(k));
        const isBRaw = rawKeywords.some(k => bName.includes(k));

        // If query doesn't mention a processed state, prefer raw or non-processed
        const queryIsProcessed = processedKeywords.some(k => cleanQuery.includes(k));
        if (!queryIsProcessed) {
            if (isARaw && !isBRaw) return -1;
            if (!isARaw && isBRaw) return 1;
            if (!isAProcessed && isBProcessed) return -1;
            if (isAProcessed && !isBProcessed) return 1;
        }

        // 4. StartsWith Boost
        const aStarts = aName.startsWith(cleanQuery) || aCommon.startsWith(cleanQuery);
        const bStarts = bName.startsWith(cleanQuery) || bCommon.startsWith(cleanQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 5. Word Coverage Score
        const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
        const aWordScore = queryWords.filter(w => aName.includes(w) || aCommon.includes(w)).length;
        const bWordScore = queryWords.filter(w => bName.includes(w) || bCommon.includes(w)).length;
        if (aWordScore !== bWordScore) return bWordScore - aWordScore;

        return aName.length - bName.length; // Prefer shorter names if scores tied
    });
}

/**
 * Searches for food items using the USDA FoodData Central API.
 */
const USDA_MICRO_MAP: Record<string, string> = {
    'Potassium': 'Potassium',
    'Magnesium': 'Magnesium',
    'Calcium': 'Calcium',
    'Phosphorus': 'Phosphorus',
    'Sodium': 'Sodium',
    'Iron': 'Iron',
    'Zinc': 'Zinc',
    'Selenium': 'Selenium',
    'Copper': 'Copper',
    'Manganese': 'Manganese',
    'Iodine': 'Iodine',
    'Fluoride': 'Fluoride',
    'Chromium': 'Chromium',
    'Molybdenum': 'Molybdenum',
    'Vitamin A, RAE': 'Vitamin A',  // More specific to avoid matching IU version
    'Vitamin C': 'Vitamin C',
    'Vitamin D (D2 + D3)': 'Vitamin D', // More specific
    'Vitamin E (alpha-tocopherol)': 'Vitamin E', // More specific
    'Vitamin K (phylloquinone)': 'Vitamin K',
    'Thiamin': 'B1 (Thiamine)',
    'Riboflavin': 'B2 (Riboflavin)',
    'Niacin': 'B3 (Niacin)',
    'Pantothenic acid': 'B5 (Pantothenic Acid)',
    'Vitamin B-6': 'B6 (Pyridoxine)',
    'Folate, total': 'B9 (Folate)', // More specific
    'Vitamin B-12': 'B12 (Cobalamin)',
    'Choline, total': 'Choline', // More specific
    'Fiber, total dietary': 'Fiber',
    'Ash': 'Ash',
    'Water': 'Water',
    'Alcohol, ethyl': 'Alcohol',
    'Total Sugars': 'Sugars',
    'Sucrose': 'Sucrose',
    'Glucose': 'Glucose',
    'Fructose': 'Fructose',
    'Lactose': 'Lactose',
    'Maltose': 'Maltose',
    'Galactose': 'Galactose',
    'Starch': 'Starch',
    'Cholesterol': 'Cholesterol',
    'Fatty acids, total saturated': 'Saturated Fat',
    'Fatty acids, total monounsaturated': 'Monounsaturated Fat',
    'Fatty acids, total polyunsaturated': 'Polyunsaturated Fat',
    'Fatty acids, total trans': 'Trans Fat',
    'Tryptophan': 'Tryptophan',
    'Threonine': 'Threonine',
    'Isoleucine': 'Isoleucine',
    'Leucine': 'Leucine',
    'Lysine': 'Lysine',
    'Methionine': 'Methionine',
    'Cystine': 'Cystine',
    'Phenylalanine': 'Phenylalanine',
    'Tyrosine': 'Tyrosine',
    'Valine': 'Valine',
    'Arginine': 'Arginine',
    'Histidine': 'Histidine',
    'Alanine': 'Alanine',
    'Aspartic acid': 'Aspartic acid',
    'Glutamic acid': 'Glutamic acid',
    'Glycine': 'Glycine',
    'Proline': 'Proline',
    'Serine': 'Serine',
    'Hydroxyproline': 'Hydroxyproline',
    'Retinol': 'Retinol',
    'Carotene, beta': 'Beta-carotene',
    'Carotene, alpha': 'Alpha-carotene',
    'Cryptoxanthin, beta': 'Beta-cryptoxanthin',
    'Lycopene': 'Lycopene',
    'Lutein + zeaxanthin': 'Lutein + Zeaxanthin',
    'Tocopherol, beta': 'Beta-tocopherol',
    'Tocopherol, gamma': 'Gamma-tocopherol',
    'Tocopherol, delta': 'Delta-tocopherol',
    'Caffeine': 'Caffeine',
    'Theobromine': 'Theobromine'
};

function extractUSDANutrients(foodNutrients: any[]): Record<string, number> {
    const micronutrients: Record<string, number> = {};
    if (foodNutrients) {
        foodNutrients.forEach((nut: any) => {
            const nutrientName = nut.nutrient?.name || nut.nutrientName || '';
            const amount = nut.amount ?? nut.value ?? 0;

            // Skip if no name
            if (!nutrientName) return;

            const lowerName = nutrientName.toLowerCase();

            // Skip IU (International Units) entries - we prefer µg/mg values
            // This affects Vitamin A, D, E which USDA provides in both units
            if (lowerName.includes('international units') || lowerName.includes(', iu')) {
                return;
            }

            Object.entries(USDA_MICRO_MAP).forEach(([usdaKey, ourName]) => {
                // Check if this USDA nutrient name contains our key
                if (lowerName.includes(usdaKey.toLowerCase())) {
                    // Only set if not already captured, or if new value is non-zero and old was zero
                    if (micronutrients[ourName] === undefined ||
                        (micronutrients[ourName] === 0 && amount > 0)) {
                        micronutrients[ourName] = amount;
                    }
                }
            });
        });
    }
    return micronutrients;
}

/**
 * Searches for food items using the USDA FoodData Central API.
 */
export async function searchUSDAFood(query: string): Promise<FoodItemMatch[]> {
    if (!query || query.trim().length < 2) return [];

    // Debugging: log key presence (do NOT log full key for security)
    console.log(`[USDA Search] Query: "${query}", Using Key: ${USDA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY' : 'Custom Key (Set)'}`);

    try {
        const url = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=25`;
        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[USDA API Error] Status: ${response.status} ${response.statusText}`, errText);
            return [];
        }

        const data = await response.json();

        if (!data.foods || data.foods.length === 0) {
            console.warn("[USDA Search] No foods found in response:", data);
            return [];
        }

        console.log(`[USDA Search] Found ${data.foods.length} items`);

        // Priority order for data types (lower = better)
        const dataTypePriority: Record<string, number> = {
            'SR Legacy': 1,
            'Foundation': 2,
            'Survey (FNDDS)': 3,
            'Branded': 4
        };

        const results = data.foods.map((food: any) => {
            // Check for strict exclusionary mismatches (e.g. searching for Chicken but getting Turkey)
            const desc = (food.description || "").toLowerCase();
            const lowerQuery = query.toLowerCase();
            if (lowerQuery.startsWith('chicken') && desc.includes('turkey')) return null;
            if (lowerQuery.startsWith('turkey') && desc.includes('chicken')) return null;

            const getNutrient = (name: string) => {
                if (!food.foodNutrients) return 0;
                const n = food.foodNutrients.find((nut: any) =>
                    nut.nutrientName && nut.nutrientName.toLowerCase().includes(name.toLowerCase())
                );
                return n ? n.value : 0;
            };

            const protein = getNutrient('Protein');
            const carbs = getNutrient('Carbohydrate');
            const fat = getNutrient('Total lipid');

            // USDA sometimes labels Calories explicitly
            let energyKcal = getNutrient('Energy') || getNutrient('Calories') || 0;

            // MATH CHECK: Sometimes USDA entries (like ID 169079) put kJ in the kcal field!
            // If the stated calories are > 20% higher than what macros allow, recalculate.
            const macroCals = (protein * 4) + (carbs * 4) + (fat * 9);
            if (macroCals > 0 && energyKcal > (macroCals * 1.5)) {
                console.warn(`[Nutrition Fix] Recalculating suspicious energy for ${food.description}: Stated ${energyKcal} vs Macro ${macroCals}`);
                energyKcal = Math.round(macroCals);
            }

            const energyKj = Math.round(energyKcal * 4.184);

            const micronutrients = extractUSDANutrients(food.foodNutrients);

            return {
                fdcId: food.fdcId,
                name: food.description,
                dataType: food.dataType, // Include for display/sorting
                energy_kcal: energyKcal,
                energy_kj: energyKj,
                protein_g: protein,
                carbs_g: carbs,
                fat_g: fat,
                micronutrients,
                source: 'usda' as const,
                _priority: dataTypePriority[food.dataType] || 5 // for sorting
            };
        }).filter((f: any) => f !== null);

        // Sort by priority (SR Legacy first, Branded last)
        results.sort((a: any, b: any) => a._priority - b._priority);

        // Remove _priority before returning
        return results.map(({ _priority, ...rest }: any) => rest).slice(0, 15);
    } catch (error) {
        console.error("[USDA Search Exception] Catch Block:", error);
        return [];
    }
}

/**
 * Fetches full details for a USDA food item, including extensive micronutrients and portions.
 */
export async function getUSDAFoodDetails(fdcId: number): Promise<{ portions: FoodMeasure[], micronutrients: Record<string, number> }> {
    try {
        const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        // Parse Portions
        const portions: FoodMeasure[] = [];
        if (data.foodPortions && data.foodPortions.length > 0) {
            data.foodPortions.forEach((p: any) => {
                // Priority 1: portionDescription (e.g., "1 pouch", "1 small can")
                // Priority 2: modifier (sometimes has label like "cup")
                // Priority 3: measureUnit.name (e.g., "cup")
                let label = (p.portionDescription || '').trim();

                // If portionDescription is missing or bad, try modifier
                if (!label || label.toLowerCase() === 'quantity not specified') {
                    label = (p.modifier || '').trim();
                }

                // If modifier is also bad (numeric ID), try measureUnit.name
                const isBad = (s: string) => !s || /^\d+$/.test(s) || s.toLowerCase() === 'undetermined' || s.length > 30;
                if (isBad(label)) {
                    const unitName = (p.measureUnit?.name || '').trim();
                    label = isBad(unitName) ? 'serving' : unitName;
                }

                // Clean up: remove leading "1" if present (we store just the unit name)
                label = label.replace(/^1\s+/, '').toLowerCase();

                if (p.gramWeight && p.gramWeight > 0) {
                    portions.push({
                        label,
                        weight_g: p.gramWeight
                    });
                }
            });
        }

        // Also check for top-level serving info (common in Branded foods)
        if (data.servingSize && data.householdServingFullText) {
            const label = data.householdServingFullText.replace(/^1\s+/, '').toLowerCase();
            if (!portions.find(p => p.label === label)) {
                portions.push({
                    label,
                    weight_g: data.servingSize
                });
            }
        }

        // Always add default base measures (gram and kilogram)
        const defaultMeasures: FoodMeasure[] = [
            { label: 'gram', weight_g: 1 },
            { label: 'kilogram', weight_g: 1000 }
        ];

        // Add defaults if not already present
        defaultMeasures.forEach(dm => {
            if (!portions.find(p => p.label === dm.label)) {
                portions.unshift(dm); // Add at beginning
            }
        });

        // Parse Micronutrients
        const micronutrients = extractUSDANutrients(data.foodNutrients);

        return { portions, micronutrients };

    } catch (error) {
        console.error("USDA Food Details Error:", error);
        return { portions: [], micronutrients: {} };
    }
}

/**
 * Fetches common measures/weights for a USDA food item.
 * @deprecated Use getUSDAFoodDetails for full details, this is kept for legacy compatibility
 */
export async function getUSDAMeasures(fdcId: number): Promise<FoodMeasure[]> {
    const details = await getUSDAFoodDetails(fdcId);
    return details.portions;
}

/**
 * Syncs a USDA food item to our local database.
 * Uses UPSERT to prevent duplicates and preserve existing data.
 */
export async function syncToLocal(
    food: FoodItemMatch,
    measures: FoodMeasure[],
    userId?: string | null,
    isCurated: boolean = false
): Promise<string | null> {
    // 1. Clean and standardize measures before sync
    const standardizeLabel = (l: string) => {
        let clean = l.toLowerCase().trim();

        // Remove parenthetical weights like " (224g)" but keep the name
        if (clean.includes(' (')) {
            clean = clean.split(' (')[0].trim();
        }

        // Only turn it into 'portion' if it's literally empty, "undetermined", or a pure ID that we can't use
        if (!clean || clean === 'undetermined') return 'portion';

        // If it's a number, it might be a measurement unit count (e.g. "1") 
        // We'll keep it for now and let the UI handle the "humanizing"
        if (/^\d+$/.test(clean) && clean.length > 3) return 'portion'; // Likely a USDA ID

        // Common standardizations
        if (['cup', 'cups', 'c.'].includes(clean)) return 'cup';
        if (['tbsp', 'tablespoon', 'tbs'].includes(clean)) return 'tbsp';
        if (['tsp', 'teaspoon'].includes(clean)) return 'tsp';
        if (['unit', 'item', 'each', 'whole', 'piece'].includes(clean)) return 'piece';

        return clean;
    };

    // 3. Prepare Portions (JSONB)
    // We now save measures directly to the food_item 'portions' column
    let uniquePortions: any[] = [];

    if (measures.length > 0) {
        const measuresToInsert = measures.map(m => ({
            label: standardizeLabel(m.label),
            weight_g: m.weight_g
        })).filter(m => m.weight_g > 0);

        // Filter out internal duplicates
        uniquePortions = Array.from(new Map(measuresToInsert.map(m => [m.label, m])).values());
    }

    // 4. Check if item already exists by name
    const { data: existing } = await supabase
        .from('food_items')
        .select('id, is_curated, user_id')
        .eq('name', food.name)
        .maybeSingle();

    if (existing) {
        // If it's curated, we're done. Just return this ID.
        if (existing.is_curated) return existing.id;

        // If it belongs to the current user, we can proceed with upsert to update it
        // If it belongs to someone else, we technically can't update it but names are unique
        // To be safe, if we can't update it, we should just return the existing ID
        if (userId && existing.user_id !== userId) return existing.id;
    }

    // 5. Insert or get Food Item (with portions)
    const { data: itemData, error: itemError } = await supabase
        .from('food_items')
        .upsert({
            name: food.name,
            energy_kcal: food.energy_kcal,
            energy_kj: food.energy_kj,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
            source: food.source || 'usda',
            micronutrients: food.micronutrients,
            phytonutrients: food.phytonutrients || {},
            portions: uniquePortions, // Save to JSONB
            user_id: userId || null,
            is_curated: isCurated
        }, { onConflict: 'name' })
        .select()
        .single();

    if (itemError) {
        console.error("Sync Item Error:", itemError);
        // If RLS blocked the update but the item exists, try one last time to just get the ID
        if (itemError.code === '42501') {
            const { data: retry } = await supabase
                .from('food_items')
                .select('id')
                .eq('name', food.name)
                .maybeSingle();
            if (retry) return retry.id;
        }
        return null;
    }
    if (!itemData) { // This case should ideally be covered by itemError, but keeping for robustness
        console.error("Sync Item Error: No data returned after upsert.");
        return null;
    }

    return itemData.id;
}
