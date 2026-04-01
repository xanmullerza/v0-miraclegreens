import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvbfdqxrvrbjorwiaksn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YmZkcXhydnJiam9yd2lha3NuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQxMjE5MywiZXhwIjoyMDgzOTg4MTkzfQ.rnr89_ONBDhK3Bgvuw9j1p-AYruocURWE_zdMNcgBC8'
);

async function checkSchema() {
  // Get the first tomato entry to inspect
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .ilike('name', '%Tomatoes%')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else if (data && data[0]) {
    console.log('Tomato entry columns:');
    console.log(Object.keys(data[0]));
    console.log('\nFull data:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkSchema().catch(console.error);
