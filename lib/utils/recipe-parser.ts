import { ParsedRecipe } from '@/types/recipe';
import { RecipeIngredient } from '@/components/recipe/ingredient-builder';

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Parses an ingredient line to extract quantity, measure, and food name.
 */
export const parseIngredientAmount = (ingredientLine: string) => {
    let line = ingredientLine.trim();
    
    // Step 1: Remove common trailing descriptors
    line = line.replace(/\s*\(to taste\)\s*$/i, '').trim();
    line = line.replace(/\s*\(optional\)\s*$/i, '').trim();
    line = line.replace(/\s+(to taste|optional)\s*$/i, '').trim();
    
    // Step 2: Extract amount at the START of the line
    const amountRegex = /^([\d¼½¾⅛⅜⅝⅞]+(?:\s*[-\/]\s*[\d¼½¾⅛⅜⅝⅞]+)?)\s*([a-z]*)/i;
    const match = line.match(amountRegex);
    
    let quantity = 1;
    let measure = 'item';
    let foodName = line;
    
    if (match) {
        const amountStr = match[1].trim();
        const possibleUnit = match[2].trim().toLowerCase();
        
        const unitMap: Record<string, string> = {
            'g': 'g', 'gram': 'g', 'grams': 'g', 'kg': 'g', 'kilogram': 'g', 'kilograms': 'g',
            'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'l': 'ml', 'liter': 'ml', 'liters': 'ml',
            'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
            'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
            'cup': 'cup', 'cups': 'cup', 'c': 'cup',
            'tbsp': 'tbsp', 'tbs': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
            'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
            'clove': 'clove', 'cloves': 'clove',
            'sprig': 'sprig', 'sprigs': 'sprig',
            'leaf': 'leaf', 'leaves': 'leaf',
            'stalk': 'stalk', 'stalks': 'stalk',
            'breast': 'breast', 'breasts': 'breast',
        };
        
        if (possibleUnit && unitMap[possibleUnit]) {
            measure = unitMap[possibleUnit];
            let qtyStr = amountStr;
            if (amountStr.includes('-') || amountStr.includes('/')) {
                qtyStr = amountStr.split(/[-\/]/)[0].trim();
            }
            try {
                quantity = parseFloat(qtyStr) || 1;
            } catch (e) {
                quantity = 1;
            }
            foodName = line.replace(new RegExp(`^${escapeRegex(amountStr)}\\s*${escapeRegex(possibleUnit)}\\s*`), '').trim();
        } else {
            try {
                quantity = parseFloat(amountStr) || 1;
            } catch (e) {
                quantity = 1;
            }
            foodName = line.replace(new RegExp(`^${escapeRegex(amountStr)}\\s*`), '').trim();
        }
    }
    
    // Clean up prep descriptions
    foodName = foodName.replace(/\s+(crushed or finely grated|drained and roughly chopped|finely chopped|roughly chopped|torn to serve|torn, to serve).*$/i, '').trim();
    
    return { quantity, measure, foodName: foodName || line };
};

/**
 * Converts a ParsedRecipe into structured data ready for saving.
 */
export const structureRecipeForSaving = (recipe: ParsedRecipe) => {
    // Ingredients
    const ingredientsList = recipe.ingredients_text
        .split('\n')
        .filter(line => line.trim())
        .map((line, idx) => {
            const { quantity, measure, foodName } = parseIngredientAmount(line);
            return {
                food_item_name: foodName || line.trim(),
                food_item_id: `raw-${idx}`,
                quantity: quantity,
                measure_label: measure,
                weight_g: 0,
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
            } as any; // Cast to any to avoid complex type intersection issues here
        });

    // Instructions
    const instructionsList = recipe.instructions_text
        .split('\n')
        .filter(line => line.trim());

    // Basic Data
    const recipeDataToSave = {
        title: recipe.title,
        type: 'dinner' as const,
        servings: recipe.servings || 4,
        prep_time: recipe.prep_time || 30,
        cook_time: recipe.cook_time || 0,
        difficulty: recipe.difficulty || 'Medium',
        tags: recipe.tags || [],
        image: recipe.image_url,
        is_favorite: true,
        is_mix: false,
        diet: [] as string[],
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        source: recipe.source_url
    };

    return { recipeDataToSave, ingredientsList, instructionsList };
};
