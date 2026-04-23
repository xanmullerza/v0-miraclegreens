import { ParsedRecipe } from '@/types/recipe';
import { parseRecipeAmount } from './parsing-utils';
import { parseCooklangComprehensive, type CooklangParsedRecipe } from './cooklang-parser';

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
 * Robustly parses a full recipe text string into structured components.
 * Tries to identify title, servings, prep time, ingredients and instructions.
 */
export const parseRecipeText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const result = {
        title: '',
        prepTime: 30,
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
        if (lower.match(/^(ingredients|protocol components|list of components|what you'll need):?\s*$/i)) {
            mode = 'ingredients';
            continue;
        }
        if (lower.match(/^(instructions|method|steps|preparation|directions|how to make):?\s*$/i)) {
            mode = 'instructions';
            continue;
        }

        // Parse servings/prep time if found
        const servingsMatch = lower.match(/(?:servings|yields?|makes?):\s*(\d+)/i);
        if (servingsMatch) result.servings = parseInt(servingsMatch[1]);

        const timeMatch = lower.match(/(?:prep|preparation|cook|total)\s*time:\s*(\d+)\s*(?:min|hour|hr)/i);
        if (timeMatch) result.prepTime = parseInt(timeMatch[1]);

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

const COOKLANG_TOKEN_REGEX = /@(?:\{([^}]+)\}|([^\s{@]+))(?:\{([^}]*)\})?/g;

const normalizeCooklangKey = (input: string) => input.trim().toLowerCase().replace(/[-_ ]+/g, '_');

const maybeParseNumber = (value?: string) => {
    if (!value) return undefined;
    const parsed = Number(value.replace(/[a-zA-Z\s]+/g, '').trim());
    return Number.isFinite(parsed) ? parsed : undefined;
};

const cleanCooklangLine = (line: string) => {
    return line
        .replace(COOKLANG_TOKEN_REGEX, (_match, bracedName, bareName, amount) => {
            const name = (bracedName || bareName || '').trim();
            if (!name) return '';
            return amount ? `${name} ${amount.trim()}` : name;
        })
        .replace(/\s+/g, ' ')
        .trim();
};

const isCooklangIngredientLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.match(/^(ingredients|components|shopping list|what you'll need)\b/i)) return true;
    const afterTokens = trimmed.replace(COOKLANG_TOKEN_REGEX, '').replace(/[\s\-•*,:;]+/g, '');
    return trimmed.includes('@') && afterTokens.length === 0;
};

const formatCooklangIngredientLine = (ingredient: { name: string; quantity?: string; unit?: string; preparation?: string }) => {
    const quantity = ingredient.quantity ? ingredient.quantity : '';
    const unit = ingredient.unit ? ` ${ingredient.unit}` : '';
    const preparation = ingredient.preparation ? `, ${ingredient.preparation}` : '';
    return `${quantity}${unit}`.trim() ? `${quantity}${unit} ${ingredient.name}${preparation}` : `${ingredient.name}${preparation}`;
};

const formatCooklangStep = (tokens: { type: string; value: string }[]) => {
    return tokens.map(token => token.value).join('').replace(/\s+/g, ' ').trim();
};

type CooklangType = CooklangParsedRecipe;

const mapCooklangToParsedRecipe = (cooklang: CooklangType): ParsedRecipe => {
    const metadata = cooklang.metadata || {};
    const title = (metadata.title as string) || (metadata.name as string) || 'Untitled Cooklang Recipe';
    const servings = metadata.servings ? Number(metadata.servings) : undefined;
    const prep_time = metadata.prep_time ? Number(metadata.prep_time) : metadata.prepTime ? Number(metadata.prepTime) : undefined;
    const cook_time = metadata.cook_time ? Number(metadata.cook_time) : metadata.cookTime ? Number(metadata.cookTime) : undefined;
    const image_url = (metadata.image as string) || (metadata.photo as string) || (metadata.picture as string) || undefined;
    const tags = Array.isArray(metadata.tags)
        ? metadata.tags.map(String)
        : typeof metadata.tags === 'string'
        ? (metadata.tags as string).split(',').map(tag => tag.trim()).filter(Boolean)
        : undefined;
    const type = (metadata.type as ParsedRecipe['type']) || (metadata.meal_type as ParsedRecipe['type']) || undefined;

    const ingredients_text = cooklang.ingredients
        .map(formatCooklangIngredientLine)
        .filter(Boolean)
        .join('\n');

    const instructions_text = cooklang.sections
        .map(section => section.steps.map(step => formatCooklangStep(step)).filter(Boolean).join('\n'))
        .filter(Boolean)
        .join('\n\n');

    return {
        title,
        ingredients_text,
        instructions_text,
        servings,
        prep_time,
        cook_time,
        source_url: (metadata.source as string) || 'cooklang',
        image_url,
        type,
        meal_type: metadata.meal_type as string,
        difficulty: metadata.difficulty as string,
        tags,
        metadata: metadata as Record<string, string | number | string[]>,
        cookware: cooklang.cookware,
        timers: cooklang.timers,
    };
};

export const parseCooklang = (text: string): ParsedRecipe => {
    const parsed = parseCooklangComprehensive(text);
    return mapCooklangToParsedRecipe(parsed);
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
