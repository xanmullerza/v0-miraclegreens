import { supabase } from './lib/supabase';

async function debugPlanner() {
    // Fetch a specific recipe to see what values are stored
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
            id,
            title,
            servings,
            calories,
            energy_kj,
            protein,
            carbs,
            fat,
            ingredients (
                weight_g,
                food_items (
                    energy_kcal,
                    energy_kj,
                    protein_g,
                    carbs_g,
                    fat_g
                )
            )
        `)
        .eq('title', 'Spanakopita')
        .limit(1);

    if (error) {
        console.error('Error fetching recipe:', error);
        return;
    }

    if (recipes && recipes.length > 0) {
        const recipe = recipes[0];
        console.log('\n=== RECIPE DATA ===');
        console.log('Title:', recipe.title);
        console.log('Servings:', recipe.servings);
        console.log('DB Calories (kcal):', recipe.calories);
        console.log('DB Energy (kJ):', recipe.energy_kj);
        console.log('Protein:', recipe.protein);

        // Calculate nutrition from ingredients
        let calculatedCals = 0;
        let calculatedKj = 0;
        
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach((ing: any) => {
                if (ing.food_items && ing.weight_g) {
                    const ratio = ing.weight_g / 100;
                    calculatedCals += (ing.food_items.energy_kcal || 0) * ratio;
                    calculatedKj += (ing.food_items.energy_kj || 0) * ratio;
                }
            });
        }

        console.log('\n=== CALCULATED FROM INGREDIENTS ===');
        console.log('Total Calories:', calculatedCals);
        console.log('Total kJ:', calculatedKj);
        
        console.log('\n=== PER SERVING ===');
        console.log('DB Calories / Servings:', recipe.calories / (recipe.servings || 1));
        console.log('Calculated / Servings:', calculatedCals / (recipe.servings || 1));
        console.log('Energy kJ / Servings:', recipe.energy_kj / (recipe.servings || 1));
        
        console.log('\n=== WHAT PLANNER WOULD SHOW ===');
        const sf = (1 / (recipe.servings || 1)) * 1; // selectedServings = 1
        console.log('Scale factor for 1 serving:', sf);
        console.log('Display calories:', recipe.calories * sf);
        console.log('Display kJ:', (recipe.energy_kj * sf || recipe.calories * sf * 4.184));
    }
}

debugPlanner().catch(console.error);
