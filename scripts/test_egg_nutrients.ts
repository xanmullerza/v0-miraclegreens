
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function testEggNutrients() {
    // Egg, whole, raw (SR Legacy) - fdcId 171287
    const eggId = 171287;

    console.log(`--- Fetching nutrient details for Egg (ID: ${eggId}) ---\n`);

    const url = `${USDA_BASE_URL}/food/${eggId}?api_key=${USDA_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log(`Food: ${data.description}\n`);

        // List all nutrient names
        console.log('--- ALL NUTRIENTS ---');
        if (data.foodNutrients) {
            data.foodNutrients.forEach((n: any) => {
                const name = n.nutrient?.name || 'Unknown';
                const amount = n.amount || 0;
                const unit = n.nutrient?.unitName || '';
                console.log(`${name}: ${amount} ${unit}`);
            });
        }

    } catch (e) {
        console.error(e);
    }
}

testEggNutrients();
