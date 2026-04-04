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
    Clock, Flame, Dumbbell, List, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { supabase } from '@/lib/supabase';
import { TrackerTabShell, SortOption } from '../tracker-tab-shell';

export interface PlannerContentProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    onRecipeClick?: (recipeId: string) => void;
}

const PLANNER_SORT_OPTIONS: SortOption[] = [
    { id: 'time', label: 'Time (Schedule)', icon: <Clock size={12} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={12} /> },
    { id: 'protein', label: 'Protein', icon: <Dumbbell size={12} /> },
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
}: PlannerContentProps) {
    const { state, actions } = usePlannerState();
    
    // UI State for shell
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('time');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [planLength, setPlanLength] = useState<PlanLength>('daily');
    const [showLengthMenu, setShowLengthMenu] = useState(false);
    const [selectedServings, setSelectedServings] = useState<number>(1);
    const [hasAttemptedInitial, setHasAttemptedInitial] = useState(false);

    // Override local state with external props if provided
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : state.showFavoritesOnly;
    
    const { handleGenerate, handleMarkEaten, handleShuffleAll } = usePlannerActions(state, actions);
    const { pantryItems } = usePantry();

    const { plan, eatenMeals, unit, generating } = state;

    const { navigateTo, setIsActionPanelOpen, setActiveView, isActionPanelOpen, activeView } = useActionPanel();
    const { profile, profileLoaded, dailyTargets } = useUserPreferences();
    const [user, setUser] = useState<any>(undefined);
    const [authReady, setAuthReady] = useState(false);
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
        if (!plan) return [];
        let meals: any[] = [];
        if (plan.breakfast) meals.push({ ...plan.breakfast, mealLabel: 'breakfast' });
        if (plan.lunch) meals.push({ ...plan.lunch, mealLabel: 'lunch' });
        if (plan.dinner) meals.push({ ...plan.dinner, mealLabel: 'dinner' });
        if (plan.snacks && Array.isArray(plan.snacks)) {
            plan.snacks.forEach((s: any, i: number) => meals.push({ ...s, mealLabel: `snack-${i+1}` }));
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

    const lengthSwitcher = (
        <div className="flex items-center gap-2">
            {/* Servings Adjuster */}
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setSelectedServings(Math.max(0.5, selectedServings - 0.5))}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                    title="Decrease servings"
                >
                    <ChevronDown size={12} />
                </button>
                <div className="px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-slate-900 dark:text-white whitespace-nowrap min-w-[50px] text-center">
                    {selectedServings.toFixed(1)}x
                </div>
                <button
                    onClick={() => setSelectedServings(selectedServings + 0.5)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                    title="Increase servings"
                >
                    <ChevronDown size={12} className="rotate-180" />
                </button>
            </div>

            {/* Plan Length Switcher */}
            <div className="relative">
                <button
                    onClick={() => setShowLengthMenu(!showLengthMenu)}
                    className="h-10 px-4 rounded-xl bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Sparkles size={14} className="animate-pulse" />
                    <span className="hidden sm:inline">{planLength}</span>
                    <ChevronDown size={10} className={cn("transition-transform duration-300", showLengthMenu && "rotate-180")} />
                </button>

                {showLengthMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-[100] p-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
                        {(['daily', 'weekly', 'monthly'] as PlanLength[]).map((length) => (
                            <button
                                key={length}
                                onClick={() => {
                                    setPlanLength(length);
                                    setShowLengthMenu(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                                    planLength === length
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                            >
                                <Calendar size={12} className={planLength === length ? "text-white" : "text-blue-500"} />
                                {length}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // Auto-generate plan when navigating to empty planner if authenticated & setup
    useEffect(() => {
        if (!profileLoaded || !authReady || !user || isProfileIncomplete) return;
        
        if (!plan && !generating && !hasAttemptedInitial) {
            handleGenerate().then(() => setHasAttemptedInitial(true));
        }
    }, [user, isProfileIncomplete, plan, generating, profileLoaded, authReady, hasAttemptedInitial]);

    // Unified Loading State Logic
    const isLoading = !profileLoaded || !authReady || user === undefined || generating || (user && !plan && !hasAttemptedInitial);

    return (
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
            onFilterClick={() => {
                setActiveView('recipe-filters');
                setIsActionPanelOpen(true);
            }}
            dropdownContent={lengthSwitcher}
        >
            <div className="space-y-6 py-4">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Loader2 size={24} className="animate-spin text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">Loading meal plan...</p>
                    </div>
                ) : user === null ? (
                    <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                        <div className="max-w-2xl w-full p-8 rounded-[2rem] bg-slate-900 border border-slate-700/50 shadow-2xl text-center space-y-5">
                            <p className="text-sm font-medium text-white/90 leading-relaxed">
                                Because the meal planner is highly personalised, we require you to create an account to access it.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <Button 
                                    className="h-12 rounded-lg px-8 bg-white text-slate-900 border-2 border-white hover:bg-slate-50 hover:border-slate-200 font-bold flex items-center justify-center gap-3 group transition-all shadow-lg"
                                    onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                                >
                                    <svg className="w-6 h-6 transition-transform group-hover:scale-110 flex-shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    <span className="text-slate-900 whitespace-nowrap font-bold text-base">Continue with Google</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : isProfileIncomplete ? (
                    <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                        <div className="max-w-2xl w-full p-8 rounded-[2rem] bg-slate-900 border border-slate-700/50 shadow-2xl text-center space-y-5">
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
                ) : (user && !plan && hasAttemptedInitial) ? (
                     <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                        <div className="max-w-2xl w-full p-8 rounded-[2rem] bg-slate-900 border border-slate-700/50 shadow-2xl text-center space-y-5">
                            <p className="text-sm font-medium text-rose-400 font-bold uppercase tracking-widest">
                                Failed to generate plan. Your recipe parameters might be too strict.
                            </p>
                            <Button onClick={handleGenerate} className="h-10 rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
                                Retry Generation
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
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
                                    onMarkEaten={() => handleMarkEaten(meal, meal.mealLabel, selectedServings)}
                                    isEaten={eatenMeals.has(meal.mealLabel)}
                                    pantryItems={pantryItems}
                                    onRecipeClick={onRecipeClick}
                                    selectedServings={selectedServings}
                                />
                            ))}
                        </div>

                        {/* Daily Nutrition Display */}
                        <div className="mt-6 p-4 sm:p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-6 duration-500">
                            <DailyNutrition 
                                plan={plan} 
                                userRDAs={userRDAs}
                                profile={profile}
                                energyUnit={unit}
                                nutrientDisplayMode="both"
                                selectedServings={selectedServings}
                            />
                        </div>
                    </div>
                )}
            </div>
        </TrackerTabShell>
    );
}

export default PlannerContent;
