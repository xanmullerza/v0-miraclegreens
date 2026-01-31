
import { supabase } from './lib/supabase';

async function analyzeUSDA() {
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
        const meta = item.micronutrients ? (item.micronutrients as any)._meta_dataType : 'N/A';
        const fdcId = item.micronutrients ? (item.micronutrients as any)._meta_fdc_id : 'N/A';
        console.log(`[${meta}] [${fdcId}] ${item.name}`);
    });
}

analyzeUSDA();
