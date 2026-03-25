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
                const searchTerm = extractCoreName(searchTermRaw);
                
                if (!searchTerm || searchTerm.length < 2) continue;

                // Auto-skip flavorings
                if (isFlavoringIngredient({ name: searchTermRaw } as any)) {
                    skippedFlavorings.push(searchTermRaw);
                    continue;
                }

                // Unified search
                let matchData = await searchFoodItem(searchTerm);
                
                // Singularization Fallback
                if (!matchData || matchData.length === 0) {
                    const singular = dePluralize(searchTerm);
                    if (singular !== searchTerm) {
                        matchData = await searchFoodItem(singular);
                    }
                }
                
                // Keyword Fallback
                if ((!matchData || matchData.length === 0) && searchTerm.includes(' ')) {
                    const words = searchTerm.split(' ');
                    for (let w = words.length - 1; w >= 0; w--) {
                        const subTerm = words.slice(w).join(' ');
                        matchData = await searchFoodItem(subTerm);
                        if (!matchData || matchData.length === 0) {
                            const subSingular = dePluralize(subTerm);
                            if (subSingular !== subTerm) matchData = await searchFoodItem(subSingular);
                        }
                        if (matchData && matchData.length > 0) break;
                    }
                }

                if (matchData && matchData.length > 0) {
                    nextQueue.push({ idx, ingredient: ing, results: matchData });
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
