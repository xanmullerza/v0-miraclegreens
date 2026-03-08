#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('📥 Fetching all food items...\n');

const { data: allFoods, error } = await supabase
    .from('food_items')
    .select('id, name, common_name, details, phytonutrients')
    .order('name');

if (error || !allFoods) {
    console.error('Error:', error);
    process.exit(1);
}

const missing = [];

allFoods.forEach(item => {
    const detailsStr = JSON.stringify(item.details || {});
    const phytosStr = JSON.stringify(item.phytonutrients || {});
    
    const detailsEmpty = detailsStr === '{}' || !item.details;
    const phytosEmpty = phytosStr === '{}' || !item.phytonutrients;
    
    if (detailsEmpty || phytosEmpty) {
        missing.push({
            name: item.name,
            common_name: item.common_name,
            details_empty: detailsEmpty,
            phytos_empty: phytosEmpty
        });
    }
});

console.log(`✅ Total items: ${allFoods.length}`);
console.log(`⚠️  Items with missing data: ${missing.length}\n`);

fs.writeFileSync('items-needing-data.json', JSON.stringify(missing, null, 2));

if (missing.length > 0) {
    console.log(`Items needing updates:`);
    missing.slice(0, 30).forEach((item, i) => {
        const missing_parts = [];
        if (item.details_empty) missing_parts.push('details');
        if (item.phytos_empty) missing_parts.push('phytos');
        console.log(`${i + 1}. ${item.name} ${item.common_name ? `(${item.common_name})` : ''}`);
        console.log(`   Missing: ${missing_parts.join(', ')}`);
    });
    if (missing.length > 30) {
        console.log(`\n... and ${missing.length - 30} more`);
    }
}

console.log(`\n✅ Full list saved to: items-needing-data.json`);
process.exit(0);
