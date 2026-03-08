import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Comprehensive Phytonutrient Database for Missing Items
 */
const PHYTO_DATA: Record<string, Record<string, string>> = {
    'Lamb Kidney': {
        "Carnitine": "A compound essential for energy production, supporting metabolic health and muscle function.",
        "Heme Iron": "The most bioavailable form of iron, crucial for oxygen transport and energy metabolism.",
        "Carnosine": "A dipeptide found in animal tissues with potent antioxidant and anti-inflammatory properties.",
        "CoQ10": "A mitochondrial powerhouse that supports cellular energy production and heart health."
    },
    'Lamb Kidneys': {
        "Carnitine": "A compound essential for energy production, supporting metabolic health and muscle function.",
        "Heme Iron": "The most bioavailable form of iron, crucial for oxygen transport and energy metabolism.",
        "Carnosine": "A dipeptide found in animal tissues with potent antioxidant and anti-inflammatory properties.",
        "CoQ10": "A mitochondrial powerhouse that supports cellular energy production and heart health."
    },
    'Baking Powder': {
        "Baking Soda Compounds": "Although inorganic, baking powder enables nutrient-dense baked goods with long shelf life.",
        "Acid Salts": "The acid components help leaven baked goods to proper texture and digestibility."
    },
    'Balsamic vinegar': {
        "Polyphenols": "Antioxidant compounds from aged grapes that support heart health and antioxidant defenses.",
        "Acetic Acid": "Supports digestive health and may help with blood sugar regulation.",
        "Coumarin": "Found in small amounts, supports blood circulation and natural anti-inflammatory responses."
    },
    'Vinegar': {
        "Polyphenols": "Powerful antioxidants that support heart health and cellular protection.",
        "Acetic Acid": "Supports digestion and helps stabilize blood glucose levels.",
        "Catechins": "Natural antioxidants from the source material that protect cells from oxidative stress."
    },
    'Beef Liver': {
        "Heme Iron": "The most bioavailable form of iron for oxygen transport and energy metabolism.",
        "Carnitine": "Essential for cellular energy production and fat metabolism.",
        "Carnosine": "A powerful antioxidant dipeptide that protects against cellular damage.",
        "Anserine": "A unique compound researched for neuroprotective and anti-fatigue properties."
    },
    'Beef Livers': {
        "Heme Iron": "The most bioavailable form of iron for oxygen transport and energy metabolism.",
        "Carnitine": "Essential for cellular energy production and fat metabolism.",
        "Carnosine": "A powerful antioxidant dipeptide that protects against cellular damage.",
        "Anserine": "A unique compound researched for neuroprotective and anti-fatigue properties."
    },
    'Brown sugar': {
        "Molasses Compounds": "Natural compounds from molasses with antioxidant potential.",
        "Minerals": "Contains trace minerals like Iron and Potassium from the molasses fraction."
    },
    'Brown Sugar': {
        "Molasses Compounds": "Natural compounds from molasses with antioxidant potential.",
        "Minerals": "Contains trace minerals like Iron and Potassium from the molasses fraction."
    },
    'Chicken Liver': {
        "Heme Iron": "The most bioavailable form of iron crucial for oxygen transport.",
        "Carnitine": "Supports cellular energy production and fat oxidation.",
        "Anserine": "A neuroprotective dipeptide with anti-fatigue potential.",
        "Vitamin A Precursors": "Retinol and beta-carotene for vision, immune, and skin health."
    },
    'Chicken Livers': {
        "Heme Iron": "The most bioavailable form of iron crucial for oxygen transport.",
        "Carnitine": "Supports cellular energy production and fat oxidation.",
        "Anserine": "A neuroprotective dipeptide with anti-fatigue potential.",
        "Vitamin A Precursors": "Retinol and beta-carotene for vision, immune, and skin health."
    },
    'Cornmeal': {
        "Lutein": "A yellow carotenoid that supports eye health and protects tissues from blue light.",
        "Zeaxanthin": "Found in corn kernels, it concentrates in the retina to support long-term vision.",
        "Beta-Carotene": "Supports immune function and healthy vision through pro-Vitamin A activity."
    },
    'Cornmeal, White, Whole Grain, Dry': {
        "Lutein": "A yellow carotenoid that supports eye health and protects tissues from blue light.",
        "Zeaxanthin": "Found in corn kernels, it concentrates in the retina to support long-term vision.",
        "Beta-Carotene": "Supports immune function and healthy vision through pro-Vitamin A activity."
    },
    'Maize Meal': {
        "Lutein": "A yellow carotenoid that supports eye health and protects tissues from blue light.",
        "Zeaxanthin": "Found in corn kernels, it concentrates in the retina to support long-term vision.",
        "Beta-Carotene": "Supports immune function and healthy vision through pro-Vitamin A activity."
    },
    'Mayonnaise': {
        "Vitamin E": "From oil content, supports cell membrane protection and antioxidant defense.",
        "Carotenoids": "If made with egg yolks, provides lutein and zeaxanthin for eye health."
    },
    'Mayonnaise regular, salted': {
        "Vitamin E": "From oil content, supports cell membrane protection and antioxidant defense.",
        "Carotenoids": "If made with egg yolks, provides lutein and zeaxanthin for eye health."
    },
    'Rice': {
        "Gamma-Oryzanol": "A unique plant compound specific to rice bran that supports cholesterol balance.",
        "Inositol": "A compound that supports cellular communication and may help stabilize blood sugar.",
        "Phytic Acid": "Has antioxidant properties and may help metabolize heavy metals."
    },
    'Parboiled Rice': {
        "Gamma-Oryzanol": "A unique plant compound specific to rice bran that supports cholesterol balance.",
        "Inositol": "A compound that supports cellular communication and may help stabilize blood sugar.",
        "Phytic Acid": "Has antioxidant properties and may help metabolize heavy metals."
    },
    'Parboiled Rice, Converted, Cooked in Salted Water': {
        "Gamma-Oryzanol": "A unique plant compound specific to rice bran that supports cholesterol balance.",
        "Inositol": "A compound that supports cellular communication and may help stabilize blood sugar.",
        "Phytic Acid": "Has antioxidant properties and may help metabolize heavy metals."
    },
    'White Rice (Cooked)': {
        "Gamma-Oryzanol": "A unique plant compound specific to rice bran that supports cholesterol balance.",
        "Inositol": "A compound that supports cellular communication and may help stabilize blood sugar.",
        "Phytic Acid": "Has antioxidant properties and may help metabolize heavy metals."
    },
    'Baked Beans': {
        "Phytates": "Plant compounds that bind minerals but have antioxidant potential.",
        "Flavonoids": "Natural antioxidants from beans that protect cells from oxidative stress.",
        "Saponins": "Compounds that may help support healthy cholesterol and immune function."
    },
    'PNP No Name Baked Beans': {
        "Phytates": "Plant compounds that bind minerals but have antioxidant potential.",
        "Flavonoids": "Natural antioxidants from beans that protect cells from oxidative stress.",
        "Saponins": "Compounds that may help support healthy cholesterol and immune function."
    },
    'Eggs': {
        "Choline": "An essential nutrient crucial for brain development and cognitive function.",
        "Lutein": "Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.",
        "Zeaxanthin": "Works synergistically with lutein to protect the macula and support vision.",
        "Carnosine": "An antioxidant dipeptide with anti-aging and neuroprotective properties."
    },
    'Raw Egg': {
        "Choline": "An essential nutrient crucial for brain development and cognitive function.",
        "Lutein": "Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.",
        "Zeaxanthin": "Works synergistically with lutein to protect the macula and support vision.",
        "Carnosine": "An antioxidant dipeptide with anti-aging and neuroprotective properties."
    },
    'Egg': {
        "Choline": "An essential nutrient crucial for brain development and cognitive function.",
        "Lutein": "Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.",
        "Zeaxanthin": "Works synergistically with lutein to protect the macula and support vision.",
        "Carnosine": "An antioxidant dipeptide with anti-aging and neuroprotective properties."
    },
    'Hard Boiled Egg': {
        "Choline": "An essential nutrient crucial for brain development and cognitive function.",
        "Lutein": "Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.",
        "Zeaxanthin": "Works synergistically with lutein to protect the macula and support vision.",
        "Carnosine": "An antioxidant dipeptide with anti-aging and neuroprotective properties."
    }
};

async function addMissingPhytos() {
    console.log('🚀 Adding missing phytonutrients...\n');

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
    let notFound = 0;

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
        } else {
            console.log(`⚠️  No phytonutrient data found for: ${name} ${commonName ? `(${commonName})` : ''}`);
            notFound++;
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Skipped: ${skipped}`);
    console.log(`⚠️  Not found: ${notFound}`);

    process.exit(0);
}

addMissingPhytos();
