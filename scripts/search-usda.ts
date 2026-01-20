
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function searchHighQualityFood(query: string) {
    console.log(`\n--- Searching for: "${query}" ---`);
    try {
        const url = `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageSize=10`;
        const response = await fetch(url);
        const data: any = await response.json();

        const foods = data.foods;
        if (!foods || foods.length === 0) {
            console.log('No foods found.');
            return;
        }

        // Filter for Foundation or SR Legacy in the script logic to be sure
        const qualityFoods = foods.filter((f: any) =>
            f.dataType === 'Foundation' || f.dataType === 'SR Legacy'
        );

        const results = qualityFoods.length > 0 ? qualityFoods : foods;

        results.slice(0, 5).forEach((food: any, idx: number) => {
            console.log(`[${idx + 1}] ID: ${food.fdcId} | ${food.description}`);
            console.log(`    Data Type: ${food.dataType} | Category: ${food.foodCategory || 'N/A'}`);
            const kcal = food.foodNutrients.find((n: any) =>
                (n.nutrientName === 'Energy' || n.nutrientName === 'Calories') && n.unitName === 'KCAL'
            )?.value;
            console.log(`    Energy: ${kcal} kcal/100g`);
        });
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

async function run() {
    if (!API_KEY) {
        console.error('No API Key found in .env.local');
        return;
    }
    await searchHighQualityFood('Bread, whole-wheat');
    await searchHighQualityFood('Cream cheese, low fat');
    await searchHighQualityFood('Tomatoes, raw');
}

run();
