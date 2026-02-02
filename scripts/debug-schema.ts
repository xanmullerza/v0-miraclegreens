
import { supabase } from '../lib/supabase';

async function checkSchema() {
    const { data, error } = await supabase.from('food_items').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(Object.keys(data[0]), null, 2));
}

checkSchema();
