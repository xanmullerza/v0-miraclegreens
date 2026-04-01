'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, Check, RefreshCw, ArrowLeft, Sparkles, Plus, Zap } from 'lucide-react';
import { parseRecipeAmount, cleanIngredientDisplay } from '@/lib/utils/parsing-utils';
import { findBestMeasureMatch } from '@/lib/utils/measure-matcher';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CustomMeasurementDialog } from './custom-measurement-dialog';
import type { SmartMatchPortionState } from '@/lib/context/action-panel-context';

interface PortionMatchPanelProps {
    state: SmartMatchPortionState;
    onBack: () => void;
    onFinalize?: () => Promise<void>;
    finalizeLoading?: boolean;
}

export function PortionMatchPanel({ 
    state, 
    onBack,
    onFinalize,
    finalizeLoading = false
}: PortionMatchPanelProps) {
    const {
        ingredients, matchedIngredients, skippedIngredients,
        stepTwoInputs, stepTwoSaved, recipe,
        onInputChange, onSave, onFinalize: stateFinalize
    } = state;

    const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);
    const [unmappedIngredients, setUnmappedIngredients] = useState<any[]>([]);

    const nonSkippedIngredients = ingredients.filter(ing => !skippedIngredients[ing.id]);
    const allVerified = ingredients.every(ing => stepTwoSaved[ing.id] || skippedIngredients[ing.id]);

    // Use finalize callback from state if provided as prop
    const finalizeHandler = onFinalize || stateFinalize;

    // Find ingredients without measures and show measurement dialog
    const handleShowMeasurementDialog = () => {
        const unmapped = nonSkippedIngredients.filter(ing => {
            const inputs = stepTwoInputs[ing.id];
            return !inputs || !inputs.measure; // No measure selected
        }).map(ing => ({
            id: ing.id,
            item: ing.item,
            amount: ing.amount,
            food_item_id: matchedIngredients[ing.id]?.id
        }));

        if (unmapped.length === 0) {
            // All have measures, proceed to finalize
            finalizeHandler?.();
        } else {
            setUnmappedIngredients(unmapped);
            setShowMeasurementDialog(true);
        }
    };

    const handleMeasurementDialogComplete = () => {
        setShowMeasurementDialog(false);
        setUnmappedIngredients([]);
        // Proceed to finalize
        finalizeHandler?.();
    };

    return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            <div className="space-y-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 -mx-4 px-4 py-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        ⚖️ Step 2: Portion Verification
                    </h3>
                    <button
                        onClick={onBack}
                        className="text-[10px] uppercase font-bold text-muted-foreground hover:text-indigo-600 hover:underline flex items-center gap-1"
                    >
                        <ArrowLeft size={10} /> Back
                    </button>
                </div>

                <p className="text-sm text-muted-foreground px-1">
                    Review the automatically mapped portions. If a portion couldn't be accurately identified, select the relevant unit below.
                </p>

                {/* Skipped Ingredients Warning */}
                {Object.keys(skippedIngredients).length > 0 && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800/50 flex items-start gap-3">
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

                {/* Portion Cards */}
                <div className="space-y-3">
                    {nonSkippedIngredients.map((ing, idx) => (
                        <PortionCard
                            key={ing.id}
                            ing={ing}
                            recipe={recipe}
                            matchedIngredients={matchedIngredients}
                            stepTwoInputs={stepTwoInputs}
                            stepTwoSaved={stepTwoSaved}
                            onInputChange={onInputChange}
                            onSave={() => onSave(ing.id)}
                            isLast={idx === nonSkippedIngredients.length - 1}
                        />
                    ))}
                </div>

                {/* Finalize Section */}
                {allVerified && finalizeHandler && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col items-center gap-3 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Sparkles size={20} className="fill-current" />
                        </div>
                        <div className="text-center">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">All Complete!</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Ready to finalize nutrition calculations.</p>
                        </div>
                        <button
                            onClick={handleShowMeasurementDialog}
                            disabled={finalizeLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            {finalizeLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Finalizing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Finish & Calculate Nutrition
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Custom Measurement Dialog */}
                <CustomMeasurementDialog
                    unmappedIngredients={unmappedIngredients}
                    onComplete={handleMeasurementDialogComplete}
                    isOpen={showMeasurementDialog}
                />
            </div>
        </div>
    );
}

interface PortionCardProps {
    ing: any;
    recipe: any;
    matchedIngredients: Record<string, any>;
    stepTwoInputs: Record<string, { multiplier: string; measure: string; isSaving?: boolean }>;
    stepTwoSaved: Record<string, boolean>;
    onInputChange: (ingId: string, field: 'multiplier' | 'measure', value: string) => void;
    onSave: () => Promise<void>;
    isLast?: boolean;
}

function PortionCard({
    ing, recipe, matchedIngredients,
    stepTwoInputs, stepTwoSaved,
    onInputChange, onSave, isLast
}: PortionCardProps) {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customLabel, setCustomLabel] = useState('');
    const [customWeightG, setCustomWeightG] = useState('');
    const [savingCustomMeasure, setSavingCustomMeasure] = useState(false);
    const [autoMatchedConfidence, setAutoMatchedConfidence] = useState<number | null>(null);
    const [hasAutoMatched, setHasAutoMatched] = useState(false);

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
    useEffect(() => {
        if (!hasAutoMatched && dbItem?.portions && dbItem.portions.length > 0 && !inputs.measure) {
            const bestMatch = findBestMeasureMatch(
                originalDetails.measure_label,
                originalDetails.quantity,
                dbItem.portions
            );
            
            if (bestMatch) {
                // Auto-select the best match
                onInputChange(ing.id, 'measure', String(bestMatch.weight_g));
                setAutoMatchedConfidence(bestMatch.confidence);
                toast.success(`✓ Auto-matched: ${bestMatch.label}`, { duration: 2000 });
            }
            
            setHasAutoMatched(true);
        }
    }, [dbItem?.portions, hasAutoMatched, inputs.measure, ing.id]);

    let liveUnitWeight = 0;
    if (!isNaN(Number(inputs.measure))) {
        liveUnitWeight = Number(inputs.measure);
    }

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

            // Update the measure selection
            onInputChange(ing.id, 'measure', customWeightG);
            
            // Reset form
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

    const handleSave = async () => {
        if (!inputs.multiplier || isNaN(Number(inputs.multiplier))) {
            toast.error('Please enter a valid quantity');
            return;
        }
        if (!inputs.measure) {
            toast.error('Please select or create a measure');
            return;
        }
        await onSave();
    };

    return (
        <div className={cn(
            "rounded-lg border p-3 shadow-sm flex flex-col gap-2 transition-all",
            isAccepted
                ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        )}>
            {/* Original Text */}
            <div className={cn(
                "rounded p-2 text-xs border flex items-center gap-2",
                isAccepted
                    ? "bg-emerald-100/50 dark:bg-emerald-800/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            )}>
                <span className="font-semibold uppercase tracking-widest text-[9px] opacity-70">Original</span>
                <span className="italic text-xs">&quot;{ing.amount} {ing.item}&quot;</span>
            </div>

            {/* Edit Form */}
            <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-end">
                <div>
                    <label className={cn(
                        "text-[9px] uppercase font-bold mb-1 block",
                        isAccepted ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400"
                    )}>Qty</label>
                    <input
                        type="number"
                        value={inputs.multiplier}
                        step="0.01"
                        disabled={isAccepted}
                        onChange={e => onInputChange(ing.id, 'multiplier', e.target.value)}
                        className={cn(
                            "w-full h-8 rounded px-2 text-xs font-bold focus:outline-none focus:ring-1 transition-colors",
                            isAccepted
                                ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 focus:ring-emerald-500 cursor-not-allowed"
                                : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-indigo-500"
                        )}
                    />
                </div>
                <div>
                    <label className={cn(
                        "text-[9px] uppercase font-bold mb-1 flex items-center gap-2",
                        isAccepted ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400"
                    )}>
                        Unit Type (from database)
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
                                placeholder="Label (e.g., 'serving', 'cup')"
                                value={customLabel}
                                onChange={e => setCustomLabel(e.target.value)}
                                className="w-full h-8 rounded px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                type="number"
                                placeholder="Weight in grams"
                                value={customWeightG}
                                onChange={e => setCustomWeightG(e.target.value)}
                                step="0.1"
                                className="w-full h-8 rounded px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={handleSaveCustomMeasure}
                                    disabled={savingCustomMeasure}
                                    className="flex-1 h-7 rounded text-[9px] font-bold transition-colors bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center justify-center gap-1"
                                >
                                    {savingCustomMeasure ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomLabel('');
                                        setCustomWeightG('');
                                    }}
                                    className="flex-1 h-7 rounded text-[9px] font-bold transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <select
                            value={inputs.measure}
                            disabled={isAccepted}
                            onChange={e => onInputChange(ing.id, 'measure', e.target.value)}
                            className={cn(
                                "w-full h-8 rounded px-2 text-xs focus:outline-none cursor-pointer transition-colors",
                                isAccepted
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 cursor-not-allowed"
                                    : inputs.measure && autoMatchedConfidence
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                                    : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-indigo-500"
                            )}
                        >
                            <option value="">-- Select a measure --</option>
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
                            className="mt-1 w-full h-7 rounded text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                            Enter custom measure
                        </button>
                    )}
                </div>
                <div className="pl-2 border-l border-slate-200 dark:border-slate-700 flex flex-col justify-end items-center gap-1">
                    <div className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-in fade-in zoom-in duration-300",
                        isOutlier
                            ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}>
                        {isOutlier && <AlertTriangle size={10} />}
                        {liveTotalWeight}g
                    </div>
                    {isOutlier && !isAccepted && (
                        <div className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">High!</div>
                    )}
                    <button
                        onClick={isAccepted ? () => {} : handleSave}
                        disabled={inputs.isSaving || isAccepted}
                        className={cn(
                            "h-8 px-4 rounded text-[10px] font-bold transition-colors flex items-center justify-center min-w-fit gap-1 group",
                            isAccepted
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 cursor-not-allowed"
                                : "bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 shadow-sm"
                        )}
                    >
                        {inputs.isSaving ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : isAccepted ? (
                            <>
                                <Check size={12} />
                                <span className="text-[9px]">Done</span>
                            </>
                        ) : (
                            "Save"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
