'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';
import { usePlannerNutrition } from '@/hooks/use-planner-nutrition';
import { NutritionDisplay } from '@/components/nutrients/NutritionDisplay';

interface DailyNutritionProps {
    plan: any;
    userRDAs: Record<string, number>;
    profile?: any;
    energyUnit?: string;
    nutrientDisplayMode?: 'value' | 'percentage' | 'both';
    selectedServings?: number;
}

export function DailyNutrition({
    plan,
    userRDAs,
    profile,
    energyUnit = 'kJ',
    nutrientDisplayMode = 'both',
    selectedServings = 1,
}: DailyNutritionProps) {
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);
    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);

    if (!plan || !userRDAs) return null;

    // Use planner nutrition hook for all calculations
    const nutrition = usePlannerNutrition({
        plan,
        energyUnit,
        userRDAs,
        nutrientDisplayMode,
        selectedServings,
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Nutrition Display Component */}
            <NutritionDisplay
                nutrition={nutrition}
                energyUnit={energyUnit}
                nutrientDisplayMode={nutrientDisplayMode}
                universalThreshold={universalThreshold}
                onThresholdChange={setUniversalThreshold}
            />

            {/* Phytonutrients Tag Cloud */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                <div className="mb-4">
                    <div className="text-sm font-black uppercase tracking-widest text-green-600 dark:text-green-400">Phytonutrients</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Plant compounds from combined meals • Click a tag to learn more</div>
                </div>
                {nutrition?.phytonutrients && Object.keys(nutrition.phytonutrients).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(nutrition.phytonutrients).map(([name, data]) => {
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
                                            <span className="text-xs">{name}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-[10px] text-slate-400">No phytonutrient data available from meals</p>
                    </div>
                )}
            </div>
        </div>
    );
}
