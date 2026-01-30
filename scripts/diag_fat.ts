
import { supabase } from '../lib/supabase';
import { calculateRecipeNutrition } from '../lib/utils/nutrition-calculator';

async function test() {
    const recipeId = '1769600509377';
    const { data: ingData } = await supabase
        .from('ingredients')
        .select('*, food_item:food_items(*)')
        .eq('recipe_id', recipeId);

    if (ingData) {
        const calculated = calculateRecipeNutrition(
            ingData.map((ing: any) => ({
                food_item: ing.food_item,
                weight_g: ing.weight_g || 0
            }))
        );

        console.log('\n--- FAT MICROS ---');
        const m = (calculated.micronutrients || {});
        Object.keys(m)
            .filter(k =>
                k.toLowerCase().includes('fat') ||
                k.toLowerCase().includes('saturated') ||
                k.toLowerCase().includes('mono') ||
                k.toLowerCase().includes('poly') ||
                k.toLowerCase().includes('omega')
            )
            .sort()
            .forEach(k => console.log(`${k}: ${m[k]}`));

        console.log('\n--- TOTAL FAT MACRO ---');
        console.log('Fat:', calculated.fat);
    } else {
        console.log('No ingredients found for recipe', recipeId);
    }
}
test();
