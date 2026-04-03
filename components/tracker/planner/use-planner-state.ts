import { useState, useEffect, useRef } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DietType } from '@/lib/data/recipes';
import { GoalType, ActivityLevel } from './types';
import { supabase } from '@/lib/supabase';

export interface PlannerState {
    step: 1 | 2 | 3;
    generating: boolean;
    pageMode: 'planner' | 'maker';
    makerMode: 'menu' | 'food' | 'meal' | 'mix';
    calories: number;
    diet: DietType;
    goal: GoalType;
    activityLevel: ActivityLevel;
    gender: 'male' | 'female';
    age: number | '';
    weight: number | '';
    height: number | '';
    eatenMeals: Set<string>;
    plan: any;
    unit: string;
    showFavoritesOnly: boolean;
}

export function usePlannerState() {
    const {
        profile,
        energyUnit: unit,
        skipPlannerQuiz,
        dailyPlan: plan,
        updateDailyPlan: setPlan,
    } = useUserPreferences();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generating, setGenerating] = useState(false);
    const [pageMode, setPageMode] = useState<'planner' | 'maker'>('planner');
    const [makerMode, setMakerMode] = useState<'menu' | 'food' | 'meal' | 'mix'>('menu');
    
    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const [goal, setGoal] = useState<GoalType>('maintain');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');
    const [eatenMeals, setEatenMeals] = useState<Set<string>>(new Set());
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const planKey = plan ? `${plan.breakfast.id}_${plan.lunch.id}_${plan.dinner.id}` : null;
    const EATEN_STORAGE_KEY = 'vitala_eaten_meals';
    const eatenHydrated = useRef(false);

    useEffect(() => {
        if (profile.age) {
            setAge(profile.age);
            setWeight(profile.weight);
            setHeight(profile.height);
            setGender(profile.gender);
            setGoal(profile.goal);
            setDiet(profile.dietType as DietType);
            setActivityLevel(profile.activityLevel);

            if (skipPlannerQuiz) {
                const w = Number(profile.weight) || 70;
                const h = Number(profile.height) || 170;
                const a = Number(profile.age) || 30;
                let bmr = 10 * w + 6.25 * h - 5 * a;
                if (profile.gender === 'male') bmr += 5;
                else bmr -= 161;
                let tdee = bmr;
                switch (profile.activityLevel) {
                    case 'light': tdee = bmr * 1.375; break;
                    case 'moderate': tdee = bmr * 1.55; break;
                    case 'active': tdee = bmr * 1.725; break;
                    default: tdee = bmr * 1.2;
                }
                if (profile.goal === 'build-muscle') tdee *= 1.1;
                setCalories(Math.max(1200, Math.round(tdee / 50) * 50));
                setStep(2);
            }
        }
    }, [profile, skipPlannerQuiz]);

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

    useEffect(() => {
        if (plan && step === 1) setStep(3);
    }, [plan, step]);

    // Validate plan recipes against DB to handle deleted recipes
    useEffect(() => {
        if (!plan) return;

        const validatePlan = async () => {
            try {
                // Version bump to clear broken nutrition caches
                if (plan && !(plan as any)._version) {
                    console.warn('Clearing stale plan to apply new nutritional calculations.');
                    setPlan(null);
                    setStep(1);
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
                    setStep(1);
                    // Import toast if needed, but for now we'll just use setPlan(null) 
                    // and usePlannerActions will handle errors if they happen during interactions
                }
            } catch (e) {
                console.error('Failed to validate plan:', e);
            }
        };

        // Delay slightly to avoid race conditions with profile loading
        const timer = setTimeout(validatePlan, 500);
        return () => clearTimeout(timer);
    }, [plan, setPlan, setStep]);

    return {
        state: {
            step, generating, pageMode, makerMode, calories, diet,
            goal, activityLevel, gender, age, weight, height, eatenMeals, plan, unit, showFavoritesOnly
        },
        actions: {
            setStep, setGenerating, setPageMode, setMakerMode, setCalories,
            setDiet, setGoal, setActivityLevel, setGender, setAge,
            setWeight, setHeight, setEatenMeals, setPlan, setShowFavoritesOnly
        }
    };
}
