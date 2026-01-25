
/**
 * Utility to parse nutritional data from various text formats.
 * Primarily designed for copy-pasted data from common nutrition databases.
 */

export interface ParsedNutrition {
    name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients: Record<string, number>;
}

export function parseNutritionText(text: string): Partial<ParsedNutrition> {
    const result: Partial<ParsedNutrition> = {
        micronutrients: {}
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Helper to find a value following a label in subsequent lines
    const findValueAfter = (label: string | RegExp, lines: string[]): number | null => {
        const index = lines.findIndex(l =>
            typeof label === 'string' ? l.toLowerCase().includes(label.toLowerCase()) : label.test(l)
        );
        if (index === -1) return null;

        // Look ahead up to 3 lines for a number
        for (let i = index + 1; i <= Math.min(index + 3, lines.length - 1); i++) {
            const match = lines[i].match(/^(\d+(?:\.\d+)?)/);
            if (match) return parseFloat(match[1]);
        }
        return null;
    };

    // Helper to find a value on the same line or next line (for Source 1 style)
    const findValueNear = (label: string | RegExp, lines: string[]): number | null => {
        for (let i = 0; i < lines.length; i++) {
            if (typeof label === 'string' ? lines[i].toLowerCase().includes(label.toLowerCase()) : label.test(lines[i])) {
                // Check same line
                const sameLineMatch = lines[i].match(/(\d+(?:\.\d+)?)\s*(?:g|mg|µg|ug|kcal|kj|IU|%)/i);
                if (sameLineMatch) return parseFloat(sameLineMatch[1]);

                // Check next line
                if (i + 1 < lines.length) {
                    const nextLineMatch = lines[i + 1].match(/^(\d+(?:\.\d+)?)/);
                    if (nextLineMatch) return parseFloat(nextLineMatch[1]);
                }
            }
        }
        return null;
    };

    // Macro Mapping
    const energyKcal = findValueAfter(/^Energy$/i, lines) || findValueNear(/^Calories$/i, lines);
    if (energyKcal !== null) result.energy_kcal = energyKcal;

    const energyKj = findValueAfter(/^Energy$/i, lines.slice(lines.findIndex(l => /^Energy$/i.test(l)) + 2)) || findValueNear(/kJ/i, lines);
    // If we only found one energy value and it's Kj, handle it.
    // But usually we can just derive if missing.
    if (energyKj !== null) result.energy_kj = energyKj;

    const protein = findValueAfter(/^Protein$/i, lines) || findValueNear(/^Protein$/i, lines);
    if (protein !== null) result.protein_g = protein;

    const carbs = findValueAfter(/^Total Carbs$/i, lines) || findValueNear(/^Carbs$/i, lines) || findValueNear(/^Carbohydrates$/i, lines);
    if (carbs !== null) result.carbs_g = carbs;

    const fat = findValueAfter(/^Fat$/i, lines) || findValueNear(/^Fats$/i, lines) || findValueNear(/^Total lipid/i, lines);
    if (fat !== null) result.fat_g = fat;

    // Micronutrient Mapping
    const microMap: Record<string, string | RegExp> = {
        'Potassium': /Potassium/i,
        'Magnesium': /Magnesium/i,
        'Calcium': /Calcium/i,
        'Phosphorus': /Phosphorus/i,
        'Sodium': /Sodium/i,
        'Iron': /Iron/i,
        'Zinc': /Zinc/i,
        'Selenium': /Selenium/i,
        'Copper': /Copper/i,
        'Manganese': /Manganese/i,
        'Vitamin A': /Vitamin A/i,
        'Vitamin C': /Vitamin C/i,
        'Vitamin D': /Vitamin D/i,
        'Vitamin E': /Vitamin E/i,
        'Vitamin K': /Vitamin K/i,
        'B1 (Thiamine)': /B1|Thiamine/i,
        'B2 (Riboflavin)': /B2|Riboflavin/i,
        'B3 (Niacin)': /B3|Niacin/i,
        'B5 (Pantothenic Acid)': /B5|Pantothenic/i,
        'B6 (Pyridoxine)': /B6|Pyridoxine/i,
        'B9 (Folate)': /B9|Folate/i,
        'B12 (Cobalamin)': /B12|Cobalamin/i,
        'Choline': /Choline/i,
        'Fiber': /Fiber/i
    };

    Object.entries(microMap).forEach(([target, regex]) => {
        const val = findValueAfter(regex, lines) || findValueNear(regex, lines);
        if (val !== null) {
            result.micronutrients![target] = val;
        }
    });

    return result;
}
