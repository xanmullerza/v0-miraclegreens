/**
 * IMPROVED Ingredient Parser with better accuracy
 * Handles ranges, word amounts, Unicode fractions, and edge cases
 */

import { ParsedRecipe } from '@/types/recipe';

interface ParsedIngredient {
    quantity: number;
    quantityRange?: { min: number; max: number }; // For "2-3 cups"
    measure: string;
    foodName: string;
    originalText: string;
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
 * IMPROVED: Parse ingredient line to extract quantity, measure, and food name
 * NOW HANDLES: ranges, word amounts, Unicode, edge cases
 */
export const parseIngredientAmountImproved = (ingredientLine: string): ParsedIngredient => {
    let line = ingredientLine.trim();
    const originalText = line;

    // Step 1: Remove common trailing descriptors
    line = line.replace(/\s*\(to taste\)\s*$/i, '').trim();
    line = line.replace(/\s*\(optional\)\s*$/i, '').trim();
    line = line.replace(/\s+(to taste|optional)\s*$/i, '').trim();

    // Step 2: Try to extract amount at START
    let quantity = 1;
    let quantityRange: { min: number; max: number } | undefined;
    let measure = 'item';
    let foodName = line;

    // Attempt 1: Numeric amount pattern
    const numericPattern = /^([\d+\s.,½⅓⅔¼¾⅛⅜⅝⅞/-]+)\s*([a-z]*)/i;
    let numMatch = line.match(numericPattern);

    // Attempt 2: Word-based amount
    if (!numMatch) {
        const wordMatch = line.match(/^(a|an|some|few|several|handful|pinch|dash|splash)\s+/i);
        if (wordMatch) {
            const { quantity: wordQty, wordForm } = parseWordAmount(wordMatch[1]);
            quantity = wordQty;
            foodName = line.substring(wordMatch[0].length);
            return { quantity, measure, foodName, originalText };
        }
    }

    if (numMatch) {
        const amountStr = numMatch[1].trim();
        const possibleUnit = numMatch[2].trim().toLowerCase();

        // Standard unit mappings
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
            'fillet': 'fillet', 'fillets': 'fillet',
            'head': 'head', 'heads': 'head',
            'bunch': 'bunch', 'bunches': 'bunch',
        };

        if (possibleUnit && unitMap[possibleUnit]) {
            measure = unitMap[possibleUnit];

            // Parse quantity with range support
            const parsed = parseQuantityWithRange(amountStr);
            quantity = parsed.quantity;
            quantityRange = parsed.range;

            // Remove amount + unit from line to get food name
            const pattern = new RegExp(`^${amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${possibleUnit}\\s*`, 'i');
            foodName = line.replace(pattern, '').trim();
        } else {
            // No unit found, just parse the amount
            const parsed = parseQuantityWithRange(amountStr);
            quantity = parsed.quantity;
            quantityRange = parsed.range;

            const pattern = new RegExp(`^${amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
            foodName = line.replace(pattern, '').trim();
        }
    }

    // Step 3: Clean up prep descriptions from food name
    foodName = foodName
        .replace(/\s+(crushed or finely grated|drained and roughly chopped|finely chopped|roughly chopped|torn to serve|torn, to serve).*$/i, '')
        .replace(/\s*,\s*(drained|chopped|sliced|peeled).*$/i, '')
        .trim();

    return {
        quantity,
        quantityRange,
        measure,
        foodName: foodName || originalText,
        originalText
    };
};

/**
 * Improved recipe text parser
 */
export const parseRecipeTextImproved = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const result = {
        title: '',
        prepTime: 30,
        cookTime: 0,
        servings: 4,
        ingredients: [] as ParsedIngredient[],
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

        // Parse servings/times
        const servingsMatch = lower.match(/(?:servings|yields?|makes?):\s*(\d+)/i);
        if (servingsMatch) result.servings = parseInt(servingsMatch[1]);

        const prepTimeMatch = lower.match(/(?:prep|preparation)\s*time:\s*(\d+)\s*(?:min|hour|hr)/i);
        if (prepTimeMatch) result.prepTime = parseInt(prepTimeMatch[1]);

        const cookTimeMatch = lower.match(/(?:cook)\s*time:\s*(\d+)\s*(?:min|hour|hr)/i);
        if (cookTimeMatch) result.cookTime = parseInt(cookTimeMatch[1]);

        // Process based on mode
        if (mode === 'ingredients' && line.length > 2) {
            const parsed = parseIngredientAmountImproved(line);
            if (parsed.foodName.length > 1) {
                result.ingredients.push(parsed);
            }
        } else if (mode === 'instructions' && line.length > 3) {
            const step = line.replace(/^\d+\.\s*|^\s*[-•*]\s+/, '').trim();
            if (step.length > 3) {
                result.instructions.push(step);
            }
        }
    }

    return result;
};
