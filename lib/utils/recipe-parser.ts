
/**
 * Utility to parse raw recipe text into structured data.
 */

export interface ParsedIngredient {
    item: string;
    amount: string;
    weightG?: number;
    modifier?: string;
}

export interface ParsedRecipe {
    title: string;
    servings: number;
    prepTime: number;
    ingredients: ParsedIngredient[];
    instructions: string[];
}

function isJunkLine(line: string): boolean {
    const lower = line.toLowerCase();
    const JUNK_MARKERS = [
        'local offers', 'directions', 'method', 'instructions', 'step',
        'prep time', 'cook time', 'total time', 'servings', 'makes',
        'print recipe', 'save recipe', 'pin it', 'share this',
        'jump to', 'nutrition facts', 'keep screen awake', 'yields',
        'yield:', '1/2x', '1x', '2x'
    ];

    if (JUNK_MARKERS.some(marker => lower.includes(marker))) return true;

    // Detect time durations like "20 mins", "1 hr" as standalone lines
    if (/^\d+\s*(mins?|minutes?|hr|hours?|seconds?|sec)\s*$/i.test(line)) return true;

    // Detect single numbers or list markers alone
    if (/^[\d¼½¾⅛⅜⅝⅞*•\-]\s*$/i.test(line)) return true;

    // Skip lines that look like instruction steps or long descriptive text
    if (line.length > 150 && !/^[\d¼½¾⅛⅜⅝⅞*•\-]/.test(line)) return true;

    return false;
}

export function parseIngredientsOnly(text: string): ParsedIngredient[] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const ingredients: ParsedIngredient[] = [];
    let nameBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isJunkLine(line)) continue;

        const lowerLine = line.toLowerCase();

        if (lowerLine.includes('ingredient') || lowerLine.includes('original recipe') || lowerLine.includes('scaled to')) continue;

        // Use stricter isProbablyIngredient for mid-list filtering
        if (!isProbablyIngredient(line)) {
            // If we're already parsing ingredients, a non-ingredient line might be junk or a buffer
            if (ingredients.length > 0 && !/^[\d¼½¾⅛⅜⅝⅞*•\-]/.test(line)) {
                nameBuffer.push(line);
                continue;
            }
            if (ingredients.length === 0) continue; // Skip leading junk
        }

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

        // If it has a quantity, flush buffer and start new
        if (hasQuantity) {
            // Heuristic: If the parsed item name is very short OR is just the unit name
            const lowerItem = (parsed.item || "").toLowerCase();
            const isNameWeak = (parsed.item || "").length < 2 ||
                parsed.item === parsed.amount ||
                COMMON_UNITS.some(u => lowerItem === u || lowerItem === u + 's');

            if (nameBuffer.length > 0) {
                if (isNameWeak) {
                    // The buffer IS the name of this ingredient
                    const prefix = nameBuffer.join(' ');
                    parsed.item = prefix + (parsed.item && parsed.item !== prefix ? ' ' + parsed.item : '');
                    nameBuffer = []; // Consumed
                } else {
                    // Flush buffer as separate items if they don't look like junk
                    nameBuffer.forEach(bufferedItem => {
                        if (!isJunkLine(bufferedItem)) {
                            ingredients.push(parseIngredientLine(bufferedItem));
                        }
                    });
                    nameBuffer = [];
                }
            }
            ingredients.push(parsed);
        } else {
            // No quantity. Buffer it for possible multi-line name or as a standalone
            nameBuffer.push(line);
        }
    }

    // Flush remaining buffer
    if (nameBuffer.length > 0) {
        const lastIng = ingredients[ingredients.length - 1];
        if (lastIng && nameBuffer.length === 1 && nameBuffer[0].length < 20) {
            lastIng.item += ', ' + nameBuffer[0];
        } else {
            nameBuffer.forEach(bufferedItem => {
                if (!isJunkLine(bufferedItem)) {
                    ingredients.push(parseIngredientLine(bufferedItem));
                }
            });
        }
    }

    // Final cleanup of empty ingredients
    return ingredients.filter(ing => ing.item && ing.item.length >= 2);
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
    let prepTime = 30; // Default
    let ingredients: ParsedIngredient[] = [];
    let instructions: string[] = [];
    let nameBuffer: string[] = [];

    let currentSection: 'none' | 'ingredients' | 'instructions' = 'none';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // 1. Skip Title Parsing (As requested: User should fill manually)
        // We'll just ignore the first block of text that isn't a section or metadata

        // 2. Section Switching
        if (lowerLine === 'ingredients' || lowerLine.includes('ingredient list')) {
            currentSection = 'ingredients';
            nameBuffer = [];
            continue;
        }
        if (lowerLine === 'instructions' || lowerLine === 'directions' || lowerLine === 'method' || lowerLine.includes('preparation')) {
            currentSection = 'instructions';
            continue;
        }

        // 3. Metadata Detection (Servings, Prep Time, Cook Time)
        // Handle "Makes \n 1 omelet"
        if (lowerLine === 'makes' && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const match = nextLine.match(/^(\d+)/);
            if (match) {
                servings = parseInt(match[1]);
                i++; continue;
            }
        }
        // Handle "Prep Time \n 2 minutes"
        if (lowerLine === 'prep time' && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const match = nextLine.match(/^(\d+)/);
            if (match) {
                prepTime = parseInt(match[1]);
                i++; continue;
            }
        }
        // Handle "Cook Time \n 3 minutes" (Add to prep time for total)
        if (lowerLine === 'cook time' && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const match = nextLine.match(/^(\d+)/);
            if (match) {
                prepTime += parseInt(match[1]); // We sum prep+cook for the simple 'prepTime' field
                i++; continue;
            }
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

            // A: If it's just a weight (e.g. "472g" or "100g"), merge it back to the previous ingredient
            const isWeightOnly = parsed.weightG && (!parsed.amount || parsed.amount.toLowerCase() === 'g' || parsed.item === parsed.amount || parsed.item.length <= 4);
            if (ingredients.length > 0 && isWeightOnly) {
                const lastIng = ingredients[ingredients.length - 1];
                // Update weight if the new one is more specific (non-zero)
                if (parsed.weightG) lastIng.weightG = parsed.weightG;
                continue;
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
        title: "", // Manual entry required
        servings,
        prepTime,
        ingredients,
        instructions: instructions.length > 0 ? instructions : [""]
    };
}

