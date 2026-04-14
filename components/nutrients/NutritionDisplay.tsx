'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface NutritionData {
    energy: { value: number; percent: number };
    protein: { value: number; percent: number; rda: number };
    carbs: { value: number; percent: number; rda: number };
    fat: { value: number; percent: number; rda: number };
    aminoAcids: Array<{ name: string; value: number }>;
    carbBreakdown: {
        starch: number;
        fiber: number;
        sugar: number;
    };
    fatBreakdown: {
        saturated: number;
        monounsaturated: number;
        polyunsaturated: number;
        omega3: number;
        omega6: number;
        cholesterol: number;
    };
    micronutrients: {
        electrolytes: Array<{ label: string; val: number; pct: number }>;
        trace: Array<{ label: string; val: number; pct: number }>;
        waterSoluble: Array<{ label: string; fullName: string; subtitle: string; val: number; pct: number }>;
        fatSoluble: Array<{ label: string; fullName: string; subtitle: string; val: number; pct: number }>;
        choline: { label: string; val: number; pct: number };
    };
}

interface NutritionDisplayProps {
    nutrition: NutritionData | null;
    energyUnit?: string;
    nutrientDisplayMode?: 'value' | 'percentage' | 'both';
    universalThreshold?: 50 | 75 | 100;
    onThresholdChange?: (threshold: 50 | 75 | 100) => void;
}

