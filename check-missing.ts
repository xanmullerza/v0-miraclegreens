import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvbfdqxrvrbjorwiaksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YmZkcXhydnJiam9yd2lha3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQxMjE5MywiZXhwIjoyMDgzOTg4MTkzfQ.rnr89_ONBDhK3Bgvuw9j1p-AYruocURWE_zdMNcgBC8'
);

async function checkMissingItems() {
  console.log('\n=== Checking items that need portions ===\n');
  
  const items = ['sundried tomato', 'feta cheese crumbled', 'filo pastry'];
  
  for (const item of items) {
    console.log(`\nSearching for: "${item}"`);
    const { data } = await supabase
      .from('food_items')
      .select('id, name, portions')
      .ilike('name', `%${item}%`)
      .limit(5);
    
    if (data && data.length > 0) {
      data.forEach(d => {
        console.log(`  Found: ${d.name}`);
        console.log(`    Portions: ${d.portions?.length || 0}`);
        if (d.portions?.[0]) {
          console.log(`    Sample: ${d.portions[0].label} (${d.portions[0].weight_g}g)`);
        }
      });
    } else {
      console.log('  NOT FOUND in database');
    }
  }
}

checkMissingItems().catch(console.error);