const COMMON_UNITS = [
    'extra large', 'extra-large', 'xl', 'large', 'medium', 'small', 'jumbo', 'tiny',
    'cup', 'cups', 'c.', 'tbsp', 'tablespoon', 'tablespoons', 'tbs', 'tbs.', 'tb.', 'T',
    'tsp', 'teaspoon', 'teaspoons', 't', 't.', 'oz', 'ounce', 'ounces', 'fl oz', 'fluid ounce', 'fluid ounces',
    'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'gr', 'kg', 'kilogram', 'kilograms', 'kilo',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'litre', 'litres',
    'clove', 'cloves', 'pinch', 'pinches', 'dash', 'dashes', 'slice', 'slices', 'ring', 'rings',
    'can', 'cans', 'bottle', 'bottles', 'package', 'packages', 'pkg', 'tin', 'tins', 'box', 'boxes',
    'bunch', 'bunches', 'head', 'heads', 'sprig', 'sprigs',
    'stalk', 'stalks', 'bulb', 'bulbs', 'each', 'item', 'unit', 'portion', 'piece', 'pieces', 'whole'
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
        lower.includes('add ') || lower.includes('mix ') || lower.includes('salt and pepper') ||
        lower.includes('heat ') || lower.includes('skillet') || lower.includes('stir ')) {
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

const COMMON_MODIFIERS = [
    'chopped', 'diced', 'minced', 'shredded', 'grated', 'sliced', 'crushed', 'pureed', 'mashed', 'ground',
    'melted', 'softened', 'beaten', 'whisked', 'sifted',
    'peeled', 'seeded', 'cored', 'zested', 'juiced', 'skinless', 'boneless',
    'cooked', 'boiled', 'fried', 'baked', 'roasted', 'steamed', 'blanched', 'sautéed', 'grilled', 'smoked',
    'dried', 'fresh', 'frozen', 'raw', 'canned',
    'warm', 'hot', 'cold', 'chilled',
    'crumbled', 'cubed', 'halved', 'quartered', 'whole',
    'finely', 'coarsely', 'thinly', 'thickly', 'roughly',
    'sea', 'kosher', 'table', 'iodized', 'extra-virgin', 'virgin', 'light', 'dark', 'unsalted', 'salted',
    'green', 'red', 'white', 'yellow', 'purple', 'large', 'medium', 'small'
];

function extractModifier(text: string): { modifier?: string, cleanText: string } {
    let currentText = text.trim();
    const potentialModifiers: string[] = [];

    // 1. Handle trailing modifiers after a comma (e.g., "Carrots, thinly sliced")
    const commaIndex = currentText.indexOf(',');
    if (commaIndex !== -1) {
        const itemPart = currentText.substring(0, commaIndex).trim();
        const modifierPart = currentText.substring(commaIndex + 1).trim();

        // Reliability check: Is the part after comma likely a modifier?
        const modWords = modifierPart.toLowerCase().split(/\s+/);
        const hasKnownMod = modWords.some(w => COMMON_MODIFIERS.includes(w.replace(/[,;:]/g, '')));

        if (hasKnownMod || modifierPart.length < 30) {
            return {
                modifier: modifierPart,
                cleanText: itemPart
            };
        }
    }

    // 2. Handle prefix modifiers (e.g., "Chopped Spinach", "Extra Virgin Olive Oil")
    const words = currentText.split(/\s+/);
    let i = 0;
    while (i < words.length) {
        let wordRaw = words[i].toLowerCase().replace(/[,;:]$/, '');

        if (COMMON_MODIFIERS.includes(wordRaw)) {
            potentialModifiers.push(words[i].replace(/[,;:]$/, ''));
            i++;
        } else {
            // Check for adverbs or composite descriptors
            const adverbs = ['finely', 'coarsely', 'thinly', 'roughly', 'extra', 'lightly', 'heavily'];
            if (adverbs.includes(wordRaw) && i + 1 < words.length) {
                const nextWord = words[i + 1].toLowerCase().replace(/[,;:]$/, '');
                if (COMMON_MODIFIERS.includes(nextWord) || nextWord === 'virgin') {
                    potentialModifiers.push(words[i] + ' ' + words[i + 1].replace(/[,;:]$/, ''));
                    i += 2;
                    continue;
                }
            }
            break;
        }
    }

    if (potentialModifiers.length > 0) {
        return {
            modifier: potentialModifiers.join(', '),
            cleanText: words.slice(i).join(' ')
        };
    }

    return { cleanText: text };
}

function parseIngredientLine(line: string): ParsedIngredient {
    let cleanLine = line.replace(/^[*•\-+]\s+/, '').trim();

    // Aggressive cleanup for "or", "original", etc. artifacts
    const artifacts = ['or', 'original', 'scaled', 'serving'];
    const artifactRegex = new RegExp(`(\\w+)(?:${artifacts.join('|')})\\b`, 'gi');

    cleanLine = cleanLine.replace(artifactRegex, (match, p1) => {
        const lowerP1 = p1.toLowerCase();
        // Trust the exceptions list primarily. If NOT in exceptions, we strip it.
        const exceptions = ['flo', 'doo', 'po', 'arm', 'col', 'flav', 'tail', 'extra'];
        if (exceptions.includes(lowerP1)) return match;
        return p1;
    }).trim();

    // Remove artifacts from whole line
    if (cleanLine.toLowerCase() === 'original recipe' || cleanLine.toLowerCase().includes('scaled to')) return { amount: "", item: "" };

    cleanLine = cleanLine.replace(/(\W)(?:or|original|scaled|serving)\s*$/gi, '$1').trim();
    cleanLine = cleanLine.replace(/(?:,|"|'|\d)(or|original|scaled|serving)\s*$/gi, (m, p1) => m.slice(0, -p1.length)).trim();

    // 1. Pre-process text-based fractions and comma-decimals
    // Handle "quarter", "half", "third"
    cleanLine = cleanLine.replace(/\bquarter\b/gi, '0.25');
    cleanLine = cleanLine.replace(/\bhalf\b/gi, '0.5');
    cleanLine = cleanLine.replace(/\bthird\b/gi, '0.33');
    // Handle comma decimals "0,25" -> "0.25"
    cleanLine = cleanLine.replace(/(\d+),(\d+)/g, '$1.$2');

    // 2. Try Standard Start-of-line Match
    // Matches: "1 1/2", "1/2", "1.5", "1", "250", "0.25"
    const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅛⅜⅝⅞]))\s*(.*)/i;

    let match = cleanLine.match(qtyRegex);
    let amount = "";
    let item = cleanLine;
    let weightG: number | undefined = undefined;

    // 3. IF Start-of-line failed, try Embedded match
    // Look for (Number/Fraction) followed explicitly by a (Unit)
    if (!match) {
        // Sort units by length descending to match longest first (e.g. "extra large" before "large")
        const sortedUnits = [...COMMON_UNITS].sort((a, b) => b.length - a.length);
        const embeddedRegex = new RegExp(`(?:^|[\\s,(])((?:\\d+(?:\\.\\d+)?|\\d+\\/\\d+|[¼½¾⅛⅜⅝⅞]))\\s*(${sortedUnits.join('|').replace(/\s+/g, '\\s+')})\\b`, 'i');
        const embeddedMatch = cleanLine.match(embeddedRegex);

        if (embeddedMatch) {
            // Reconstruct a "standard" structure to parse nicely
            // We found "0.25 cup" inside "Onion, 0.25 cup chopped"
            // We set amount="0.25", unit="cup"
            // And we try to remove this part from the Item string to clean it up
            const foundAmount = embeddedMatch[1];
            const foundUnit = embeddedMatch[2];
            amount = foundAmount.trim();

            // Remove the found quantity entity from the item string
            const fullMatch = embeddedMatch[0]; // e.g. ", 0.25 cup"
            let rest = cleanLine.replace(fullMatch, ' ').replace(/\s+/g, ' ').trim();
            // Clean up leading commas/spaces we might have left
            rest = rest.replace(/^[,.\s]+/, '');

            // Prepare for the unit-parsing logic below
            // equivalent to `match` structure: match[1]=amount, match[2]=rest (which starts with unit now)
            // But here we already extracted unit.
            // Let's just create the formatted amount string directly.

            amount = `${foundAmount} ${foundUnit}`;
            item = rest;

            // Check for weight in the REST of the string (parenthesis etc)
            // Reuse the weight parsing logic below by passing `rest`
            match = [fullMatch, foundAmount, rest]; // Fake match object to fall through? 
            // Actually, better to just reuse the weight logic function or duplicate small logic.
            // Let's just set the variables and let the code proceed if possible, 
            // OR duplicated weight logic here for safety.

            // Weight parsing logic (Duplicated for embedded case)
            const parenWeightMatch = item.match(/\((\d+(?:\.\d+)?)\s*(?:g|gram|grams)\)/i);
            if (parenWeightMatch) {
                weightG = parseFloat(parenWeightMatch[1]);
                item = item.replace(parenWeightMatch[0], '').trim();
            } else {
                const endWeightMatch = item.match(/\b(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b$/i);
                if (endWeightMatch) {
                    weightG = parseFloat(endWeightMatch[1]);
                    item = item.replace(endWeightMatch[0], '').trim();
                }
            }

            const { modifier, cleanText } = extractModifier(item);

            return { amount, item: cleanText, weightG, modifier };
        }
    }

    if (match) {
        amount = match[1].trim();
        let rest = match[2].trim();

        // Check for known units (up to 2 words, most common multi-word units)
        let unit = "";
        const words = rest.split(/\s+/);

        // Try 2-word match first
        if (words.length >= 2) {
            const twoWords = (words[0] + ' ' + words[1]).toLowerCase().replace(/[.,]$/, '');
            if (COMMON_UNITS.includes(twoWords)) {
                unit = words[0] + ' ' + words[1];
                rest = words.slice(2).join(' ').trim();
            }
        }

        // Try 1-word match if no multi-word found
        if (!unit && words.length >= 1) {
            const firstWord = words[0].toLowerCase().replace(/[.,]$/, '');
            if (COMMON_UNITS.includes(firstWord)) {
                unit = words[0];
                rest = words.slice(1).join(' ').trim();
            }
        }

        if (unit && rest.toLowerCase().startsWith('of ')) {
            rest = rest.slice(3).trim();
        }

        // Weight parsing logic
        const parenWeightMatch = rest.match(/\((\d+(?:\.\d+)?)\s*(?:g|gram|grams)\)/i);
        if (parenWeightMatch) {
            weightG = parseFloat(parenWeightMatch[1]);
            rest = rest.replace(parenWeightMatch[0], '').trim();
        } else {
            const endWeightMatch = rest.match(/\b(\d+(?:\.\d+)?)\s*(?:g|gram|grams)\b$/i);
            if (endWeightMatch) {
                weightG = parseFloat(endWeightMatch[1]);
                rest = rest.replace(endWeightMatch[0], '').trim();
            }
        }

        const lowerUnit = unit.toLowerCase();
        if (lowerUnit === 'g' || lowerUnit === 'gram' || lowerUnit === 'grams' || lowerUnit === 'ml') {
            weightG = parseFloat(amount);
        } else if (lowerUnit === 'kg' || lowerUnit === 'kilogram' || lowerUnit === 'kilograms') {
            weightG = parseFloat(amount) * 1000;
        }

        const { modifier, cleanText } = extractModifier(rest);

        return {
            amount: unit ? `${amount} ${unit}` : amount,
            item: cleanText || unit || amount,
            weightG,
            modifier
        };
    }

    // If no match at start OR embedded
    if (!match) {
        const anyWeightMatch = cleanLine.match(/\b(\d+(?:\.\d+)?)\s*(?:g|gram|grams|ml|kg|kilogram|kilograms)\b/i);
        if (anyWeightMatch) {
            const amount = anyWeightMatch[1];
            const unitPart = anyWeightMatch[0].replace(amount, '').trim();
            const item = cleanLine.replace(anyWeightMatch[0], '').trim();

            let weightG = parseFloat(amount);
            if (unitPart.toLowerCase().startsWith('kg')) weightG *= 1000;

            const { modifier, cleanText } = extractModifier(item);

            return {
                amount: `${amount} ${unitPart}`,
                item: cleanText || cleanLine,
                weightG,
                modifier
            };
        }
    }

    return { amount: "", item: cleanLine };
}
