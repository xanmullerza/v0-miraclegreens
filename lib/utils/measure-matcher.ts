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

export type MeasureCandidate = {
    weight_g: number;
    label: string;
    confidence?: number;
};

type MeasureType = 'weight' | 'volume' | 'count' | 'unknown';

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

const MEASURE_TYPES: Record<string, MeasureType> = {
    // Weight measures
    'g': 'weight',
    'kg': 'weight',
    'mg': 'weight',
    'mcg': 'weight',
    'oz': 'weight',
    'lb': 'weight',
    // Volume measures
    'tsp': 'volume',
    'tbsp': 'volume',
    'cup': 'volume',
    'ml': 'volume',
    'l': 'volume',
    'floz': 'volume',
    // Count measures
    'item': 'count',
    'bunch': 'count',
    'handful': 'count',
    'sprig': 'count',
    'clove': 'count',
    'stalk': 'count',
    'pinch': 'count',
    'dash': 'count',
    'slice': 'count',
    'wedge': 'count',
    'fillet': 'count',
    'piece': 'count',
    'whole': 'count',
    'unit': 'count',
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
 * Get the type of measure (weight, volume, count, or unknown)
 */
function getMeasureType(measure: string): MeasureType {
    const canonical = getCanonicalMeasure(measure);
    if (!canonical) return 'unknown';
    return MEASURE_TYPES[canonical] || 'unknown';
}

/**
 * Extract measure label without weight info (e.g., "tbsp (15g)" → "tbsp")
 */
function extractMeasureLabel(fullLabel: string): string {
    // Remove anything in parentheses at the end
    return fullLabel.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
    const s1 = normalizeMeasure(str1);
    const s2 = normalizeMeasure(extractMeasureLabel(str2)); // Extract label without weight
    
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
/**
 * Score how well a database measure matches the original
 * Prioritizes measurement TYPE first (weight, volume, count)
 * For count measures, prefers "medium" size as the safest default
 */
function scoreMeasure(dbMeasure: MeasureCandidate, originalMeasure: string, originalQuantity: number): number {
    let score = 0;
    
    const originalType = getMeasureType(originalMeasure);
    const dbMeasureLabel = extractMeasureLabel(dbMeasure.label);
    const dbType = getMeasureType(dbMeasureLabel);
    
    const originalCanonical = getCanonicalMeasure(originalMeasure);
    const dbCanonical = getCanonicalMeasure(dbMeasureLabel);
    
    // CRITICAL: Measure type mismatch = almost automatic rejection
    if (originalType !== 'unknown' && dbType !== 'unknown' && originalType !== dbType) {
        // Different type (weight vs volume vs count) - very low score
        score += 5;
    } else {
        // SAME TYPE - strong boost
        score += 60;
        
        // 1. Canonical match (same unit family like "g" = "gram")
        if (originalCanonical && dbCanonical && originalCanonical === dbCanonical) {
            score += 30; // Exact canonical match
        }
        
        // 2. Text similarity (handles "tbsp" vs "tablespoon")
        const textSim = stringSimilarity(originalMeasure, dbMeasure.label);
        if (textSim > 0.7) {
            score += 20 * textSim;
        }
        
        // 3. Weight/quantity match (secondary - helps with similar measures)
        const originalGrams = measureToGrams(originalQuantity, originalMeasure);
        if (originalGrams !== null) {
            const ratio = dbMeasure.weight_g / originalGrams;
            // Ideal is 1:1 ratio (exact match)
            const weightSim = Math.max(0, 1 - Math.abs(ratio - 1) / 2);
            score += 10 * weightSim;
        }
        
        // 4. For count measures, prefer "medium" size (safest default assumption)
        if (originalType === 'count' && dbMeasureLabel.toLowerCase().includes('medium')) {
            score += 25; // Strong boost for medium-sized items (safe default for singular items)
        }
    }
    
    // Label length penalty (prefer concise matches)
    const labelLength = dbMeasureLabel.length;
    if (labelLength > 30) score *= 0.9;
    
    return Math.min(100, score);
}

/**
 * Find best measure match from database
 * Returns the matched measure or null if no good match found (confidence < 75)
 * Higher threshold to avoid false positives like "cubic inch" for cheese
 */
export function findBestMeasureMatch(
    originalMeasure: string,
    originalQuantity: number,
    availableMeasures: MeasureCandidate[]
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
    
    // Only return if confidence is >= 75 (high confidence threshold to prevent false matches)
    if (bestMatch.score >= 75) {
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
    availableMeasures: MeasureCandidate[],
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
