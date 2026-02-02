const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
    const tables = ['food_items', 'recipes', 'ingredients', 'instructions', 'profiles'];

    console.log('=== Checking all tables for RLS issues ===\n');

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ ${table}: ERROR - ${error.message}`);
            } else {
                console.log(`✅ ${table}: ${count} rows accessible`);
            }
        } catch (e) {
            console.log(`❌ ${table}: Table might not exist`);
        }
    }

    console.log('\n=== RLS Policy SQL to fix authenticated access ===\n');
    console.log(`Run this SQL in Supabase SQL Editor:\n`);

    const sql = `
-- Fix RLS for all tables - allow authenticated users to read
-- Run each statement separately if needed

-- food_items
CREATE POLICY "Allow authenticated read foods" 
ON food_items FOR SELECT TO authenticated USING (true);

-- recipes  
CREATE POLICY "Allow authenticated read recipes"
ON recipes FOR SELECT TO authenticated USING (true);

-- ingredients
CREATE POLICY "Allow authenticated read ingredients"
ON ingredients FOR SELECT TO authenticated USING (true);

-- instructions
CREATE POLICY "Allow authenticated read instructions"
ON instructions FOR SELECT TO authenticated USING (true);

-- Also allow INSERT/UPDATE for authenticated users on food_items
CREATE POLICY "Allow authenticated insert foods"
ON food_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update foods"
ON food_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow INSERT/UPDATE for recipes
CREATE POLICY "Allow authenticated insert recipes"
ON recipes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update recipes"
ON recipes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow INSERT for ingredients
CREATE POLICY "Allow authenticated insert ingredients"
ON ingredients FOR INSERT TO authenticated WITH CHECK (true);

-- Allow INSERT for instructions
CREATE POLICY "Allow authenticated insert instructions"
ON instructions FOR INSERT TO authenticated WITH CHECK (true);
`;

    console.log(sql);
}

checkAllTables();
