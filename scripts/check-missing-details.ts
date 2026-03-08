import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
    console.log('🔍 Checking for missing food details and phytonutrients...\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, phytonutrients, details')
        .order('name');

    if (error || !allFoods) {
        console.error('Failed to fetch food items:', error);
        process.exit(1);
    }

    let missingPhyto = 0;
    let missingDetails = 0;
    let hasBoth = 0;

    const phytoMissing: any[] = [];
    const detailsMissing: any[] = [];
    const both: any[] = [];

    for (const food of allFoods) {
        const hasPhyto = food.phytonutrients && Object.keys(food.phytonutrients).length > 0;
        const hasDetails = food.details && typeof food.details === 'object' && Object.keys(food.details).length > 0;

        if (!hasPhyto && !hasDetails) {
            both.push(food);
            hasBoth++;
        } else {
            if (!hasPhyto) {
                phytoMissing.push(food);
                missingPhyto++;
            }
            if (!hasDetails) {
                detailsMissing.push(food);
                missingDetails++;
            }
        }
    }

    console.log(`📊 Summary:`);
    console.log(`Total items: ${allFoods.length}`);
    console.log(`Missing BOTH phytonutrients & details: ${hasBoth}`);
    console.log(`Missing only phytonutrients: ${missingPhyto}`);
    console.log(`Missing only details: ${missingDetails}`);
    console.log(`\n✅ Complete items: ${allFoods.length - (hasBoth + missingPhyto + missingDetails)}\n`);

    if (both.length > 0) {
        console.log('\n🚨 MISSING BOTH (Priority 1):');
        both.slice(0, 10).forEach(f => {
            console.log(`  - ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
        if (both.length > 10) console.log(`  ... and ${both.length - 10} more`);
    }

    if (phytoMissing.length > 0) {
        console.log('\n🟡 MISSING PHYTONUTRIENTS (Priority 2):');
        phytoMissing.slice(0, 10).forEach(f => {
            console.log(`  - ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
        if (phytoMissing.length > 10) console.log(`  ... and ${phytoMissing.length - 10} more`);
    }

    if (detailsMissing.length > 0) {
        console.log('\n🟡 MISSING DETAILS (Priority 3):');
        detailsMissing.slice(0, 10).forEach(f => {
            console.log(`  - ${f.name} ${f.common_name ? `(${f.common_name})` : ''}`);
        });
        if (detailsMissing.length > 10) console.log(`  ... and ${detailsMissing.length - 10} more`);
    }

    // Export lists to JSON for further processing
    console.log('\n💾 Exporting data for processing...');
    const fs = require('fs').promises;
    
    await fs.writeFile(
        path.join(process.cwd(), 'scripts/missing-data.json'),
        JSON.stringify({
            total: allFoods.length,
            missingBoth: both,
            missingPhytoOnly: phytoMissing,
            missingDetailsOnly: detailsMissing
        }, null, 2)
    );

    console.log('✅ Data exported to scripts/missing-data.json');
    process.exit(0);
}

check();
