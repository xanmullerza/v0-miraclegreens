import { FoodMeasure } from '@/lib/utils/nutrition-calculator';

/**
 * Parses numeric strings including unicode fractions and mixed fractions
 * e.g. "1 1/2", "3/4", "½"
 */
export const evaluateLocalQty = (amt: string): number => {
    if (!amt) return 1;
    let cleanAmt = amt.replace(/,/g, '.').trim();
    const unicodeFractions: Record<string, number> = {
        '¼': 0.25, '½': 0.5, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
    };
    for (const [char, val] of Object.entries(unicodeFractions)) {
        if (cleanAmt.includes(char)) {
            const parts = cleanAmt.split(char);
            const whole = parseFloat(parts[0].trim()) || 0;
            return whole + val;
        }
    }
    const match = cleanAmt.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))/);
    if (!match) return 1;
    const val = match[1].trim();
    if (val.includes('/')) {
        if (val.includes(' ')) {
            const [whole, frac] = val.split(/\s+/);
            const [num, den] = frac.split('/').map(n => parseFloat(n.trim()));
            return (parseFloat(whole) || 0) + (num / (den || 1));
        }
        const [num, den] = val.split('/').map(n => parseFloat(n.trim()));
        return num / (den || 1);
    }
    const numVal = parseFloat(val);
    return isNaN(numVal) ? 1 : numVal;
};

/**
 * Standardizes unit labels for comparison
 */
export const normalizeUnit = (unit: string): string => {
    return unit.toLowerCase()
        .replace(/\s*\(.*\)$/, '') // Remove parentheticals
        .replace(/s$/, '')         // Singularize
        .trim();
};

/**
 * Returns multipliers for standard mass units
 */
export const getStandardMassMultiplier = (unit: string): number | null => {
    const std: Record<string, number> = {
        'g': 1, 'gram': 1, 'ml': 1,
        'kg': 1000, 'kilogram': 1000,
        'lb': 453.59, 'lbs': 453.59, 'pound': 453.59, 'lb.': 453.59,
        'oz': 28.35, 'ounce': 28.35, 'oz.': 28.35
    };
    return std[unit.toLowerCase()] || null;
};

/**
 * Attempts to find a natural measure (like "whole", "each", "clove")
 */
export const findNaturalMeasure = (measures: FoodMeasure[]): FoodMeasure | undefined => {
    return measures.find(m => {
        const l = m.label.toLowerCase();
        return l.includes('whole') || l.includes('item') || l.includes('unit') ||
            l.includes('medium') || l.includes('large') || l.includes('each') ||
            l.includes('portion') || l.includes('fruit') || l.includes('vegetable') ||
            l.includes('clove');
    });
};
