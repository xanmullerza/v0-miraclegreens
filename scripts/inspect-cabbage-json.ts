import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectCabbageJSON() {
    console.log("🥬 Inspecting Cabbage JSON portions...");
    const { data: item } = await supabase
        .from('food_items')
        .select('name, portions')
        .eq('id', 'c165b859-ca2d-47a2-8a19-b8c01747b65c')
        .single();

    if (item) {
        console.log(`Item: ${item.name}`);
        console.log("Portions JSONB:");
        console.log(JSON.stringify(item.portions, null, 2));
    } else {
        console.log("Item not found.");
    }
}

inspectCabbageJSON();
