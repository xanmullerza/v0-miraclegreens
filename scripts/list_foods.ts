import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function list() {
    const { data, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, phytonutrients')
        .order('name');

    if (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }

    console.log(`\n=== ${data.length} FOOD ITEMS ===\n`);
    for (const f of data) {
        const hasPhyto = f.phytonutrients && Object.keys(f.phytonutrients).length > 0;
        const marker = hasPhyto ? '✅' : '  ';
        console.log(`${marker} ${f.name} | ${f.common_name || '-'}`);
    }

    const withPhyto = data.filter(f => f.phytonutrients && Object.keys(f.phytonutrients).length > 0);
    console.log(`\n${withPhyto.length}/${data.length} items have phytonutrients`);
    process.exit(0);
}

list();
