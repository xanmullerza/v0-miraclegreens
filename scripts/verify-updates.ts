import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verify() {
    console.log('✅ Verifying phytonutrients...\n');

    const itemsToCheck = [
        'Baking Powder',
        'Balsamic vinegar',
        'Beef Liver',
        'Brown sugar',
        'Chicken Liver',
        'Cornmeal, White, Whole Grain, Dry',
        'Lamb Kidney',
        'Mayonnaise regular, salted',
        'Parboiled Rice, Converted, Cooked in Salted Water',
        'PNP No Name Baked Beans',
        'Raw Egg',
        'Salt, table, iodized',
        'South African Pilchard',
        'White All-Purpose Flour, Unenriched',
        'White Bread, Store Bought'
    ];

    for (const itemName of itemsToCheck) {
        const { data } = await supabase
            .from('food_items')
            .select('id, name, phytonutrients')
            .eq('name', itemName)
            .maybeSingle();

        if (data && data.phytonutrients) {
            const count = Object.keys(data.phytonutrients).length;
            console.log(`✅ ${itemName}: ${count} phytonutrients`);
        } else {
            console.log(`❌ ${itemName}: MISSING`);
        }
    }

    process.exit(0);
}

verify();
