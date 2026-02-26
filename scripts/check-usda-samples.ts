
import { supabase } from '../lib/supabase';

async function checkUSDASamples() {
    const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('source', 'usda')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

checkUSDASamples();
