import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findActualMissing() {
    console.log('🔍 Finding ACTUAL items with missing data...\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, details, phytonutrients')
        .order('name');

    if (error || !allFoods) {
        console.error('Failed to fetch food items:', error);
        process.exit(1);
    }

    const missingDetails: any[] = [];
    const missingPhytos: any[] = [];
    const missingBoth: any[] = [];

    for (const food of allFoods) {
        const detailsNull = food.details === null;
        const detailsEmpty = food.details && Object.keys(food.details).length === 0;
        const phytosNull = food.phytonutrients === null;
        const phytosEmpty = food.phytonutrients && Object.keys(food.phytonutrients).length === 0;

        const noDetails = detailsNull || detailsEmpty;
        const noPhytos = phytosNull || phytosEmpty;

        if (noDetails && noPhytos) {
            missingBoth.push({ name: food.name, common_name: food.common_name });
        } else if (noDetails) {
            missingDetails.push({ name: food.name, common_name: food.common_name });
        } else if (noPhytos) {
            missingPhytos.push({ name: food.name, common_name: food.common_name });
        }
    }

    console.log(`📊 ACTUAL Missing Data Summary:`);
    console.log(`Total items: ${allFoods.length}`);
    console.log(`Missing BOTH details & phytos: ${missingBoth.length}`);
    console.log(`Missing only details: ${missingDetails.length}`);
    console.log(`Missing only phytos: ${missingPhytos.length}`);
    console.log(`Complete items: ${allFoods.length - (missingBoth.length + missingDetails.length + missingPhytos.length)}\n`);

    if (missingBoth.length > 0) {
        console.log('🚨 MISSING BOTH:');
        missingBoth.forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
    }

    if (missingDetails.length > 0) {
        console.log(`\n🟡 MISSING DETAILS ONLY (${missingDetails.length} items):`);
        missingDetails.slice(0, 20).forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
        if (missingDetails.length > 20) {
            console.log(`... and ${missingDetails.length - 20} more`);
        }
    }

    if (missingPhytos.length > 0) {
        console.log(`\n🟡 MISSING PHYTOS ONLY (${missingPhytos.length} items):`);
        missingPhytos.slice(0, 20).forEach((f, i) => {
            console.log(`${i + 1}. ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
        if (missingPhytos.length > 20) {
            console.log(`... and ${missingPhytos.length - 20} more`);
        }
    }

    // Export for reference
    fs.writeFileSync(
        'ACTUAL_MISSING_DATA.json',
        JSON.stringify({ missingBoth, missingDetails, missingPhytos }, null, 2)
    );
    console.log('\n✅ Full list saved to: ACTUAL_MISSING_DATA.json');

    process.exit(0);
}

findActualMissing();
