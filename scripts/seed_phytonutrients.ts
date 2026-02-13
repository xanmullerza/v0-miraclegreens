import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const HERO_FOODS = [
    {
        names: ['Moringa', 'Drumstick leaf'],
        phytos: {
            "Quercetin": "A potent antioxidant that supports cardiovascular health and provides natural anti-inflammatory benefits.",
            "Isothiocyanates": "The 'detox' compounds that support healthy liver function and protect cells from damage.",
            "Chlorogenic Acid": "Helps balance blood sugar levels and supports metabolic efficiency."
        }
    },
    {
        names: ['Turmeric', 'Curcumin'],
        phytos: {
            "Curcumin": "Nature's most famous anti-inflammatory. Supports joint mobility and cognitive health.",
            "Turmerones": "Essential oils that help the brain repair itself and support stem cell growth."
        }
    },
    {
        names: ['Garlic'],
        phytos: {
            "Allicin": "The compound responsible for garlic's 'bite' and its legendary ability to support the immune system.",
            "S-Allyl Cysteine": "A stable antioxidant that helps maintain healthy cholesterol levels and heart health."
        }
    },
    {
        names: ['Blueberry', 'Blueberries'],
        phytos: {
            "Anthocyanins": "The deep blue pigments that cross the blood-brain barrier to support memory and focus.",
            "Pterostilbene": "A close relative of Resveratrol that is highly bioavailable and supports cellular longevity."
        }
    },
    {
        names: ['Ginger'],
        phytos: {
            "Gingerols": "Powerful soothing compounds that help with digestion and reduce muscle soreness.",
            "Shogaols": "Formed when ginger is dried or cooked, these provide potent neuroprotective benefits."
        }
    },
    {
        names: ['Kale', 'Spinach', 'Collard'],
        phytos: {
            "Lutein & Zeaxanthin": "The 'internal sunglasses' for your eyes, protecting your vision from blue light and aging.",
            "Kaempferol": "A flavonoid that has been linked to a lower risk of chronic diseases and improved heart health."
        }
    },
    {
        names: ['Onion', 'Red Onion'],
        phytos: {
            "Quercetin": "Found in high concentrations in the outer layers, it acts as a natural antihistamine and heart protector.",
            "Organosulfur Compounds": "Help support a healthy gut microbiome and natural detoxification."
        }
    },
    {
        names: ['Tomato', 'Tomatoes'],
        phytos: {
            "Lycopene": "A powerful red pigment that is even more effective when cooked; it protects skin from UV damage and supports heart health."
        }
    },
    {
        names: ['Green Tea', 'Matcha'],
        phytos: {
            "EGCG": "A world-class antioxidant that boosts metabolism and protects the nervous system."
        }
    }
];

async function seed() {
    console.log('🚀 Starting Phytonutrient Seeding...');

    for (const hero of HERO_FOODS) {
        for (const name of hero.names) {
            console.log(`Searching for "${name}"...`);
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name')
                .ilike('name', `%${name}%`);

            if (error) {
                console.error(`Error searching for ${name}:`, error);
                continue;
            }

            if (data && data.length > 0) {
                console.log(`Found ${data.length} matches for "${name}". Updating...`);
                for (const item of data) {
                    const { error: updateError } = await supabase
                        .from('food_items')
                        .update({ phytonutrients: hero.phytos })
                        .eq('id', item.id);

                    if (updateError) {
                        console.error(`Failed to update ${item.name}:`, updateError);
                    } else {
                        console.log(`✅ Updated ${item.name}`);
                    }
                }
            } else {
                console.log(`⚠️ No matches found for "${name}"`);
            }
        }
    }

    console.log('🏁 Seeding Complete!');
}

seed();
