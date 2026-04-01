import { supabase } from './lib/supabase';

async function checkRLS() {
  console.log('Testing RLS and basic queries...\n');
  
  // Test 1: No filter
  console.log('Test 1: No filter (all items)');
  const { data: data1, error: err1 } = await supabase
    .from('food_items')
    .select('id, name')
    .limit(3);
  if (err1) console.log('Error:', err1);
  console.log('Result:', data1?.length, 'items');
  if (data1?.length) console.log('  Sample:', data1[0].name);
  
  // Test 2: With ilike
  console.log('\nTest 2: With ilike on name only');
  const { data: data2, error: err2 } = await supabase
    .from('food_items')
    .select('id, name, portions')
    .ilike('name', '%Tomatoes%')
    .limit(3);
  if (err2) console.log('Error:', err2);
  console.log('Result:', data2?.length, 'items');
  if (data2?.length) {
    console.log('  Sample:', data2[0].name);
    console.log('  Portions length:', data2[0].portions?.length);
  }
}

checkRLS().catch(console.error);
