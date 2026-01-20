
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

        // 1. Title Heuristic: First line that isn't a section header
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
            ingredients.push(parseIngredientLine(line));
        } else if (currentSection === 'instructions' || (currentSection === 'none' && isProbablyInstruction(line))) {
            // Clean up numbered lists (e.g. "1. Mix flour")
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

function isProbablyIngredient(line: string): boolean {
    // Starts with a number, fraction, or bullet
    return /^[\d¼½¾⅛⅜⅝⅞.\-\s*•]+/.test(line);
}

function isProbablyInstruction(line: string): boolean {
    // Longer lines, starting with caps, or numbered
    return line.length > 20 || /^\d+[.)]/.test(line);
}

function parseIngredientLine(line: string): ParsedIngredient {
    // Regex to match quantity + unit + item
    // Matches: "2 cups", "1/2 tsp", "1.5 lbs", "1", "250g"
    const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))\s*([a-zA-Z.]+(?:\s+[a-zA-Z.]+)?\b)?\s*(?:of\s+)?(.*)/i;

    // Remove bullets
    const cleanLine = line.replace(/^[*•\-+]\s+/, '').trim();

    const match = cleanLine.match(qtyRegex);
    if (match) {
        const amount = match[1].trim();
        const unit = match[2]?.trim() || "";
        const item = match[3]?.trim() || "";

        // If 'g' is the unit, set weightG
        let weightG: number | undefined = undefined;
        if (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'ml') {
            weightG = parseFloat(amount);
        } else if (unit.toLowerCase() === 'kg') {
            weightG = parseFloat(amount) * 1000;
        }

        return {
            amount: unit ? `${amount} ${unit}` : amount,
            item: item || unit || amount, // Fallback if parsing fails
            weightG
        };
    }

    return { amount: "", item: cleanLine };
}
