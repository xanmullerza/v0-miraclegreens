import { useState, useEffect, useRef } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { supabase } from '@/lib/supabase';

export interface PlannerState {
    generating: boolean;
    pageMode: 'planner' | 'maker';
    makerMode: 'menu' | 'food' | 'meal' | 'mix';
    eatenMeals: Set<string>;
    plan: any;
    unit: string;
    showFavoritesOnly: boolean;
}

export function usePlannerState() {
    const {
        energyUnit: unit,
    } = useUserPreferences();

    const [plan, setPlan] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [pageMode, setPageMode] = useState<'planner' | 'maker'>('planner');
    const [makerMode, setMakerMode] = useState<'menu' | 'food' | 'meal' | 'mix'>('menu');
    
    const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const planKey = plan ? `${plan.breakfast.id}_${plan.lunch.id}_${plan.dinner.id}` : null;
    const EATEN_STORAGE_KEY = 'vitala_eaten_meals';
    const eatenHydrated = useRef(false);

    useEffect(() => {
        if (!planKey) return;
        try {
            const saved = JSON.parse(localStorage.getItem(EATEN_STORAGE_KEY) || '{}');
            if (saved.planKey === planKey && Array.isArray(saved.meals)) {
                setEatenMeals(new Set(saved.meals));
            } else if (saved.planKey && saved.planKey !== planKey) {
                setEatenMeals(new Set());
            }
        } catch { /* ignored */ }
        requestAnimationFrame(() => { eatenHydrated.current = true; });
    }, [planKey]);

    useEffect(() => {
        if (!planKey || !eatenHydrated.current) return;
        localStorage.setItem(EATEN_STORAGE_KEY, JSON.stringify({
            planKey,
            meals: [...eatenMeals]
        }));
    }, [eatenMeals, planKey]);

    // Validate plan recipes against DB to handle deleted recipes
    useEffect(() => {
        if (!plan) return;

        const validatePlan = async () => {
            try {
                // Version bump to clear broken nutrition caches
                if (plan && !(plan as any)._version) {
                    console.warn('Clearing stale plan to apply new nutritional calculations.');
                    setPlan(null);
                    return;
                }

                const recipeIds = [
                    plan.breakfast?.id,
                    plan.lunch?.id,
                    plan.dinner?.id,
                    ...(plan.snacks || []).map((s: any) => s.id)
                ].filter(Boolean);

                if (recipeIds.length === 0) return;

                const { data, error } = await supabase
                    .from('recipes')
                    .select('id')
                    .in('id', recipeIds);

                if (error) {
                    console.error('Error validating plan recipes:', error);
                    return;
                }

                const existingIds = new Set(data.map((r: any) => r.id));
                const allExist = recipeIds.every(id => existingIds.has(id));

                if (!allExist) {
                    console.warn('Current plan contains deleted recipes. Clearing plan.');
                    setPlan(null);
                }
            } catch (e) {
                console.error('Failed to validate plan:', e);
            }
        };

        // Delay slightly to avoid race conditions with profile loading
        const timer = setTimeout(validatePlan, 500);
        return () => clearTimeout(timer);
    }, [plan, setPlan]);

    return {
        state: {
            generating, pageMode, makerMode, eatenMeals, plan, unit, showFavoritesOnly
        },
        actions: {
            setGenerating, setPageMode, setMakerMode, setEatenMeals, setPlan, setShowFavoritesOnly
        }
    };
}
