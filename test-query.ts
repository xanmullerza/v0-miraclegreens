import { supabase } from './lib/supabase';

async function testQuery() {
  console.log('Testing queries...\n');
  
  // Test 1: Direct ilike (what works in debug)
  console.log('Test 1: Direct ilike');
  const { data: data1, error: err1 } = await supabase
    .from('food_items')
    .select('id, name, portions')
    .ilike('name', '%tomato%')
    .limit(3);
  console.log('Result:', data1?.length, 'items');
  if (data1?.[0]) console.log('  First:', data1[0].name, '| Portions:', data1[0].portions?.length);
  
  // Test 2: Using or (what searchLocalFood uses)
  console.log('\nTest 2: Using or');
  const { data: data2, error: err2 } = await supabase
    .from('food_items')
    .select('id, name, portions')
    .or(`name.ilike.%tomato%,common_name.ilike.%tomato%`)
    .limit(3);
  console.log('Result:', data2?.length, 'items');
  if (data2?.[0]) console.log('  First:', data2[0].name, '| Portions:', data2[0].portions?.length);
  
  // Test 3: Debug the or syntax
  console.log('\nTest 3: Debug - check if or is the issue');
  const query = `name.ilike.%tomato%,common_name.ilike.%tomato%`;
  console.log('Query string:', query);
  const { data: data3 } = await supabase
    .from('food_items')
    .select('id, name, portions')
    .or(query)
    .limit(3);
  console.log('Result:', data3?.length, 'items');
  if (data3?.[0]) console.log('  First:', data3[0].name, '| Portions:', data3[0].portions?.length);
}

testQuery().catch(console.error);
