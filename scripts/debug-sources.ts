
import { supabase } from '../lib/supabase';

async function checkSources() {
    const { data, error } = await supabase.from('food_items').select('source').limit(100);
    if (error) {
        console.error(error);
        return;
    }
    const sources = new Set(data.map(d => d.source));
    console.log(JSON.stringify(Array.from(sources), null, 2));
}

checkSources();
