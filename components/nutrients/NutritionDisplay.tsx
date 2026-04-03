'use client';

import React, { useState } from 'react';
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

    // Donut chart for energy
    const R = 44, STR = 9, CC = 2 * Math.PI * R;
    const pCal = protein.value * 4;
    const cCal = carbs.value * 4;
    const fCal = fat.value * 9;
    const tCal = pCal + cCal + fCal || 1;
    const cFr = cCal / tCal, fFr = fCal / tCal, pFr = pCal / tCal;
    let o = 0;
    const cS = { strokeDasharray: `${cFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };
    o += cFr;
    const fS = { strokeDasharray: `${fFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };
    o += fFr;
    const pS = { strokeDasharray: `${pFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };

    return (
        <div className="space-y-6">
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

            {/* Macros Section */}
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Energy Donut */}
                <div className="flex-shrink-0 p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col justify-center items-center lg:h-auto">
                    <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r={R}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={STR}
                                className="text-slate-700"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={R}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth={STR}
                                strokeLinecap="butt"
                                style={{ ...cS, transition: 'all 0.7s ease' }}
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={R}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={STR}
                                strokeLinecap="butt"
                                style={{ ...fS, transition: 'all 0.7s ease' }}
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r={R}
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth={STR}
                                strokeLinecap="butt"
                                style={{ ...pS, transition: 'all 0.7s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-white leading-none">{Math.round(energy.value)}</span>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">{energyUnit}</span>
                        </div>
                    </div>
                </div>

                {/* Macro Cards */}
                <div className="flex-1 space-y-3">
                    {/* Carbs */}
                    <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                        <button
                            onClick={() => setExpandedMacro(expandedMacro === 'carbs' ? null : 'carbs')}
                            className="flex items-center justify-between hover:opacity-80 transition-opacity"
                        >
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Carbs</p>
                                <p className="text-sm font-bold text-white">
                                    {carbs.value.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({carbs.percent}%)</span>
                                </p>
                            </div>
                            <span className="text-slate-400 text-lg">{expandedMacro === 'carbs' ? '▼' : '▶'}</span>
                        </button>

                        {expandedMacro !== 'carbs' && (
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(carbs.percent, 100)}%`, backgroundColor: '#3b82f6' }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{carbs.value.toFixed(1)}g</span>
                                    <span>{carbs.rda.toFixed(1)}g</span>
                                </div>
                            </div>
                        )}

                        {expandedMacro === 'carbs' && (
                            <div className="space-y-2 border-t border-slate-700 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Starch</span>
                                    <span className="text-[10px] font-bold">{carbBreakdown.starch.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Fiber</span>
                                    <span className="text-[10px] font-bold">{carbBreakdown.fiber.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Sugar</span>
                                    <span className="text-[10px] font-bold">{carbBreakdown.sugar.toFixed(1)}g</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Protein */}
                    <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                        <button
                            onClick={() => setExpandedMacro(expandedMacro === 'protein' ? null : 'protein')}
                            className="flex items-center justify-between hover:opacity-80 transition-opacity"
                        >
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Protein</p>
                                <p className="text-sm font-bold text-white">
                                    {protein.value.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({protein.percent}%)</span>
                                </p>
                            </div>
                            <span className="text-slate-400 text-lg">{expandedMacro === 'protein' ? '▼' : '▶'}</span>
                        </button>

                        {expandedMacro !== 'protein' && (
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(protein.percent, 100)}%`, backgroundColor: '#f43f5e' }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{protein.value.toFixed(1)}g</span>
                                    <span>{protein.rda.toFixed(1)}g</span>
                                </div>
                            </div>
                        )}

                        {expandedMacro === 'protein' && (
                            <div className="space-y-2 border-t border-slate-700 pt-3">
                                {aminoAcids.map(aa => (
                                    <div key={aa.name} className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-slate-300">{aa.name}</span>
                                        <span className="text-[10px] font-bold">{aa.value.toFixed(2)}g</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fat */}
                    <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                        <button
                            onClick={() => setExpandedMacro(expandedMacro === 'fat' ? null : 'fat')}
                            className="flex items-center justify-between hover:opacity-80 transition-opacity"
                        >
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Fat</p>
                                <p className="text-sm font-bold text-white">
                                    {fat.value.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({fat.percent}%)</span>
                                </p>
                            </div>
                            <span className="text-slate-400 text-lg">{expandedMacro === 'fat' ? '▼' : '▶'}</span>
                        </button>

                        {expandedMacro !== 'fat' && (
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min(fat.percent, 100)}%`, backgroundColor: '#f59e0b' }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{fat.value.toFixed(1)}g</span>
                                    <span>{fat.rda.toFixed(1)}g</span>
                                </div>
                            </div>
                        )}

                        {expandedMacro === 'fat' && (
                            <div className="space-y-2 border-t border-slate-700 pt-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Saturated</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.saturated.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Monounsaturated</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.monounsaturated.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Polyunsaturated</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.polyunsaturated.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Omega-3</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.omega3.toFixed(2)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Omega-6</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.omega6.toFixed(2)}g</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-300">Cholesterol</span>
                                    <span className="text-[10px] font-bold">{fatBreakdown.cholesterol.toFixed(0)}mg</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Micronutrients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Vitamins */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black uppercase tracking-widest text-violet-500">Vitamins + Choline</div>
                            <div className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
                                {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.waterSoluble.length + micronutrients.fatSoluble.length}
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.waterSoluble.concat(micronutrients.fatSoluble).map(v => {
                            const meetsThreshold = v.pct >= universalThreshold;
                            return (
                                <div key={v.label} className="flex items-center justify-between">
                                    <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-violet-300' : 'text-slate-400')}>
                                        {v.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold',
                                            v.pct >= 100 ? 'text-emerald-400' : v.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${v.val.toFixed(1)}`}
                                        {ndm === 'percentage' && `${v.pct}%`}
                                        {ndm === 'both' && `${v.val.toFixed(1)} (${v.pct}%)`}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="border-t border-slate-700 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        'text-[10px] font-semibold',
                                        micronutrients.choline.pct >= universalThreshold ? 'text-violet-300' : 'text-slate-400'
                                    )}
                                >
                                    Choline
                                </span>
                                <span
                                    className={cn(
                                        'text-[10px] font-bold',
                                        micronutrients.choline.pct >= 100 ? 'text-emerald-400' : micronutrients.choline.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                    )}
                                >
                                    {ndm === 'value' && `${micronutrients.choline.val.toFixed(1)} mg`}
                                    {ndm === 'percentage' && `${micronutrients.choline.pct}%`}
                                    {ndm === 'both' && `${micronutrients.choline.val.toFixed(1)} mg (${micronutrients.choline.pct}%)`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Minerals */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black uppercase tracking-widest text-cyan-500">Minerals</div>
                            <div className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                                {micronutrients.electrolytes.concat(micronutrients.trace).filter(v => v.pct >= universalThreshold).length} /{' '}
                                {micronutrients.electrolytes.length + micronutrients.trace.length}
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2">
                        {micronutrients.electrolytes.concat(micronutrients.trace).map(m => {
                            const meetsThreshold = m.pct >= universalThreshold;
                            return (
                                <div key={m.label} className="flex items-center justify-between">
                                    <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-cyan-300' : 'text-slate-400')}>
                                        {m.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold',
                                            m.pct >= 100 ? 'text-emerald-400' : m.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${m.val.toFixed(1)} mg`}
                                        {ndm === 'percentage' && `${m.pct}%`}
                                        {ndm === 'both' && `${m.val.toFixed(1)} mg (${m.pct}%)`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
