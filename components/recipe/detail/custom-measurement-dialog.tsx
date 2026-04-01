'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ChevronRight, ChevronLeft, Scale, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { parseRecipeAmount } from '@/lib/utils/parsing-utils';

interface UnmappedIngredient {
    id: string;
    item: string;
    amount: string;
    food_item_id: string;
}

interface CustomMeasurementDialogProps {
    unmappedIngredients: UnmappedIngredient[];
    onComplete: () => void;
    isOpen: boolean;
}

export function CustomMeasurementDialog({
    unmappedIngredients,
    onComplete,
    isOpen
}: CustomMeasurementDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [weightsGrams, setWeightsGrams] = useState<Record<string, string>>({});
    const [savingIndex, setSavingIndex] = useState<number | null>(null);
    const [skipped, setSkipped] = useState<Set<string>>(new Set());

    if (!isOpen || unmappedIngredients.length === 0) return null;

    const current = unmappedIngredients[currentIndex];
    const weight = weightsGrams[current.id] || '';
    const isSkipped = skipped.has(current.id);

    // Parse the recipe amount to extract measure unit (e.g., "4 tbsp" → "tbsp")
    const originalDetails = parseRecipeAmount(current.amount, current.item);
    const measureUnit = originalDetails.measure_label || current.amount;

    const handleSaveMeasurement = async () => {
        if (!weight || isNaN(Number(weight))) {
            toast.error('Please enter a valid weight in grams');
            return;
        }

        setSavingIndex(currentIndex);
        try {
            // Generate label from measure unit (e.g., "tbsp" instead of "4 tbsp")
            // This way "4 tbsp" and "5 tbsp" both use the same "tbsp" measure
            const label = `${measureUnit}`;

            const { error } = await supabase
                .from('food_measures')
                .insert({
                    food_item_id: current.food_item_id,
                    label: label.trim(),
                    weight_g: parseFloat(weight)
                });

            if (error) throw error;

            toast.success(`✓ Saved: 1 ${measureUnit} = ${weight}g`);
            moveToNext();
        } catch (err: any) {
            console.error('Error saving measurement:', err);
            toast.error(err.message || 'Failed to save measurement');
        } finally {
            setSavingIndex(null);
        }
    };

    const handleSkip = () => {
        setSkipped(prev => new Set(prev).add(current.id));
        toast.info(`Skipped "${current.item}"`);
        moveToNext();
    };

    const moveToNext = () => {
        if (currentIndex < unmappedIngredients.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete();
        }
    };

    const moveToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in scale-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Scale size={20} className="text-white" />
                        <h2 className="text-lg font-bold text-white">Measure Portion</h2>
                    </div>
                    <p className="text-indigo-100 text-sm">
                        Step {currentIndex + 1} of {unmappedIngredients.length}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            Please measure <span className="font-bold">1 {measureUnit}</span> of{' '}
                            <span className="font-bold">{current.item}</span> on a scale and enter the weight below.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                            The recipe calls for {current.amount}, but we're measuring 1 unit so it can be reused for future recipes.
                        </p>
                    </div>

                    {/* Original Amount Display */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-700 flex items-center justify-center flex-shrink-0">
                            <Scale size={18} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">Measure</p>
                            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                                1 {measureUnit} of {current.item}
                            </p>
                        </div>
                    </div>

                    {/* Weight Input */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 block mb-2">
                            Weight in Grams
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="e.g., 120"
                                value={weight}
                                onChange={e => setWeightsGrams(prev => ({ ...prev, [current.id]: e.target.value }))}
                                step="0.1"
                                min="0"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold">
                                g
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{
                                width: `${((currentIndex + 1) / unmappedIngredients.length) * 100}%`
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    {/* Previous Button */}
                    <button
                        onClick={moveToPrevious}
                        disabled={currentIndex === 0}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={14} /> Prev
                    </button>

                    {/* Skip Button */}
                    <button
                        onClick={handleSkip}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                        Skip
                    </button>

                    {/* Save/Next Button */}
                    <button
                        onClick={handleSaveMeasurement}
                        disabled={!weight || isNaN(Number(weight)) || savingIndex === currentIndex}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {savingIndex === currentIndex ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Saving...
                            </>
                        ) : currentIndex === unmappedIngredients.length - 1 ? (
                            <>
                                <Check size={14} />
                                Done
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight size={14} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
