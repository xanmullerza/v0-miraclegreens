
import * as dotenv from 'dotenv';
import path from 'path';


// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function testFetch() {
    console.log('Testing USDA Detail Fetch...');
    // A standard item: Bananas, raw (Foundation) - ID 173944 or 1102653
    // Or Beef 174032
    // Using 170273 (SR Legacy) which is very common
    const id = 170273;

    const url = `${USDA_BASE_URL}/food/${id}?api_key=${USDA_API_KEY}`;
    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log('--- Top Level Keys ---');
        console.log(Object.keys(data));

        console.log('\n--- Portion Sample ---');
        console.log(JSON.stringify(data.foodPortions?.[0], null, 2));

        console.log('\n--- Nutrient Sample (First 3) ---');
        if (data.foodNutrients) {
            data.foodNutrients.slice(0, 3).forEach((n: any) => console.log(JSON.stringify(n, null, 2)));
        }

    } catch (e) {
        console.error(e);
    }
}

testFetch();
