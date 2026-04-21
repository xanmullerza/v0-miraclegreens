/**
 * IMPROVED Smart Food Item Matching
 * Handles fuzzy matching, synonyms, and better fallbacks
 */

import { extractCoreName, dePluralize } from '@/lib/utils/parsing-utils';
import { searchFoodItem, isFlavoringIngredient } from '@/lib/services/nutrition';

interface MatchAttempt {
    searchTerm: string;
    results: any[];
    confidence: number;
    method: 'exact' | 'singular' | 'keyword' | 'fuzzy' | 'synonym';
}

/**
 * Synonyms for common ingredient names
 */
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
    'bell pepper': ['capsicum', 'pepper', 'sweet pepper'],
    'green beans': ['french beans', 'snap beans', 'string beans', 'beans'],
    'self-rising flour': ['self-raising flour', 'flour', 'all-purpose flour'],
    'sweet potato': ['yam'],
    'chick peas': ['chickpeas', 'garbanzo beans'],
    'arugula': ['rocket', 'roquette'],
    'cilantro': ['coriander leaves', 'fresh coriander'],
    'scallion': ['green onion', 'spring onion'],
    'zucchini': ['courgette'],
    'eggplant': ['aubergine'],
    'coriander': ['cilantro', 'coriander seeds'],
    'paneer': ['panir', 'cottage cheese'],
    'egg white': ['white of egg'],
    'egg yolk': ['yolk'],
    'whole egg': ['large egg', 'egg'],
    'mozzarella': ['mozarella', 'buffalo mozzarella'],
    'parmesan': ['parmigiano', 'parmesan cheese'],
    'ground beef': ['beef mince', 'minced beef'],
    'ground chicken': ['chicken mince', 'minced chicken'],
    'heavy cream': ['double cream', 'heavy whipping cream'],
    'butter': ['unsalted butter', 'salted butter'],
    'milk': ['whole milk', 'low-fat milk'],
    'yogurt': ['yoghurt'],
    'olive oil': ['extra virgin olive oil', 'virgin olive oil'],
};

/**
 * Flavoring ingredients that should be auto-skipped (common herbs, spices)
 */
const COMMON_FLAVORINGS = new Set([
    'salt', 'pepper', 'sugar', 'honey', 'vanilla', 'mint', 'basil', 'oregano',
    'thyme', 'rosemary', 'sage', 'cumin', 'cinnamon', 'nutmeg', 'paprika',
    'garlic powder', 'onion powder', 'chili powder', 'cayenne', 'black pepper',
]);

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 0;

    const editCosts = [];
    for (let i = 0; i <= shorter.length; i++) {
        editCosts[i] = [i];
    }

    for (let j = 0; j <= longer.length; j++) {
        editCosts[0][j] = j;
    }

    for (let i = 1; i <= shorter.length; i++) {
        for (let j = 1; j <= longer.length; j++) {
            const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1;
            editCosts[i][j] = Math.min(
                editCosts[i - 1][j] + 1,
                editCosts[i][j - 1] + 1,
                editCosts[i - 1][j - 1] + cost
            );
        }
    }

    return editCosts[shorter.length][longer.length];
}

/**
 * Fuzzy match score (0-100)
 */
function fuzzyScore(query: string, target: string): number {
    const q = query.toLowerCase();
    const t = target.toLowerCase();

    if (q === t) return 100;
    if (t.includes(q)) return 90;
    if (q.includes(t)) return 85;

    const distance = levenshteinDistance(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - distance / maxLen;

    return Math.round(similarity * 100);
}

/**
 * Get all search terms to try for an ingredient
 */
function generateSearchTerms(ingredientName: string): string[] {
    const terms = new Set<string>();

    // Original (after core extraction)
    let coreName = extractCoreName(ingredientName);
    terms.add(coreName);

    // Singular form
    const singular = dePluralize(coreName);
    if (singular !== coreName) terms.add(singular);

    // Check synonyms
    const lowerCore = coreName.toLowerCase();
    for (const [canonical, syns] of Object.entries(INGREDIENT_SYNONYMS)) {
        if (lowerCore === canonical.toLowerCase()) {
            syns.forEach(s => terms.add(s));
        }
        if (syns.some(s => s.toLowerCase() === lowerCore)) {
            terms.add(canonical);
        }
    }

    // Multi-word: try last word first (highest confidence)
    if (coreName.includes(' ')) {
        const words = coreName.split(' ');
        for (let i = words.length - 1; i >= 0; i--) {
            terms.add(words.slice(i).join(' '));
        }
    }

    return Array.from(terms).sort((a, b) => b.length - a.length); // Longest first
}

/**
 * IMPROVED: Match ingredient to food items DB with multiple strategies
 */
export async function smartMatchIngredientImproved(
    ingredientName: string,
    skippedFlavorings: string[] = []
): Promise<MatchAttempt | null> {
    const searchTerms = generateSearchTerms(ingredientName);

    if (!searchTerms || searchTerms.length === 0) {
        return null;
    }

    // Auto-skip flavorings only if explicitly in list
    if (isFlavoringIngredient({ name: ingredientName } as any)) {
        skippedFlavorings.push(ingredientName);
        return null;
    }

    // Try each search term with confidence tracking
    for (const searchTerm of searchTerms) {
        if (searchTerm.length < 2) continue;

        try {
            // Exact/keyword search first
            const exactResults = await searchFoodItem(searchTerm);

            if (exactResults && exactResults.length > 0) {
                return {
                    searchTerm,
                    results: exactResults,
                    confidence: 90,
                    method: 'exact'
                };
            }
        } catch (error) {
            console.warn(`Search failed for "${searchTerm}":`, error);
        }
    }

    // Fuzzy fallback: Try fuzzy matching against last 50 items
    // This is expensive, only use if exact failed
    try {
        const primaryTerm = searchTerms[0]; // Use best guess
        const fuzzyResults = await searchFoodItem(primaryTerm);

        if (fuzzyResults && fuzzyResults.length > 0) {
            // Score them
            const scored = fuzzyResults.map(item => ({
                ...item,
                fuzzyScore: fuzzyScore(primaryTerm, item.name || item.common_name)
            }))
            .sort((a, b) => b.fuzzyScore - a.fuzzyScore)
            .filter(i => i.fuzzyScore > 60);

            if (scored.length > 0) {
                return {
                    searchTerm: primaryTerm,
                    results: scored,
                    confidence: scored[0].fuzzyScore,
                    method: 'fuzzy'
                };
            }
        }
    } catch (error) {
        console.warn('Fuzzy search failed:', error);
    }

    return null;
}

/**
 * Batch match multiple ingredients
 */
export async function batchMatchIngredientsImproved(
    ingredients: Array<{ id: string; item: string; base_ingredient: string }>
): Promise<Array<{ ingredient: any; match: MatchAttempt | null }>> {
    const results = [];
    const skippedFlavorings: string[] = [];

    for (const ingredient of ingredients) {
        const searchTermRaw = ingredient.base_ingredient || ingredient.item;

        try {
            const match = await smartMatchIngredientImproved(searchTermRaw, skippedFlavorings);
            results.push({ ingredient, match });

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 50));
        } catch (error) {
            console.error(`Error matching ingredient "${searchTermRaw}":`, error);
            results.push({ ingredient, match: null });
        }
    }

    return results;
}

/**
 * Get confidence level for a match
 */
export function getMatchConfidenceLevel(attempt: MatchAttempt | null): 'high' | 'medium' | 'low' | 'none' {
    if (!attempt) return 'none';
    if (attempt.confidence >= 85) return 'high';
    if (attempt.confidence >= 70) return 'medium';
    return 'low';
}
