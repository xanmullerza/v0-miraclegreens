'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Dna, Sparkles, Zap, Loader2 } from 'lucide-react';
import { useRecipeNutrition } from '@/hooks/use-recipe-nutrition';
import { NutritionDisplay } from '@/components/nutrients/NutritionDisplay';
import { RecipeSmartMatch } from './recipe-smart-match';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

// ── Main Component ──────────────────────────────────────────
export function RecipeNutrition({ ctx }: { ctx: RecipeDetailCtx }) {
    const {
        recipe, calculatedNutrition, selectedServings,
        energyUnit, nutrientDisplayMode, userRDAs, profile
    } = ctx;

    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);

    if (!recipe) return null;

    // Check if recipe has nutrition data saved in DB only
    const hasData = recipe.calories > 0 && recipe.micronutrients && Object.keys(recipe.micronutrients).length > 0;

    // No data → Show smart match workflow
    if (!hasData) {
        return <RecipeSmartMatch ctx={ctx} />;
    }

    // Calculate nutrition using DB recipe fields only; no fallback to calculated ingredient nutrition
    const nutrition = useRecipeNutrition({
        recipe: {
            ...recipe,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            energy_kj: recipe.energy_kj,
            micronutrients: recipe.micronutrients || {},
        },
        viewMode: 'per-serving' as const,
        energyUnit,
        userRDAs,
        nutrientDisplayMode,
    });

    // Scale nutrition by selectedServings
    const scaledNutrition = nutrition ? {
        ...nutrition,
        energy: { ...nutrition.energy, value: nutrition.energy.value * selectedServings },
        protein: { ...nutrition.protein, value: nutrition.protein.value * selectedServings },
        carbs: { ...nutrition.carbs, value: nutrition.carbs.value * selectedServings },
        fat: { ...nutrition.fat, value: nutrition.fat.value * selectedServings },
        aminoAcids: nutrition.aminoAcids?.map(aa => ({ ...aa, value: aa.value * selectedServings })),
        carbBreakdown: {
            starch: nutrition.carbBreakdown.starch * selectedServings,
            fiber: nutrition.carbBreakdown.fiber * selectedServings,
            sugar: nutrition.carbBreakdown.sugar * selectedServings,
        },
        fatBreakdown: {
            saturated: nutrition.fatBreakdown.saturated * selectedServings,
            monounsaturated: nutrition.fatBreakdown.monounsaturated * selectedServings,
            polyunsaturated: nutrition.fatBreakdown.polyunsaturated * selectedServings,
            omega3: nutrition.fatBreakdown.omega3 * selectedServings,
            omega6: nutrition.fatBreakdown.omega6 * selectedServings,
            cholesterol: nutrition.fatBreakdown.cholesterol * selectedServings,
        },
        micronutrients: {
            electrolytes: nutrition.micronutrients.electrolytes?.map(el => ({ ...el, val: el.val * selectedServings })) || [],
            trace: nutrition.micronutrients.trace?.map(tr => ({ ...tr, val: tr.val * selectedServings })) || [],
            waterSoluble: nutrition.micronutrients.waterSoluble?.map(ws => ({ ...ws, val: ws.val * selectedServings })) || [],
            fatSoluble: nutrition.micronutrients.fatSoluble?.map(sv => ({ ...sv, val: sv.val * selectedServings })) || [],
            choline: { ...nutrition.micronutrients.choline, val: nutrition.micronutrients.choline.val * selectedServings },
        },
    } : null;

    // Get phytonutrients from DB recipe only
    const phytonutrients = recipe.phytonutrients || {};

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Nutrition Display Component */}
            {scaledNutrition && (
                <NutritionDisplay
                    nutrition={scaledNutrition}
                    energyUnit={energyUnit}
                    nutrientDisplayMode={nutrientDisplayMode}
                    universalThreshold={universalThreshold}
                    onThresholdChange={setUniversalThreshold}
                />
            )}

            {/* Phytonutrients Section */}
            {/* Phytonutrients Section */}
            <div className="rounded-[2.5rem] border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] hover:-translate-y-1 transition-all duration-500 p-4">
                <div className="mb-4">
                    <div className="text-[11px] font-black uppercase tracking-widest text-green-400">Phytonutrients</div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">Plant compounds with powerful health benefits • Click a tag to learn more</div>
                </div>
                {phytonutrients && Object.keys(phytonutrients).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {Object.entries(phytonutrients).map(([name, data]) => {
                            const isExpanded = expandedPhyto === name;
                            const description = typeof data === 'object' ? data.description : String(data);
                            const sources = typeof data === 'object' ? data.sources || [] : [];

                            return (
                                <button
                                    key={name}
                                    onClick={() => setExpandedPhyto(isExpanded ? null : name)}
                                    className={cn(
                                        "relative rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden font-semibold w-full",
                                        isExpanded
                                            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl px-4 py-4"
                                            : "inline-flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 hover:shadow-sm"
                                    )}
                                >
                                    {isExpanded ? (
                                        // Expanded view - Show description and sources
                                        <div className="flex flex-col gap-3 w-full">
                                            <div>
                                                <div className="text-[11px] font-black text-green-700 dark:text-green-400">{name}</div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                                                    {description || "No description available"}
                                                </p>
                                            </div>
                                            {sources.length > 0 && (
                                                <div>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Sources</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {sources.map((source) => (
                                                            <span key={source} className="inline-block text-[8px] bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full border border-green-300/30 dark:border-green-600/40">
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
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500/20 text-[7px] font-black">•</span>
                                            <span className="text-[10px] text-slate-900 dark:text-slate-200">{name}</span>
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
