'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Dna, Sparkles, Zap, Loader2 } from 'lucide-react';
import { formatEnergyValue } from '@/lib/utils/nutrition-utils';
import { useRecipeNutrition } from '@/hooks/use-recipe-nutrition';
import { NutritionDisplay } from '@/components/nutrients/NutritionDisplay';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

// ── Main Component ──────────────────────────────────────────
export function RecipeNutrition({ ctx }: { ctx: RecipeDetailCtx }) {
    const {
        recipe, calculatedNutrition, nutritionViewMode, setNutritionViewMode,
        energyUnit, nutrientDisplayMode, userRDAs, profile
    } = ctx;

    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);

    if (!recipe) return null;

    // Check if recipe has nutrition data saved in DB OR calculated from ingredients
    const hasData = recipe.calories > 0 || calculatedNutrition.calories > 0;

    // No data → Empty state (workflow in side panel)
    if (!hasData) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={64} className="text-indigo-500" /></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-500 animate-pulse" /> Smart Match
                        </h3>
                        <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mb-4 leading-relaxed">
                            Use the workflow on the right side to match and measure ingredients from our nutrition database.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate nutrition using the hook
    const nutrition = useRecipeNutrition({
        recipe: {
            ...recipe,
            calories: recipe.calories > 0 ? recipe.calories : calculatedNutrition.calories,
            protein: recipe.protein > 0 ? recipe.protein : calculatedNutrition.protein,
            carbs: recipe.carbs > 0 ? recipe.carbs : calculatedNutrition.carbs,
            fat: recipe.fat > 0 ? recipe.fat : calculatedNutrition.fat,
            energy_kj: recipe.energy_kj > 0 ? recipe.energy_kj : calculatedNutrition.energyKj,
            micronutrients: recipe.micronutrients && Object.keys(recipe.micronutrients).length > 0 ? recipe.micronutrients : calculatedNutrition.micronutrients || {},
        },
        viewMode: nutritionViewMode as 'per-recipe' | 'per-serving',
        energyUnit,
        userRDAs,
        nutrientDisplayMode,
    });

    // Get phytonutrients (not part of NutritionDisplay yet)
    const phytonutrients = calculatedNutrition.phytonutrients && Object.keys(calculatedNutrition.phytonutrients).length > 0 ? calculatedNutrition.phytonutrients : (recipe.phytonutrients || {});

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Rendering mode toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                        <Activity size={16} /> Serving Mode
                    </h3>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    {(['per-recipe', 'per-serving'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setNutritionViewMode(mode)}
                            className={cn(
                                'flex-1 text-[10px] font-black py-1.5 px-2 rounded-md transition-all uppercase tracking-widest',
                                nutritionViewMode === mode
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            )}
                        >
                            {mode === 'per-recipe' ? 'Recipe' : 'Per Serving'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Nutrition Display Component */}
            {nutrition && (
                <NutritionDisplay
                    nutrition={nutrition}
                    energyUnit={energyUnit}
                    nutrientDisplayMode={nutrientDisplayMode}
                    universalThreshold={universalThreshold}
                    onThresholdChange={setUniversalThreshold}
                />
            )}

            {/* Phytonutrients Section */}
            {/* Phytonutrients Section */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4">
                <div className="mb-4">
                    <div className="text-[11px] font-black uppercase tracking-widest text-green-400">Phytonutrients</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Plant compounds with powerful health benefits • Click a tag to learn more</div>
                </div>
                {phytonutrients && Object.keys(phytonutrients).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(phytonutrients).map(([name, data]) => {
                            const isExpanded = expandedPhyto === name;
                            const description = typeof data === 'object' ? data.description : String(data);
                            const sources = typeof data === 'object' ? data.sources || [] : [];

                            return (
                                <button
                                    key={name}
                                    onClick={() => setExpandedPhyto(isExpanded ? null : name)}
                                    className={cn(
                                        "relative rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden font-semibold",
                                        isExpanded
                                            ? "col-span-full w-full px-4 py-3 h-auto bg-gradient-to-r from-green-500/15 to-emerald-500/15 border-green-400/50 dark:border-green-500/50"
                                            : "inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-300/30 dark:border-blue-600/40 text-blue-700 dark:text-blue-400 hover:shadow-md hover:border-blue-400/50 dark:hover:border-blue-500/50"
                                    )}
                                >
                                    {isExpanded ? (
                                        // Expanded view - Show description and sources
                                        <div className="flex flex-col gap-3 w-full">
                                            <div>
                                                <div className="text-[11px] font-black text-green-700 dark:text-green-400">{name}</div>
                                                <p className="text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                                                    {description || "No description available"}
                                                </p>
                                            </div>
                                            {sources.length > 0 && (
                                                <div>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Sources</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sources.map((source) => (
                                                            <span key={source} className="inline-block text-[8px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-300/30 dark:border-green-600/40">
                                                                {source}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Collapsed view - Show tag
                                        <>
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-[7px] font-black">•</span>
                                            <span className="text-[10px]">{name}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-[10px] text-slate-400">No phytonutrient data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
