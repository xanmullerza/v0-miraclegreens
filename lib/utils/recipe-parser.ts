
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

export function parseIngredientsOnly(text: string): ParsedIngredient[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const ingredients: ParsedIngredient[] = [];
    let nameBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('ingredient') || lowerLine === 'original recipe' || lowerLine.includes('scaled to')) continue;

        const parsed = parseIngredientLine(line);

        // Merge trailing weight lines
        if (ingredients.length > 0 && parsed.weightG && (!parsed.amount || parsed.item.length <= 2)) {
            const lastIng = ingredients[ingredients.length - 1];
            if (!lastIng.weightG || lastIng.weightG === 0) {
                lastIng.weightG = parsed.weightG;
                continue;
            }
        }

        const hasQuantity = /^[\d¼½¾⅛⅜⅝⅞*•\-]/.test(line) || lowerLine.startsWith('optional');
        if (!hasQuantity) {
            if (line.length < 100) nameBuffer.push(line);
            continue;
        }

        if (nameBuffer.length > 0) {
            const prefix = nameBuffer.join(' ');
            parsed.item = prefix + (parsed.item ? ', ' + parsed.item : '');
            nameBuffer = [];
        }
        ingredients.push(parsed);
    }

    // Fallback: if we found NO ingredients but have items in nameBuffer, 
    // treat each buffered item as a separate ingredient (for simple word lists)
    if (ingredients.length === 0 && nameBuffer.length > 0) {
        return nameBuffer.map(item => parseIngredientLine(item));
    }

    return ingredients;
}

export function parseInstructionsOnly(text: string): string[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const instructions: string[] = [];

    for (let line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('direction') || lower.includes('method') || lower.includes('instruction') || lower === 'directions') continue;

        const clean = line.replace(/^\d+[\s.)]+/, '').trim();
        if (clean.length > 5) instructions.push(clean);
    }
    return instructions.length > 0 ? instructions : [""];
}

export function parseRecipeText(text: string): ParsedRecipe {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let title = "";
    let servings = 1;
    let ingredients: ParsedIngredient[] = [];
    let instructions: string[] = [];
    let nameBuffer: string[] = [];

    let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // 1. Title Heuristic
        if (!title && !lowerLine.includes('ingredient') && !lowerLine.includes('direction') && !lowerLine.includes('method') && !lowerLine.includes('servings')) {
            title = line;
        }

        // 2. Section Switching
        if (lowerLine.includes('ingredient')) {
            currentSection = 'ingredients';
            nameBuffer = [];
            continue;
        }
        if (lowerLine.includes('instruction') || lowerLine.includes('method') || lowerLine.includes('preparation') || lowerLine === 'directions') {
            currentSection = 'instructions';
            continue;
        }

        // 3. Servings Detection
        if (lowerLine === 'makes' && i + 1 < lines.length && /^\d+/.test(lines[i + 1])) {
            servings = parseInt(lines[i + 1]);
            i++; continue;
        }
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
            // IGNORE common junk lines that are definitely not ingredients
            if (lowerLine === 'original recipe' || lowerLine.includes('scaled to')) continue;

            const parsed = parseIngredientLine(line);

            // A: If it's just a weight (e.g. "472g"), merge it back
            if (ingredients.length > 0 && parsed.weightG && (!parsed.amount || parsed.amount.toLowerCase() === 'g' || parsed.item === parsed.amount)) {
                const lastIng = ingredients[ingredients.length - 1];
                if (!lastIng.weightG || lastIng.weightG === 0) {
                    lastIng.weightG = parsed.weightG;
                    continue;
                }
            }

            // B: Fragment logic. If a line DOES NOT have a quantity, it's likely a name fragment.
            const hasQuantity = /^[\d¼½¾⅛⅜⅝⅞]/.test(line);

            if (!hasQuantity && currentSection === 'ingredients') {
                // Buffer the descriptive fragment
                if (line.length < 100) nameBuffer.push(line);
                continue;
            }

            // C: If we have a quantity, this is the 'anchor' of the ingredient.
            if (hasQuantity) {
                if (nameBuffer.length > 0) {
                    const prefix = nameBuffer.join(' ');
                    parsed.item = prefix + (parsed.item ? ', ' + parsed.item : '');
                    nameBuffer = [];
                }
                ingredients.push(parsed);
            } else if (currentSection === 'none' && isProbablyIngredient(line)) {
                // For 'none' section, we allow lines starting with bullets to be ingredients
                ingredients.push(parsed);
            }
        } else {
            const isInstructionSection = currentSection === 'instructions' || (currentSection === 'none' && isProbablyInstruction(line));

            if (isInstructionSection) {
                const cleanInstruction = line.replace(/^\d+[\s.)]+/, '').trim();
                if (cleanInstruction.length > 5) instructions.push(cleanInstruction);
                nameBuffer = [];
            } else if (currentSection === 'none' && line.length < 100 && !lowerLine.includes('prep time') && !lowerLine.includes('cook time')) {
                nameBuffer.push(line);
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
    'cup', 'cups', 'c.', 'tbsp', 'tablespoon', 'tablespoons', 'tbs', 'tbs.', 'tb.', 'T',
    'tsp', 'teaspoon', 'teaspoons', 't', 't.', 'oz', 'ounce', 'ounces', 'fl oz',
    'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'gr', 'kg', 'kilogram', 'kilograms', 'kilo',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'litre', 'litres',
    'clove', 'cloves', 'pinch', 'pinches', 'dash', 'dashes', 'slice', 'slices', 'ring', 'rings',
    'can', 'cans', 'bottle', 'bottles', 'package', 'packages', 'pkg', 'tin', 'tins', 'box', 'boxes',
    'large', 'medium', 'small', 'bunch', 'bunches', 'head', 'heads', 'sprig', 'sprigs',
    'stalk', 'stalks', 'bulb', 'bulbs', 'item', 'unit', 'portion', 'piece', 'pieces'
];

