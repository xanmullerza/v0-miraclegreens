
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

    // Clean and split lines
    const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !['Amount', '% DV', 'General', 'Lipids', 'Vitamins', 'Minerals', 'Carbohydrates', 'Protein', 'Sugars', 'Fatty Acids', 'Amino Acids'].includes(l));

    // We didn't want to filter "Protein" if it's the only word on the line and it's a label.
    // Let's be more surgical. We only filter headers if they are likely just headers.

    const allLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const findValue = (label: string | RegExp): number | null => {
        const regex = typeof label === 'string' ? new RegExp(label, 'i') : label;

        for (let i = 0; i < allLines.length; i++) {
            if (regex.test(allLines[i])) {
                // Check same line first (Source 1 style)
                // Match patterns like "20", "20g", "20 mg", "<0.1", etc.
                const sameLineMatch = allLines[i].match(/(?:^|\s|<|:)(-?\d+(?:\.\d+)?)\s*(?:g|mg|µg|ug|kcal|kj|iu|%)/i) ||
                    allLines[i].match(/\s+(\d+(?:\.\d+)?)$/);

                if (sameLineMatch) return parseFloat(sameLineMatch[1]);

                // Check subsequent lines (Source 2 style)
                // Look ahead 5 lines, skipping "Amount", "% DV", or the label repeated
                for (let j = 1; j <= 5; j++) {
                    if (i + j >= allLines.length) break;
                    const nextLine = allLines[i + j];
                    if (['Amount', '% DV'].includes(nextLine)) continue;

                    // Match a number (allow < prefix)
                    const match = nextLine.match(/^(?:<)?\s*(-?\d+(?:\.\d+)?)/);
                    if (match) return parseFloat(match[1]);

                    // If we hit another alphabetic word that isn't a known skip, 
                    // we might have moved to a different nutrient. But some nutrients
                    // are multi-word, so we are cautious.
                }
            }
        }
        return null;
    };

    // Macro Mapping
    const kcal = findValue(/Calories/i) || findValue(/Energy/i);
    if (kcal !== null) result.energy_kcal = kcal;

    // For Kj, we look for Energy but specifically the one followed by kJ
    // Or just look for a number followed by kJ
    const kj = findValue(/kJ/i);
    if (kj !== null) result.energy_kj = kj;

    const protein = findValue(/^Protein/i) || findValue(/Protein/i);
    if (protein !== null) result.protein_g = protein;

    const carbs = findValue(/Total Carbs/i) || findValue(/Carbo/i) || findValue(/^Carbs/i);
    if (carbs !== null) result.carbs_g = carbs;

    const fat = findValue(/^Fat$/i) || findValue(/Total lipid/i) || findValue(/^Fats$/i) || findValue(/Total Fat/i);
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
        'Vitamin A': /^Vitamin A$/i,
        'Vitamin C': /Vitamin C/i,
        'Vitamin D': /Vitamin D/i,
        'Vitamin E': /Vitamin E/i,
        'Vitamin K': /Vitamin K/i,
        'B1 (Thiamine)': /Thiamin/i,
        'B2 (Riboflavin)': /Riboflavin/i,
        'B3 (Niacin)': /Niacin/i,
        'B5 (Pantothenic Acid)': /Pantothenic/i,
        'B6 (Pyridoxine)': /Pyridoxine|B6/i,
        'B9 (Folate)': /Folate/i,
        'B12 (Cobalamin)': /Cobalamin|B12/i,
        'Choline': /Choline/i,
        'Fiber': /Fiber/i,
        'Sugars': /^Sugars$/i,
        'Starch': /^Starch$/i,
        'Saturated Fat': /Saturated/i,
        'Monounsaturated Fat': /Monounsaturated/i,
        'Polyunsaturated Fat': /Polyunsaturated/i,
        'Trans Fat': /Trans/i,
        'Omega-3': /Omega-3|Total omega 3/i,
        'Omega-6': /Omega-6|Total omega 6/i,
        'Alanine': /^Alanine$/i,
        'Arginine': /^Arginine$/i,
        'Aspartic acid': /Aspartic/i,
        'Glutamic acid': /Glutamic/i,
        'Glycine': /^Glycine$/i,
        'Histidine': /^Histidine$/i,
        'Isoleucine': /^Isoleucine$/i,
        'Leucine': /^Leucine$/i,
        'Lysine': /^Lysine$/i,
        'Methionine': /^Methionine$/i,
        'Phenylalanine': /^Phenylalanine$/i,
        'Proline': /^Proline$/i,
        'Serine': /^Serine$/i,
        'Threonine': /^Threonine$/i,
        'Tryptophan': /^Tryptophan$/i,
        'Tyrosine': /^Tyrosine$/i,
        'Valine': /^Valine$/i
    };

    Object.entries(microMap).forEach(([target, regex]) => {
        const val = findValue(regex);
        if (val !== null) {
            result.micronutrients![target] = val;
        }
    });

    return result;
}
