import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspect() {
    console.log('🔬 Detailed inspection of food_items table...\n');

    // Check a few specific items from the screenshot
    const itemsToCheck = [
        'Kiwi Fruit, Green',
        'Mango, Fresh',
        'Melons, honeydew, raw',
        'Quinoa, Cooked',
        'Tofu, Raw (Not Silken), Not Cooked, Firm'
    ];

    for (const itemName of itemsToCheck) {
        const { data } = await supabase
            .from('food_items')
            .select('id, name, common_name, details, phytonutrients')
            .ilike('name', `%${itemName}%`)
            .limit(1)
            .maybeSingle();

        if (data) {
            console.log(`\n📍 ${data.name}`);
            console.log(`   Common: ${data.common_name || 'N/A'}`);
            console.log(`   Details type: ${typeof data.details}`);
            console.log(`   Details value: ${JSON.stringify(data.details)}`);
            console.log(`   Details is null: ${data.details === null}`);
            console.log(`   Details keys: ${data.details ? Object.keys(data.details).length : 'N/A'}`);
            console.log(`   Phytos type: ${typeof data.phytonutrients}`);
            console.log(`   Phytos value: ${JSON.stringify(data.phytonutrients)?.substring(0, 100)}...`);
            console.log(`   Phytos is null: ${data.phytonutrients === null}`);
            console.log(`   Phytos keys: ${data.phytonutrients ? Object.keys(data.phytonutrients).length : 'N/A'}`);
        } else {
            console.log(`❌ Not found: ${itemName}`);
        }
    }

    // Get count of items with empty phytonutrients
    console.log('\n\n📊 Checking for items with empty/null columns...');
    
    const { data: allItems, error } = await supabase
        .from('food_items')
        .select('name, details, phytonutrients')
        .limit(200);

    if (allItems) {
        let nullDetails = 0;
        let emptyDetails = 0;
        let nullPhytos = 0;
        let emptyPhytos = 0;

        allItems.forEach(item => {
            if (item.details === null) nullDetails++;
            if (item.details && JSON.stringify(item.details) === '{}') emptyDetails++;
            if (item.phytonutrients === null) nullPhytos++;
            if (item.phytonutrients && JSON.stringify(item.phytonutrients) === '{}') emptyPhytos++;
        });

        console.log(`Total checked: ${allItems.length}`);
        console.log(`Details = null: ${nullDetails}`);
        console.log(`Details = {}: ${emptyDetails}`);
        console.log(`Phytonutrients = null: ${nullPhytos}`);
        console.log(`Phytonutrients = {}: ${emptyPhytos}`);
    }

    process.exit(0);
}

inspect();
