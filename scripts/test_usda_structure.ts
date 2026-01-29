
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function searchAndInspect() {
    console.log('--- Searching for "tuna" ---');
    const searchUrl = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=tuna&pageSize=3`;

    try {
        const sRes = await fetch(searchUrl);
        const sData = await sRes.json();

        if (!sData.foods || sData.foods.length === 0) {
            console.log("No results");
            return;
        }

        console.log(`Found ${sData.foods.length} items. Checking structures...`);

        for (const food of sData.foods) {
            console.log(`\n\n=== CHECKING: [${food.fdcId}] ${food.description} (${food.dataType}) ===`);

            // Fetch Detail
            const dUrl = `${USDA_BASE_URL}/food/${food.fdcId}?api_key=${USDA_API_KEY}`;
            const dRes = await fetch(dUrl);
            const dData = await dRes.json();

            // Check Portions
            console.log('--- PORTIONS ---');
            if (dData.foodPortions && dData.foodPortions.length > 0) {
                console.log(JSON.stringify(dData.foodPortions, null, 2));
            } else {
                console.log("NO foodPortions array.");
            }

            // Check Top-Level Serving Info (Common in Branded)
            console.log('--- TOP LEVEL SERVING ---');
            console.log(`servingSize: ${dData.servingSize}`);
            console.log(`servingSizeUnit: ${dData.servingSizeUnit}`);
            console.log(`householdServingFullText: ${dData.householdServingFullText}`);

            // Check Nutrients (First 5)
            console.log('--- NUTRIENTS SAMPLE ---');
            if (dData.foodNutrients) {
                dData.foodNutrients.slice(0, 5).forEach((n: any) => {
                    console.log(`${n.nutrient?.name || n.nutrientName}: ${n.amount || n.value} ${n.nutrient?.unitName || n.unitName}`);
                });
            }
        }

    } catch (e) {
        console.error(e);
    }
}

searchAndInspect();
