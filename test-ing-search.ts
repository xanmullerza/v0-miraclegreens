import { searchFoodItem } from './lib/services/nutrition';
import { extractCoreName } from './lib/utils/parsing-utils';

async function testSearch() {
  console.log('\n=== Testing searchFoodItem for recipe ingredients ===\n');
  
  const ingredients = [
    'jar sundried tomato in oil',
    'feta cheese crumbled', 
    'filo pastry'
  ];
  
  for (const ing of ingredients) {
    console.log(`\nIngredient: "${ing}"`);
    const coreName = extractCoreName(ing);
    console.log(`  Core name: "${coreName}"`);
    
    if (coreName && coreName.length >= 2) {
      const results = await searchFoodItem(coreName);
      console.log(`  Results: ${results.length} items`);
      if (results.length > 0) {
        const first = results[0];
        console.log(`    1. ${first.name}`);
        console.log(`       Source: ${first.source}`);
        console.log(`       Portions: ${first.portions?.length || 0}`);
      }
    } else {
      console.log('  Core name too short!');
    }
  }
}

testSearch().catch(console.error);
