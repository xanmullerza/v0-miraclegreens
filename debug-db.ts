import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvbfdqxrvrbjorwiaksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YmZkcXhydnJiam9yd2lha3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQxMjE5MywiZXhwIjoyMDgzOTg4MTkzfQ.rnr89_ONBDhK3Bgvuw9j1p-AYruocURWE_zdMNcgBC8'
);

async function debugDB() {
  console.log('\n=== CHECKING FOOD_ITEMS ===\n');
  
  // Search for tomatoes, cheese, eggs, filo
  const items = ['Tomatoes', 'Cheese', 'Egg', 'Filo'];
  
  for (const item of items) {
    console.log(`\n--- Searching for: ${item} ---`);
    const { data, error } = await supabase
      .from('food_items')
      .select('id, name, common_name')
      .ilike('name', `%${item}%`)
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
    } else if (data) {
      console.log(`Found ${data.length} items:`);
      data.forEach(d => console.log(`  - ${d.name} (${d.id})`));
      
      // For each food item, check if it has food_measures
      for (const foodItem of data) {
        const { data: measures, error: measError } = await supabase
          .from('food_measures')
          .select('id, label, weight_g')
          .eq('food_item_id', foodItem.id);
        
        if (measError) {
          console.error(`    Measures error: ${measError.message}`);
        } else {
          console.log(`    Measures: ${measures?.length || 0} entries`);
          measures?.slice(0, 3).forEach(m => 
            console.log(`      • ${m.label} (${m.weight_g}g)`)
          );
        }
      }
    }
  }
  
  console.log('\n\n=== CHECKING SPECIFIC IDS FROM YOUR SCREENSHOT ===\n');
  
  // Based on the DB screenshot showing these IDs
  const specificIds = [
    '5ffe096d-0360-47a1-bbbb-05c98a758e01', // Cheese, feta
    'aa181f8b-ea9f-4f05-93b5-a3083f83bd1c'  // Cheese, feta (another)
  ];
  
  for (const id of specificIds) {
    console.log(`\nChecking ID: ${id}`);
    const { data: item, error: itemError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (itemError) {
      console.log(`  Item not found or error: ${itemError.message}`);
    } else if (item) {
      console.log(`  Item: ${item.name}`);
      
      const { data: measures, error: measError } = await supabase
        .from('food_measures')
        .select('id, label, weight_g')
        .eq('food_item_id', id);
      
      if (measError) {
        console.error(`  Measures error: ${measError.message}`);
      } else {
        console.log(`  Measures: ${measures?.length || 0} entries`);
        measures?.forEach(m => 
          console.log(`    • ${m.label} (${m.weight_g}g)`)
        );
      }
    }
  }
}

debugDB().catch(console.error);
