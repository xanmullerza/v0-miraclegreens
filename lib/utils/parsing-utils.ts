/**
 * Parsing Utilities for Food and Ingredients
 */

/**
 * Extract the core name of an ingredient (e.g., "3 cloves of garlic" -> "garlic").
 */
export const extractCoreName = (name: string): string => {
    let cleaned = name.toLowerCase().trim();
    
    // Remove anything in parentheses first
    cleaned = cleaned.replace(/\s*\(.*?\)/g, '').trim();
    
    // Multi-pass leading cleanup
    for (let i = 0; i < 2; i++) {
        cleaned = cleaned.replace(/^[\d\/\.\-]+\s*(x\s+)?/g, '').trim();
        cleaned = cleaned.replace(/^(tbsp|tsp|cups?|ml|g|kg|oz|lb|liters?|bunch|handful|pinch|dash|cans?|cloves?|sprigs?|leaves?|stalks?)\s+/gi, '').trim();
        cleaned = cleaned.replace(/^of\s+/gi, '').trim();
        cleaned = cleaned.replace(/^(small|large|medium|big|thin|thick)\s+/gi, '').trim();
        cleaned = cleaned.replace(/^(organic|fresh|frozen|canned|diced|chopped|sliced|minced|peeled|roasted|cooked|raw|grated|finely|roughly|thinly|rinsed|pitted|separated|skin-on|bone-in|boneless|skinless)\s*,?\s*/gi, '').trim();
    }
    
    // Remove trailing non-food descriptors
    cleaned = cleaned.replace(/\s+(sprigs?|stalks?|leaves?|cloves?|bunch|bunches)\s*$/gi, '').trim();
    
    // Remove trailing prep descriptions
    cleaned = cleaned.replace(/\s+(finely|roughly|thinly|sliced|diced|chopped|minced|grated|peeled|rinsed|separated|to serve|to taste|and leaves|stalks and leaves).*$/gi, '').trim();
    
    // Handle commas
    if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map(p => p.trim()).filter(p => p.length > 1);
        const descriptorPattern = /^(skin-on|bone-in|boneless|skinless|dried|fresh|raw|cooked|chopped|diced|sliced|minced|grated|peeled|whole|ground|crushed|smoked|roasted|canned|frozen|organic|rinsed|pitted|grade|unprepared)/i;
        const foodPart = parts.find(p => !descriptorPattern.test(p));
        cleaned = foodPart || parts[parts.length - 1] || cleaned;
        cleaned = cleaned.trim();
    }
    
    return cleaned;
};

/**
 * Clean up ingredient display names for the UI.
 */
export const cleanIngredientDisplay = (name: string): string => {
    let cleaned = name.trim();
    cleaned = cleaned.replace(/\s+(crushed or finely grated|drained and roughly chopped|finely chopped|roughly chopped|torn to serve|torn, to serve|and leaves stalks and leaves|stalks and leaves).*$/i, '');
    cleaned = cleaned.replace(/\s*,\s*(drained|roughly chopped|finely chopped|crushed|grated|torn|picked|separated|skinless|boneless|and.*).*$/i, '');
    cleaned = cleaned.replace(/\s+(to taste|to serve|optional).*$/i, '');
    return cleaned.trim();
};

/**
 * Simple singularization logic.
 */
export const dePluralize = (term: string): string => {
    const lower = term.toLowerCase();
    if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y';
    if (lower.endsWith('ves')) return lower.slice(0, -3) + 'f';
    if (lower.endsWith('es') && !lower.endsWith('ses')) return lower.slice(0, -2);
    if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1);
    return lower;
};

/**
 * Parse strings like "1 1/2 cups" into quantity and unit.
 */
export const parseRecipeAmount = (amountStr: string, itemStr?: string) => {
    let quantity = 1;
    let measure = '';

    let str = (amountStr || '').trim().toLowerCase();
    const mainMatch = str.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)/);
    const hasNumber = !!mainMatch;

    if (!hasNumber && itemStr) {
        const itemLower = itemStr.trim().toLowerCase();
        if (itemLower.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*([a-z]+)/)) {
            str = itemLower;
        }
    }

    const match = str.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)/);
    if (match) {
        let numStr = match[1];
        if (numStr.includes('/')) {
            const parts = numStr.split(' ');
            if (parts.length === 2) {
                const [whole, frac] = parts;
                const [n, d] = frac.split('/');
                quantity = parseInt(whole) + (parseInt(n) / parseInt(d));
            } else {
                const [n, d] = numStr.split('/');
                quantity = parseInt(n) / parseInt(d);
            }
        } else {
            quantity = parseFloat(numStr);
        }
        
        let restStr = match[2].trim();
        const firstWordMatch = restStr.match(/^([a-z]+)/);
        if (firstWordMatch) {
            measure = firstWordMatch[1];
        }
    } else {
         const firstWordMatch = str.match(/^([a-z]+)/);
         if (firstWordMatch) {
             measure = firstWordMatch[1];
         }
    }
    
    // Normalize units
    if (['tbs', 'tbsp', 'tablespoon', 'tablespoons'].includes(measure)) measure = 'tbsp';
    if (['tsp', 'teaspoon', 'teaspoons'].includes(measure)) measure = 'tsp';
    if (['oz', 'ounce', 'ounces'].includes(measure)) measure = 'oz';
    if (['lb', 'lbs', 'pound', 'pounds'].includes(measure)) measure = 'lb';
    if (['g', 'gram', 'grams'].includes(measure)) measure = 'g';
    if (['c', 'cup', 'cups'].includes(measure)) measure = 'cup';
    if (['ml', 'milliliter', 'milliliters'].includes(measure)) measure = 'ml';
    if (['sprig', 'sprigs'].includes(measure)) measure = 'sprig';
    if (['clove', 'cloves'].includes(measure)) measure = 'clove';
    if (['bunch', 'bunches'].includes(measure)) measure = 'bunch';
    if (['stalk', 'stalks'].includes(measure)) measure = 'stalk';

    if (measure.endsWith('s') && !['oz', 'lbs', 'g', 'ml'].includes(measure)) {
         measure = measure.slice(0, -1);
    }
    return { quantity: quantity || 1, measure_label: measure || 'item' };
};

/**
 * Format a number to a pretty fraction/decimal for display.
 */
export const formatFraction = (num: number): string => {
    const whole = Math.floor(num);
    const frac = num - whole;
    let fracStr = '';
    if (Math.abs(frac - 0.25) < 0.01) fracStr = '1/4';
    else if (Math.abs(frac - 0.33) < 0.02) fracStr = '1/3';
    else if (Math.abs(frac - 0.5) < 0.01) fracStr = '1/2';
    else if (Math.abs(frac - 0.66) < 0.02) fracStr = '2/3';
    else if (Math.abs(frac - 0.75) < 0.01) fracStr = '3/4';
    else if (frac > 0) fracStr = frac.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

    if (whole > 0 && fracStr) return `${whole} ${fracStr}`;
    if (whole > 0) return `${whole}`;
    if (fracStr) return fracStr;
    return '0';
};
