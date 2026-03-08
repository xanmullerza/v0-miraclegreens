import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
    console.log('📊 COMPREHENSIVE DATABASE STATUS REPORT\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('name, common_name, phytonutrients, details')
        .order('name');

    if (error || !allFoods) {
        console.error('Error:', error);
        process.exit(1);
    }

    const stats = {
        total: allFoods.length,
        with_phytos: 0,
        phytos_count: {} as Record<string, number>,
        with_details: 0,
        details_info: {} as Record<string, number>,
        both: 0,
        neither: 0
    };

    const itemsDetail: any[] = [];

    allFoods.forEach((food) => {
        const hasPhytos = food.phytonutrients && Object.keys(food.phytonutrients).length > 0;
        const hasDetails = food.details && Object.keys(food.details).length > 0;
        const phytosCount = hasPhytos ? Object.keys(food.phytonutrients).length : 0;

        if (hasPhytos) stats.with_phytos++;
        if (hasDetails) stats.with_details++;
        if (hasPhytos && hasDetails) stats.both++;
        if (!hasPhytos && !hasDetails) stats.neither++;

        // Count phytos by range
        const range = phytosCount === 0 ? '0' : phytosCount <= 2 ? '1-2' : phytosCount <= 4 ? '3-4' : '5+';
        stats.phytos_count[range] = (stats.phytos_count[range] || 0) + 1;

        // Details info
        const detailsStr = JSON.stringify(food.details || {});
        const detailsSize = detailsStr.length;
        stats.details_info[detailsSize > 500 ? 'large (>500 chars)' : 'small (<500 chars)'] = 
            (stats.details_info[detailsSize > 500 ? 'large (>500 chars)' : 'small (<500 chars)'] || 0) + 1;

        itemsDetail.push({
            name: food.name,
            common_name: food.common_name,
            phytos: phytosCount,
            has_details: hasDetails ? 'Y' : 'N'
        });
    });

    console.log('📈 STATISTICS:');
    console.log(`Total items: ${stats.total}`);
    console.log(`Items with phytonutrients: ${stats.with_phytos} (${((stats.with_phytos/stats.total)*100).toFixed(1)}%)`);
    console.log(`Items with details: ${stats.with_details} (${((stats.with_details/stats.total)*100).toFixed(1)}%)`);
    console.log(`Items with BOTH: ${stats.both} (${((stats.both/stats.total)*100).toFixed(1)}%)`);
    console.log(`Items with NEITHER: ${stats.neither}`);

    console.log('\n🧬 PHYTONUTRIENT DISTRIBUTION:');
    Object.entries(stats.phytos_count).sort().forEach(([range, count]) => {
        console.log(`  ${range} compounds: ${count} items`);
    });

    console.log('\n📝 DETAILS CONTENT SIZE:');
    Object.entries(stats.details_info).forEach(([size, count]) => {
        console.log(`  ${size}: ${count} items`);
    });

    // Save detailed CSV
    let csv = 'name,common_name,phytonutrients_count,has_details\n';
    itemsDetail.forEach(item => {
        csv += `"${item.name?.replace(/"/g, '""')}","${(item.common_name || '').replace(/"/g, '""')}",${item.phytos},"${item.has_details}"\n`;
    });
    fs.writeFileSync('database-status-report.csv', csv);

    console.log('\n✅ CONCLUSION:');
    if (stats.both === stats.total) {
        console.log('🎉 DATABASE IS FULLY POPULATED!');
        console.log(`   All ${stats.total} food items have both phytonutrients AND details.`);
        console.log('   No additional data entry needed.');
    } else if (stats.neither === stats.total) {
        console.log('⚠️  DATABASE IS EMPTY!');
        console.log(`   All ${stats.total} items are missing both phytonutrients AND details.`);
        console.log('   Please run the SQL update scripts.');
    } else {
        console.log(`⚠️  DATABASE IS PARTIALLY POPULATED:`);
        console.log(`   ${stats.both} items complete, ${stats.total - stats.both} items incomplete`);
    }

    console.log('\n📁 Saved: database-status-report.csv');
    process.exit(0);
})();
