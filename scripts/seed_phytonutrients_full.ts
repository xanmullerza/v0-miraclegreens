import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Comprehensive Phytonutrient Database
 * Maps food name patterns to their scientifically-documented phytonutrients.
 * Descriptions are written in a friendly, accessible tone.
 */
const PHYTO_MAP: Record<string, Record<string, string>> = {

    // ── FRUITS ──────────────────────────────────────────────
    'Apple': {
        "Quercetin": "Concentrated in the skin, this natural antihistamine supports heart health and calms inflammation.",
        "Catechins": "A type of flavanol that supports healthy blood vessels and aids the body's natural antioxidant defenses.",
        "Phloridzin": "Unique to apples, this compound helps regulate blood sugar by slowing glucose absorption."
    },
    'Apricot': {
        "Beta-Carotene": "The orange pigment your body converts to Vitamin A, supporting healthy skin and sharp vision.",
        "Catechins": "Gentle antioxidants that help protect cells and support cardiovascular health."
    },
    'Avocado': {
        "Lutein": "An 'eye vitamin' that protects your retina from age-related damage and filters harmful blue light.",
        "Beta-Sitosterol": "A plant sterol that helps maintain healthy cholesterol levels by competing with cholesterol absorption.",
        "Glutathione": "Known as the 'master antioxidant', it supports detoxification and immune defense at the cellular level."
    },
    'Banana': {
        "Dopamine": "Not the brain chemical, but a potent water-soluble antioxidant that protects cells from free radical damage.",
        "Catechins": "Flavanols with strong antioxidant activity that may help support cardiovascular health."
    },
    'Blackberries': {
        "Anthocyanins": "The deep purple pigments that are powerful brain protectors, supporting memory and cognitive function.",
        "Ellagic Acid": "A unique polyphenol that supports the body's natural cellular repair and renewal processes."
    },
    'Grapes': {
        "Resveratrol": "The famous 'red wine compound' that supports heart health and promotes cellular longevity.",
        "Anthocyanins": "Vibrant pigments that cross the blood-brain barrier to protect neurons and support memory.",
        "Proanthocyanidins": "Powerful antioxidants that support blood vessel integrity and healthy circulation."
    },
    'Lemon': {
        "Limonene": "Found in the zest, this citrus compound supports liver detoxification and has mood-lifting properties.",
        "Hesperidin": "A citrus flavonoid that strengthens capillaries and supports healthy blood pressure."
    },
    'Mandarin': {
        "Hesperidin": "A citrus bioflavonoid that strengthens tiny blood vessels and supports healthy circulation.",
        "Nobiletin": "A rare citrus compound that supports metabolic health and helps regulate blood sugar."
    },
    'Orange': {
        "Hesperidin": "A powerful citrus flavonoid that strengthens blood vessel walls and supports healthy blood pressure.",
        "Limonene": "An aromatic compound from the peel that supports natural detoxification and immune health."
    },
    'Papaya': {
        "Lycopene": "A red carotenoid powerhouse that protects skin from UV damage and supports heart health.",
        "Papain": "A unique digestive enzyme that breaks down tough protein and soothes inflammation.",
        "Beta-Cryptoxanthin": "A carotenoid linked to reduced risk of inflammatory conditions and strong bone health."
    },
    'Peach': {
        "Chlorogenic Acid": "A coffee-related polyphenol that helps stabilize blood sugar and supports fat metabolism.",
        "Beta-Carotene": "A pro-vitamin A carotenoid that supports healthy skin and immune defenses."
    },
    'Pear': {
        "Arbutin": "A natural compound that helps even skin tone and provides gentle antioxidant protection.",
        "Chlorogenic Acid": "Supports balanced blood sugar levels and efficient metabolic function."
    },
    'Plum': {
        "Anthocyanins": "Deep purple pigments that protect brain cells and help maintain sharp cognitive function.",
        "Chlorogenic Acid": "Helps balance blood sugar levels and supports metabolic health."
    },
    'Raspberries': {
        "Ellagic Acid": "A remarkable polyphenol that supports the body's natural cellular repair mechanisms.",
        "Anthocyanins": "The red pigments that provide powerful antioxidant protection for the brain and heart.",
        "Raspberry Ketones": "Aromatic compounds that may support healthy metabolism and fat-burning processes."
    },
    'Strawberries': {
        "Fisetin": "A brain-protective flavonoid that supports memory and may slow age-related cognitive decline.",
        "Ellagic Acid": "Helps protect cells from oxidative damage and supports the body's natural detox systems.",
        "Pelargonidin": "The anthocyanin responsible for the red color; it has strong antioxidant and anti-inflammatory effects."
    },
    'Watermelon': {
        "Lycopene": "Watermelon has MORE lycopene than raw tomatoes — protects heart and skin from oxidative stress.",
        "Citrulline": "An amino acid that boosts nitric oxide production, supporting blood flow, exercise performance, and recovery."
    },

    // ── VEGETABLES ──────────────────────────────────────────
    'Beetroot': {
        "Betalains": "The vibrant red-purple pigments that are potent anti-inflammatories and support liver detoxification.",
        "Nitrates": "Natural compounds your body converts to nitric oxide, boosting blood flow, stamina, and brain oxygenation."
    },
    'Broccoli': {
        "Sulforaphane": "One of the most researched plant compounds — activates the body's internal defense systems against toxins.",
        "Indole-3-Carbinol": "Supports healthy hormone metabolism and helps the body balance estrogen levels.",
        "Kaempferol": "A flavonoid that supports heart health and has natural anti-inflammatory properties."
    },
    'Butternut': {
        "Beta-Carotene": "The rich orange color signals high levels of this pro-vitamin A compound that supports immunity and eye health.",
        "Alpha-Carotene": "Works alongside beta-carotene to provide a broader spectrum of antioxidant protection."
    },
    'Cabbage': {
        "Sulforaphane": "An isothiocyanate that turbocharges the body's detoxification enzymes.",
        "Indole-3-Carbinol": "Supports hormone balance and healthy cellular metabolism.",
        "Anthocyanins": "Present in red/purple cabbage varieties, these pigments protect brain and heart health."
    },
    'Carrots': {
        "Beta-Carotene": "The classic orange 'vision vitamin' — your body converts it to Vitamin A for sharp eyesight and glowing skin.",
        "Alpha-Carotene": "A quieter partner to beta-carotene, providing additional antioxidant protection.",
        "Falcarinol": "A unique polyacetylene that supports healthy cell growth and division."
    },
    'Cauliflower': {
        "Sulforaphane": "A powerful activator of the body's Phase II detoxification enzymes.",
        "Indole-3-Carbinol": "Supports healthy estrogen metabolism and helps maintain cellular balance."
    },
    'Chinese Cabbage': {
        "Glucosinolates": "Sulfur compounds that support liver detoxification and defensive cellular processes.",
        "Kaempferol": "A heart-protective flavonoid with natural anti-inflammatory properties."
    },
    'Cucumber': {
        "Cucurbitacins": "Bitter compounds unique to the cucumber family, they have anti-inflammatory and anti-tumor research potential.",
        "Fisetin": "A brain-protective flavonoid that supports memory and fights neuroinflammation."
    },
    'Green Bell Peppers': {
        "Luteolin": "A flavonoid that crosses the blood-brain barrier and supports neurological health.",
        "Quercetin": "A potent natural antihistamine that stabilizes mast cells and calms allergic responses."
    },
    'Red Bell Peppers': {
        "Capsanthin": "The red pigment unique to red peppers — a powerful antioxidant that supports eye and skin health.",
        "Beta-Carotene": "Red peppers have 8x more beta-carotene than green ones, supporting immunity and vision.",
        "Quercetin": "A versatile antioxidant and natural anti-inflammatory compound."
    },
    'Yellow Bell Peppers': {
        "Violaxanthin": "A yellow carotenoid with antioxidant properties that supports eye health.",
        "Quercetin": "A multi-target flavonoid that supports heart, brain, and immune health.",
        "Luteolin": "A flavonoid that calms inflammation and has been linked to better memory."
    },
    'Green Peas': {
        "Coumestrol": "A phytoestrogen that supports bone density and hormonal balance.",
        "Saponins": "Natural compounds that support immune function and may help lower cholesterol."
    },
    'Lettuce': {
        "Lactucin": "A mild natural sedative compound that supports relaxation and healthy sleep.",
        "Beta-Carotene": "Provides pro-Vitamin A protection for eyes and skin."
    },
    'Potato': {
        "Chlorogenic Acid": "The same polyphenol found in coffee — helps stabilize blood sugar after meals.",
        "Kukoamines": "Compounds linked to healthy blood pressure regulation, first found in potatoes."
    },
    'Pumpkin': {
        "Beta-Carotene": "The deep orange color signals exceptionally high levels of this pro-vitamin A powerhouse.",
        "Alpha-Carotene": "Works in tandem with beta-carotene for broader antioxidant coverage.",
        "Lutein": "Protects your eyes from blue light and age-related macular degeneration."
    },
    'Sweet Potato': {
        "Beta-Carotene": "One of the richest sources in nature — a single serving can provide your full daily Vitamin A needs.",
        "Anthocyanins": "Present in purple sweet potatoes, these protect neurons and support cognitive health.",
        "Chlorogenic Acid": "Helps moderate blood sugar spikes after meals."
    },
    'Baby Marrow': {
        "Lutein": "An eye-protective carotenoid that acts as an internal sunscreen for your retina.",
        "Beta-Carotene": "Supports healthy skin regeneration and immune function."
    },
    'Lentil Sprouts': {
        "Isoflavones": "Plant estrogens that support hormonal balance and cardiovascular health.",
        "Saponins": "Natural compounds that help maintain healthy cholesterol levels."
    },
    'Split Peas': {
        "Isoflavones": "Phytoestrogens that support bone density and heart health.",
        "Saponins": "Compounds that support immune function and healthy cholesterol metabolism."
    },
    'Dahl': {
        "Phenolic Acids": "Natural antioxidants that protect cells from oxidative damage.",
        "Saponins": "Plant compounds that support gut health and cholesterol regulation."
    },

    // ── HERBS & SPICES ──────────────────────────────────────
    'Allspice': {
        "Eugenol": "The dominant compound — a powerful antimicrobial and natural pain-reliever found also in cloves.",
        "Quercetin": "An antioxidant flavonoid that provides anti-inflammatory and antihistamine benefits."
    },
    'Anise': {
        "Anethole": "The compound creating the licorice flavor — has potent anti-inflammatory and antimicrobial effects.",
        "Estragole": "Supports digestive comfort and has mild antispasmodic properties."
    },
    'Basil': {
        "Eugenol": "A potent anti-inflammatory compound with natural antimicrobial properties.",
        "Rosmarinic Acid": "Named after rosemary but abundant in basil — reduces oxidative stress and calms inflammation.",
        "Linalool": "An aromatic compound with proven calming and stress-reducing effects."
    },
    'Bay Leaf': {
        "Cineole": "Also known as eucalyptol, it supports respiratory health and has anti-inflammatory properties.",
        "Linalool": "A naturally calming terpene that reduces stress and supports healthy sleep patterns."
    },
    'Black Peppercorns': {
        "Piperine": "The 'bioavailability booster' — makes other nutrients (especially Curcumin) up to 2000% more absorbable.",
        "Beta-Caryophyllene": "A unique terpene that interacts with the body's endocannabinoid system to reduce inflammation."
    },
    'Cardamom': {
        "Cineole": "A refreshing compound that supports respiratory function and naturally freshens breath.",
        "Alpha-Terpinyl Acetate": "The dominant oil responsible for Cardamom's unique aroma, with mild anti-inflammatory effects."
    },
    'Cayenne Pepper': {
        "Capsaicin": "The 'heat' compound — boosts metabolism by up to 5%, supports pain relief, and clears sinuses.",
        "Beta-Carotene": "Provides pro-Vitamin A antioxidant protection alongside the capsaicin heat."
    },
    'Chili Powder': {
        "Capsaicin": "The thermogenic compound that raises body temperature, boosting calorie burning and clearing airways.",
        "Beta-Carotene": "Adds antioxidant protection that supports skin and immune health."
    },
    'Cinnamon': {
        "Cinnamaldehyde": "The compound that gives cinnamon its warmth — dramatically supports blood sugar regulation.",
        "Proanthocyanidins": "Powerful antioxidants that protect blood vessel walls and support heart health.",
        "Eugenol": "Adds antimicrobial and mild analgesic benefits."
    },
    'Cloves': {
        "Eugenol": "Cloves contain the highest concentration of eugenol in any food — a legendary natural painkiller and anti-inflammatory.",
        "Beta-Caryophyllene": "An anti-inflammatory terpene that helps soothe chronic inflammation pathways."
    },
    'Coriander': {
        "Linalool": "A naturally calming terpene that supports relaxation, sleep quality, and digestive comfort.",
        "Quercetin": "A versatile antioxidant that supports cardiovascular and immune health."
    },
    'Cumin': {
        "Cuminaldehyde": "The signature compound supporting digestion and healthy iron absorption.",
        "Thymoquinone": "A powerful antioxidant also found in black seed, supporting immune health."
    },
    'Curry Powder': {
        "Curcumin": "From the turmeric component — nature's most potent natural anti-inflammatory.",
        "Piperine": "From the pepper component — boosts the absorption of curcumin by up to 2000%.",
        "Cuminaldehyde": "Supports healthy digestion and enhances nutrient absorption."
    },
    'Fennel Seed': {
        "Anethole": "The licorice-flavored compound that calms digestive spasms and supports gut comfort.",
        "Fenchone": "Supports respiratory health and has mild antimicrobial activity."
    },
    'Mace': {
        "Myristicin": "A unique compound that supports brain health and has mild sedative properties.",
        "Eugenol": "Provides anti-inflammatory and antimicrobial protection."
    },
    'Mustard': {
        "Allyl Isothiocyanate": "The sharp 'heat' compound that stimulates circulation and clears sinuses.",
        "Sinigrin": "A glucosinolate that supports detoxification and healthy inflammatory responses."
    },
    'Nutmeg': {
        "Myristicin": "A neuroactive compound that in small doses supports cognitive function and calm.",
        "Elemicin": "Works synergistically with myristicin to provide gentle mood support."
    },
    'Paprika': {
        "Capsanthin": "The red pigment that is a powerful lipid-soluble antioxidant protecting cell membranes.",
        "Beta-Carotene": "Supports immune function and healthy skin through pro-Vitamin A activity.",
        "Zeaxanthin": "An eye-health carotenoid that filters damaging blue light."
    },
    'Parsley': {
        "Apigenin": "A calming flavonoid that supports brain health and has been shown to promote neurogenesis.",
        "Myristicin": "Supports natural liver detoxification and antioxidant processes."
    },
    'Rosemary': {
        "Carnosic Acid": "A potent neuroprotective antioxidant that supports brain health and memory.",
        "Rosmarinic Acid": "A polyphenol that calms inflammation and supports respiratory function.",
        "Carnosol": "Works alongside carnosic acid to protect neurons from oxidative damage."
    },
    'Thyme': {
        "Thymol": "A powerful natural antimicrobial — used medicinally for centuries to fight infections.",
        "Carvacrol": "An oregano-family compound with strong antimicrobial and anti-inflammatory properties.",
        "Rosmarinic Acid": "Provides additional antioxidant protection and supports healthy airways."
    },
    'Mint': {
        "Menthol": "The cooling sensation compound that opens airways, soothes digestion, and provides natural pain relief.",
        "Rosmarinic Acid": "A polyphenol that calms allergic responses and supports respiratory health."
    },
    'Vanilla': {
        "Vanillin": "The primary flavor compound with notable antioxidant activity and mood-enhancing properties."
    },

    // ── NUTS & SEEDS ────────────────────────────────────────
    'Almonds': {
        "Proanthocyanidins": "Found mainly in the brown skin — powerful antioxidants that support gut and heart health.",
        "Catechins": "The same flavanols found in green tea, supporting cardiovascular health."
    },
    'Brazil Nuts': {
        "Ellagic Acid": "Supports cellular repair and the body's detoxification pathways.",
        "Squalene": "An antioxidant compound that supports skin hydration and cell protection."
    },
    'Cashews': {
        "Anacardic Acid": "Unique to cashews, it has antimicrobial properties and supports skin health."
    },
    'Chia Seeds': {
        "Chlorogenic Acid": "Supports healthy blood sugar regulation and metabolic efficiency.",
        "Myricetin": "A flavonoid with anti-inflammatory and blood-sugar-regulating properties.",
        "Quercetin": "A versatile antioxidant providing immune and cardiovascular support."
    },
    'Flax Seeds': {
        "Lignans": "Flax is the richest food source — these phyto-estrogens support hormonal balance and heart health.",
        "Secoisolariciresinol (SDG)": "The primary lignan in flax, linked to reduced cancer risk and improved cholesterol profiles."
    },
    'Hazelnuts': {
        "Proanthocyanidins": "Powerful antioxidants found in the skin that support vascular health.",
        "Phytosterols": "Plant sterols that actively compete with cholesterol at absorption sites."
    },
    'Macadamia Nuts': {
        "Squalene": "A natural antioxidant that protects skin cells and supports healthy aging.",
        "Tocotrienols": "A superior form of Vitamin E with exceptional antioxidant and neuroprotective potency."
    },
    'Pecans': {
        "Ellagic Acid": "Supports cellular defense and the body's natural repair systems.",
        "Proanthocyanidins": "Concentrated tannins that support healthy blood pressure and vessel flexibility."
    },
    'Peanut Butter': {
        "Resveratrol": "The 'red wine compound' — peanuts are one of the best non-grape sources for heart protection.",
        "P-Coumaric Acid": "An antioxidant that increases as peanuts are roasted, protecting cells from damage."
    },
    'Sesame Seeds': {
        "Sesamin": "A unique lignan that supports liver health and healthy cholesterol metabolism.",
        "Sesamolin": "Works with sesamin to provide a double defense for cardiovascular and liver health."
    },
    'Sunflower Seeds': {
        "Chlorogenic Acid": "Helps stabilize blood sugar and supports metabolic health.",
        "Phytosterols": "Plant sterols that help maintain healthy cholesterol levels."
    },
    'Walnuts': {
        "Ellagic Acid": "A powerful polyphenol that supports the body's natural cellular cleanup processes.",
        "Pedunculagin": "A unique ellagitannin that your gut bacteria convert into urolithins — potent anti-aging compounds.",
        "Juglone": "A quinone unique to walnuts with antimicrobial and anti-parasitic properties."
    },

    // ── OILS ────────────────────────────────────────────────
    'Extra Virgin Olive Oil': {
        "Oleocanthal": "Acts like natural ibuprofen — provides anti-inflammatory effects similar to pharmaceutical painkillers.",
        "Hydroxytyrosol": "One of the most potent antioxidants ever measured in food, protecting heart and brain.",
        "Oleuropein": "Supports healthy blood pressure and provides antimicrobial protection."
    },
    'Avocado Oil': {
        "Lutein": "Heart- and eye-protective carotenoid that's highly bioavailable in this oil form.",
        "Beta-Sitosterol": "A plant sterol that supports healthy cholesterol by blocking absorption."
    },
    'Coconut Cream': {
        "Lauric Acid": "A medium-chain fatty acid with antimicrobial properties that supports immune defense.",
        "Phenolic Acids": "Natural antioxidants that provide gentle cellular protection."
    },

    // ── GRAINS & LEGUMES ────────────────────────────────────
    'Quinoa': {
        "Saponins": "Natural compounds in the coating that support immune health and healthy cholesterol.",
        "Kaempferol": "An anti-inflammatory flavonoid linked to reduced risk of chronic diseases.",
        "Quercetin": "A versatile antioxidant that can surpass even cranberry levels in certain quinoa varieties."
    },
    'Amaranth': {
        "Squalene": "Amaranth grain contains one of the highest plant-based levels, supporting skin and cell health.",
        "Lunasin": "A peptide with emerging research showing anti-inflammatory and cellular-protective effects."
    },

    // ── OTHER ───────────────────────────────────────────────
    'Cocoa': {
        "Theobromine": "Cocoa's signature stimulant — gentler than caffeine, it lifts mood, supports focus, and relaxes airways.",
        "Epicatechin": "A powerful flavanol that supports blood vessel flexibility and healthy blood flow.",
        "Phenylethylamine": "The 'love chemical' — triggers natural endorphin release and mood elevation."
    },
    'Honey': {
        "Chrysin": "A flavonoid that supports healthy testosterone levels and acts as a natural calming agent.",
        "Pinocembrin": "Unique to honey and propolis, it provides neuroprotective and antimicrobial benefits."
    },
    'Olive Oil': {
        "Oleocanthal": "Nature's ibuprofen — a natural anti-inflammatory that rivals pharmaceutical painkillers.",
        "Hydroxytyrosol": "Among the most powerful antioxidants found in any food, protecting heart and brain."
    }
};

