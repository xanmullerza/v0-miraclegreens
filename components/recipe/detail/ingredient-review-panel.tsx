'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Layers, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { cleanIngredientDisplay } from '@/lib/utils/parsing-utils';
import type { Ingredient } from './types';

interface IngredientReviewPanelProps {
    ingredients: Ingredient[];
    matchedIngredients: Record<string, any>;
    setMatchedIngredients: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    skippedIngredients: Record<string, boolean>;
    setSkippedIngredients: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setMappingStep: React.Dispatch<React.SetStateAction<'FOOD_MATCH' | 'INGREDIENT_REVIEW' | 'PORTION_MATCH'>>;
}

export function IngredientReviewPanel({
    ingredients,
    matchedIngredients,
    setMatchedIngredients,
    skippedIngredients,
    setSkippedIngredients,
    setMappingStep
}: IngredientReviewPanelProps) {
    const matchedCount = ingredients.filter(ing => matchedIngredients[ing.id]).length;
    const skippedCount = Object.keys(skippedIngredients).length;
    const allVerified = ingredients.every(ing => matchedIngredients[ing.id] || skippedIngredients[ing.id]);

    return (
        <div className="w-full space-y-4 p-4">
            {/* Header */}
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 -mx-4 px-4 py-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Layers size={14} /> Step 2: Ingredient Verification
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                    Review all matched ingredients before proceeding to portion measurements. {matchedCount} matched, {skippedCount} skipped.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Matched</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{matchedCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Skipped</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{skippedCount}</p>
                </div>
            </div>

            {/* Matched Ingredients */}
            <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">✓ Matched Ingredients</h4>
                <div className="space-y-2">
                    {ingredients.filter(ing => matchedIngredients[ing.id]).map(ing => (
                        <div
                            key={ing.id}
                            className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3"
                        >
                            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                    {cleanIngredientDisplay(ing.base_ingredient || ing.item)}
                                </p>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                                    → <span className="font-medium">{matchedIngredients[ing.id].name}</span>
                                </p>
                                <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1">
                                    {ing.amount} · {matchedIngredients[ing.id]?.portions?.length || 0} portions available
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setMatchedIngredients(prev => {
                                        const u = { ...prev };
                                        delete u[ing.id];
                                        return u;
                                    });
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                                title="Remove match"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skipped Ingredients */}
            {skippedCount > 0 && (
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">⊘ Skipped Ingredients</h4>
                    <div className="space-y-2">
                        {ingredients.filter(ing => skippedIngredients[ing.id]).map(ing => (
                            <div
                                key={ing.id}
                                className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 flex items-start gap-3"
                            >
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                        {cleanIngredientDisplay(ing.base_ingredient || ing.item)}
                                    </p>
                                    <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1">
                                        Will not contribute to nutrition calculations
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSkippedIngredients(prev => {
                                            const u = { ...prev };
                                            delete u[ing.id];
                                            return u;
                                        });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                    title="Restore"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Next Step Button */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                <button
                    onClick={() => setMappingStep('PORTION_MATCH')}
                    disabled={!allVerified}
                    className={cn(
                        "w-full py-3 rounded-lg font-bold text-sm transition-all",
                        allVerified
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-95"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                >
                    {allVerified ? "Proceed to Portion Matching →" : "Match all ingredients to continue"}
                </button>
                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-2 text-center">
                    All ingredients must be either matched or skipped before proceeding.
                </p>
            </div>
        </div>
    );
}
