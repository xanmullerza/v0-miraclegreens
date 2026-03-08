import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Phytonutrient data for remaining items
 */
const PHYTO_DATA: Record<string, Record<string, string>> = {
    'Salt, table, iodized': {
        "Iodine": "Essential for thyroid function and hormone production.",
        "Minerals": "Contains trace minerals like sodium and potassium for electrolyte balance."
    },
    'Salt (Iodized)': {
        "Iodine": "Essential for thyroid function and hormone production.",
        "Minerals": "Contains trace minerals like sodium and potassium for electrolyte balance."
    },
    'South African Pilchard': {
        "Omega-3 Fatty Acids": "EPA and DHA that support heart, brain, and eye health.",
        "Heme Iron": "Highly bioavailable iron for oxygen transport and energy metabolism.",
        "Astaxanthin": "A powerful carotenoid that provides the pink color and potent antioxidant protection.",
        "Carnosine": "An antioxidant compound that protects cells from oxidative damage."
    },
    'Pilchards': {
        "Omega-3 Fatty Acids": "EPA and DHA that support heart, brain, and eye health.",
        "Heme Iron": "Highly bioavailable iron for oxygen transport and energy metabolism.",
        "Astaxanthin": "A powerful carotenoid that provides the pink color and potent antioxidant protection.",
        "Carnosine": "An antioxidant compound that protects cells from oxidative damage."
    },
    'White All-Purpose Flour, Unenriched': {
        "Phytic Acid": "A compound with antioxidant properties and potential heavy metal binding.",
        "Gliadin": "Part of gluten that provides structure to baked goods."
    },
    'Cake Wheat Flour': {
        "Phytic Acid": "A compound with antioxidant properties and potential heavy metal binding.",
        "Gliadin": "Part of gluten that provides structure to baked goods."
    },
    'White Bread, Store Bought': {
        "B-Vitamins": "Often fortified with B1, B2, B3, and folic acid for metabolic support.",
        "Iron": "Fortified in most commercial breads to support oxygen transport.",
        "Gluten": "Provides structure and elasticity, though problematic for celiac individuals."
    }
};

async function addRemainingPhytos() {
    console.log('🚀 Adding phytonutrients for remaining items...\n');

    const { data: allFoods, error: fetchError } = await supabase
        .from('food_items')
        .select('id, name, common_name, phytonutrients')
        .order('name');

    if (fetchError || !allFoods) {
        console.error('Failed to fetch food items:', fetchError);
        process.exit(1);
    }

    let updated = 0;
    let skipped = 0;

    for (const food of allFoods) {
        // Skip if already has phytonutrients
        if (food.phytonutrients && Object.keys(food.phytonutrients).length > 0) {
            continue;
        }

        // Try to find in our phyto data
        let phytoData = null;
        const name = food.name || '';
        const commonName = food.common_name || '';

        // Try exact matches first
        if (PHYTO_DATA[name]) {
            phytoData = PHYTO_DATA[name];
        } else if (PHYTO_DATA[commonName]) {
            phytoData = PHYTO_DATA[commonName];
        } else {
            // Try partial matches
            for (const key in PHYTO_DATA) {
                if (name.includes(key) || commonName.includes(key)) {
                    phytoData = PHYTO_DATA[key];
                    break;
                }
            }
        }

        if (phytoData) {
            const { error: updateError } = await supabase
                .from('food_items')
                .update({ phytonutrients: phytoData })
                .eq('id', food.id);

            if (updateError) {
                console.error(`❌ Failed to update ${name}:`, updateError);
                skipped++;
            } else {
                console.log(`✅ Updated: ${name} ${commonName ? `(${commonName})` : ''}`);
                updated++;
            }
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Skipped: ${skipped}`);

    process.exit(0);
}

addRemainingPhytos();
