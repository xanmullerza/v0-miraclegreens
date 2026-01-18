
/**
 * Utility to scale ingredient amount strings.
 * scales "1 cup" -> "2 cup", "1/2 tbsp" -> "1 tbsp", etc.
 */
export function scaleIngredient(amount: string, factor: number): string {
    if (factor === 1) return amount;
    if (!amount) return "";

    // Regex to find the leading number (integer, decimal, or fraction)
    // Matches: "1.5", "1", "1/2", "1 1/2"
    const numberRegex = /^(\d+(\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s*(.*)$/;
    const match = amount.trim().match(numberRegex);

    if (match) {
        const numericPart = match[1];
        const textPart = match[3];

        let value = 0;

        if (numericPart.includes('/')) {
            // Handle fractions like "1/2" or "1 1/2"
            const parts = numericPart.split(' ');
            if (parts.length === 2) {
                // "1 1/2"
                value = parseFloat(parts[0]) + parseFraction(parts[1]);
            } else {
                // "1/2"
                value = parseFraction(parts[0]);
            }
        } else {
            value = parseFloat(numericPart);
        }

        if (!isNaN(value)) {
            const newValue = value * factor;
            // Format nicely (e.g. 1.5 instead of 1.500000)
            const formattedValue = formatNumber(newValue);
            return `${formattedValue} ${textPart}`;
        }
    }

    // Fallback: If no leading number found (e.g. "Salt to taste"), verify if we can find a number embedded?
    // Usually recipes are "Quantity Unit Item". The 'amount' field in this app seems to be just the quantity+unit part or similar.
    // Based on previous view_file, 'amount' is mapped from DB.

    return amount;
}

function parseFraction(fraction: string): number {
    const [num, denom] = fraction.split('/').map(Number);
    return denom ? num / denom : 0;
}

function formatNumber(num: number): string {
    // If it's effectively an integer
    if (Math.abs(num - Math.round(num)) < 0.01) {
        return Math.round(num).toString();
    }

    // Check for common fractions
    const decimal = num - Math.floor(num);
    const whole = Math.floor(num);

    // Close to 0.25, 0.5, 0.75, 0.33, 0.66
    if (Math.abs(decimal - 0.5) < 0.01) return whole > 0 ? `${whole} 1/2` : "1/2";
    if (Math.abs(decimal - 0.25) < 0.01) return whole > 0 ? `${whole} 1/4` : "1/4";
    if (Math.abs(decimal - 0.75) < 0.01) return whole > 0 ? `${whole} 3/4` : "3/4";
    if (Math.abs(decimal - 0.33) < 0.02) return whole > 0 ? `${whole} 1/3` : "1/3";
    if (Math.abs(decimal - 0.66) < 0.02) return whole > 0 ? `${whole} 2/3` : "2/3";

    // Default to 1 decimal place if needed
    return num.toFixed(1).replace(/\.0$/, '');
}