function isProbablyIngredient(line: string): boolean {
    const lower = line.toLowerCase();

    // 1. Strict Exclusion: If it looks like an instruction step
    // e.g. "1. Mix", "Step 1:", "4. Toss"
    if (/^\d+[\s.)]/.test(line) && line.length > 20) {
        // If it starts with a step-number and is long, it's likely an instruction
        // UNLESS it also contains a common unit very early on
        const firstFewWords = lower.split(/\s+/).slice(0, 4).join(' ');
        const hasUnit = COMMON_UNITS.some(u => firstFewWords.includes(u));
        if (!hasUnit) return false;
    }

    if (lower.includes('minutes') || lower.includes('hours') || lower.includes('degrees') ||
        lower.includes('cook') || lower.includes('serve') || lower.includes('toss') ||
        lower.includes('add ') || lower.includes('mix ') || lower.includes('salt and pepper')) {
        return false;
    }

    // 2. Inclusion: Starts with a quantity marker
    return /^[\d¼½¾⅛⅜⅝⅞.\-\s*•]+/.test(line);
}

function isProbablyInstruction(line: string): boolean {
    const lower = line.toLowerCase();
    // Longer lines, starting with caps, or numbered, or contains instruction verbs
    return line.length > 30 || /^\d+[.)]/.test(line) || lower.startsWith('step') ||
        lower.includes('minutes') || lower.includes('heat') || lower.includes('mix') ||
        lower.includes('cook') || lower.includes('toss') || lower.includes('serve');
}

function parseIngredientLine(line: string): ParsedIngredient {
    let cleanLine = line.replace(/^[*•\-+]\s+/, '').trim();

    // Aggressive cleanup for "or", "original", etc. artifacts
    // Strategy: if a word ends in "or/scaled/etc" and the part before it is a known unit or short word, strip it.
    const artifacts = ['or', 'original', 'scaled', 'serving'];
    const artifactRegex = new RegExp(`(\\w+)(?:${artifacts.join('|')})\\b`, 'gi');

    cleanLine = cleanLine.replace(artifactRegex, (match, p1) => {
        const lowerP1 = p1.toLowerCase();
        if (COMMON_UNITS.includes(lowerP1) || lowerP1.length <= 4) {
            // Keep real words like "floor", "door"
            const exceptions = ['flo', 'doo', 'po', 'arm', 'col', 'flav', 'tail'];
            if (exceptions.includes(lowerP1)) return match;
            return p1;
        }
        return match;
    }).trim();

    // Catch trailing punctuation + artifact like "long,or"
    cleanLine = cleanLine.replace(/(\W)(?:or|original|scaled|serving)\s*$/gi, '$1').trim();
    cleanLine = cleanLine.replace(/(?:,|"|'|\d)(or|original|scaled|serving)\s*$/gi, (m, p1) => m.slice(0, -p1.length)).trim();

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

        // Special case: check for weight in grams anywhere in the line (e.g. "2 cups (94g) flour" or "100g chicken")
        let weightG: number | undefined = undefined;

        // 1. Check for weight in parenthesis: (100g) or (100 grams)
        const parenWeightMatch = rest.match(/\((\d+(?:\.\d+)?)\s*(?:g|gram|grams)\)/i);
        if (parenWeightMatch) {
            weightG = parseFloat(parenWeightMatch[1]);
            rest = rest.replace(parenWeightMatch[0], '').trim();
        }
        // 2. Check for weight at the end: 100g or 100 grams
        else {
            const endWeightMatch = rest.match(/\b(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b$/i);
            if (endWeightMatch) {
                weightG = parseFloat(endWeightMatch[1]);
                rest = rest.replace(endWeightMatch[0], '').trim();
            }
        }

        // If 'g' is the unit, set weightG (priority over the above if it was the main unit)
        const lowerUnit = unit.toLowerCase();
        if (lowerUnit === 'g' || lowerUnit === 'gram' || lowerUnit === 'grams' || lowerUnit === 'ml') {
            weightG = parseFloat(amount);
        } else if (lowerUnit === 'kg' || lowerUnit === 'kilogram' || lowerUnit === 'kilograms') {
            weightG = parseFloat(amount) * 1000;
        }

        return {
            amount: unit ? `${amount} ${unit}` : amount,
            item: rest || unit || amount,
            weightG
        };
    }

    // If no match at start, try to find a weight/amount anywhere
    if (!match) {
        const anyWeightMatch = cleanLine.match(/\b(\d+(?:\.\d+)?)\s*(?:g|gram|grams|ml|kg|kilogram|kilograms)\b/i);
        if (anyWeightMatch) {
            const amount = anyWeightMatch[1];
            const unitPart = anyWeightMatch[0].replace(amount, '').trim();
            const item = cleanLine.replace(anyWeightMatch[0], '').trim();

            let weightG = parseFloat(amount);
            if (unitPart.toLowerCase().startsWith('kg')) weightG *= 1000;

            return {
                amount: `${amount} ${unitPart}`,
                item: item || cleanLine,
                weightG
            };
        }
    }

    return { amount: "", item: cleanLine };
}
