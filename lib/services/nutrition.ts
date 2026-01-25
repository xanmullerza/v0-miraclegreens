
import { supabase } from '@/lib/supabase';

export interface FoodItemMatch {
    id?: string;
    name: string;
    common_name?: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients: Record<string, number>;
    source: 'local' | 'usda';
    fdcId?: number;
}

import { FoodMeasure } from '@/lib/utils/nutrition-calculator';
export type { FoodMeasure };

// USDA API Key - Uses environment variable with fallback to DEMO_KEY
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Searches for food items in the local Supabase database.
 */
export async function searchLocalFood(query: string): Promise<FoodItemMatch[]> {
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
        .limit(10);

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        name: item.name,
        common_name: item.common_name,
        energy_kcal: item.energy_kcal || Math.round((item.energy_kj || 0) / 4.184),
        energy_kj: item.energy_kj || Math.round((item.energy_kcal || 0) * 4.184),
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        micronutrients: item.micronutrients || {},
        source: 'local' as const
    })).sort((a, b) => {
        // Prioritize common_name matches
        const aHasCommonPrefix = a.common_name?.toLowerCase().startsWith(query.toLowerCase());
        const bHasCommonPrefix = b.common_name?.toLowerCase().startsWith(query.toLowerCase());
        if (aHasCommonPrefix && !bHasCommonPrefix) return -1;
        if (!aHasCommonPrefix && bHasCommonPrefix) return 1;
        return 0;
    });
}

/**
 * Searches for food items using the USDA FoodData Central API.
 */
export async function searchUSDAFood(query: string): Promise<FoodItemMatch[]> {
    if (!query || query.trim().length < 2) return [];

    // Debugging: log key presence (do NOT log full key for security)
    console.log(`[USDA Search] Query: "${query}", Using Key: ${USDA_API_KEY === 'DEMO_KEY' ? 'DEMO_KEY' : 'Custom Key (Set)'}`);

    try {
        const url = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=15`;
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

        return data.foods.map((food: any) => {
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

            const micronutrients: Record<string, number> = {};
            // ... (rest of the mapping code) ...
            const microMap: Record<string, string> = {
                'Potassium, K': 'Potassium',
                'Magnesium, Mg': 'Magnesium',
                'Calcium, Ca': 'Calcium',
                'Phosphorus, P': 'Phosphorus',
                'Sodium, Na': 'Sodium',
                'Iron, Fe': 'Iron',
                'Zinc, Zn': 'Zinc',
                'Selenium, Se': 'Selenium',
                'Copper, Cu': 'Copper',
                'Manganese, Mn': 'Manganese',
                'Vitamin A, RAE': 'Vitamin A',
                'Vitamin C, total ascorbic acid': 'Vitamin C',
                'Vitamin D (D2 + D3)': 'Vitamin D',
                'Vitamin E (alpha-tocopherol)': 'Vitamin E',
                'Vitamin K (phylloquinone)': 'Vitamin K',
                'Thiamin': 'B1 (Thiamine)',
                'Riboflavin': 'B2 (Riboflavin)',
                'Niacin': 'B3 (Niacin)',
                'Pantothenic acid': 'B5 (Pantothenic Acid)',
                'Vitamin B-6': 'B6 (Pyridoxine)',
                'Folate, total': 'B9 (Folate)',
                'Vitamin B-12': 'B12 (Cobalamin)',
                'Choline, total': 'Choline',
                'Fiber, total dietary': 'Fiber'
            };

            if (food.foodNutrients) {
                food.foodNutrients.forEach((nut: any) => {
                    Object.entries(microMap).forEach(([usdaName, ourName]) => {
                        if (nut.nutrientName && nut.nutrientName.includes(usdaName)) {
                            micronutrients[ourName] = nut.value;
                        }
                    });
                });
            }

            return {
                fdcId: food.fdcId,
                name: food.description,
                energy_kcal: energyKcal,
                energy_kj: energyKj,
                protein_g: protein,
                carbs_g: carbs,
                fat_g: fat,
                micronutrients,
                source: 'usda' as const
            };
        }).filter((f: any) => f !== null);
    } catch (error) {
        console.error("[USDA Search Exception] Catch Block:", error);
        return [];
    }
}

/**
 * Fetches common measures/weights for a USDA food item.
 */
export async function getUSDAMeasures(fdcId: number): Promise<FoodMeasure[]> {
    try {
        const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.foodPortions) return [];

        return data.foodPortions.map((p: any) => {
            let label = (p.modifier || '').trim();
            let unitName = (p.measureUnitName || '').trim();

            const isBad = (s: string) => !s || /^\d+$/.test(s) || s.toLowerCase() === 'undetermined' || s.length > 25;

            // If modifier is bad, try unitName. If both bad, use 'portion'
            if (isBad(label)) {
                label = isBad(unitName) ? 'portion' : unitName;
            } else if (!isBad(unitName) && !label.toLowerCase().includes(unitName.toLowerCase())) {
                label = `${label} ${unitName}`;
            }

            return {
                label: label.toLowerCase(),
                weight_g: p.gramWeight || 0
            };
        }).filter((p: any) => p.weight_g > 0);
    } catch (error) {
        console.error("USDA Measures Error:", error);
        return [];
    }
}

/**
 * Syncs a USDA food item to our local database.
 * Uses UPSERT to prevent duplicates and preserve existing data.
 */
export async function syncToLocal(food: FoodItemMatch, measures: FoodMeasure[]): Promise<string | null> {
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

    // 2. Insert or get Food Item
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
            micronutrients: food.micronutrients
        }, { onConflict: 'name' })
        .select()
        .single();

    if (itemError || !itemData) {
        console.error("Sync Item Error:", itemError);
        return null;
    }

    // 3. Insert or Update measures
    if (measures.length > 0) {
        const measuresToInsert = measures.map(m => ({
            food_item_id: itemData.id,
            label: standardizeLabel(m.label),
            weight_g: m.weight_g
        })).filter(m => m.weight_g > 0);

        // Filter out internal duplicates in the payload before sending to Supabase
        const uniqueMeasures = Array.from(new Map(measuresToInsert.map(m => [m.label, m])).values());

        const { error: measError } = await supabase
            .from('food_measures')
            .upsert(uniqueMeasures, { onConflict: 'food_item_id, label' });

        if (measError) console.warn("Sync Measures Warning:", measError);
    }

    return itemData.id;
}