async function seedAll() {
    console.log('🚀 Starting Comprehensive Phytonutrient Seeding...\n');

    const { data: allFoods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name, phytonutrients')
        .order('name');

    if (error || !allFoods) {
        console.error('Failed to fetch food items:', error);
        process.exit(1);
    }

    let updated = 0;
    let skipped = 0;
    let noMatch = 0;

    for (const food of allFoods) {
        // Check if this food already has phytonutrients
        if (food.phytonutrients && Object.keys(food.phytonutrients).length > 0) {
            skipped++;
            continue;
        }

        // Try to match against our phytonutrient map
        const commonName = food.common_name || '';
        const name = food.name || '';

        let matchedPhytos: Record<string, string> | null = null;

        for (const [pattern, phytos] of Object.entries(PHYTO_MAP)) {
            const lowerPattern = pattern.toLowerCase();
            if (
                commonName.toLowerCase().includes(lowerPattern) ||
                name.toLowerCase().includes(lowerPattern)
            ) {
                matchedPhytos = phytos;
                break;
            }
        }

        if (matchedPhytos) {
            const { error: updateError } = await supabase
                .from('food_items')
                .update({ phytonutrients: matchedPhytos })
                .eq('id', food.id);

            if (updateError) {
                console.error(`❌ Failed to update "${food.name}":`, updateError.message);
            } else {
                console.log(`✅ ${food.common_name || food.name} — ${Object.keys(matchedPhytos).join(', ')}`);
                updated++;
            }
        } else {
            noMatch++;
        }
    }

    console.log(`\n🏁 Seeding Complete!`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Already had data: ${skipped}`);
    console.log(`   ⚪ No phytos mapped: ${noMatch} (e.g. salt, baking powder, meats)`);
    process.exit(0);
}

seedAll();
