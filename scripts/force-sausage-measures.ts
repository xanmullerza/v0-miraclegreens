import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function forceImport() {
    const itemName = 'Cured beef sausage cooked, smoked';
    // Get item
    const { data: item } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%Cured beef sausage%`)
        .single();

    if (!item || !item.micronutrients?._meta_fdc_id) {
        console.log("Item not found or no FDC ID");
        return;
    }

    const fdcId = item.micronutrients._meta_fdc_id;
    console.log(`Fetching portions for ${item.name} (FDC: ${fdcId})...`);

    try {
        const res = await fetch(`https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${USDA_API_KEY}`);
        const data = await res.json();
        const portions = data.foodPortions || [];

        console.log(`Found ${portions.length} raw portions from USDA.`);

        for (const p of portions) {
            if (p.gramWeight > 0 && p.modifier) {
                console.log(`   + Adding: ${p.modifier} (${p.gramWeight}g)`);
                await supabase.from('food_measures').insert({
                    food_item_id: item.id,
                    label: p.modifier,
                    weight_g: p.gramWeight / (p.amount || 1)
                });
            }
        }
        console.log("✅ Done.");
    } catch (e) {
        console.error(e);
    }
}

forceImport();
