import React, { useState, useEffect } from 'react';
import { usePlannerState } from './use-planner-state';
import { usePlannerActions } from './use-planner-actions';
import { RecipeListItem } from './ui/recipe-list-item';
import { NutrientSummary } from './ui/nutrient-summary';
import { DailyNutrition } from './ui/daily-nutrition';
import { usePantry } from '@/hooks/use-pantry';
import { useRDA } from '@/hooks/use-rda';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Calendar, RotateCcw, LayoutGrid, Info, 
    ChevronDown, Sparkles, ChefHat, 
    Search, Filter as FilterIcon, ArrowDownUp, 
    Clock, Flame, Dumbbell, List, Loader2,
    ShoppingBasket, Shapes, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { supabase } from '@/lib/supabase';
import { TrackerTabShell, SortOption } from '../tracker-tab-shell';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';
import { getSharedNavOptions } from '@/lib/constants/nav-options';

const DEMO_PLAN = {
    breakfast: {
        id: 'demo-b1',
        title: 'Tropical Chia Seed Pudding',
        calories: 395,
        energy_kj: 1653,
        protein: 15,
        fat: 18,
        carbs: 40,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
        micronutrients: { 
            'Vitamin C': 45, 'Calcium': 320, 'Magnesium': 140, 'Potassium': 480, 
            'Fiber': 12, 'Omega-3': 4.5, 'B1 (Thiamine)': 0.3, 'B2 (Riboflavin)': 0.4,
            'B3 (Niacin)': 4.2, 'Vitamin E': 3.5, 'Vitamin A': 120, 'Phosphorus': 280
        },
        phytonutrients: { 
            'Anthocyanins': { description: 'Powerful antioxidants found in berries that support heart health.', sources: ['Blueberries', 'Blackberries'] },
            'Quercetin': { description: 'A plant pigment that may help reduce inflammation.', sources: ['Onions', 'Apples'] }
        }
    },
    lunch: {
        id: 'demo-l1',
        title: 'Mediterranean Quinoa Salad',
        calories: 550,
        energy_kj: 2301,
        protein: 20,
        fat: 25,
        carbs: 55,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
        micronutrients: { 
            'Iron': 4.2, 'Vitamin K': 110, 'Folate': 180, 'Magnesium': 160, 
            'Fiber': 15, 'Potassium': 1200, 'B1 (Thiamine)': 0.4, 'B6 (Pyridoxine)': 0.5,
            'Vitamin A': 450, 'Vitamin C': 65, 'Zinc': 2.8, 'Sodium': 420
        },
        phytonutrients: { 
            'Lycopene': { description: 'A carotenoid that gives tomatoes their red color and supports prostate health.', sources: ['Tomatoes', 'Watermelon'] },
            'Lutein': { description: 'A xanthophyll that supports eye health.', sources: ['Kale', 'Spinach'] }
        }
    },
    dinner: {
        id: 'demo-d1',
        title: 'Pan-Seared Miso Salmon',
        calories: 620,
        energy_kj: 2594,
        protein: 38,
        fat: 32,
        carbs: 12,
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80',
        micronutrients: { 
            'Vitamin D': 15, 'B12 (Cobalamin)': 6, 'Selenium': 55, 'Omega-3': 2.2, 
            'Potassium': 920, 'B3 (Niacin)': 8.5, 'B6 (Pyridoxine)': 0.8, 'B5 (Pantothenic Acid)': 2.5,
            'Vitamin E': 4.2, 'Phosphorus': 450, 'Zinc': 3.2, 'Sodium': 680
        },
        phytonutrients: { 
            'Sulforaphane': { description: 'Found in cruciferous vegetables like the bok choy garnish, it supports detoxification.', sources: ['Broccoli', 'Bok Choy'] },
            'Astaxanthin': { description: 'The pigment that makes salmon pink; a potent antioxidant.', sources: ['Salmon', 'Shrimp'] }
        }
    },
    snacks: []
};

export interface PlannerContentProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    onRecipeClick?: (recipeId: string) => void;
    onSubViewChange?: (view: 'shopping' | 'pantry') => void;
}

const PLANNER_SORT_OPTIONS: SortOption[] = [
    { id: 'time', label: 'Time (Schedule)', icon: <Clock size={18} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={18} /> },
    { id: 'protein', label: 'Protein', icon: <Dumbbell size={18} /> },
];

