
/**
 * Utility to parse raw recipe text into structured data.
 */

export interface ParsedIngredient {
    item: string;
    amount: string;
    weightG?: number;
}

export interface ParsedRecipe {
    title: string;
    servings: number;
    ingredients: ParsedIngredient[];
    instructions: string[];
}

export function parseRecipeText(text: string): ParsedRecipe {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let title = "";
    let servings = 1;
    let ingredients: ParsedIngredient[] = [];
    let instructions: string[] = [];

    let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';

    // Simple heuristic-based parsing
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // 1. Title Heuristic
        if (!title && !lowerLine.includes('ingredient') && !lowerLine.includes('instruction') && !lowerLine.includes('method') && !lowerLine.includes('servings')) {
            title = line;
            continue;
        }

        // 2. Section Switching
        if (lowerLine.includes('ingredient')) {
            currentSection = 'ingredients';
            continue;
        }
        if (lowerLine.includes('instruction') || lowerLine.includes('method') || lowerLine.includes('preparation')) {
            currentSection = 'instructions';
            continue;
        }

        // 3. Servings Detection
        if (lowerLine.includes('servings:')) {
            const match = line.match(/servings:\s*(\d+)/i);
            if (match) servings = parseInt(match[1]);
            continue;
        } else if (lowerLine.includes('serves')) {
            const match = line.match(/serves\s*(\d+)/i);
            if (match) servings = parseInt(match[1]);
            continue;
        }

        // 4. Content Parsing
        if (currentSection === 'ingredients' || (currentSection === 'none' && isProbablyIngredient(line))) {
            const parsed = parseIngredientLine(line);

            // Handle multi-line ingredients: "1 cup \n Chopped Onion"
            // If the item is effectively the same as the unit/amount, check the next line
            if ((!parsed.item || parsed.item === parsed.amount.split(' ').pop()) && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (!isProbablyIngredient(nextLine) && !isProbablyInstruction(nextLine)) {
                    parsed.item = nextLine;
                    i++; // Skip the next line
                }
            }

            if (parsed.item) ingredients.push(parsed);
        } else if (currentSection === 'instructions' || (currentSection === 'none' && isProbablyInstruction(line))) {
            const cleanInstruction = line.replace(/^\d+[\s.)]+/, '').trim();
            instructions.push(cleanInstruction);
        }
    }

    return {
        title: title || "New Recipe",
        servings,
        ingredients,
        instructions: instructions.length > 0 ? instructions : [""]
    };
}

const COMMON_UNITS = [
    'cup', 'cups', 'c.', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
    'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'clove', 'cloves', 'pinch', 'pinches',
    'dash', 'dashes', 'slice', 'slices', 'can', 'cans', 'bottle', 'bottles', 'package', 'packages', 'pkg'
];

function isProbablyIngredient(line: string): boolean {
    const lower = line.toLowerCase();
    // Exclude common instruction-like patterns
    if (lower.includes('minutes') || lower.includes('hours') || lower.includes('degrees') || lower.includes('cook')) {
        return false;
    }
    // Starts with a number, fraction, or bullet
    return /^[\d¼½¾⅛⅜⅝⅞.\-\s*•]+/.test(line);
}

function isProbablyInstruction(line: string): boolean {
    const lower = line.toLowerCase();
    // Longer lines, starting with caps, or numbered, or contains instruction verbs
    return line.length > 25 || /^\d+[.)]/.test(line) || lower.includes('minutes') || lower.includes('heat') || lower.includes('mix');
}

function parseIngredientLine(line: string): ParsedIngredient {
    // Remove bullets and trim
    const cleanLine = line.replace(/^[*•\-+]\s+/, '').trim();

    // Regex to match quantity
    // Matches: "1 1/2", "1/2", "1.5", "1", "250"
    const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))\s*(.*)/i;

    const match = cleanLine.match(qtyRegex);
    if (match) {
        const amount = match[1].trim();
        let rest = match[2].trim();

        // Check if the "rest" starts with a known unit
        let unit = "";
        const words = rest.split(/\s+/);
        const firstWord = words[0].toLowerCase().replace(/[.,]$/, '');

        if (COMMON_UNITS.includes(firstWord)) {
            unit = words[0];
            rest = words.slice(1).join(' ').trim();
            // Handle cases like "cup of"
            if (rest.toLowerCase().startsWith('of ')) {
                rest = rest.slice(3).trim();
            }
        }

        // If 'g' is the unit, set weightG
        let weightG: number | undefined = undefined;
        const lowerUnit = unit.toLowerCase();
        if (lowerUnit === 'g' || lowerUnit === 'ml') {
            weightG = parseFloat(amount);
        } else if (lowerUnit === 'kg') {
            weightG = parseFloat(amount) * 1000;
        }

        return {
            amount: unit ? `${amount} ${unit}` : amount,
            item: rest || unit || amount,
            weightG
        };
    }

    return { amount: "", item: cleanLine };
}
