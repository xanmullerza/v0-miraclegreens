
/**
 * Utility to scale ingredient amount strings.
 * scales "1 cup" -> "2 cup", "1/2 tbsp" -> "1 tbsp", etc.
 */
export function scaleIngredient(amount: string, factor: number): string {
    if (factor === 1) return amount;
    if (!amount) return "";

    // Regex to find all numbers (integer, decimal, or fraction)
    // Matches: "1 1/2", "1/2", "1.5", "1"
    const numRegex = /(\d+\s+\d+\/\d+|\d+\/\d+|\d+(\.\d+)?)/g;

    return amount.replace(numRegex, (match) => {
        let value = 0;

        if (match.includes('/')) {
            // Handle fractions like "1/2" or "1 1/2"
            const parts = match.split(/\s+/);
            if (parts.length === 2) {
                // "1 1/2"
                value = parseFloat(parts[0]) + parseFraction(parts[1]);
            } else {
                // "1/2"
                value = parseFraction(parts[0]);
            }
        } else {
            value = parseFloat(match);
        }

        if (!isNaN(value)) {
            const newValue = value * factor;
            return formatNumber(newValue);
        }

        return match;
    });
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
