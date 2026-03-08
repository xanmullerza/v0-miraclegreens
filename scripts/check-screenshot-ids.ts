import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IDs = [
    '62c02a3d-30f2-4757-82fd-947ff0431713',
    'd4b1d97f-0ae6-4376-b685-61d664bf54ee',
    '873d3807-1612-4713-bb28-b40cd7ce885c',
    'b886773b-e5de-4b38-a06b-008c849004e3',
    '4d539622-3bc0-4bfe-a29b-0d862e90b6a7',
    '8aa2ac6c-7609-46c6-a0fe-f9eec3220e54',
    'c9e2853d-33b8-4e1e-abe1-ca579b0a1520',
    '93fc804e-5ac5-44e5-8d97-378b290388f1',
    'f49a17fb-445e-4ac8-b53a-f5378d247cea',
    '179068ea-d4c2-4032-a1c6-10ce5896ce89',
    '2f82ef27-33f9-448e-9554-7c14853894dc',
    '969110cc-9476-4b2b-b08c-412473bd6cf8'
];

async function checkIds() {
    console.log('🔍 Checking specific IDs from screenshot...');
    const { data, error } = await supabase
        .from('food_items')
        .select('id, name')
        .in('id', IDs);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data?.length || 0} / ${IDs.length} items.`);
        data?.forEach(item => console.log(`- ${item.name} (${item.id})`));
    }
}

checkIds();
