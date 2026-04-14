'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Activity, Eye, EyeOff } from 'lucide-react';

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
                    <Activity size={16} /> Minimum Threshold
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
                                        ? t === 50
                                            ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-100 shadow-sm'
                                            : t === 75
                                                ? 'bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100 shadow-sm'
                                                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100 shadow-sm'
                                        : t === 50
                                            ? 'text-yellow-500 hover:text-yellow-700 dark:text-yellow-300 dark:hover:text-yellow-100'
                                            : t === 75
                                                ? 'text-sky-500 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-100'
                                                : 'text-emerald-500 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-100'
                                )}
                            >
                                {t}%
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Macros Summary Bar */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-[2.5rem] border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] hover:-translate-y-1 transition-all duration-500">
                {/* Energy */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4 text-center flex flex-col items-center shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Energy</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(energy.value).toLocaleString()}
                    </div>
                    <div className="text-[8px] text-slate-400 font-bold">{energyUnit}</div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'energy' ? null : 'energy')}
                        className="mt-3 mx-auto inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-transparent p-2 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle energy details"
                    >
                        {expandedMacro === 'energy' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Carbs */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4 text-center flex flex-col items-center shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Carbs</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(carbs.value)}
                    </div>
                    <div className="text-[8px] text-slate-400 font-bold">g</div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'carbs' ? null : 'carbs')}
                        className="mt-3 mx-auto inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-transparent p-2 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle carbs details"
                    >
                        {expandedMacro === 'carbs' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Protein */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4 text-center flex flex-col items-center shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Protein</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(protein.value)}
                    </div>
                    <div className="text-[8px] text-slate-400 font-bold">g</div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'protein' ? null : 'protein')}
                        className="mt-3 mx-auto inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-transparent p-2 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle protein details"
                    >
                        {expandedMacro === 'protein' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Fat */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 p-4 text-center flex flex-col items-center shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Fat</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                        {Math.round(fat.value)}
                    </div>
                    <div className="text-[8px] text-slate-400 font-bold">g</div>
                    <button
                        onClick={() => setExpandedMacro(expandedMacro === 'fat' ? null : 'fat')}
                        className="mt-3 mx-auto inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-transparent p-2 text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Toggle fat details"
                    >
                        {expandedMacro === 'fat' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Macro Details */}
            {expandedMacro === 'energy' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-orange-500">Energy Details</div>
                    <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(energy.value).toLocaleString()} {energyUnit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>RDA %</span>
                        <span className="font-bold text-slate-900 dark:text-white">{Math.round(energy.percent)}%</span>
                    </div>
                </div>
            )}
            {expandedMacro === 'carbs' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-3">
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
            {expandedMacro === 'protein' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-rose-500">Amino Acids Breakdown</div>
                    {aminoAcids.map(aa => (
                        <div key={aa.name} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                            <span>{aa.name}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{aa.value.toFixed(2)}g</span>
                        </div>
                    ))}
                </div>
            )}
            {expandedMacro === 'fat' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-left space-y-3">
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

            {/* Micronutrients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Vitamins */}
                <div className="rounded-[2.5rem] border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] hover:-translate-y-1 transition-all duration-500 p-4 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black uppercase tracking-widest text-violet-500">Vitamins + Choline</div>
                            <div className="text-xs font-bold text-violet-700 bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200 px-2.5 py-1 rounded-full">
                                {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.waterSoluble.length + micronutrients.fatSoluble.length}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).map(v => {
                            const meetsThreshold = v.pct >= universalThreshold;
                            return (
                                <Link 
                                    key={v.label} 
                                    href={`/?nutrientId=${encodeURIComponent(v.fullName || v.label)}`}
                                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl transition-all duration-200 border border-slate-200 dark:border-slate-800 cursor-pointer group/nut"
                                >
                                    <span className={cn('text-sm font-semibold group-hover/nut:text-violet-400', meetsThreshold ? 'text-violet-500' : 'text-slate-500 dark:text-slate-400')}>
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
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                            <Link 
                                href="/?nutrientId=Choline"
                                className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl transition-all duration-200 border border-slate-200 dark:border-slate-800 cursor-pointer group/nut"
                            >
                                <span
                                    className={cn(
                                        'text-sm font-semibold group-hover/nut:text-violet-400',
                                        micronutrients.choline.pct >= universalThreshold ? 'text-violet-500' : 'text-slate-500 dark:text-slate-400'
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
                <div className="rounded-[2.5rem] border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.55)] hover:-translate-y-1 transition-all duration-500 p-4 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-black uppercase tracking-widest text-cyan-500">Minerals</div>
                            <div className="text-xs font-bold text-cyan-700 bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-200 px-2.5 py-1 rounded-full">
                                {micronutrients.electrolytes.concat(micronutrients.trace).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.electrolytes.length + micronutrients.trace.length}
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.electrolytes.concat(micronutrients.trace).map(m => {
                            const meetsThreshold = m.pct >= universalThreshold;
                            return (
                                <Link 
                                    key={m.label} 
                                    href={`/?nutrientId=${encodeURIComponent(m.label)}`}
                                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl transition-all duration-200 border border-slate-200 dark:border-slate-800 cursor-pointer group/nut"
                                >
                                    <span className={cn('text-sm font-semibold group-hover/nut:text-cyan-400', meetsThreshold ? 'text-cyan-500' : 'text-slate-500 dark:text-slate-400')}>
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
