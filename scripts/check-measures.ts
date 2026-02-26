import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMeasures() {
    const { count, error } = await supabase
        .from('food_measures')
        .select('*', { count: 'exact', head: true });

    console.log(`Food Measures Count: ${count}`);

    // Check one item's measures
    const { data: item } = await supabase
        .from('food_items')
        .select('id, name')
        .eq('name', 'Chicken breast, raw')
        .single();

    if (item) {
        const { data: measures } = await supabase
            .from('food_measures')
            .select('*')
            .eq('food_item_id', item.id);

        console.log(`Measures for 'Chicken breast, raw':`, measures);
    }
}

checkMeasures();
