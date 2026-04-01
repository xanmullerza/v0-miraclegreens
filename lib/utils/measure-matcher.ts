/**
 * Smart measure matching utility
 * Finds the best matching measure from available database measures
 * based on the original recipe measure text
 */

interface MeasureMatch {
    weight_g: number;
    label: string;
    confidence: number; // 0-100 score
}

// Common measure conversions
const MEASURE_CONVERSIONS: Record<string, number> = {
    'tsp': 5,
    'tbsp': 15,
    'floz': 30,
    'cup': 240,
    'ml': 1,
    'l': 1000,
    'g': 1,
    'kg': 1000,
    'oz': 28.35,
    'lb': 453.59,
    'mg': 0.001,
    'mcg': 0.000001,
};

const MEASURE_ALIASES: Record<string, string[]> = {
    'tsp': ['tsp', 'teaspoon', 't', 'ts'],
    'tbsp': ['tbsp', 'tablespoon', 'tbs', 'tb', 't'],
    'cup': ['cup', 'c'],
    'oz': ['oz', 'ounce', 'fl oz', 'floz'],
    'ml': ['ml', 'milliliter'],
    'l': ['l', 'liter', 'litre'],
    'g': ['g', 'gram'],
    'kg': ['kg', 'kilogram'],
    'lb': ['lb', 'lbs', 'pound'],
    'mg': ['mg', 'milligram'],
    'item': ['item', 'whole', 'piece', 'unit'],
    'bunch': ['bunch', 'bunches'],
    'handful': ['handful', 'handfuls', 'hand'],
    'sprig': ['sprig', 'sprigs'],
    'clove': ['clove', 'cloves'],
    'stalk': ['stalk', 'stalks'],
    'pinch': ['pinch', 'pinches'],
    'dash': ['dash', 'dashes'],
    'pour': ['pour', 'pours'],
    'slice': ['slice', 'slices'],
    'wedge': ['wedge', 'wedges'],
    'fillet': ['fillet', 'fillets'],
};

/**
 * Normalize measure text to standard form
 */
function normalizeMeasure(text: string): string {
    return text.trim().toLowerCase().replace(/s$/, ''); // Remove trailing 's' for plurals
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
    const s1 = normalizeMeasure(str1);
    const s2 = normalizeMeasure(str2);
    
    if (s1 === s2) return 1;
    
    // Check if one is substring of other
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Levenshtein-like distance (simplified)
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = levenshteinDistance(shorter, longer);
    return 1 - editDistance / longer.length;
}

/**
 * Simple Levenshtein distance
 */
function levenshteinDistance(s1: string, s2: string): number {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

/**
 * Get canonical measure name from aliases
 */
function getCanonicalMeasure(text: string): string | null {
    const normalized = normalizeMeasure(text);
    for (const [canonical, aliases] of Object.entries(MEASURE_ALIASES)) {
        if (aliases.includes(normalized)) return canonical;
    }
    return null;
}

/**
 * Convert measure to grams (if possible)
 */
function measureToGrams(quantity: number, measure: string): number | null {
    const canonical = getCanonicalMeasure(measure);
    if (!canonical || !MEASURE_CONVERSIONS[canonical]) return null;
    return quantity * MEASURE_CONVERSIONS[canonical];
}

/**
 * Score how well a database measure matches the original
 */
function scoreMeasure(dbMeasure: MeasureMatch, originalMeasure: string, originalQuantity: number): number {
    let score = 0;
    const canonical = getCanonicalMeasure(originalMeasure);
    
    // 1. Direct text match (highest priority)
    const textSim = stringSimilarity(originalMeasure, dbMeasure.label);
    if (textSim > 0.7) {
        score += 50 * textSim;
    }
    
    // 2. Weight/quantity match
    const originalGrams = measureToGrams(originalQuantity, originalMeasure);
    if (originalGrams !== null) {
        const ratio = dbMeasure.weight_g / originalGrams;
        // Ideal is 1:1 ratio (exact match)
        const weightSim = Math.max(0, 1 - Math.abs(ratio - 1) / 2);
        score += 35 * weightSim;
    }
    
    // 3. Canonical match (tbsp matches tbsp-like measures)
    if (canonical) {
        if (dbMeasure.label.toLowerCase().includes(canonical)) {
            score += 15;
        }
    }
    
    // 4. Label length penalty (prefer concise matches)
    const labelLength = dbMeasure.label.length;
    if (labelLength > 30) score *= 0.9;
    
    return Math.min(100, score);
}

/**
 * Find best measure match from database
 * Returns the matched measure or null if no good match found (confidence < 50)
 */
export function findBestMeasureMatch(
    originalMeasure: string,
    originalQuantity: number,
    availableMeasures: MeasureMatch[]
): MeasureMatch & { confidence: number; isAutoMatched: boolean } | null {
    if (!availableMeasures || availableMeasures.length === 0) {
        return null;
    }
    
    // Score all measures
    const scores = availableMeasures.map(measure => ({
        ...measure,
        score: scoreMeasure(measure, originalMeasure, originalQuantity)
    }));
    
    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    
    const bestMatch = scores[0];
    
    // Only return if confidence is > 50
    if (bestMatch.score >= 50) {
        return {
            ...bestMatch,
            confidence: bestMatch.score,
            isAutoMatched: true
        };
    }
    
    return null;
}

/**
 * Get match suggestions (top N matches)
 */
export function getMeasureMatchSuggestions(
    originalMeasure: string,
    originalQuantity: number,
    availableMeasures: MeasureMatch[],
    topN: number = 3
): (MeasureMatch & { confidence: number })[] {
    if (!availableMeasures || availableMeasures.length === 0) {
        return [];
    }
    
    const scores = availableMeasures.map(measure => ({
        ...measure,
        confidence: scoreMeasure(measure, originalMeasure, originalQuantity)
    }));
    
    return scores
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, topN)
        .filter(m => m.confidence > 20);
}

export type { MeasureMatch };
