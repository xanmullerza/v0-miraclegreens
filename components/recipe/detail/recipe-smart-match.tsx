'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Loader2, Activity, UtensilsCrossed, Layers, Sparkles,
    Check, RefreshCw, X, Search, AlertTriangle, Flame, RotateCcw, Trash2, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { isFlavoringIngredient, getUSDAFoodDetails, searchUSDAFood } from '@/lib/services/nutrition';
import { cleanIngredientDisplay, extractCoreName, parseRecipeAmount } from '@/lib/utils/parsing-utils';
import { findBestMeasureMatch } from '@/lib/utils/measure-matcher';
import type { Ingredient } from './types';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeSmartMatchProps {
    ctx: RecipeDetailCtx;
}

export function RecipeSmartMatch({ ctx }: RecipeSmartMatchProps) {
    const {
        recipe, ingredients, smartMatch,
        matchedIngredients, setMatchedIngredients, flippedCards, setFlippedCards,
        skippedIngredients, setSkippedIngredients, acceptedMatches, setAcceptedMatches,
        mappingStep, setMappingStep,
        stepTwoInputs, setStepTwoInputs, stepTwoSaved, setStepTwoSaved,
        usdaResults, setUsdaResults, usdaLoading, setUsdaLoading,
        usdaExpanded, setUsdaExpanded,
        smartMatchRunning, processAcceptIngredient,
        finalizeRecipeNutrition, setIngredients,
        deleteIngredient,
    } = ctx;

    if (!recipe) return null;

    return (
        <>
            {/* STEP 1: FOOD MATCH */}
            {mappingStep === 'FOOD_MATCH' && (
                <StepOneFoodMatch
                    ingredients={ingredients}
                    matchedIngredients={matchedIngredients}
                    setMatchedIngredients={setMatchedIngredients}
                    flippedCards={flippedCards}
                    setFlippedCards={setFlippedCards}
                    skippedIngredients={skippedIngredients}
                    setSkippedIngredients={setSkippedIngredients}
                    acceptedMatches={acceptedMatches}
                    setAcceptedMatches={setAcceptedMatches}
                    usdaResults={usdaResults}
                    setUsdaResults={setUsdaResults}
                    usdaLoading={usdaLoading}
                    setUsdaLoading={setUsdaLoading}
                    usdaExpanded={usdaExpanded}
                    setUsdaExpanded={setUsdaExpanded}
                    processAcceptIngredient={processAcceptIngredient}
                    deleteIngredient={deleteIngredient}
                />
            )}

            {/* STEP 2: PORTION MATCH */}
            {mappingStep === 'PORTION_MATCH' && (
                <StepTwoPortionMatch
                    recipe={recipe}
                    ingredients={ingredients}
                    matchedIngredients={matchedIngredients}
                    skippedIngredients={skippedIngredients}
                    stepTwoInputs={stepTwoInputs}
                    setStepTwoInputs={setStepTwoInputs}
                    stepTwoSaved={stepTwoSaved}
                    setStepTwoSaved={setStepTwoSaved}
                    setMappingStep={setMappingStep}
                    smartMatchRunning={smartMatchRunning}
                    finalizeRecipeNutrition={finalizeRecipeNutrition}
                    setIngredients={setIngredients}
                />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════
// Step 1: Food Match
// ═══════════════════════════════════════════════════════════════
function StepOneFoodMatch({
    ingredients, matchedIngredients, setMatchedIngredients,
    flippedCards, setFlippedCards,
    skippedIngredients, setSkippedIngredients,
    acceptedMatches, setAcceptedMatches,
    usdaResults, setUsdaResults, usdaLoading, setUsdaLoading,
    usdaExpanded, setUsdaExpanded,
    processAcceptIngredient,
    deleteIngredient,
}: {
    ingredients: Ingredient[];
    matchedIngredients: Record<string, any>;
    setMatchedIngredients: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    flippedCards: Record<string, boolean>;
    setFlippedCards: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    skippedIngredients: Record<string, boolean>;
    setSkippedIngredients: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    acceptedMatches: Record<string, boolean>;
    setAcceptedMatches: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    usdaResults: Record<string, any[]>;
    setUsdaResults: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    usdaLoading: Record<string, boolean>;
    setUsdaLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    usdaExpanded: Record<string, boolean>;
    setUsdaExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    processAcceptIngredient: (ing: Ingredient, matchedItem: any) => void;
    deleteIngredient: (id: string) => Promise<void>;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Layers size={14} /> Step 1: Ingredient Discovery
                </h4>
                {Object.keys(matchedIngredients).length > 0 && (
                    <button
                        onClick={() => {
                            let count = 0;
                            Object.keys(matchedIngredients).forEach(id => {
                                if (!acceptedMatches[id]) {
                                    const ing = ingredients.find(i => i.id === id);
                                    if (ing) { processAcceptIngredient(ing, matchedIngredients[id]); count++; }
                                }
                            });
                            if (count > 0) toast.success(`Processed ${count} ingredient matches`);
                        }}
                        className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Accept All
                    </button>
                )}
            </div>

            <div className="grid gap-3">
                {ingredients.map((ing) => (
                    <IngredientMatchCard
                        key={ing.id}
                        ing={ing}
                        matchedIngredients={matchedIngredients}
                        setMatchedIngredients={setMatchedIngredients}
                        flippedCards={flippedCards}
                        setFlippedCards={setFlippedCards}
                        skippedIngredients={skippedIngredients}
                        setSkippedIngredients={setSkippedIngredients}
                        acceptedMatches={acceptedMatches}
                        setAcceptedMatches={setAcceptedMatches}
                        usdaResults={usdaResults}
                        setUsdaResults={setUsdaResults}
                        usdaLoading={usdaLoading}
                        setUsdaLoading={setUsdaLoading}
                        usdaExpanded={usdaExpanded}
                        setUsdaExpanded={setUsdaExpanded}
                        processAcceptIngredient={processAcceptIngredient}
                        deleteIngredient={deleteIngredient}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Individual Ingredient Card (Step 1) ───────────────────────
function IngredientMatchCard({
    ing, matchedIngredients, setMatchedIngredients,
    flippedCards, setFlippedCards,
    skippedIngredients, setSkippedIngredients,
    acceptedMatches, setAcceptedMatches,
    usdaResults, setUsdaResults, usdaLoading, setUsdaLoading,
    usdaExpanded, setUsdaExpanded,
    processAcceptIngredient,
    deleteIngredient,
}: {
    ing: Ingredient;
    matchedIngredients: Record<string, any>;
    setMatchedIngredients: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    flippedCards: Record<string, boolean>;
    setFlippedCards: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    skippedIngredients: Record<string, boolean>;
    setSkippedIngredients: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    acceptedMatches: Record<string, boolean>;
    setAcceptedMatches: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    usdaResults: Record<string, any[]>;
    setUsdaResults: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    usdaLoading: Record<string, boolean>;
    setUsdaLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    usdaExpanded: Record<string, boolean>;
    setUsdaExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    processAcceptIngredient: (ing: Ingredient, matchedItem: any) => void;
    deleteIngredient: (id: string) => Promise<void>;
}) {
    const isMatched = !!matchedIngredients[ing.id];
    const isFlipped = !!flippedCards[ing.id];
    const isAccepted = !!acceptedMatches[ing.id];
    const isSkipped = !!skippedIngredients[ing.id];
    const isFlavoring = isFlavoringIngredient({ name: ing.base_ingredient || ing.item } as any);
    const isUsdaExpanded = !!usdaExpanded[ing.id];
    const isUsdaLoading = !!usdaLoading[ing.id];
    const ingUsdaResults = usdaResults[ing.id] || [];
    const [usdaQuery, setUsdaQuery] = React.useState('');

    const handleUsdaButtonClick = async () => {
        const term = extractCoreName(ing.base_ingredient || ing.item);
        setUsdaQuery(term);
        executeUsdaSearch(term);
    };

    const executeUsdaSearch = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) { toast.error('Search term is too short'); return; }
        setUsdaLoading(prev => ({ ...prev, [ing.id]: true }));
        setUsdaExpanded(prev => ({ ...prev, [ing.id]: true }));
        try {
            const results = await searchUSDAFood(searchTerm);
            setUsdaResults(prev => ({ ...prev, [ing.id]: results.slice(0, 5) }));
        } catch (err) {
            console.error('USDA search error:', err);
            toast.error('USDA search failed');
        } finally {
            setUsdaLoading(prev => ({ ...prev, [ing.id]: false }));
        }
    };

    const handleAcceptUsda = async (result: any) => {
        const toastId = toast.loading(`Importing ${result.name}...`);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            const details = await getUSDAFoodDetails(result.fdcId);
            const foodData = {
                name: result.name, common_name: result.common_name || null, source: 'usda', category: 'General',
                energy_kcal: result.energy_kcal || 0, energy_kj: result.energy_kj || Math.round((result.energy_kcal || 0) * 4.184),
                protein_g: result.protein_g || 0, carbs_g: result.carbs_g || 0, fat_g: result.fat_g || 0,
                micronutrients: details.micronutrients || result.micronutrients || {},
                portions: details.portions || [], user_id: userId, is_curated: false
            };

            let finalFood;
            const { data: existingFood } = await supabase.from('food_items').select('*').eq('name', result.name).single();
            if (existingFood) { finalFood = existingFood; }
            else {
                const { data: insertedFood, error } = await supabase.from('food_items').insert(foodData).select().single();
                if (error) {
                    if (error.code === '23505') {
                        const { data: fallbackFood } = await supabase.from('food_items').select('*').eq('name', result.name).single();
                        if (fallbackFood) finalFood = fallbackFood; else throw error;
                    } else throw error;
                } else finalFood = insertedFood;
            }

            setUsdaExpanded(prev => ({ ...prev, [ing.id]: false }));
            toast.success(`Imported & Matched: ${result.name}`, { id: toastId });
            processAcceptIngredient(ing, { ...finalFood, source: 'usda' });
        } catch (err: any) {
            console.error('Error importing USDA item:', err);
            toast.error(`Failed to import: ${err.message}`, { id: toastId });
        }
    };

    const handleDismissUsda = () => {
        setUsdaExpanded(prev => ({ ...prev, [ing.id]: false }));
        setUsdaResults(prev => { const u = { ...prev }; delete u[ing.id]; return u; });
    };

    return (
        <div className="w-full">
            {/* Flip Card */}
            <div className="relative h-[80px] w-full [perspective:1000px] group">
                <div className={cn("w-full h-full transition-all duration-500 [transform-style:preserve-3d]", isFlipped ? "[transform:rotateY(180deg)]" : "")}>
                    {/* Front */}
                    <div className={cn(
                        "absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl p-3 flex items-center justify-between border transition-colors",
                        isAccepted ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" :
                        isSkipped && isFlavoring ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
                        isSkipped && !isFlavoring ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800" :
                        isMatched && !isAccepted ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800" :
                        "bg-card border-border"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                isAccepted ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600" :
                                isSkipped && isFlavoring ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600" :
                                isSkipped && !isFlavoring ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600" :
                                "bg-muted text-muted-foreground"
                            )}>
                                {isSkipped && isFlavoring ? <Flame size={18} /> : isSkipped && !isFlavoring ? <X size={18} /> : isAccepted ? <Check size={18} /> : <UtensilsCrossed size={18} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-bold text-foreground capitalize truncate max-w-[120px]">
                                        {cleanIngredientDisplay(ing.base_ingredient || ing.item)}
                                    </p>
                                    {isFlavoring && (
                                        <span className="text-[8px] h-4 px-1.5 py-0 rounded-full border bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                                            Flavor
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {(ing.amount?.includes('0.25') && (ing.base_ingredient || ing.item)?.match(/^\d/)) ? '' : ing.amount} {ing.weight_g ? `(${ing.weight_g}g)` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isMatched && !isAccepted && (
                                <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({ ...prev, [ing.id]: true })); }}
                                    className="p-2 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full transition-colors" title="Review Match">
                                    <RefreshCw size={16} />
                                </button>
                            )}
                            {!isMatched && !isAccepted && !isSkipped && (
                                <button onClick={handleUsdaButtonClick} disabled={isUsdaLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-400/50 text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all disabled:opacity-50" title="Search USDA Database">
                                    {isUsdaLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                    USDA
                                </button>
                            )}
                            {isSkipped && (
                                <button onClick={() => setSkippedIngredients(prev => { const u = { ...prev }; delete u[ing.id]; return u; })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Restore">
                                    <RotateCcw size={12} />
                                    RESTORE
                                </button>
                            )}
                            {!isAccepted && (
                                <button onClick={() => { if(confirm('Delete this ingredient?')) deleteIngredient(ing.id); }}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors" title="Delete Ingredient">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl p-3 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between shadow-sm shadow-indigo-100 dark:shadow-none">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                <Activity size={18} className="text-indigo-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300 truncate max-w-[150px]">
                                        {matchedIngredients[ing.id]?.name || 'Match'}
                                    </p>
                                    <span className={cn(
                                        "text-[8px] h-4 px-1 py-0 rounded border",
                                        matchedIngredients[ing.id]?.source === 'usda'
                                            ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                                            : "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400"
                                    )}>
                                        {matchedIngredients[ing.id]?.source === 'usda' ? 'USDA' : 'LOCAL DB'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-0.5 max-w-[180px] truncate">
                                    Match for: &quot;{ing.base_ingredient || ing.item}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({ ...prev, [ing.id]: false })); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 text-slate-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all" title="Review original">
                                <RefreshCw size={14} />
                            </button>
                            <button onClick={() => processAcceptIngredient(ing, matchedIngredients[ing.id])}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all" title="Accept match">
                                <Check size={14} />
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                setMatchedIngredients(prev => { const u = { ...prev }; delete u[ing.id]; return u; });
                                setFlippedCards(prev => { const u = { ...prev }; delete u[ing.id]; return u; });
                                setAcceptedMatches(prev => { const u = { ...prev }; delete u[ing.id]; return u; });
                                toast.success('Match rejected');
                            }}
                                className="w-8 h-8 flex items-center justify-center rounded-full border border-rose-300 dark:border-rose-700 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all" title="Reject match">
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* USDA Search Results */}
            {isUsdaExpanded && (
                <div className="mt-1 ml-4 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                            <Search size={10} /> USDA Results
                        </p>
                        <button onClick={handleDismissUsda} className="w-6 h-6 flex items-center justify-center rounded-full border border-rose-300 dark:border-rose-700 text-rose-400 hover:bg-rose-500 hover:text-white transition-all" title="Dismiss">
                            <X size={11} />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-2 px-1">
                        <div className="relative flex-1 group">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                value={usdaQuery}
                                onChange={(e) => setUsdaQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') executeUsdaSearch(usdaQuery);
                                }}
                                placeholder="Refine search term..."
                                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-[11px] placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => executeUsdaSearch(usdaQuery)}
                            disabled={isUsdaLoading}
                            className="h-8 px-4 bg-amber-500 hover:bg-amber-600 text-white text-[10px] uppercase font-bold tracking-widest rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                            {isUsdaLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                            Search
                        </button>
                    </div>

                    {isUsdaLoading ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <Loader2 size={14} className="animate-spin text-amber-500" />
                            <span className="text-xs text-slate-500">Searching USDA database...</span>
                        </div>
                    ) : ingUsdaResults.length === 0 ? (
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500">No results found in USDA database.</p>
                        </div>
                    ) : (
                        ingUsdaResults.map((result, idx) => (
                            <div key={result.fdcId || idx}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{result.name}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">
                                        {result.energy_kcal}kcal · P:{result.protein_g}g · C:{result.carbs_g}g · F:{result.fat_g}g
                                    </p>
                                </div>
                                <button onClick={() => handleAcceptUsda(result)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 text-slate-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all shrink-0" title="Accept">
                                    <Check size={13} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// Step 2: Portion Match
// ═══════════════════════════════════════════════════════════════
function StepTwoPortionMatch({
    recipe, ingredients, matchedIngredients, skippedIngredients,
    stepTwoInputs, setStepTwoInputs, stepTwoSaved, setStepTwoSaved,
    setMappingStep, smartMatchRunning, finalizeRecipeNutrition, setIngredients,
}: {
    recipe: any;
    ingredients: Ingredient[];
    matchedIngredients: Record<string, any>;
    skippedIngredients: Record<string, boolean>;
    stepTwoInputs: Record<string, { multiplier: string; measure: string; isSaving?: boolean }>;
    setStepTwoInputs: React.Dispatch<React.SetStateAction<Record<string, { multiplier: string; measure: string; isSaving?: boolean }>>>;
    stepTwoSaved: Record<string, boolean>;
    setStepTwoSaved: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setMappingStep: React.Dispatch<React.SetStateAction<'FOOD_MATCH' | 'PORTION_MATCH'>>;
    smartMatchRunning: boolean;
    finalizeRecipeNutrition: () => Promise<void>;
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}) {
    return (
        <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
                    <Layers size={14} /> Step 2: Portion & Nutrition Verification
                </h3>
                <button onClick={() => setMappingStep('FOOD_MATCH')}
                    className="text-[10px] uppercase font-bold text-muted-foreground hover:text-indigo-600 hover:underline flex items-center gap-1">
                    <ArrowLeft size={10} /> Back to Food Matches
                </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
                Review the automatically mapped portions. If a portion couldn&apos;t be accurately identified, select the relevant unit below.
            </p>

            {Object.keys(skippedIngredients).length > 0 && (
                <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/50 flex items-start gap-3">
                    <X size={16} className="flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold text-rose-900 dark:text-rose-200 mb-1">Skipped Ingredients</p>
                        <p className="text-rose-700 dark:text-rose-300 text-xs">
                            The following {Object.keys(skippedIngredients).length} ingredient{Object.keys(skippedIngredients).length !== 1 ? 's' : ''} will be excluded:
                        </p>
                        <div className="mt-2 space-y-1">
                            {ingredients.filter(ing => skippedIngredients[ing.id]).map(ing => (
                                <p key={ing.id} className="text-xs text-rose-700 dark:text-rose-300">
                                    • {cleanIngredientDisplay(ing.base_ingredient || ing.item)} ({ing.amount})
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {ingredients.filter(ing => !skippedIngredients[ing.id]).map((ing) => (
                    <PortionRow
                        key={ing.id}
                        ing={ing}
                        recipe={recipe}
                        matchedIngredients={matchedIngredients}
                        stepTwoInputs={stepTwoInputs}
                        setStepTwoInputs={setStepTwoInputs}
                        stepTwoSaved={stepTwoSaved}
                        setStepTwoSaved={setStepTwoSaved}
                        setIngredients={setIngredients}
                    />
                ))}
            </div>

            {/* Finalize */}
            {ingredients.every(ing => stepTwoSaved[ing.id] || skippedIngredients[ing.id]) && (
                <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Sparkles size={24} className="fill-current" />
                    </div>
                    <div className="text-center">
                        <h4 className="font-bold text-slate-900 dark:text-white">Analysis Complete!</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">All ingredients matched and verified. Ready to calculate final nutritional profile.</p>
                    </div>
                    <button onClick={finalizeRecipeNutrition} disabled={smartMatchRunning}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95">
                        {smartMatchRunning ? (<><Loader2 size={18} className="animate-spin" /> Finalizing Analysis...</>) : (<><Sparkles size={18} /> Finish Analysis & Calculate Nutrition</>)}
                    </button>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Saves to recipe and updates nutrition grid</p>
                </div>
            )}
        </div>
    );
}

// ── Individual Portion Row (Step 2) ───────────────────────────
function PortionRow({
    ing, recipe, matchedIngredients,
    stepTwoInputs, setStepTwoInputs, stepTwoSaved, setStepTwoSaved, setIngredients,
}: {
    ing: Ingredient;
    recipe: any;
    matchedIngredients: Record<string, any>;
    stepTwoInputs: Record<string, { multiplier: string; measure: string; isSaving?: boolean }>;
    setStepTwoInputs: React.Dispatch<React.SetStateAction<Record<string, { multiplier: string; measure: string; isSaving?: boolean }>>>;
    stepTwoSaved: Record<string, boolean>;
    setStepTwoSaved: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}) {
    const [showCustomInput, setShowCustomInput] = React.useState(false);
    const [customLabel, setCustomLabel] = React.useState('');
    const [customWeightG, setCustomWeightG] = React.useState('');
    const [savingCustomMeasure, setSavingCustomMeasure] = React.useState(false);
    const [autoMatchedConfidence, setAutoMatchedConfidence] = React.useState<number | null>(null);
    const [hasAutoMatched, setHasAutoMatched] = React.useState(false);

    const originalDetails = parseRecipeAmount(ing.amount, ing.item);
    const dbItem = matchedIngredients[ing.id];
    const isAccepted = !!stepTwoSaved[ing.id];

    // Ensure multiplier always has a value (original quantity)
    const baseInputs = stepTwoInputs[ing.id];
    const inputs = {
        multiplier: baseInputs?.multiplier || String(Math.round(originalDetails.quantity * 100) / 100),
        measure: baseInputs?.measure || '',
        isSaving: baseInputs?.isSaving || false
    };

    // Auto-match measure on mount
    React.useEffect(() => {
        if (!hasAutoMatched && dbItem?.portions && dbItem.portions.length > 0 && !inputs.measure) {
            const bestMatch = findBestMeasureMatch(
                originalDetails.measure_label,
                originalDetails.quantity,
                dbItem.portions
            );
            
            if (bestMatch) {
                // Auto-select the best match
                setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...inputs, measure: String(bestMatch.weight_g) } }));
                setAutoMatchedConfidence(bestMatch.confidence);
                toast.success(`✓ Auto-matched: ${bestMatch.label}`, { duration: 2000 });
            }
            
            setHasAutoMatched(true);
        }
    }, [dbItem?.portions, hasAutoMatched, inputs.measure, ing.id]);

    const liveUnitWeight = !isNaN(Number(inputs.measure)) ? Number(inputs.measure) : 0;
    const liveTotalWeight = inputs.measure ? Math.round(Number(inputs.multiplier) * liveUnitWeight * 10) / 10 : 0;

    const isOutlier = inputs.measure && (
        (dbItem?.micronutrients?.Iron || dbItem?.micronutrients?.['Iron, Fe'] || 0) * (liveTotalWeight / 100) > 50 ||
        (dbItem?.micronutrients?.Calcium || 0) * (liveTotalWeight / 100) > 1000 ||
        (dbItem?.energy_kcal || 0) * (liveTotalWeight / 100) > 2000
    );

    const handleSaveCustomMeasure = async () => {
        if (!customLabel.trim() || !customWeightG || isNaN(Number(customWeightG))) {
            toast.error('Please enter a label and valid weight in grams');
            return;
        }

        setSavingCustomMeasure(true);
        try {
            const { error } = await supabase
                .from('food_measures')
                .insert({
                    food_item_id: dbItem.id,
                    label: customLabel.trim(),
                    weight_g: parseFloat(customWeightG)
                });

            if (error) throw error;

            setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...inputs, measure: customWeightG } }));
            setShowCustomInput(false);
            setCustomLabel('');
            setCustomWeightG('');
            toast.success(`Added measure: ${customLabel}`);
        } catch (err: any) {
            console.error('Error saving custom measure:', err);
            toast.error(err.message || 'Failed to save measure');
        } finally {
            setSavingCustomMeasure(false);
        }
    };

    const handleSaveStepTwo = async () => {
        if (!inputs.multiplier || isNaN(Number(inputs.multiplier))) {
            toast.error('Please enter a valid quantity');
            return;
        }
        if (!inputs.measure) {
            toast.error('Please select or create a measure');
            return;
        }

        setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...prev[ing.id], isSaving: true } }));
        try {
            const unitWeight = Number(inputs.measure);
            const totalWeight = Math.round(Number(inputs.multiplier) * unitWeight * 10) / 10;

            const { error: ingError } = await supabase
                .from('ingredients')
                .update({ food_item_id: dbItem.id, weight_g: totalWeight })
                .eq('id', ing.id);

            if (ingError) throw ingError;

            setIngredients(prev => prev.map(p => p.id === ing.id ? { ...p, weight_g: totalWeight, food_item_id: dbItem.id } : p));
            setStepTwoSaved(prev => ({ ...prev, [ing.id]: true }));
            toast.success('Saved!');
        } catch (err: any) {
            console.error('Save step two error:', err);
            toast.error(err.message || 'Failed to save mapping');
        } finally {
            setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...prev[ing.id], isSaving: false } }));
        }
    };

    return (
        <div className={cn(
            "relative rounded-lg border p-[10px] shadow-sm flex flex-col gap-2 transition-all",
            isAccepted ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-card border-border shadow-none"
        )}>
            {/* Original Text */}
            <div className={cn(
                "rounded p-2 px-3 text-xs border flex items-center gap-3",
                isAccepted ? "bg-emerald-100/50 dark:bg-emerald-800/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" : "bg-muted text-muted-foreground border-border/50"
            )}>
                <span className="font-semibold uppercase tracking-widest text-[9px] opacity-70">Original</span>
                <span className="italic">&quot;{ing.amount} {ing.item}&quot;</span>
            </div>

            {/* Edit Form */}
            <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                <div>
                    <label className={cn("text-[9px] uppercase font-bold mb-1 block", isAccepted ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground")}>Qty</label>
                    <input
                        type="number" value={inputs.multiplier} step="0.01" disabled={isAccepted}
                        onChange={e => setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...inputs, multiplier: e.target.value } }))}
                        className={cn("w-full h-8 rounded px-2 text-xs font-bold focus:outline-none focus:ring-1",
                            isAccepted ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 focus:ring-emerald-500"
                                : "bg-muted border border-border text-foreground focus:ring-indigo-500"
                        )}
                    />
                </div>
                <div>
                    <label className={cn("text-[9px] uppercase font-bold mb-1 flex items-center gap-2", isAccepted ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground")}>
                        Unit Type (from DB)
                        {autoMatchedConfidence && autoMatchedConfidence >= 50 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <Zap size={8} className="fill-emerald-700 dark:fill-emerald-400" />
                                Auto ({Math.round(autoMatchedConfidence)}%)
                            </span>
                        )}
                    </label>
                    {showCustomInput ? (
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Label (e.g., 'serving')"
                                value={customLabel}
                                onChange={e => setCustomLabel(e.target.value)}
                                className="w-full h-8 rounded px-2 text-xs bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                placeholder="Weight in grams"
                                value={customWeightG}
                                onChange={e => setCustomWeightG(e.target.value)}
                                step="0.1"
                                className="w-full h-8 rounded px-2 text-xs bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={handleSaveCustomMeasure}
                                    disabled={savingCustomMeasure}
                                    className="flex-1 h-7 rounded text-[9px] font-bold transition-colors bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    {savingCustomMeasure ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomLabel('');
                                        setCustomWeightG('');
                                    }}
                                    className="flex-1 h-7 rounded text-[9px] font-bold transition-colors bg-muted hover:bg-muted/80 border border-border text-muted-foreground"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <select value={inputs.measure} disabled={isAccepted}
                            onChange={e => setStepTwoInputs(prev => ({ ...prev, [ing.id]: { ...inputs, measure: e.target.value } }))}
                            className={cn("w-full h-8 rounded px-2 text-xs focus:outline-none cursor-pointer",
                                isAccepted ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                                    : inputs.measure && autoMatchedConfidence
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                                    : "bg-muted border border-border text-foreground"
                            )}>
                            <option value="">-- Select measure --</option>
                            {dbItem?.portions && dbItem.portions.length > 0 ? (
                                dbItem.portions.map((p: any, idx: number) => (
                                    <option key={idx} value={p.weight_g}>{p.label} ({p.weight_g}g)</option>
                                ))
                            ) : (
                                <option disabled>No measures available</option>
                            )}
                            <option disabled>---</option>
                            <option value="__custom__">+ Create custom measure</option>
                        </select>
                    )}
                    {!showCustomInput && inputs.measure === '__custom__' && (
                        <button
                            onClick={() => setShowCustomInput(true)}
                            className="mt-1 w-full h-7 rounded text-[9px] font-bold text-indigo-600 hover:bg-muted transition-colors border border-border"
                        >
                            Enter custom measure
                        </button>
                    )}
                </div>
                <div className="pl-2 border-l border-border flex flex-col justify-end items-center gap-1">
                    <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-in fade-in zoom-in duration-300",
                        isOutlier ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" : "bg-muted text-muted-foreground"
                    )}>
                        {isOutlier && <AlertTriangle size={10} />}
                        {liveTotalWeight}g
                    </div>
                    {isOutlier && !isAccepted && <div className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">High density!</div>}
                    <button
                        onClick={isAccepted ? () => setStepTwoSaved(prev => ({ ...prev, [ing.id]: false })) : handleSaveStepTwo}
                        disabled={inputs.isSaving}
                        className={cn(
                            "h-8 px-5 rounded text-[10px] font-bold transition-colors flex items-center justify-center min-w-[80px] gap-1.5 group",
                            isAccepted
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                                : "bg-muted hover:bg-muted/80 border border-border text-indigo-600 shadow-sm"
                        )}
                    >
                        {inputs.isSaving ? <Loader2 size={12} className="animate-spin" /> : isAccepted ? (
                            <>
                                <Check size={12} className="group-hover:hidden" />
                                <span className="group-hover:hidden whitespace-nowrap text-[8px]">Verified</span>
                                <RefreshCw size={12} className="hidden group-hover:block" />
                                <span className="hidden group-hover:block whitespace-nowrap text-[8px]">Edit</span>
                            </>
                        ) : "Accept"}
                    </button>
                </div>
            </div>
        </div>
    );
}
