
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
    // Normalize newlines and split
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let title = "";
    let servings = 1;
    let ingredients: ParsedIngredient[] = [];
    let instructions: string[] = [];
    let nameBuffer: string[] = [];

    let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';

    // Simple heuristic-based parsing
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // 1. Title Heuristic
        if (!title && !lowerLine.includes('ingredient') && !lowerLine.includes('instruction') && !lowerLine.includes('method') && !lowerLine.includes('servings')) {
            title = line;
            // Don't continue, might also be a name buffer for the first ingredient
        }

        // 2. Section Switching
        if (lowerLine.includes('ingredient')) {
            currentSection = 'ingredients';
            nameBuffer = []; // Clear buffer on section switch
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
        const isIng = currentSection === 'ingredients' || (currentSection === 'none' && isProbablyIngredient(line));

        if (isIng) {
            const parsed = parseIngredientLine(line);

            // A: If it's just a weight (e.g. "94g"), try to apply to the previous ingredient if it lacks weight
            if (ingredients.length > 0 && parsed.weightG && (parsed.item.length <= 2 || parsed.item.toLowerCase() === 'g' || parsed.item === parsed.amount.split(' ').pop())) {
                const lastIng = ingredients[ingredients.length - 1];
                if (!lastIng.weightG || lastIng.weightG === 0) {
                    lastIng.weightG = parsed.weightG;
                    continue;
                }
            }

            // B: If the item name is weak (e.g. "shredded" or just a unit), use the name buffer
            const isWeakName = !parsed.item ||
                parsed.item.length <= 2 ||
                COMMON_UNITS.includes(parsed.item.toLowerCase()) ||
                ['shredded', 'raw', 'cooked', 'diced', 'chopped', 'regular', 'skinless', 'serving', 'original'].includes(parsed.item.toLowerCase());

            if (isWeakName && nameBuffer.length > 0) {
                const bufferedName = nameBuffer.join(' ');
                parsed.item = bufferedName + (parsed.item ? ', ' + parsed.item : '');
                nameBuffer = []; // Used the buffer
            }

            if (parsed.item) {
                ingredients.push(parsed);
                nameBuffer = []; // Always clear buffer once an ingredient is pushed
            }
        } else {
            const isInstructionSection = currentSection === 'instructions' || (currentSection === 'none' && isProbablyInstruction(line));

            if (isInstructionSection) {
                const cleanInstruction = line.replace(/^\d+[\s.)]+/, '').trim();
                instructions.push(cleanInstruction);
                nameBuffer = []; // Instructions break the name buffer
            } else {
                // Not an ingredient or instruction, likely a name or part of a name
                if (!lowerLine.includes('servings') && !lowerLine.includes('ingredient')) {
                    // If it's a short line, buffer it as a potential ingredient name
                    if (line.length < 100) {
                        nameBuffer.push(line);
                    }
                }
            }
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
    return line.length > 30 || /^\d+[.)]/.test(line) || lower.includes('minutes') || lower.includes('heat') || lower.includes('mix') || lower.includes('cook');
}

function parseIngredientLine(line: string): ParsedIngredient {
    // 1. Remove artifacts like catenated "or" or "original" often found in scaled recipes
    // e.g. "shreddedor", "tbspor" -> "shredded", "tbsp"
    let cleanLine = line.replace(/^[*•\-+]\s+/, '').trim();
    cleanLine = cleanLine.replace(/([a-zA-Z]{3,})(or|original|scaled|serving)\b/gi, '$1').trim();

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

        // Special case: check for weight in grams at the end of the line (e.g. "2 cups (94g)")
        let weightG: number | undefined = undefined;
        const weightMatch = rest.match(/\(?(\d+(?:\.\d+)?)\s*g\)?$/i);
        if (weightMatch) {
            weightG = parseFloat(weightMatch[1]);
            // Remove the weight from the item description
            rest = rest.replace(/\(?(\d+(?:\.\d+)?)\s*g\)?$/i, '').trim();
        }

        // If 'g' is the unit, set weightG
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
