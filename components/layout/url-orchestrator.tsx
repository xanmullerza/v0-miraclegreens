'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useActionPanel } from '@/lib/context/action-panel-context';

export function URLOrchestrator() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { 
        isActionPanelOpen, 
        setIsActionPanelOpen, 
        setActiveView, 
        setContextRecipeId, 
        setContextFoodId,
        setContextNutrientId,
        activeView
    } = useActionPanel();

    // Track initialization to avoid infinite loops
    const initialized = useRef(false);

    // 1. Sync URL -> Context (On Load & URL Change)
    useEffect(() => {
        const recipeId = searchParams.get('recipeId');
        const foodId = searchParams.get('foodId');
        const nutrientId = searchParams.get('nutrientId');

        if (recipeId) {
            setContextRecipeId(recipeId);
            setActiveView('recipe-detail');
            setIsActionPanelOpen(true);
        } else if (foodId) {
            setContextFoodId(foodId);
            setActiveView('food-detail');
            setIsActionPanelOpen(true);
        } else if (nutrientId) {
            setContextNutrientId(nutrientId);
            setActiveView('nutrient-detail');
            setIsActionPanelOpen(true);
        }
    }, [searchParams]);

    // 2. Sync Context -> URL (Clean up URL when panel is closed)
    useEffect(() => {
        if (!isActionPanelOpen && pathname === '/') {
            const params = new URLSearchParams(searchParams.toString());
            let changed = false;
            
            if (params.has('recipeId')) { params.delete('recipeId'); changed = true; }
            if (params.has('foodId')) { params.delete('foodId'); changed = true; }
            if (params.has('nutrientId')) { params.delete('nutrientId'); changed = true; }

            if (changed) {
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }
    }, [isActionPanelOpen, pathname, searchParams, router]);

    return null;
}
