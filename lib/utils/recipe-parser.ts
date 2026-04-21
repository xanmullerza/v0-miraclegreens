import { ParsedRecipe } from '@/types/recipe';
import { parseRecipeAmount } from './parsing-utils';

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Convert Unicode fractions to decimal
 */
function parseUnicodeFraction(char: string): number | null {
    const unicodeMap: Record<string, number> = {
        '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
        '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
    };
    return unicodeMap[char] || null;
}

/**
 * Parse word-based amounts like "a cup", "some", "a handful"
 */
function parseWordAmount(text: string): { quantity: number; wordForm: boolean } {
    const wordMap: Record<string, number> = {
        'a ': 1,
        'an ': 1,
        'half': 0.5,
        'quarter': 0.25,
        'handful': 1,
        'pinch': 0.25,
        'dash': 0.125,
        'splash': 0.5,
        'some': 1,
        'few': 3,
        'several': 5,
        'most': 0.8,
        'drizzle': 0.25,
    };

    for (const [word, qty] of Object.entries(wordMap)) {
        if (text.toLowerCase().startsWith(word)) {
            return { quantity: qty, wordForm: true };
        }
    }
    
    return { quantity: 1, wordForm: false };
}

/**
 * Parse quantities with ranges like "2-3 cups" or "1 1/2 to 2"
 */
function parseQuantityWithRange(quantityStr: string): {
    quantity: number;
    range?: { min: number; max: number };
} {
    const rangePatterns = [
        /^(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?)/i, // "2-3" or "2 to 3"
        /^(\d+)\s+(\d+)\/(\d+)\s*[-–to]\s*(\d+)\s+(\d+)\/(\d+)/i, // "1 1/2 to 2 1/2"
    ];

    for (const pattern of rangePatterns) {
        const match = quantityStr.match(pattern);
        if (match) {
            const min = parseFloat(match[1]);
            const max = parseFloat(match[2]);
            const mid = (min + max) / 2;
            return { quantity: mid, range: { min, max } };
        }
    }

    // Single quantity - try to parse
    try {
        let result = 1;

        // Check for Unicode fractions
        for (const char of quantityStr) {
            const frac = parseUnicodeFraction(char);
            if (frac !== null) {
                result = frac;
                break;
            }
        }

        // Try standard fraction/decimal
        if (result === 1) {
            result = parseFloat(quantityStr) || 1;
        }

        return { quantity: result };
    } catch {
        return { quantity: 1 };
    }
}

/**
 * Parses an ingredient line to extract quantity, measure, and food name.
<<<<<<< HEAD
 * Handles both traditional format ("2 cups flour") and bracketed format ("flour (2 cups)").
=======
 * IMPROVED: Now handles ranges ("2-3 cups"), word amounts ("a pinch"), and Unicode fractions.
>>>>>>> 7debded3 (feat: improve recipe import accuracy with better parsing, fuzzy matching, and nutrition validation)
 */
