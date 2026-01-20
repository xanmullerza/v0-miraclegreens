
import { supabase } from '@/lib/supabase';

export interface FoodItemMatch {
    id?: string;
    name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients: Record<string, number>;
    source: 'local' | 'usda';
    fdcId?: number;
}

export interface FoodMeasure {
    label: string;
    weight_g: number;
}

// USDA API Key - using DEMO_KEY for initial development
const USDA_API_KEY = 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Searches for food items in the local Supabase database.
 */
export async function searchLocalFood(query: string): Promise<FoodItemMatch[]> {
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);

    if (error || !data) return [];

    return data.map(item => ({
        id: item.id,
        name: item.name,
        energy_kcal: item.energy_kcal,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        micronutrients: item.micronutrients || {},
        source: 'local'
    }));
}

/**
 * Searches for food items using the USDA FoodData Central API.
 */
export async function searchUSDAFood(query: string): Promise<FoodItemMatch[]> {
    if (!query || query.trim().length < 2) return [];

    try {
        const response = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`);

        if (!response.ok) {
            console.error(`USDA API Error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        if (!data.foods || data.foods.length === 0) {
            console.warn("USDA API: No foods found for query:", query);
            return [];
        }

        return data.foods.map((food: any) => {
            const getNutrient = (name: string) => {
                const n = food.foodNutrients.find((nut: any) => nut.nutrientName.toLowerCase().includes(name.toLowerCase()));
                return n ? n.value : 0;
            };

            // Map USDA nutrients to our internal names
            // USDA identifies nutrients by ID or Name. 
            // Common IDs: Protein=1003, Fat=1004, Carbs=1005, Energy=1008
            const micronutrients: Record<string, number> = {};

            // Mapping for common micros we track
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

            food.foodNutrients.forEach((nut: any) => {
                Object.entries(microMap).forEach(([usdaName, ourName]) => {
                    if (nut.nutrientName.includes(usdaName)) {
                        micronutrients[ourName] = nut.value;
                    }
                });
            });

            return {
                fdcId: food.fdcId,
                name: food.description,
                energy_kcal: getNutrient('Energy'),
                protein_g: getNutrient('Protein'),
                carbs_g: getNutrient('Carbohydrate'),
                fat_g: getNutrient('Total lipid'),
                micronutrients,
                source: 'usda' as const
            };
        });
    } catch (error) {
        console.error("USDA API Error:", error);
        return [];
    }
}

/**
 * Fetches common measures/weights for a USDA food item.
 */
export async function getUSDAMeasures(fdcId: number): Promise<FoodMeasure[]> {
    try {
        const response = await fetch(`${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`);
        const data = await response.json();

        if (!data.foodPortions) return [];

        return data.foodPortions.map((p: any) => ({
            label: p.modifier || p.measureUnitName || 'portion',
            weight_g: p.gramWeight || 0
        })).filter((p: any) => p.weight_g > 0);
    } catch (error) {
        console.error("USDA Measures Error:", error);
        return [];
    }
}

/**
 * Syncs a USDA food item to our local database.
 */
export async function syncToLocal(food: FoodItemMatch, measures: FoodMeasure[]): Promise<string | null> {
    // 1. Insert into food_items
    const { data: itemData, error: itemError } = await supabase
        .from('food_items')
        .insert({
            name: food.name,
            energy_kcal: food.energy_kcal,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
            micronutrients: food.micronutrients
        })
        .select()
        .single();

    if (itemError || !itemData) return null;

    // 2. Insert measures
    if (measures.length > 0) {
        const measuresToInsert = measures.map(m => ({
            food_item_id: itemData.id,
            label: m.label,
            weight_g: m.weight_g
        }));

        await supabase.from('food_measures').insert(measuresToInsert);
    }

    return itemData.id;
}
