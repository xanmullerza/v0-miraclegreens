/**
 * Script to pluralize common_name in food_items where name is singular.
 * Run: npx ts-node scripts/pluralize-food-names.ts
 *      OR: bun scripts/pluralize-food-names.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mass nouns / uncountable foods — last word of name determines this
// If the last word of the name (before comma/paren) is in this set, skip pluralization.
const MASS_NOUNS = new Set([
    // Grains & starches
    'rice', 'flour', 'meal', 'starch', 'bran', 'quinoa', 'amaranth',
    'millet', 'sorghum', 'wheat', 'oat', 'barley', 'rye', 'buckwheat',
    'oats', 'oatmeal', 'pasta', 'couscous', 'polenta',
    // Legumes used as mass
    'dahl', 'dal', 'lentil', 'hummus',
    // Dairy & fats
    'butter', 'margarine', 'cream', 'milk', 'ghee', 'oil', 'lard',
    'cheese', 'yogurt', 'buttermilk',
    // Condiments & processed
    'honey', 'sugar', 'salt', 'vinegar', 'mustard', 'sauce', 'paste',
    'mayonnaise', 'syrup', 'molasses', 'yeast', 'jam', 'jelly', 'relish',
    'ketchup', 'tahini', 'miso', 'extract', 'essence', 'concentrate',
    // Liquids
    'juice', 'water', 'broth', 'stock', 'gravy', 'tea', 'coffee',
    // Powders & ground forms
    'powder', 'flour', 'starch', 'cocoa', 'matcha',
    // Spices (whole and ground) — all uncountable
    'cinnamon', 'turmeric', 'paprika', 'cumin', 'ginger', 'nutmeg',
    'cardamom', 'elachi', 'mace', 'allspice', 'anise', 'saffron',
    'oregano', 'thyme', 'rosemary', 'basil', 'parsley', 'cilantro',
    'coriander', 'dhania', 'dill', 'sage', 'mint', 'pepper', 'chili',
    // Leafy greens & brassicas used as bulk
    'kale', 'spinach', 'lettuce', 'cabbage', 'broccoli', 'cauliflower',
    'arugula', 'watercress', 'bok choy', 'edamame', 'seaweed', 'nori',
    'celery', 'parsley',
    // Bread & baked
    'bread', 'toast', 'naan', 'roti', 'pita',
    // Proteins used as bulk
    'beef', 'pork', 'lamb', 'chicken', 'turkey', 'salmon', 'tuna',
    'cod', 'tilapia', 'shrimp', 'bacon', 'ham', 'venison', 'bison',
    'tofu', 'tempeh', 'protein',
    // Superfoods & powders
    'moringa', 'spirulina', 'wheatgrass', 'collagen', 'gelatin',
    // Nuts used as bulk / butters
    'peanut', 'almond', 'coconut',
    // Non-countable fruits (used by weight, not unit)
    'watermelon', 'cantaloupe', 'honeydew', 'pineapple', 'papaya', 'mango',
    'avocado', 'pumpkin', 'squash', 'zucchini', 'asparagus', 'garlic',
    'ginger',
]);

// Words that are already plural (end with these patterns) – skip
const ALREADY_PLURAL_ENDINGS = [
    /s$/i,  // most plurals
    /ies$/i,
    /ves$/i,
    /oes$/i,
];

// Only skip if the WHOLE first word is a mass noun
function isMassNoun(name: string): boolean {
    // Take just the base word (before comma or parenthesis)
    const base = name.split(/[,(]/)[0].trim().toLowerCase();
    // Check full base or last word
    if (MASS_NOUNS.has(base)) return true;
    const words = base.split(/\s+/);
    const lastWord = words[words.length - 1];
    return MASS_NOUNS.has(lastWord);
}

function isAlreadyPlural(name: string): boolean {
    // Check just the first word (before comma) for plural endings
    const firstWord = name.split(/[,(]/)[0].trim();
    // If it ends in 's' but is a known mass noun, it's not plural
    for (const pattern of ALREADY_PLURAL_ENDINGS) {
        if (pattern.test(firstWord) && !isMassNoun(name)) return true;
    }
    return false;
}

function pluralizeName(name: string): string {
    const name_ = name.trim(); // strip any trailing/leading spaces
    if (isMassNoun(name_)) return name_;
    if (isAlreadyPlural(name_)) return name_;

    // Split on comma: pluralize only the part before the comma
    const commaIdx = name_.indexOf(',');
    if (commaIdx > -1) {
        const before = name_.slice(0, commaIdx).trim();
        const after = name_.slice(commaIdx);
        return pluralizeWord(before) + after;
    }

    // Split on parenthesis
    const parenIdx = name_.indexOf('(');
    if (parenIdx > -1) {
        const before = name_.slice(0, parenIdx).trim();
        const after = name_.slice(parenIdx);
        return pluralizeWord(before) + ' ' + after;
    }

    return pluralizeWord(name_);
}

function pluralizeWord(word: string): string {
    if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies'; // Berry → Berries
    if (/(s|sh|ch|x|z)$/i.test(word)) return word + 'es';           // Peach → Peaches
    if (/fe?$/i.test(word)) return word.replace(/fe?$/, 'ves');      // Leaf → Leaves
    if (/o$/i.test(word)) return word + 'es';                        // Tomato → Tomatoes
    return word + 's';                                                // Apple → Apples
}

async function main() {
    console.log('Fetching food items...');
    const { data: foods, error } = await supabase
        .from('food_items')
        .select('id, name, common_name')
        .order('common_name');

    if (error || !foods) {
        console.error('Error fetching foods:', error);
        process.exit(1);
    }

    console.log(`Found ${foods.length} food items\n`);

    const updates: { id: string; old: string; new: string }[] = [];

    for (const food of foods) {
        const original = food.common_name || food.name;
        if (!original) continue;
        const pluralized = pluralizeName(original);
        if (pluralized !== original) {
            updates.push({ id: food.id, old: original, new: pluralized });
        }
    }

    if (updates.length === 0) {
        console.log('No names need pluralizing. All done!');
        return;
    }

    console.log(`Will update ${updates.length} food names:\n`);
    for (const u of updates) {
        console.log(`  ${u.old}  →  ${u.new}`);
    }

    console.log('\nApplying updates...');
    let success = 0;
    let failed = 0;
    for (const u of updates) {
        const { error: upErr } = await supabase
            .from('food_items')
            .update({ common_name: u.new })
            .eq('id', u.id);
        if (upErr) {
            console.error(`  ✗ Failed to update "${u.old}":`, upErr.message);
            failed++;
        } else {
            success++;
        }
    }

    console.log(`\n✅ Done! ${success} updated, ${failed} failed.`);
}

main().catch(console.error);
