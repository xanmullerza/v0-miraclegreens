import React, { useState, useEffect } from 'react';
import { X, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { useFoodNutrition } from '@/hooks/use-food-nutrition';
import { NutritionDisplay } from '@/components/nutrients/NutritionDisplay';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { CompareView } from '@/components/admin/ingredients/compare-view';

export function FoodNutrition({ ctx }: { ctx: FoodDetailContextType }) {
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);
    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);
    const [showComparator, setShowComparator] = useState(false);
    const { 
        food, amount, selectedPortion, energyUnit, userRDAs, nutrientDisplayMode,
        breakdownNutrient, setBreakdownNutrient
    } = ctx;

    // Sync macroGrams with the shared Library portion context
    const { portionGrams, setPortionGrams } = useFoodFilter();

    // Use nutrition hook for all calculations
    const { macroGrams, setMacroGrams, nutrition } = useFoodNutrition({
        food,
        selectedPortion,
        amount,
        energyUnit,
        userRDAs,
        nutrientDisplayMode,
        initialGrams: portionGrams,
    });

    // Sync back to context when user edits the input in detail view
    useEffect(() => {
        if (macroGrams !== portionGrams) {
            setPortionGrams(macroGrams);
        }
    }, [macroGrams]);

    if (!food) return null;

    // Phytonutrients component
    const Phytonutrients = () => {
        if (!food?.phytonutrients || Object.keys(food.phytonutrients).length === 0) {
            return null;
        }

        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                <div className="mb-4">
                    <div className="text-[11px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Phytonutrients</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Plant compounds • Click a tag to learn more</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(food.phytonutrients).map(([name, data]) => {
                        const isExpanded = expandedPhyto === name;
                        const description = typeof data === 'object' ? (data as any).description : String(data);
                        const sources = typeof data === 'object' ? (data as any).sources || [] : [];

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
                                                    {sources.map((source: string) => (
                                                        <span key={source} className="inline-block text-[8px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-300/30 dark:border-green-600/40">
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-[7px] font-black">•</span>
                                        <span className="text-[10px]">{name}</span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Control Buttons - Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
                {/* Adjust Portion */}
                <div className="p-6 pt-5 rounded-3xl border bg-gradient-to-br bg-slate-900 border-slate-800">
                    <div className="flex flex-col gap-4">
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-orange-400">
                            Adjust Portion
                        </h4>
                        <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-2 border border-slate-600 hover:border-orange-400/50 transition-colors cursor-pointer group" title="Click to adjust portion size">
                            <input
                                type="number"
                                min="1"
                                max="9999"
                                value={macroGrams}
                                onChange={(e) => setMacroGrams(Math.max(1, parseInt(e.target.value) || 100))}
                                className="w-full bg-slate-800 text-white text-center text-sm font-bold rounded px-2 py-1 border border-slate-600 focus:outline-none focus:border-orange-400 group-hover:border-orange-400/50 transition-colors cursor-pointer"
                                title="Edit portion size (1-9999g)"
                                aria-label="Portion size in grams"
                            />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-400/60 transition-colors whitespace-nowrap">g</span>
                        </div>
                    </div>
                </div>

                {/* Compare Nutrition */}
                <button
                    onClick={() => setShowComparator(!showComparator)}
                    className="p-6 pt-5 rounded-3xl border bg-gradient-to-br bg-slate-900 border-slate-800 hover:border-cyan-400/50 transition-colors flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="flex items-center gap-2">
                        <Scale size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            Compare
                        </h4>
                    </div>
                    <span className="text-[8px] text-slate-400 group-hover:text-slate-300 transition-colors">Nutrition</span>
                </button>
            </div>

            {/* Comparator View */}
            {showComparator && food && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black uppercase tracking-widest text-[12px] text-cyan-400">
                            Compare Nutrition
                        </h4>
                        <button
                            onClick={() => setShowComparator(false)}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <CompareView 
                        stats={{
                            foods: 1,
                            recipes: 0,
                            nutrients: 35,
                            mixes: 0
                        }} 
                        showStats={false}
                        initialFood={food as any}
                    />
                </div>
            )}

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

            <Phytonutrients />

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && food.micronutrients && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setBreakdownNutrient(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBreakdownNutrient(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>

                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-900 dark:text-white">
                            {breakdownNutrient} Breakdown
                        </h3>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Detailed breakdown data not available.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
