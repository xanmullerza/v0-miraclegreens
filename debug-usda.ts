
import { supabase } from './lib/supabase';

async function checkUSDAItem() {
    const { data, error } = await supabase.from('food_items').select('*').eq('source', 'usda').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data[0], null, 2));
}

checkUSDAItem();
