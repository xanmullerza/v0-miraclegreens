
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment loaded.');
console.log('URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('Anon Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback to Anon if Service missing (might fail RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateMeasures() {
    console.log('Starting migration of food_measures to food_items.portions...');

    // 1. Fetch all existing measures
    const { data: measures, error: measuresError } = await supabase
        .from('food_measures')
        .select('*');

    if (measuresError) {
        console.error('Error fetching measures:', measuresError);
        return;
    }

    if (!measures || measures.length === 0) {
        console.log('No measures found in food_measures table.');
        return;
    }

    console.log(`Found ${measures.length} measures to process.`);

    // 2. Group by food_item_id
    const startMap: Record<string, any[]> = {};
    for (const m of measures) {
        if (!startMap[m.food_item_id]) {
            startMap[m.food_item_id] = [];
        }
        startMap[m.food_item_id].push({
            label: m.label,
            weight_g: m.weight_g
        });
    }

    // 3. Update each food item
    let updatedCount = 0;
    const foodIds = Object.keys(startMap);

    console.log(`Updating ${foodIds.length} food items...`);

    for (const id of foodIds) {
        const portions = startMap[id];

        // Remove duplicates in portions
        const uniquePortions = Array.from(new Map(portions.map(p => [p.label, p])).values());

        const { error } = await supabase
            .from('food_items')
            .update({ portions: uniquePortions })
            .eq('id', id);

        if (error) {
            console.error(`Failed to update food ${id}:`, error);
        } else {
            updatedCount++;
            if (updatedCount % 50 === 0) process.stdout.write('.');
        }
    }

    console.log(`\nMigration complete! Updated ${updatedCount} food items.`);
}

migrateMeasures().catch(console.error);
