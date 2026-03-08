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
async function exportAll() {
    console.log('📥 Exporting all food items data...\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, details, phytonutrients')
        .order('name');

    if (error || !allFoods) {
        console.error('Error:', error);
        process.exit(1);
    }

    // Save to CSV for inspection
    let csv = 'id,name,common_name,details_empty,phytonutrients_empty,details_length,phytos_length\n';
    
    const missing: Array<{name: string; common_name: string; details_empty: boolean; phytos_empty: boolean}> = [];

    allFoods.forEach(item => {
        const detailsStr = JSON.stringify(item.details || {});
        const phytosStr = JSON.stringify(item.phytonutrients || {});
        
        const detailsEmpty = detailsStr === '{}' || detailsStr === 'null' || !item.details;
        const phytosEmpty = phytosStr === '{}' || phytosStr === 'null' || !item.phytonutrients;
        
        csv += `"${item.id}","${item.name?.replace(/"/g, '""')}","${(item.common_name || '').replace(/"/g, '""')}",${detailsEmpty},${phytosEmpty},${detailsStr.length},${phytosStr.length}\n`;
        
        if (detailsEmpty || phytosEmpty) {
            missing.push({
                name: item.name,
                common_name: item.common_name,
                details_empty: detailsEmpty,
                phytos_empty: phytosEmpty
            });
        }
    });

    fs.writeFileSync('all-food-items.csv', csv);
    fs.writeFileSync('items-needing-data.json', JSON.stringify(missing, null, 2));

    console.log(`✅ Exported ${allFoods.length} items`);
    console.log(`⚠️  Items with missing data: ${missing.length}`);
    console.log(`\nFiles created:`);
    console.log(`  • all-food-items.csv`);
    console.log(`  • items-needing-data.json`);

    // Show first 20 items needing data
    if (missing.length > 0) {
        console.log(`\nFirst 20 items needing data:`);
        missing.slice(0, 20).forEach((item, i) => {
            const missing_str = [];
            if (item.details_empty) missing_str.push('details');
            if (item.phytos_empty) missing_str.push('phytos');
            console.log(`${i + 1}. ${item.name} (${missing_str.join(', ')})`);
        });
        if (missing.length > 20) {
            console.log(`... and ${missing.length - 20} more`);
        }
    }

    process.exit(0);
}

await exportAll();
})();
