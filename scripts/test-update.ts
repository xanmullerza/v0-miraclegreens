import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testUpdate() {
    console.log('🧪 Testing direct update...\n');

    // Find a test item
    const { data: items, error: fetchError } = await supabase
        .from('food_items')
        .select('id, name, phytonutrients')
        .eq('name', 'Chicken Liver')
        .maybeSingle();

    if (fetchError || !items) {
        console.error('Error fetching:', fetchError);
        process.exit(1);
    }

    console.log(`Found item: ${items.name}`);
    console.log(`Current phytonutrients:`, JSON.stringify(items.phytonutrients));

    // Test update with proper JSON
    const testData = {
        "Heme Iron": "The most bioavailable form of iron crucial for oxygen transport.",
        "Carnitine": "Supports cellular energy production and fat oxidation.",
        "Anserine": "A neuroprotective dipeptide with anti-fatigue potential.",
        "Vitamin A Precursors": "Retinol and beta-carotene for vision, immune, and skin health."
    };

    console.log(`\nAttempting update with:`, JSON.stringify(testData));

    const { error: updateError, data } = await supabase
        .from('food_items')
        .update({ phytonutrients: testData })
        .eq('id', items.id)
        .select();

    if (updateError) {
        console.error('❌ Update error:', updateError);
        process.exit(1);
    }

    console.log('✅ Update response:', JSON.stringify(data));

    // Verify
    const { data: verify } = await supabase
        .from('food_items')
        .select('id, name, phytonutrients')
        .eq('id', items.id)
        .maybeSingle();

    console.log(`\n✓ Verified phytonutrients:`, JSON.stringify(verify?.phytonutrients));

    process.exit(0);
}

testUpdate();