export const parseIngredientAmount = (ingredientLine: string) => {
    let line = ingredientLine.trim();
    
    // Step 1: Remove common trailing descriptors
    line = line.replace(/\s*\(to taste\)\s*$/i, '').trim();
    line = line.replace(/\s*\(optional\)\s*$/i, '').trim();
    line = line.replace(/\s+(to taste|optional)\s*$/i, '').trim();
<<<<<<< HEAD
    
    let quantity = 1;
    let measure = 'item';
    let foodName = line;
    
    // Step 2: Try to extract amount at the START of the line (traditional format)
    const amountRegex = /^([\d¼½¾⅛⅜⅝⅞]+(?:\s*[-\/]\s*[\d¼½¾⅛⅜⅝⅞]+)?)\s*([a-z]*)/i;
    const startMatch = line.match(amountRegex);
    
    if (startMatch) {
        const amountStr = startMatch[1].trim();
        const possibleUnit = startMatch[2].trim().toLowerCase();
        
=======

    // Step 2: Try to extract amount at START
    let quantity = 1;
    let measure = 'item';
    let foodName = line;

    // Attempt 1: Numeric amount pattern
    const numericPattern = /^([\d+\s.,½⅓⅔¼¾⅛⅜⅝⅞/-]+)\s*([a-z]*)/i;
    let numMatch = line.match(numericPattern);

    // Attempt 2: Word-based amount
    if (!numMatch) {
        const wordMatch = line.match(/^(a|an|some|few|several|handful|pinch|dash|splash)\s+/i);
        if (wordMatch) {
            const { quantity: wordQty } = parseWordAmount(wordMatch[1]);
            quantity = wordQty;
            foodName = line.substring(wordMatch[0].length);
            return { quantity, measure, foodName };
        }
    }

    if (numMatch) {
        const amountStr = numMatch[1].trim();
        const possibleUnit = numMatch[2].trim().toLowerCase();

>>>>>>> 7debded3 (feat: improve recipe import accuracy with better parsing, fuzzy matching, and nutrition validation)
        const unitMap: Record<string, string> = {
            'g': 'g', 'gram': 'g', 'grams': 'g', 'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
            'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'l': 'l', 'liter': 'l', 'liters': 'l',
            'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
            'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
            'cup': 'cup', 'cups': 'cup', 'c': 'cup',
            'tbsp': 'tbsp', 'tbs': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tblsp': 'tbsp',
            'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
            'clove': 'clove', 'cloves': 'clove',
            'sprig': 'sprig', 'sprigs': 'sprig',
            'leaf': 'leaf', 'leaves': 'leaf',
            'stalk': 'stalk', 'stalks': 'stalk',
            'breast': 'breast', 'breasts': 'breast',
            'slice': 'slice', 'slices': 'slice',
            'head': 'head', 'heads': 'head',
        };

        if (possibleUnit && unitMap[possibleUnit]) {
            measure = unitMap[possibleUnit];
            
            // Parse quantity with range support
            const parsed = parseQuantityWithRange(amountStr);
            quantity = parsed.quantity;

            // Remove amount + unit from line to get food name
            const pattern = new RegExp(`^${amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${possibleUnit}\\s*`, 'i');
            foodName = line.replace(pattern, '').trim();
        } else {
            // No unit found, just parse the amount
            const parsed = parseQuantityWithRange(amountStr);
            quantity = parsed.quantity;

            const pattern = new RegExp(`^${amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
            foodName = line.replace(pattern, '').trim();
        }
    } else {
        // Step 3: If no amount at start, check for bracketed amount at the END (e.g., "flour (2 cups)")
        const bracketRegex = /\s*\(([^)]+)\)\s*$/;
        const bracketMatch = line.match(bracketRegex);
        
        if (bracketMatch) {
            const bracketContent = bracketMatch[1].trim();
            // Try to parse the bracketed content as an amount
            const bracketAmountMatch = bracketContent.match(/^([\d¼½¾⅛⅜⅝⅞]+(?:\s*[-\/]\s*[\d¼½¾⅛⅜⅝⅞]+)?)\s*([a-z]*)/i);
            
            if (bracketAmountMatch) {
                const amountStr = bracketAmountMatch[1].trim();
                const possibleUnit = bracketAmountMatch[2].trim().toLowerCase();
                
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
                } else {
                    try {
                        quantity = parseFloat(amountStr) || 1;
                    } catch (e) {
                        quantity = 1;
                    }
                    measure = 'item';
                }
                
                // Remove the bracketed part from the food name
                foodName = line.replace(bracketRegex, '').trim();
            }
        }
    }

    // Step 3: Clean up prep descriptions from food name
    foodName = foodName
        .replace(/\s+(crushed or finely grated|drained and roughly chopped|finely chopped|roughly chopped|torn to serve|torn, to serve).*$/i, '')
        .replace(/\s*,\s*(drained|chopped|sliced|peeled).*$/i, '')
        .trim();
    
    return { quantity, measure, foodName: foodName || line };
};

/**
 * Robustly parses a full recipe text string into structured components.
 * Tries to identify title, servings, prep/cook time, ingredients and instructions.
 * IMPROVED: Now handles cook time and better time parsing.
 */
export const parseRecipeText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const result = {
        title: '',
        prepTime: 30,
        cookTime: 0,
        servings: 4,
        ingredients: [] as { item: string; amount: string; weightG?: number; modifier?: string }[],
        instructions: [] as string[]
    };

    if (lines.length === 0) return result;

    let mode: 'none' | 'ingredients' | 'instructions' = 'none';
    
    // First line is often title
    result.title = lines[0].replace(/^[#\s=]+|[#\s=]+$/g, '');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        // Detect sections
        if (lower.match(/^(ingredients|protocol components|list of components|what you'll need|recipe ingredients|shopping list|ingredient list):?\s*$/i)) {
            mode = 'ingredients';
            continue;
        }
        if (lower.match(/^(instructions|method|steps|preparation|directions|how to make|recipe instructions|recipe method|recipe directions|cooking instructions|cooking method|cooking directions|recipe steps):?\s*$/i)) {
            mode = 'instructions';
            continue;
        }

        // Parse servings if found
        const servingsMatch = lower.match(/(?:servings|yields?|makes?):\s*(\d+)/i);
        if (servingsMatch) result.servings = parseInt(servingsMatch[1]);

        // Parse prep time
        const prepTimeMatch = lower.match(/(?:prep|preparation)\s*time:\s*(\d+)\s*(?:min|hour|hr)/i);
        if (prepTimeMatch) result.prepTime = parseInt(prepTimeMatch[1]);

        // Parse cook time
        const cookTimeMatch = lower.match(/(?:cook)\s*time:\s*(\d+)\s*(?:min|hour|hr)/i);
        if (cookTimeMatch) result.cookTime = parseInt(cookTimeMatch[1]);

        // Process based on mode
        if (mode === 'ingredients') {
            const parsedArray = parseIngredientsOnly(line);
            if (parsedArray.length > 0) {
                const parsed = parsedArray[0];
                if (parsed && parsed.item.length > 1) {
                    result.ingredients.push(parsed);
                }
            }
        } else if (mode === 'instructions') {
            const step = line.replace(/^\d+\.\s*|^\s*[-•*]\s+/, '').trim();
            if (step.length > 3) {
                result.instructions.push(step);
            }
        }
    }

    // Fallback logic if no sections found
    if (result.ingredients.length === 0 && result.instructions.length === 0) {
        const half = Math.floor(lines.length / 2);
        result.ingredients = parseIngredientsOnly(lines.slice(0, half + 1).join('\n'));
        result.instructions = parseInstructionsOnly(lines.slice(half + 1).join('\n'));
    }

    return result;
};

/**
 * Extracts structured ingredient data from a block of text.
 */
export const parseIngredientsOnly = (text: string) => {
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.toLowerCase().startsWith('ingredients:'))
        .map(line => {
            // Use existing parseIngredientAmount to be consistent
            const { quantity, measure, foodName } = parseIngredientAmount(line);
            
            return {
                item: foodName,
                amount: `${quantity} ${measure}`,
                weightG: (measure === 'g') ? quantity : undefined,
                modifier: ''
            };
        });
};

/**
 * Extracts just the instructions from a block of text.
 */
export const parseInstructionsOnly = (text: string) => {
    return text.split(/\n\s*\n|\n(?=\d+\.|\s*[-•*]\s+)/)
        .map(step => step.replace(/^\d+\.\s*|^\s*[-•*]\s+/, '').trim())
        .filter(step => step.length > 2);
};

/**
 * Converts a ParsedRecipe into structured data ready for saving.
 * This is used by the Chatbot to finalize a recipe before database insertion.
 */
export const structureRecipeForSaving = (recipe: ParsedRecipe) => {
    if (!recipe) return null;

    // Ingredients
    const ingredientsList = (recipe.ingredients_text || '')
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
            } as any;
        });

    // Instructions
    const instructionsList = (recipe.instructions_text || '')
        .split('\n')
        .filter(line => line.trim());

    // Basic Data
    const recipeDataToSave = {
        title: recipe.title,
        type: recipe.type || recipe.meal_type || 'dinner',
        servings: recipe.servings || 4,
        prep_time: recipe.prep_time || 30,
        cook_time: recipe.cook_time || 0,
        difficulty: recipe.difficulty || 'Medium',
        tags: recipe.tags || [],
        image: recipe.image_url || recipe.image,
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
