import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

console.log('📋 SQL Execution Script');
console.log(`Using key type: ${supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}\n`);

const phytoFile = path.join(process.cwd(), 'scripts/add-missing-phytonutrients.sql');
const detailsFile = path.join(process.cwd(), 'scripts/add-missing-details.sql');

console.log('📁 Generated SQL Files:');
console.log(`✓ ${phytoFile}`);
console.log(`✓ ${detailsFile}`);

console.log('\n📌 To apply these changes:\n');
console.log('1. Open Supabase Dashboard: https://app.supabase.com');
console.log('2. Navigate to SQL Editor');
console.log('3. Create new query');
console.log('4. Copy and paste the contents of:');
console.log(`   - scripts/add-missing-phytonutrients.sql`);
console.log(`   - scripts/add-missing-details.sql`);
console.log('5. Click "Run" to execute\n');

console.log('Alternative: You can execute these from psql:');
console.log(`  psql -h [host] -U postgres -d postgres -f scripts/add-missing-phytonutrients.sql`);
console.log(`  psql -h [host] -U postgres -d postgres -f scripts/add-missing-details.sql\n`);

// Try to check if we can connect with service role
(async () => {
    const testClient = createClient(supabaseUrl, supabaseKey);

    console.log('Testing connection...');
    const { data, error } = await testClient
        .from('food_items')
        .select('count', { count: 'exact' })
        .limit(1);

    if (error) {
        console.log(`⚠️  Connection test failed: ${error.message}`);
    } else {
        console.log('✅ Connection successful\n');

        // Try to execute the phyto updates for a test item
        console.log('Attempting to update test item...\n');

        const testSQL = `
            UPDATE public.food_items SET 
            phytonutrients = '{"Test":"This is a test update"}'
            WHERE name = 'Lamb Kidney'
            RETURNING id, name, phytonutrients;
        `;

        try {
            // Since direct SQL execution isn't available via SDK, we'll just provide instructions
            console.log('ℹ️  Direct SQL execution through SDK not available.');
            console.log('Please use Supabase SQL Editor or psql to run the SQL scripts.\n');
        } catch (err: any) {
            console.log(`Note: ${err.message}`);
        }
    }

    console.log('📊 Summary:');
    console.log('- 15 food items need phytonutrients added');
    console.log('- 15 food items need food details added');
    console.log('- Run the SQL files in Supabase SQL Editor to complete setup\n');

    process.exit(0);
})();
