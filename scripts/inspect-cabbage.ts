import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectCabbage() {
    console.log("🥬 Inspecting Cabbage measures...");
    const { data: items } = await supabase
        .from('food_items')
        .select('id, name')
        .ilike('name', '%Cabbage, green, cooked%')
        .limit(5);

    if (!items || items.length === 0) {
        console.log("Cabbage not found.");
        return;
    }

    for (const item of items) {
        console.log(`\nItem: ${item.name} (${item.id})`);
        const { data: measures } = await supabase
            .from('food_measures')
            .select('label, weight_g')
            .eq('food_item_id', item.id);

        console.log("Portions:");
        console.log(JSON.stringify(measures, null, 2));
    }
}

inspectCabbage();
