/**
 * Fix incorrect pluralizations applied by pluralize-food-names.ts
 * Run: npx ts-node --esm --skip-project scripts/fix-plural-corrections.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Specific corrections: current (wrong) → desired
const CORRECTIONS: Record<string, string> = {
  // Mass noun spices — never counted individually
  'Allspices': 'Allspice',
  'Anises': 'Anise',
  'Mints': 'Mint',
  'Mustards': 'Mustard',
  // Powders / condiments
  'Baking Powders': 'Baking Powder',
  'Baking Yeasts': 'Baking Yeast',
  'Chili Powders': 'Chili Powder',
  'Curry Powders': 'Curry Powder',
  'Curry Powders (Homemade)': 'Curry Powder (Homemade)',
  'Garlic Powders': 'Garlic Powder',
  'Ginger Powders': 'Ginger Powder',
  'Moringa Powders': 'Moringa Powder',
  'Onion Powders': 'Onion Powder',
  'Maize Meals': 'Maize Meal',
  'Maize Meals (Cooked)': 'Maize Meal (Cooked)',
  // Ground spices
  'Ground Cardomoms (Elachi)': 'Ground Cardomom (Elachi)',
  'Ground Maces': 'Ground Mace',
  // Condiments / spreads / pastes
  'Apricot Jams': 'Apricot Jam',
  'Margarines (Homemade)': 'Margarine (Homemade)',
  'Mayonnaises': 'Mayonnaise',
  'Mayonnaises (Homemade)': 'Mayonnaise (Homemade)',
  'Tomato Pastes': 'Tomato Paste',
  'Vanilla Essences': 'Vanilla Essence',
  // Grain / legume
  'Dahls': 'Dahl',
  // Spacing bug
  'Baby Marrow s': 'Baby Marrows',
};

async function main() {
  console.log('Fetching food items to correct...');
  const { data: foods, error } = await supabase
    .from('food_items')
    .select('id, name, common_name');

  if (error || !foods) {
    console.error('Error:', error);
    process.exit(1);
  }

  let fixed = 0;
  let skipped = 0;

  for (const food of foods) {
    const current = food.common_name || food.name;
    const corrected = CORRECTIONS[current];
    if (!corrected) { skipped++; continue; }

    console.log(`  Fixing: "${current}" → "${corrected}"`);
    const { error: upErr } = await supabase
      .from('food_items')
      .update({ common_name: corrected })
      .eq('id', food.id);

    if (upErr) {
      console.error(`  ✗ Failed:`, upErr.message);
    } else {
      fixed++;
    }
  }

  console.log(`\n✅ Done! ${fixed} corrected, ${skipped} skipped (already correct).`);
}

main().catch(console.error);
