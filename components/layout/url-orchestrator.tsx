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

    // Guard: prevents the cleanup effect from firing immediately after a URL-driven open
    const justOpenedRef = useRef(false);

    // 1. Sync URL -> Context (On Load & URL Change)
    useEffect(() => {
        const recipeId = searchParams.get('recipeId');
        const foodId = searchParams.get('foodId');
        const nutrientId = searchParams.get('nutrientId');

        if (recipeId) {
            setContextRecipeId(recipeId);
            setActiveView('recipe-detail');
            setIsActionPanelOpen(true);
            justOpenedRef.current = true;
        } else if (foodId) {
            setContextFoodId(foodId);
            setActiveView('food-detail');
            setIsActionPanelOpen(true);
            justOpenedRef.current = true;
        } else if (nutrientId) {
            setContextNutrientId(nutrientId);
            setActiveView('nutrient-detail');
            setIsActionPanelOpen(true);
            justOpenedRef.current = true;
        }
    }, [searchParams]);

    // 2. Sync Context -> URL (Clean up URL when panel is explicitly closed by user)
    useEffect(() => {
        // Skip cleanup if the orchestrator just opened the panel (prevents race condition)
        if (justOpenedRef.current) {
            justOpenedRef.current = false;
            return;
        }

        if (!isActionPanelOpen) {
            const params = new URLSearchParams(searchParams.toString());
            let changed = false;
            
            if (params.has('recipeId')) { params.delete('recipeId'); changed = true; }
            if (params.has('foodId')) { params.delete('foodId'); changed = true; }
            if (params.has('nutrientId')) { params.delete('nutrientId'); changed = true; }

            if (changed) {
                const remaining = params.toString();
                router.replace(`${pathname}${remaining ? `?${remaining}` : ''}`, { scroll: false });
            }
        }
    }, [isActionPanelOpen]);

    return null;
}
