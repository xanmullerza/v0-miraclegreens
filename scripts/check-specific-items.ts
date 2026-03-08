import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
    console.log('🔎 Checking specific items...\n');

    // Items that commonly appear in food databases
    const itemsToCheck = [
        'Kiwi Fruit', 'Mango', 'Quinoa', 'Tofu', 'Ramen Noodles',
        'Kale', 'Spinach', 'Broccoli', 'Chicken Breast', 'Salmon',
        'Rice', 'Wheat', 'Oats', 'Lentils', 'Chickpeas'
    ];

    for (const itemName of itemsToCheck) {
        const { data } = await supabase
            .from('food_items')
            .select('id, name, common_name, phytonutrients, details')
            .ilike('name', `%${itemName}%`)
            .limit(3);

        if (data && data.length > 0) {
            console.log(`\n✓ Found "${itemName}":`);
            data.forEach((item) => {
                const phytoCount = item.phytonutrients ? Object.keys(item.phytonutrients).length : 0;
                const detailsHas = item.details && Object.keys(item.details).length > 0 ? '✓' : '✗';
                console.log(`  • ${item.name} (common: ${item.common_name})`);
                console.log(`    Phytos: ${phytoCount} compounds | Details: ${detailsHas}`);
            });
        } else {
            console.log(`✗ "${itemName}" not found`);
        }
    }

    console.log('\n');
    process.exit(0);
})();
