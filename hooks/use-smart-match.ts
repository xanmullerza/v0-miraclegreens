'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { searchFoodItem, isFlavoringIngredient } from '@/lib/services/nutrition';
import { extractCoreName, dePluralize } from '@/lib/utils/parsing-utils';

interface Ingredient {
    id: string;
    item: string;
    base_ingredient: string;
    [key: string]: any;
}

interface SmartMatchQueueItem {
    idx: number;
    ingredient: Ingredient;
    results: any[];
}

/**
 * Ingredient synonyms for better matching
 */
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
    'bell pepper': ['capsicum', 'pepper', 'sweet pepper'],
    'green beans': ['french beans', 'snap beans', 'string beans', 'beans'],
    'self-rising flour': ['self-raising flour', 'flour', 'all-purpose flour'],
    'sweet potato': ['yam'],
    'chick peas': ['chickpeas', 'garbanzo beans', 'chickpea'],
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
    'parmesan': ['parmigiano'],
    'ground beef': ['beef mince', 'minced beef'],
    'ground chicken': ['chicken mince', 'minced chicken'],
    'heavy cream': ['double cream', 'heavy whipping cream'],
    'butter': ['unsalted butter', 'salted butter'],
    'milk': ['whole milk', 'low-fat milk'],
    'yogurt': ['yoghurt'],
    'olive oil': ['extra virgin olive oil'],
};

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
 * Generate search terms with synonyms and variations
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

export function useSmartMatch() {
    const [isRunning, setIsRunning] = useState(false);
    const [queue, setQueue] = useState<SmartMatchQueueItem[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showPicker, setShowPicker] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const runMatch = useCallback(async (ingredients: Ingredient[]) => {
        if (isRunning || ingredients.length === 0) return;
        
        setIsRunning(true);
        toast.loading("Analyzing ingredients with Smart Match...", { id: 'smart-match' });

        try {
            const nextQueue: SmartMatchQueueItem[] = [];
            const skippedFlavorings: string[] = [];

            for (let idx = 0; idx < ingredients.length; idx++) {
                const ing = ingredients[idx];
                const searchTermRaw = ing.base_ingredient || ing.item;
                
                if (!searchTermRaw || searchTermRaw.length < 2) continue;

                // Auto-skip flavorings
                if (isFlavoringIngredient({ name: searchTermRaw } as any)) {
                    skippedFlavorings.push(searchTermRaw);
                    continue;
                }

                // IMPROVED: Generate all search variations
                const searchTerms = generateSearchTerms(searchTermRaw);
                let foundResults = null;

                // Try each search term
                for (const searchTerm of searchTerms) {
                    if (searchTerm.length < 2) continue;

                    try {
                        const matchData = await searchFoodItem(searchTerm);
                        if (matchData && matchData.length > 0) {
                            foundResults = matchData;
                            break; // Found results, stop searching
                        }
                    } catch (error) {
                        console.warn(`Search failed for "${searchTerm}":`, error);
                    }
                }

                // IMPROVED: Fuzzy fallback if exact search failed
                if (!foundResults) {
                    const primaryTerm = generateSearchTerms(searchTermRaw)[0];
                    try {
                        const fuzzyResults = await searchFoodItem(primaryTerm);
                        if (fuzzyResults && fuzzyResults.length > 0) {
                            // Score by fuzzy match
                            const scored = fuzzyResults
                                .map(item => ({
                                    ...item,
                                    fuzzyScore: fuzzyScore(primaryTerm, item.name || item.common_name)
                                }))
                                .sort((a, b) => b.fuzzyScore - a.fuzzyScore)
                                .filter(i => i.fuzzyScore > 60);

                            if (scored.length > 0) {
                                foundResults = scored;
                            }
                        }
                    } catch (error) {
                        console.warn('Fuzzy fallback failed:', error);
                    }
                }

                if (foundResults && foundResults.length > 0) {
                    nextQueue.push({ idx, ingredient: ing, results: foundResults });
                }
            }

            if (nextQueue.length > 0) {
                setQueue(nextQueue);
                setCurrentIdx(0);
                setResults(nextQueue[0].results);
                setShowPicker(true);
                
                const flavorMsg = skippedFlavorings.length > 0 ? ` (${skippedFlavorings.length} flavorings auto-skipped)` : '';
                toast.success(`Smart Match: Select matches for ${nextQueue.length} ingredients${flavorMsg}`, { id: 'smart-match' });
                return { hasQueue: true, skippedFlavorings };
            } else {
                const flavorMsg = skippedFlavorings.length > 0 ? `${skippedFlavorings.length} flavorings were auto-skipped.` : "No direct mappings found.";
                toast.info(`Smart Match result: ${flavorMsg}`, { id: 'smart-match' });
                return { hasQueue: false, skippedFlavorings };
            }
        } finally {
            setIsRunning(false);
        }
    }, [isRunning]);

    const reset = useCallback(() => {
        setQueue([]);
        setCurrentIdx(0);
        setShowPicker(false);
        setResults([]);
    }, []);

    return {
        isRunning,
        queue,
        currentIdx,
        setCurrentIdx,
        showPicker,
        setShowPicker,
        results,
        setResults,
        runMatch,
        reset
    };
}
