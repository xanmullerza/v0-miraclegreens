import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in environment variables.');
    console.error('Please ensure .env.local file exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the comprehensive list of micronutrients that NCCDB tracks
const NCCDB_MICRONUTRIENTS = [
    // Electrolytes
    'Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus',
    // Trace minerals
    'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium',
    // Water-soluble vitamins
    'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)',
    // Fat-soluble vitamins
    'Vitamin A', 'Vitamin D', 'Vitamin E', 'Vitamin K',
    // Other
    'Choline'
];

async function analyzeMicronutrients() {
    console.log('🔍 Analyzing micronutrients in food_items table...\n');

    // Get all food items with micronutrients
    const { data: foodItems, error } = await supabase
        .from('food_items')
        .select('id, name, source, micronutrients')
        .not('micronutrients', 'is', null);

    if (error) {
        console.error('Error fetching food items:', error);
        return;
    }

    console.log(`📊 Found ${foodItems.length} food items with micronutrients\n`);

    // First, let's analyze what nutrients are actually present
    const allNutrients = new Set<string>();
    const nutrientCounts = new Map<string, number>();

    foodItems.forEach(item => {
        const micros = item.micronutrients as Record<string, number>;
        Object.keys(micros).forEach(nutrient => {
            allNutrients.add(nutrient);
            nutrientCounts.set(nutrient, (nutrientCounts.get(nutrient) || 0) + 1);
        });
    });

    console.log(`🔬 Found ${allNutrients.size} unique micronutrients across all items\n`);

    // Sort nutrients by frequency
    const sortedNutrients = Array.from(nutrientCounts.entries())
        .sort((a, b) => b[1] - a[1]);

    console.log('📋 Top 30 most common micronutrients:');
    sortedNutrients.slice(0, 30).forEach(([nutrient, count]) => {
        console.log(`   ${nutrient}: ${count}/${foodItems.length} items`);
    });
    console.log('');

    // Now analyze patterns
    let nccdbCount = 0;
    let usdaCount = 0;
    let needsUpdate = 0;

    // Let's look at a few examples to understand the pattern
    console.log('🔍 Examining specific examples:\n');

    const examples = foodItems.slice(0, 10); // First 10 items
    examples.forEach(item => {
        const micros = item.micronutrients as Record<string, number>;
        const microKeys = Object.keys(micros);
        const zeroCount = microKeys.filter(key => micros[key] === 0).length;

        console.log(`🍎 ${item.name}`);
        console.log(`   Source: ${item.source || 'null'}`);
        console.log(`   Total nutrients: ${microKeys.length}`);
        console.log(`   Zero values: ${zeroCount}`);
        console.log(`   Non-zero values: ${microKeys.length - zeroCount}`);
        console.log('');
    });

    // Try to identify NCCDB pattern: items that have many nutrients with zeros
    foodItems.forEach(item => {
        const micros = item.micronutrients as Record<string, number>;
        const microKeys = Object.keys(micros);
        const zeroCount = microKeys.filter(key => micros[key] === 0).length;
        const nonZeroCount = microKeys.length - zeroCount;

        let detectedSource = 'unknown';

        // NCCDB pattern: many nutrients (70+) with significant zeros (20+)
        if (microKeys.length >= 70 && zeroCount >= 20) {
            detectedSource = 'nccdb';
            nccdbCount++;
        }
        // USDA pattern: fewer nutrients (< 30) with few or no zeros
        else if (microKeys.length < 30 && zeroCount < 5) {
            detectedSource = 'usda';
            usdaCount++;
        }

        const currentSource = item.source || 'null';
        const needsUpdateFlag = detectedSource !== 'unknown' && currentSource !== detectedSource;

        if (needsUpdateFlag) {
            needsUpdate++;
            console.log(`   ⚠️  Needs update: ${currentSource} → ${detectedSource}`);
        }
    });

    console.log('📈 SUMMARY:');
    console.log(`   NCCDB detected (70+ nutrients, 20+ zeros): ${nccdbCount}`);
    console.log(`   USDA detected (<30 nutrients, <5 zeros): ${usdaCount}`);
    console.log(`   Needs update: ${needsUpdate}`);
    console.log(`   Total analyzed: ${foodItems.length}`);
}

async function updateSources() {
    console.log('🔄 Updating sources based on micronutrient analysis...\n');

    const { data: foodItems, error } = await supabase
        .from('food_items')
        .select('id, name, source, micronutrients')
        .not('micronutrients', 'is', null);

    if (error) {
        console.error('Error fetching food items:', error);
        return;
    }

    let updated = 0;

    for (const item of foodItems) {
        const micros = item.micronutrients as Record<string, number>;
        const microKeys = Object.keys(micros);
        const zeroCount = microKeys.filter(key => micros[key] === 0).length;
        const nonZeroCount = microKeys.length - zeroCount;

        let newSource = null;

        // NCCDB pattern: many nutrients (70+) with significant zeros (20+)
        if (microKeys.length >= 70 && zeroCount >= 20) {
            newSource = 'nccdb';
        }
        // USDA pattern: fewer nutrients (< 30) with few or no zeros
        else if (microKeys.length < 30 && zeroCount < 5) {
            newSource = 'usda';
        }

        if (newSource && newSource !== item.source) {
            console.log(`   📝 Considering: ${item.name} (${item.source} → ${newSource})`);
            const { error: updateError } = await supabase
                .from('food_items')
                .update({ source: newSource })
                .eq('id', item.id);

            if (updateError) {
                console.error(`❌ Failed to update ${item.name}:`, updateError);
            } else {
                console.log(`✅ Updated ${item.name}: ${item.source || 'null'} → ${newSource}`);
                updated++;
            }
        }
    }

    console.log(`\n✨ Updated ${updated} food items`);
}

// Run the analysis
if (process.argv[2] === '--update') {
    updateSources();
} else {
    analyzeMicronutrients();
}