import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRemaining() {
    // 1. Total items with FDC IDs
    const { count: totalWithFdc } = await supabase
        .from('food_items')
        .select('id', { count: 'exact', head: true })
        .not('micronutrients->>_meta_fdc_id', 'is', null);

    // 2. Total items that ALREADY have measures
    // This is tricky to query directly without a join, but we can check items that have at least one entry in food_measures
    const { data: itemsWithMeasures } = await supabase
        .from('food_measures')
        .select('food_item_id');

    const uniqueItemIds = new Set(itemsWithMeasures?.map(m => m.food_item_id));

    console.log(`Total Food Items with FDC IDs: ${totalWithFdc}`);
    console.log(`Items that already have measures: ${uniqueItemIds.size}`);
    console.log(`Items remaining to check: ${Number(totalWithFdc) - uniqueItemIds.size}`);
}

checkRemaining();
