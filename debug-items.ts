
import { supabase } from './lib/supabase';

async function checkMoreItems() {
    const { data, error } = await supabase.from('food_items').select('*').limit(10);
    if (error) {
        console.error(error);
        return;
    }
    data.forEach(item => {
        console.log(`Name: ${item.name}, Source: ${item.source}`);
    });
}

checkMoreItems();
