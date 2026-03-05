
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkForeignKeys() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking foreign keys for 'food_items'...");

    const sql = `
        SELECT
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'food_items';
    `;

    // Note: Standard Supabase client doesn't have a direct 'sql' method for raw queries unless enabled via RPC
    // We try querying via a common 'exec_sql' RPC if available, otherwise we might need to rely on inference

    // Alternative: Try to select from suspected tables and see if they have food_item_id
    const tables = ['ingredients', 'food_measures', 'meal_plan_items'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            if (error.code === 'PGRST116') {
                console.log(`Table '${table}' exists but is empty.`);
            } else if (error.code === '42P01') {
                console.log(`Table '${table}' does not exist.`);
            } else {
                console.error(`Error checking table '${table}':`, error.message);
            }
        } else {
            console.log(`Table '${table}' exists and is accessible.`);
            if (data && data.length > 0) {
                console.log(`Columns in '${table}':`, Object.keys(data[0]));
            }
        }
    }
}

checkForeignKeys();
