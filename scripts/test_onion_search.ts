
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function testOnionSearch() {
    console.log('--- Searching for "onion" ---');
    const searchUrl = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=onion&pageSize=10`;

    try {
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (!data.foods) {
            console.log("No results");
            return;
        }

        console.log(`Found ${data.foods.length} items:\n`);

        data.foods.forEach((food: any, i: number) => {
            console.log(`${i + 1}. [${food.fdcId}] ${food.description} (${food.dataType})`);

            // Find energy
            const energy = food.foodNutrients?.find((n: any) => n.nutrientName?.toLowerCase().includes('energy'))?.value || 0;
            console.log(`   Calories: ${energy} kcal\n`);
        });

    } catch (e) {
        console.error(e);
    }
}

testOnionSearch();
