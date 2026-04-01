import React, { useState, useEffect } from 'react';
import { usePlannerState } from './use-planner-state';
import { usePlannerActions } from './use-planner-actions';
import { PlannerStepWizard } from './ui/planner-step-wizard';
import { RecipeListItem } from './ui/recipe-list-item';
import { NutrientSummary } from './ui/nutrient-summary';
import { usePantry } from '@/hooks/use-pantry';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RotateCcw, Scale, LayoutGrid, Info, ChevronDown, ChevronUp, Sparkles, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { supabase } from '@/lib/supabase';

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
    
    // Override local state with external props if provided
    const showFavoritesOnly = externalShowFavoritesOnly !== undefined ? externalShowFavoritesOnly : state.showFavoritesOnly;
    // ... we could map more here, but for now we primarily need to fix the type error.
    
    const { handleGenerate, handleMarkEaten, handleShuffleAll } = usePlannerActions(state, actions);
    const { pantryItems } = usePantry();
    const [showDailyNutrients, setShowDailyNutrients] = useState(false);

    const { step, plan, eatenMeals, unit, generating } = state;

    const { navigateTo } = useActionPanel();
    const [user, setUser] = useState<any>(null);
    const { profile, profileLoaded } = useUserPreferences();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const isProfileIncomplete = !profile.age || !profile.weight || !profile.height;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            {step < 3 && (
                <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                    <div className="max-w-2xl w-full p-8 rounded-[2rem] bg-slate-900 border border-slate-700/50 shadow-2xl text-center space-y-5">
                        {!user ? (
                            <>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">
                                    Fill in your basic information to generate a personalised daily meal plan.
                                    <br />
                                    <span className="text-emerald-400 font-bold block mt-1">Sign up or Log In to generate a full weekly meal plan.</span>
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
                            </>
                        ) : isProfileIncomplete ? (
                            <>
                                <p className="text-sm font-medium text-white/90 leading-relaxed">
                                    Welcome back, {user.user_metadata?.full_name || 'Protocol User'}!
                                    <br />
                                    <span className="text-emerald-400 font-bold block mt-1">Complete your profile to generate a personalised 7 day meal plan.</span>
                                </p>
                                <div className="flex justify-center pt-2">
                                    <Button 
                                        onClick={() => navigateTo('profile')}
                                        className="h-10 rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                    >
                                        Complete Profile
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm font-medium text-emerald-400 font-bold uppercase tracking-widest">
                                Profile Synchronized. Ready for Weekly Generation.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-8">

                {step < 3 ? (
                    <div className="flex justify-center w-full">
                        <Card className="p-6 w-full max-w-2xl border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-900/5 dark:shadow-none">
                            <PlannerStepWizard 
                                state={state} 
                                actions={actions} 
                                handleGenerate={handleGenerate} 
                            />
                        </Card>
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
                                    <h3 className="font-bold text-lg uppercase tracking-tight">Today's Protocol</h3>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Molecular Schedule</p>
                                </div>
                             </div>
                        </div>

                        {/* List of Meals */}
                        <div className="space-y-3">
                            {plan && (
                                <>
                                    {plan.breakfast && (
                                        <RecipeListItem
                                            key={plan.breakfast.id}
                                            recipe={plan.breakfast}
                                            mealLabel="breakfast"
                                            unit={unit as any}
                                            onMarkEaten={() => handleMarkEaten(plan.breakfast, 'breakfast')}
                                            isEaten={eatenMeals.has('breakfast')}
                                            pantryItems={pantryItems}
                                        />
                                    )}
                                    {plan.lunch && (
                                        <RecipeListItem
                                            key={plan.lunch.id}
                                            recipe={plan.lunch}
                                            mealLabel="lunch"
                                            unit={unit as any}
                                            onMarkEaten={() => handleMarkEaten(plan.lunch, 'lunch')}
                                            isEaten={eatenMeals.has('lunch')}
                                            pantryItems={pantryItems}
                                        />
                                    )}
                                    {plan.dinner && (
                                        <RecipeListItem
                                            key={plan.dinner.id}
                                            recipe={plan.dinner}
                                            mealLabel="dinner"
                                            unit={unit as any}
                                            onMarkEaten={() => handleMarkEaten(plan.dinner, 'dinner')}
                                            isEaten={eatenMeals.has('dinner')}
                                            pantryItems={pantryItems}
                                        />
                                    )}
                                    {plan.snacks && Array.isArray(plan.snacks) && plan.snacks.map((snack: any, idx: number) => (
                                        <RecipeListItem
                                            key={snack.id || `snack-${idx}`}
                                            recipe={snack}
                                            mealLabel={`snack-${idx + 1}`}
                                            unit={unit as any}
                                            onMarkEaten={() => handleMarkEaten(snack, `snack-${idx + 1}`)}
                                            isEaten={eatenMeals.has(`snack-${idx + 1}`)}
                                            pantryItems={pantryItems}
                                        />
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Analysis Section */}
                        <div className="pt-8">
                            <button
                                onClick={() => setShowDailyNutrients(!showDailyNutrients)}
                                className="w-full py-6 flex items-center justify-between px-8 rounded-3xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Scale size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500">Cumulative Analysis</p>
                                        <h4 className="text-lg font-black uppercase tracking-tighter">Molecular Daily Breakdown</h4>
                                    </div>
                                </div>
                                {showDailyNutrients ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                            </button>

                            {showDailyNutrients && (
                                <div className="mt-8 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-6 duration-500">
                                    <NutrientSummary 
                                        plan={plan} 
                                        userRDAs={state.unit === 'kJ' ? { Energy: state.calories * 4.184 } : { Energy: state.calories }} 
                                        unit={unit} 
                                        eatenMeals={eatenMeals} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlannerContent;
