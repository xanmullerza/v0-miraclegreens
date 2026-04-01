import { searchLocalFood } from './lib/services/nutrition';

async function testSearch() {
  console.log('\n=== Testing searchLocalFood ===\n');
  
  const queries = ['tomato', 'cheese', 'egg'];
  
  for (const query of queries) {
    console.log(`\nSearching for: "${query}"`);
    const results = await searchLocalFood(query);
    
    if (results.length > 0) {
      const first = results[0];
      console.log(`  Found: ${first.name}`);
      console.log(`  Portions: ${first.portions?.length || 0}`);
      first.portions?.slice(0, 3).forEach(p => {
        console.log(`    • ${p.label} (${p.weight_g}g)`);
      });
    } else {
      console.log('  No results');
    }
  }
}

testSearch().catch(console.error);
