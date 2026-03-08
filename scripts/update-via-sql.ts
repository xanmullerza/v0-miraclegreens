import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Phytonutrient data for all items
 */
const COMPLETE_PHYTO_DATA: Record<string, Record<string, string>> = {
    'Lamb Kidney': {
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
    'Beef Liver': {
        "Heme Iron": "The most bioavailable form of iron for oxygen transport and energy metabolism.",
        "Carnitine": "Essential for cellular energy production and fat metabolism.",
        "Carnosine": "A powerful antioxidant dipeptide that protects against cellular damage.",
        "Anserine": "A unique compound researched for neuroprotective and anti-fatigue properties."
    },
    'Brown sugar': {
        "Molasses Compounds": "Natural compounds from molasses with antioxidant potential.",
        "Minerals": "Contains trace minerals like Iron and Potassium from the molasses fraction."
    },
    'Chicken Liver': {
        "Heme Iron": "The most bioavailable form of iron crucial for oxygen transport.",
        "Carnitine": "Supports cellular energy production and fat oxidation.",
        "Anserine": "A neuroprotective dipeptide with anti-fatigue potential.",
        "Vitamin A Precursors": "Retinol and beta-carotene for vision, immune, and skin health."
    },
    'Cornmeal, White, Whole Grain, Dry': {
        "Lutein": "A yellow carotenoid that supports eye health and protects tissues from blue light.",
        "Zeaxanthin": "Found in corn kernels, it concentrates in the retina to support long-term vision.",
        "Beta-Carotene": "Supports immune function and healthy vision through pro-Vitamin A activity."
    },
    'Mayonnaise regular, salted': {
        "Vitamin E": "From oil content, supports cell membrane protection and antioxidant defense.",
        "Carotenoids": "If made with egg yolks, provides lutein and zeaxanthin for eye health."
    },
    'Parboiled Rice, Converted, Cooked in Salted Water': {
        "Gamma-Oryzanol": "A unique plant compound specific to rice bran that supports cholesterol balance.",
        "Inositol": "A compound that supports cellular communication and may help stabilize blood sugar.",
        "Phytic Acid": "Has antioxidant properties and may help metabolize heavy metals."
    },
    'PNP No Name Baked Beans': {
        "Phytates": "Plant compounds that bind minerals but have antioxidant potential.",
        "Flavonoids": "Natural antioxidants from beans that protect cells from oxidative stress.",
        "Saponins": "Compounds that may help support healthy cholesterol and immune function."
    },
    'Raw Egg': {
        "Choline": "An essential nutrient crucial for brain development and cognitive function.",
        "Lutein": "Concentrated in egg yolks, this carotenoid protects eyes from age-related damage.",
        "Zeaxanthin": "Works synergistically with lutein to protect the macula and support vision.",
        "Carnosine": "An antioxidant dipeptide with anti-aging and neuroprotective properties."
    },
    'Salt, table, iodized': {
        "Iodine": "Essential for thyroid function and hormone production.",
        "Minerals": "Contains trace minerals like sodium and potassium for electrolyte balance."
    },
    'South African Pilchard': {
        "Omega-3 Fatty Acids": "EPA and DHA that support heart, brain, and eye health.",
        "Heme Iron": "Highly bioavailable iron for oxygen transport and energy metabolism.",
        "Astaxanthin": "A powerful carotenoid that provides the pink color and potent antioxidant protection.",
        "Carnosine": "An antioxidant compound that protects cells from oxidative damage."
    },
    'White All-Purpose Flour, Unenriched': {
        "Phytic Acid": "A compound with antioxidant properties and potential heavy metal binding.",
        "Gliadin": "Part of gluten that provides structure to baked goods."
    },
    'White Bread, Store Bought': {
        "B-Vitamins": "Often fortified with B1, B2, B3, and folic acid for metabolic support.",
        "Iron": "Fortified in most commercial breads to support oxygen transport.",
        "Gluten": "Provides structure and elasticity, though problematic for celiac individuals."
    }
};

async function updateViaSQL() {
    console.log('🚀 Using raw SQL to update phytonutrients...\n');

    let updated = 0;
    let failed = 0;

    for (const [name, phytoData] of Object.entries(COMPLETE_PHYTO_DATA)) {
        // Use raw SQL for direct update
        const sql = `
            UPDATE public.food_items 
            SET phytonutrients = '${JSON.stringify(phytoData).replace(/'/g, "''")}'
            WHERE name = '${name.replace(/'/g, "''")}'
            OR common_name = '${name.replace(/'/g, "''")}'
        `;

        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            // If exec_sql doesn't exist, try a different approach
            const { data, error: findError } = await supabase
                .from('food_items')
                .select('id')
                .or(`name.eq.${name},common_name.eq.${name}`)
                .maybeSingle();

            if (findError || !data) {
                console.log(`⚠️  Not found: ${name}`);
                failed++;
            } else {
                // Update using API
                const { error: updateError } = await supabase
                    .from('food_items')
                    .update({ phytonutrients: phytoData })
                    .eq('id', data.id);

                if (updateError) {
                    console.log(`❌ Failed: ${name} - ${updateError.message}`);
                    failed++;
                } else {
                    console.log(`✅ Updated: ${name}`);
                    updated++;
                }
            }
        } else {
            console.log(`✅ Updated: ${name}`);
            updated++;
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);

    process.exit(0);
}

updateViaSQL();
