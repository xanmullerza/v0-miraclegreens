
import { supabase } from '../lib/supabase';

async function checkBrandKeys() {
    const { data, error } = await supabase
        .from('food_items')
        .select('name, micronutrients')
        .eq('source', 'usda')
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(item => {
        const keys = item.micronutrients ? Object.keys(item.micronutrients) : [];
        const brandKeys = keys.filter(k => k.toLowerCase().includes('brand') || k.toLowerCase().includes('owner') || k.toLowerCase().includes('gtin'));
        if (brandKeys.length > 0) {
            console.log(`[BRANDED] ${item.name} -> ${brandKeys.join(', ')}`);
        } else {
            // console.log(`[GENERIC] ${item.name}`);
        }
    });
}

checkBrandKeys();
