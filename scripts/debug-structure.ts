import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debug() {
    console.log('🔍 Debugging data structure...\n');

    const { data, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, phytonutrients, details')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('Sample records:');
    data?.forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.name}`);
        console.log(`   phytonutrients type: ${typeof item.phytonutrients}`);
        console.log(`   phytonutrients value: ${JSON.stringify(item.phytonutrients)}`);
        console.log(`   details type: ${typeof item.details}`);
        console.log(`   details value: ${JSON.stringify(item.details)?.substring(0, 100)}...`);
    });

    process.exit(0);
}

debug();