type PlanLength = 'daily' | 'weekly' | 'monthly';

export function PlannerContent({
    showFavoritesOnly: externalShowFavoritesOnly,
    setShowFavoritesOnly: externalSetShowFavoritesOnly,
    selectedTypes: externalSelectedTypes,
    setSelectedTypes: externalSetSelectedTypes,
    hideControls = false,
    isFilterOpen: externalIsFilterOpen,
    setIsFilterOpen: externalSetIsFilterOpen,
    onRecipeClick,
    onSubViewChange,
}: PlannerContentProps) {

    const { state, actions } = usePlannerState();
    
    // UI State for shell
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('time');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [planLength, setPlanLength] = useState<PlanLength>('daily');
    const [showLengthMenu, setShowLengthMenu] = useState(false);
    const [hasAttemptedInitial, setHasAttemptedInitial] = useState(false);

    // Override local state with external props if provided
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : state.showFavoritesOnly;
    
    const { handleGenerate, handleMarkEaten, handleShuffleAll } = usePlannerActions(state, actions);
    const { pantryItems } = usePantry();

    const { plan, eatenMeals, unit, generating } = state;

    const { navigateTo, setIsActionPanelOpen, setActiveView, isActionPanelOpen, activeView } = useActionPanel();
    const { profile, profileLoaded, dailyTargets, selectedServings, setSelectedServings } = useUserPreferences();
    const [user, setUser] = useState<any>(undefined);
    const [authReady, setAuthReady] = useState(false);

    const isAnonymous = authReady && user === null;
    const effectiveServings = isAnonymous ? 1 : selectedServings;
    const effectivePlan = isAnonymous ? DEMO_PLAN : state.plan;

    const handleAuthRedirect = () => {
        navigateTo('auth-prompt');
    };

    useEffect(() => {
        let resolvedViaGetSession = false;
        supabase.auth.getSession().then(({ data: { session } }) => {
            resolvedViaGetSession = true;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' && resolvedViaGetSession) return;
            setUser(session?.user ?? null);
            setAuthReady(true);
        });
        return () => subscription.unsubscribe();
    }, []);

    const isProfileIncomplete = !profile.age || !profile.weight || !profile.height;

    // Calculate RDAs for daily nutrition
    const rdas = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    // Fallback RDAs while loading or if fetch fails
    const defaultRDAs: Record<string, number> = {
        'Energy': dailyTargets.energy || 2000,
        'Protein': ((profile?.weight || 70) * 1.6),
        'Carbs': 250,
        'Fat': 70,
        'Potassium': 2600,
        'Magnesium': 310,
        'Calcium': 1000,
        'Vitamin A': 700,
        'Vitamin C': 75,
        'Vitamin D': 600,
        'Vitamin E': 15,
        'Vitamin K': 90,
    };

    const userRDAs = rdas || defaultRDAs;

    const getFilteredMeals = () => {
        if (!effectivePlan) return [];
        let meals: any[] = [];
        if (effectivePlan.breakfast) meals.push({ ...effectivePlan.breakfast, mealLabel: 'breakfast' });
        if (effectivePlan.lunch) meals.push({ ...effectivePlan.lunch, mealLabel: 'lunch' });
        if (effectivePlan.dinner) meals.push({ ...effectivePlan.dinner, mealLabel: 'dinner' });
        if (effectivePlan.snacks && Array.isArray(effectivePlan.snacks)) {
            effectivePlan.snacks.forEach((s: any, i: number) => meals.push({ ...s, mealLabel: `snack-${i+1}` }));
        }

        // Filter by search
        if (searchQuery) {
            meals = meals.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Sort
        meals.sort((a, b) => {
            let valA, valB;
            if (sortField === 'time') {
                const order: any = { 'breakfast': 1, 'lunch': 2, 'dinner': 3 };
                valA = order[a.mealLabel] || 4;
                valB = order[b.mealLabel] || 4;
            } else if (sortField === 'calories') {
                valA = a.calories || 0;
                valB = b.calories || 0;
            } else if (sortField === 'protein') {
                valA = a.protein || 0;
                valB = b.protein || 0;
            } else {
                valA = a.title;
                valB = b.title;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return meals;
    };


    // Auto-generate plan when navigating to empty planner if authenticated & setup
    useEffect(() => {
        if (!profileLoaded || !authReady || !user || isProfileIncomplete) return;
        
        if (!plan && !generating && !hasAttemptedInitial) {
            handleGenerate().then(() => setHasAttemptedInitial(true));
        }
    }, [user, isProfileIncomplete, plan, generating, profileLoaded, authReady, hasAttemptedInitial]);

    // Unified Loading State Logic
    const isLoading = !profileLoaded || !authReady || user === undefined || generating || (user && !state.plan && !hasAttemptedInitial);

    return (
        <div className="relative group/planner">
            <TrackerTabShell
                title="Planner"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortField={sortField}
                setSortField={setSortField}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                sortOptions={PLANNER_SORT_OPTIONS}
                showFilters={true}
                isFiltersOpen={activeView === 'recipe-filters'}
                onFilterClick={() => {
                    if (activeView === 'recipe-filters') {
                        setActiveView('home');
                        setIsActionPanelOpen(false);
                    } else {
                        setActiveView('recipe-filters');
                        // Only open ActionPanel on desktop
                        if (window.innerWidth >= 640) {
                            setIsActionPanelOpen(true);
                        }
                    }
                }}
                scaleValue={effectiveServings}
                onScaleChange={(val) => setSelectedServings(Math.max(0.5, val))}
                filterChildren={<RecipeFilterContent onClose={() => { setActiveView('home'); setIsActionPanelOpen(false); }} />}
            >

                <div className="space-y-6 py-4">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">Loading meal plan...</p>
                        </div>
                    ) : isProfileIncomplete && !isAnonymous ? (
                        <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                            <div className="max-w-2xl w-full p-8 rounded-[2.5rem] bg-slate-900 shadow-2xl text-center space-y-5 ring-1 ring-white/5">

                                <p className="text-sm font-medium text-white/90 leading-relaxed">
                                    Welcome, {user?.user_metadata?.full_name || 'User'}!
                                    <br />
                                    <span className="text-emerald-400 font-bold block mt-1">Complete your profile to generate a personalised meal plan.</span>
                                </p>
                                <div className="flex justify-center pt-2">
                                    <Button 
                                        onClick={() => navigateTo('profile')}
                                        className="h-10 rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                    >
                                        Complete Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (user && !state.plan && hasAttemptedInitial) ? (
                         <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                            <div className="max-w-2xl w-full p-8 rounded-[2.5rem] bg-slate-900 shadow-2xl text-center space-y-5 ring-1 ring-white/5">

                                <p className="text-sm font-medium text-rose-400 font-bold uppercase tracking-widest">
                                    Failed to generate plan. Your recipe parameters might be too strict.
                                </p>
                                <Button onClick={handleGenerate} className="h-10 rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                    Retry Generation
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 relative group/meals">
                            {/* Day View Header */}
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Calendar size={20}/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg uppercase tracking-tight">
                                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </h3>
                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* List of Meals */}
                            <div className="space-y-2">
                                {getFilteredMeals().map((meal) => (
                                    <RecipeListItem
                                        key={meal.id}
                                        recipe={meal}
                                        mealLabel={meal.mealLabel}
                                        unit={unit as any}
                                        onMarkEaten={() => handleMarkEaten(meal, meal.mealLabel, effectiveServings)}
                                        isEaten={eatenMeals.has(meal.mealLabel)}
                                        pantryItems={pantryItems}
                                        onRecipeClick={(id) => isAnonymous ? handleAuthRedirect() : onRecipeClick?.(id)}
                                        selectedServings={effectiveServings}
                                    />
                                ))}
                            </div>

                            {/* Daily Nutrition Display */}
                            <div className="mt-6 p-4 sm:p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 shadow-xl ring-1 ring-white/5 animate-in slide-in-from-top-6 duration-500">

                                <DailyNutrition 
                                    plan={effectivePlan} 
                                    userRDAs={userRDAs}
                                    profile={profile}
                                    energyUnit={unit}
                                    nutrientDisplayMode="both"
                                    selectedServings={effectiveServings}
                                />
                            </div>

                            {/* Click Interceptor for Anonymous Users (Content Only) */}
                            {isAnonymous && (
                                <div 
                                    className="absolute inset-x-0 top-0 bottom-0 z-50 cursor-pointer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAuthRedirect();
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </TrackerTabShell>
        </div>
    );
}

export default PlannerContent;
