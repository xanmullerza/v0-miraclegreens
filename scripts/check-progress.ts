import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatus() {
    console.log("🔍 Checking import status...");

    // Check Start of Batch (1441)
    // Note: The script index 1441 maps to the row in CSV. We need to check by name if possible or just check generic counts.
    // Let's check a few items from the final batch range.

    // Item 1441 in CSV is likely "Squash, winter, all varieties, cooked, baked, without salt" or similar? 
    // Wait, the log said: "[1441] Processing: Apples cooked, boiled, peeled" 
    // (Note: In previous logs, "Apples cooked" was around 1433. The numbering depends on CSV header offset. 
    //  Previous batch ended at 1440 Mahi-mahi. So 1441 is the next one.)

    // Let's check a count of items with '_meta_source': 'usda_100g_standard'
    const { count, error } = await supabase
        .from('food_items')
        .select('*', { count: 'exact', head: true })
        .eq('micronutrients->_meta_source', '"usda_100g_standard"'); // Note: querying JSONB value

    if (error) {
        console.error("Error counting:", error);
    } else {
        console.log(`✅ Total items with USDA 100g Standard: ${count}`);
    }

    // Let's check if the specific item 1441 was processed
    const searchName = "Apples cooked, boiled, peeled";
    // (Wait, duplicate names exist. The log said "Apples cooked, boiled, peeled" for 1441)

    const { data: item1441 } = await supabase
        .from('food_items')
        .select('name, micronutrients')
        .eq('name', 'Apples cooked, boiled, peeled')
        .limit(1);

    if (item1441 && item1441.length > 0) {
        const meta = item1441[0].micronutrients?._meta_source;
        console.log(`🍎 Item 'Apples cooked, boiled, peeled': ${meta}`);
    } else {
        console.log(`🍎 Item 'Apples cooked, boiled, peeled': Not found in DB`);
    }

    console.log("Done.");
}

checkStatus();
