import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
    console.log('🔍 Scanning food items for TRULY empty data...\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, details, phytonutrients')
        .order('name');

    if (error || !allFoods) {
        console.error('Error:', error);
        process.exit(1);
    }

    const truly_missing_phytos: any[] = [];
    const truly_missing_details: any[] = [];
    const empty_phytos: any[] = [];
    const empty_details: any[] = [];

    allFoods.forEach((item) => {
        // Check phytonutrients
        if (!item.phytonutrients) {
            truly_missing_phytos.push({ name: item.name, common_name: item.common_name });
        } else if (typeof item.phytonutrients === 'object' && Object.keys(item.phytonutrients).length === 0) {
            empty_phytos.push({ name: item.name, common_name: item.common_name });
        }

        // Check details
        if (!item.details) {
            truly_missing_details.push({ name: item.name, common_name: item.common_name });
        } else if (typeof item.details === 'object' && Object.keys(item.details).length === 0) {
            empty_details.push({ name: item.name, common_name: item.common_name });
        }
    });

    console.log('📊 DETAILED ANALYSIS:\n');
    console.log(`Truly NULL/undefined phytonutrients: ${truly_missing_phytos.length}`);
    console.log(`Empty object {} phytonutrients: ${empty_phytos.length}`);
    console.log(`Truly NULL/undefined details: ${truly_missing_details.length}`);
    console.log(`Empty object {} details: ${empty_details.length}`);

    if (empty_phytos.length > 0) {
        console.log(`\n🟡 Items with EMPTY {} phytonutrients (needs data):`);
        empty_phytos.slice(0, 20).forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.name} ${item.common_name ? `(${item.common_name})` : ''}`);
        });
        if (empty_phytos.length > 20) console.log(`  ... and ${empty_phytos.length - 20} more`);
    }

    if (empty_details.length > 0) {
        console.log(`\n🟡 Items with EMPTY {} details (needs data):`);
        empty_details.slice(0, 20).forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.name} ${item.common_name ? `(${item.common_name})` : ''}`);
        });
        if (empty_details.length > 20) console.log(`  ... and ${empty_details.length - 20} more`);
    }

    console.log('\n✅ SUMMARY:');
    console.log(`Total items: ${allFoods.length}`);
    console.log(`Items needing phytos: ${truly_missing_phytos.length + empty_phytos.length}`);
    console.log(`Items needing details: ${truly_missing_details.length + empty_details.length}`);

    process.exit(0);
})();