export function NutritionDisplay({
    nutrition,
    energyUnit = 'kJ',
    nutrientDisplayMode = 'both',
    universalThreshold = 75,
    onThresholdChange,
}: NutritionDisplayProps) {
    const [expandedMacro, setExpandedMacro] = useState<string | null>(null);

    if (!nutrition) return null;

    const { energy, protein, carbs, fat, aminoAcids, carbBreakdown, fatBreakdown, micronutrients } = nutrition;
    const ndm = nutrientDisplayMode;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                    <Activity size={16} /> Nutritional Breakdown
                </h3>
                {onThresholdChange && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                        {([50, 75, 100] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => onThresholdChange(t)}
                                className={cn(
                                    'flex-1 text-[10px] font-black py-1.5 px-2 rounded-md transition-all uppercase tracking-widest',
                                    universalThreshold === t
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                )}
                            >
                                {t}%
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Macros Summary Bar */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                {/* Energy */}
                <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Energy</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(energy.value).toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-400 font-bold">{energyUnit}</div>
                </div>
                
                {/* Carbs */}
                <div className="relative space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4">
                    <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Carbs</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                            {Math.round(carbs.value)}
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold">g</div>
                    </div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'carbs' ? null : 'carbs')}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors"
                        aria-label="Toggle carbs breakdown"
                    >
                        {expandedMacro === 'carbs' ? '−' : '+'}
                    </button>
                    {expandedMacro === 'carbs' && (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-widest text-blue-500">Carbs Breakdown</div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Starch</span>
                                <span className="font-bold text-slate-900 dark:text-white">{carbBreakdown.starch.toFixed(1)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Fiber</span>
                                <span className="font-bold text-slate-900 dark:text-white">{carbBreakdown.fiber.toFixed(1)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Sugar</span>
                                <span className="font-bold text-slate-900 dark:text-white">{carbBreakdown.sugar.toFixed(1)}g</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Protein */}
                <div className="relative space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4">
                    <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Protein</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                            {Math.round(protein.value)}
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold">g</div>
                    </div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'protein' ? null : 'protein')}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 transition-colors"
                        aria-label="Toggle protein breakdown"
                    >
                        {expandedMacro === 'protein' ? '−' : '+'}
                    </button>
                    {expandedMacro === 'protein' && (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-widest text-rose-500">Amino Acids Breakdown</div>
                            {aminoAcids.map(aa => (
                                <div key={aa.name} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                    <span>{aa.name}</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{aa.value.toFixed(2)}g</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fat */}
                <div className="relative space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4">
                    <div className="text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Fat</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                            {Math.round(fat.value)}
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold">g</div>
                    </div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'fat' ? null : 'fat')}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 transition-colors"
                        aria-label="Toggle fat breakdown"
                    >
                        {expandedMacro === 'fat' ? '−' : '+'}
                    </button>
                    {expandedMacro === 'fat' && (
                        <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-2">
                            <div className="text-[11px] font-black uppercase tracking-widest text-amber-500">Fat Breakdown</div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Saturated</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.saturated.toFixed(1)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Monounsaturated</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.monounsaturated.toFixed(1)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Polyunsaturated</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.polyunsaturated.toFixed(1)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Omega-3</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.omega3.toFixed(2)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Omega-6</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.omega6.toFixed(2)}g</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                <span>Cholesterol</span>
                                <span className="font-bold text-slate-900 dark:text-white">{fatBreakdown.cholesterol.toFixed(0)}mg</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Micronutrients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Vitamins */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 flex flex-col gap-3">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black uppercase tracking-widest text-violet-500">Vitamins + Choline</div>
                            <div className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
                                {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.waterSoluble.length + micronutrients.fatSoluble.length}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).map(v => {
                            const meetsThreshold = v.pct >= universalThreshold;
                            return (
                                <Link 
                                    key={v.label} 
                                    href={`/?nutrientId=${encodeURIComponent(v.fullName || v.label)}`}
                                    className="flex items-center justify-between hover:bg-slate-700/30 p-1 -mx-1 rounded-md transition-colors cursor-pointer group/nut"
                                >
                                    <span className={cn('text-sm font-semibold group-hover/nut:text-violet-400', meetsThreshold ? 'text-violet-300' : 'text-slate-400')}>
                                        {v.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-sm font-bold' ,
                                            v.pct >= 100 ? 'text-emerald-400' : v.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${v.val.toFixed(1)}`}
                                        {ndm === 'percentage' && `${v.pct}%`}
                                        {ndm === 'both' && `${v.val.toFixed(1)} (${v.pct}%)`}
                                    </span>
                                </Link>
                            );
                        })}
                        <div className="border-t border-slate-700 pt-2 mt-2">
                            <Link 
                                href="/?nutrientId=Choline"
                                className="flex items-center justify-between hover:bg-slate-700/30 p-1 -mx-1 rounded-md transition-colors cursor-pointer group/nut"
                            >
                                <span
                                    className={cn(
                                        'text-sm font-semibold group-hover/nut:text-violet-400',
                                        micronutrients.choline.pct >= universalThreshold ? 'text-violet-300' : 'text-slate-400'
                                    )}
                                >
                                    Choline
                                </span>
                                <span
                                    className={cn(
                                        'text-sm font-bold',
                                        micronutrients.choline.pct >= 100 ? 'text-emerald-400' : micronutrients.choline.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                    )}
                                >
                                    {ndm === 'value' && `${micronutrients.choline.val.toFixed(1)} mg`}
                                    {ndm === 'percentage' && `${micronutrients.choline.pct}%`}
                                    {ndm === 'both' && `${micronutrients.choline.val.toFixed(1)} mg (${micronutrients.choline.pct}%)`}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Minerals */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-3 flex flex-col gap-3">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black uppercase tracking-widest text-cyan-500">Minerals</div>
                            <div className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                                {micronutrients.electrolytes.concat(micronutrients.trace).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.electrolytes.length + micronutrients.trace.length}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.electrolytes.concat(micronutrients.trace).map(m => {
                            const meetsThreshold = m.pct >= universalThreshold;
                            return (
                                <Link 
                                    key={m.label} 
                                    href={`/?nutrientId=${encodeURIComponent(m.label)}`}
                                    className="flex items-center justify-between hover:bg-slate-700/30 p-1 -mx-1 rounded-md transition-colors cursor-pointer group/nut"
                                >
                                    <span className={cn('text-sm font-semibold group-hover/nut:text-cyan-400', meetsThreshold ? 'text-cyan-300' : 'text-slate-400')}>
                                        {m.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-sm font-bold' ,
                                            m.pct >= 100 ? 'text-emerald-400' : m.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${m.val.toFixed(1)} mg`}
                                        {ndm === 'percentage' && `${m.pct}%`}
                                        {ndm === 'both' && `${m.val.toFixed(1)} mg (${m.pct}%)`}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
