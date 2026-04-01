import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvbfdqxrvrbjorwiaksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YmZkcXhydnJiam9yd2lha3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQxMjE5MywiZXhwIjoyMDgzOTg4MTkzfQ.rnr89_ONBDhK3Bgvuw9j1p-AYruocURWE_zdMNcgBC8'
);

async function findMissingItems() {
  console.log('\n=== Broad search for missing items ===\n');
  
  const searches = [
    { term: 'tomato', name: 'Tomato items' },
    { term: 'cheese', name: 'Cheese items' },
    { term: 'filo', name: 'Filo items' },
    { term: 'pastry', name: 'Pastry items' }
  ];
  
  for (const search of searches) {
    console.log(`\n${search.name}:`);
    const { data } = await supabase
      .from('food_items')
      .select('id, name, portions, created_at')
      .ilike('name', `%${search.term}%`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data && data.length > 0) {
      console.log(`  Found ${data.length} items:`);
      data.forEach(d => {
        const portionsText = d.portions?.length ? `${d.portions.length} portions` : 'NO portions';
        console.log(`    • ${d.name} (${portionsText})`);
      });
    } else {
      console.log('  None found');
    }
  }
}

findMissingItems().catch(console.error);
