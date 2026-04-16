'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Layers, CheckCircle2, AlertCircle, XCircle, ArrowRight, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { cleanIngredientDisplay } from '@/lib/utils/parsing-utils';
import { parseRecipeAmount } from '@/lib/utils/parsing-utils';
import { findBestMeasureMatch } from '@/lib/utils/measure-matcher';
import type { Ingredient } from './types';

type FoodItemMatch = {
  id?: string;
  name: string;
  common_name?: string;
  category?: string | null;
  image?: string | null;
  energy_kcal: number;
  energy_kj: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micronutrients: Record<string, number>;
  phytonutrients?: Record<string, string>;
  source: 'local' | 'usda';
  fdcId?: number;
  portions?: { label: string; weight_g: number }[];
};

interface IngredientReviewComparisonProps {
    ingredients: Ingredient[];
    matchedIngredients: Record<string, FoodItemMatch>;
    setMatchedIngredients: React.Dispatch<React.SetStateAction<Record<string, FoodItemMatch>>>;
    skippedIngredients: Record<string, boolean>;
    setSkippedIngredients: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setMappingStep: React.Dispatch<React.SetStateAction<'FOOD_MATCH' | 'INGREDIENT_REVIEW' | 'PORTION_MATCH'>>;
}

export function IngredientReviewComparison({
    ingredients,
    matchedIngredients,
    setMatchedIngredients,
    skippedIngredients,
    setSkippedIngredients,
    setMappingStep
}: IngredientReviewComparisonProps) {
    const matchedCount = ingredients.filter(ing => matchedIngredients[ing.id]).length;
    const skippedCount = Object.keys(skippedIngredients).length;
    const allVerified = ingredients.every(ing => matchedIngredients[ing.id] || skippedIngredients[ing.id]);

    // Categorize ingredients
    const highConfidenceMatches = ingredients.filter(ing => {
        if (!matchedIngredients[ing.id] || skippedIngredients[ing.id]) return false;
        const matchedItem = matchedIngredients[ing.id];
        if (!matchedItem.portions || matchedItem.portions.length === 0) return false;

        const originalDetails = parseRecipeAmount(ing.amount, ing.item);
        const bestMatch = findBestMeasureMatch(
            originalDetails.measure_label,
            originalDetails.quantity,
            matchedItem.portions
        );

        return bestMatch && bestMatch.confidence >= 75;
    });

    const lowConfidenceMatches = ingredients.filter(ing => {
        if (!matchedIngredients[ing.id] || skippedIngredients[ing.id]) return false;
        const matchedItem = matchedIngredients[ing.id];
        if (!matchedItem.portions || matchedItem.portions.length === 0) return false;

        const originalDetails = parseRecipeAmount(ing.amount, ing.item);
        const bestMatch = findBestMeasureMatch(
            originalDetails.measure_label,
            originalDetails.quantity,
            matchedItem.portions
        );

        return bestMatch && bestMatch.confidence < 75;
    });

    const noMatchIngredients = ingredients.filter(ing =>
        !matchedIngredients[ing.id] && !skippedIngredients[ing.id]
    );

    const skippedIngredientsList = ingredients.filter(ing => skippedIngredients[ing.id]);

    return (
        <div className="w-full space-y-6 p-4">
            {/* Header */}
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 -mx-4 px-4 py-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Layers size={14} /> Step 2: Ingredient Review
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                    Review smart-matched ingredients and confirm each selection before moving to portion verification.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">High Confidence</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{highConfidenceMatches.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Low Confidence</p>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{lowConfidenceMatches.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">No Match</p>
                    <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{noMatchIngredients.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Skipped</p>
                    <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{skippedCount}</p>
                </div>
            </div>

            {/* High Confidence Matches */}
            {highConfidenceMatches.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={12} /> High Confidence Matches
                    </h4>
                    <div className="space-y-3">
                        {highConfidenceMatches.map(ing => (
                            <IngredientComparisonCard
                                key={ing.id}
                                ingredient={ing}
                                matchedItem={matchedIngredients[ing.id]}
                                confidence="high"
                                onRemoveMatch={() => {
                                    setMatchedIngredients(prev => {
                                        const u = { ...prev };
                                        delete u[ing.id];
                                        return u;
                                    });
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Low Confidence Matches */}
            {lowConfidenceMatches.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle size={12} /> Low Confidence Matches
                    </h4>
                    <div className="space-y-3">
                        {lowConfidenceMatches.map(ing => (
                            <IngredientComparisonCard
                                key={ing.id}
                                ingredient={ing}
                                matchedItem={matchedIngredients[ing.id]}
                                confidence="low"
                                onRemoveMatch={() => {
                                    setMatchedIngredients(prev => {
                                        const u = { ...prev };
                                        delete u[ing.id];
                                        return u;
                                    });
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No Match Ingredients */}
            {noMatchIngredients.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-2">
                        <XCircle size={12} /> No Match Found
                    </h4>
                    <div className="space-y-3">
                        {noMatchIngredients.map(ing => (
                            <div
                                key={ing.id}
                                className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800"
                            >
                                <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                                    {cleanIngredientDisplay(ing.base_ingredient || ing.item)}
                                </p>
                                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                                    Original: {ing.amount}
                                </p>
                                <p className="text-[9px] text-rose-600 dark:text-rose-400 mt-1">
                                    No suitable match found in database
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skipped Ingredients */}
            {skippedIngredientsList.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <EyeOff size={12} /> Skipped Ingredients
                    </h4>
                    <div className="space-y-3">
                        {skippedIngredientsList.map(ing => (
                            <div
                                key={ing.id}
                                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800"
                            >
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {cleanIngredientDisplay(ing.base_ingredient || ing.item)}
                                </p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                                    Original: {ing.amount}
                                </p>
                                <p className="text-[9px] text-slate-600 dark:text-slate-400 mt-1">
                                    Skipped - will not contribute to nutrition calculations
                                </p>
                                <button
                                    onClick={() => {
                                        setSkippedIngredients(prev => {
                                            const u = { ...prev };
                                            delete u[ing.id];
                                            return u;
                                        });
                                    }}
                                    className="mt-2 text-[10px] text-slate-500 hover:text-emerald-600 hover:underline"
                                >
                                    Restore
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
                    {allVerified ? "Proceed to Step 3: Portion Verification →" : "All ingredients must be matched or skipped"}
                </button>
                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-2 text-center">
                    Completed review. In the next step, verify portion measurements for nutrition accuracy.
                </p>
            </div>
        </div>
    );
}

interface IngredientComparisonCardProps {
    ingredient: Ingredient;
    matchedItem: any;
    confidence: 'high' | 'low';
    onRemoveMatch: () => void;
}

function IngredientComparisonCard({
    ingredient,
    matchedItem,
    confidence,
    onRemoveMatch
}: IngredientComparisonCardProps) {
    const originalDetails = parseRecipeAmount(ingredient.amount, ingredient.item);
    const bestMatch = findBestMeasureMatch(
        originalDetails.measure_label,
        originalDetails.quantity,
        matchedItem.portions
    );

    const confidenceColor = confidence === 'high' ? 'emerald' : 'amber';
    const ConfidenceIcon = confidence === 'high' ? CheckCircle2 : AlertTriangle;

    return (
        <div className={cn(
            "p-4 rounded-lg border",
            confidence === 'high'
                ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
        )}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <ConfidenceIcon size={16} className={cn(
                        confidence === 'high' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )} />
                    <p className={cn(
                        "text-sm font-semibold",
                        confidence === 'high' ? "text-emerald-900 dark:text-emerald-100" : "text-amber-900 dark:text-amber-100"
                    )}>
                        {cleanIngredientDisplay(ingredient.base_ingredient || ingredient.item)}
                    </p>
                </div>
                <button
                    onClick={onRemoveMatch}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                    title="Remove match"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Original Recipe</p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                        {originalDetails.quantity} {originalDetails.measure_label}
                    </p>
                </div>

                {/* Matched */}
                <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Smart Match</p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                        {matchedItem.name}
                    </p>
                    {bestMatch && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            → {originalDetails.quantity} × {bestMatch.label} ({bestMatch.confidence.toFixed(0)}% match)
                        </p>
                    )}
                </div>
            </div>

            {confidence === 'low' && bestMatch && (
                <div className="mt-3 p-2 rounded bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-[9px] text-amber-700 dark:text-amber-300">
                        Low confidence match - consider manual portion selection in the next step
                    </p>
                </div>
            )}
        </div>
    );
}