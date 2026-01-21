import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSausage() {
    const itemName = 'Cured beef sausage cooked, smoked';
    console.log(`Checking status for: "${itemName}"`);

    // 1. Get Food Item
    const { data: item, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%Cured beef sausage%`) // Looser match to be sure
        .limit(1)
        .single();

    if (error || !item) {
        console.log("❌ Food item not found in DB yet (or name mismatch).");
        return;
    }

    console.log(`✅ Found Item: ${item.name} (ID: ${item.id})`);
    console.log(`   USDA ID: ${item.micronutrients?._meta_fdc_id}`);

    // 2. Get Measures
    const { data: measures, error: mError } = await supabase
        .from('food_measures')
        .select('*')
        .eq('food_item_id', item.id);

    if (measures && measures.length > 0) {
        console.log(`✅ Has ${measures.length} measures:`);
        measures.forEach(m => console.log(`   - ${m.label} (${m.weight_g}g)`));
    } else {
        console.log("⚠️  No measures found yet.");
    }
}

checkSausage();
