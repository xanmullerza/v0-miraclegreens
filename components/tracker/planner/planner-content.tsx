import React, { useState } from 'react';
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Biological Meal Planner</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Nutrient Dense Protocol Generation</p>
                </div>
                {step === 3 && (
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleShuffleAll}
                            className="h-10 px-4 rounded-xl text-[10px] uppercase font-black tracking-widest gap-2"
                        >
                            <RotateCcw size={14}/> Full Shuffle
                        </Button>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {step < 3 ? (
                    <Card className="p-8">
                        <PlannerStepWizard 
                            state={state} 
                            actions={actions} 
                            handleGenerate={handleGenerate} 
                        />
                    </Card>
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
                            {plan && Object.entries(plan).map(([mealType, recipe]: [string, any]) => {
                                if (!recipe || typeof recipe !== 'object') return null;
                                return (
                                    <RecipeListItem
                                        key={recipe.id}
                                        recipe={recipe}
                                        mealLabel={mealType}
                                        unit={unit as any}
                                        onMarkEaten={() => handleMarkEaten(recipe, mealType)}
                                        isEaten={eatenMeals.has(mealType)}
                                        pantryItems={pantryItems}
                                    />
                                );
                            })}
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
