'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Dna, Sparkles, Zap, Loader2 } from 'lucide-react';
import { formatEnergyValue } from '@/lib/utils/nutrition-utils';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

// ── Reusable sub-components ─────────────────────────────────
function ThresholdToggle({ value, onChange }: { value: 50 | 75 | 100; onChange: (v: 50 | 75 | 100) => void }) {
    return (
        <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            {([50, 75, 100] as const).map(t => (
                <button key={t} onClick={() => onChange(t)}
                    className={cn('flex-1 text-[10px] font-black py-1.5 rounded-md transition-all uppercase tracking-widest',
                        value === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}>
                    {t}%
                </button>
            ))}
        </div>
    );
}

function MiniDonut({ count, total, color }: { count: number; total: number; color: string }) {
    const arcPct = total > 0 ? count / total : 0;
    const R = 38, S = 8, C = 2 * Math.PI * R;
    return (
        <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90" overflow="visible">
                <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth={S} className="text-slate-200 dark:text-slate-800" />
                <circle cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth={S} strokeLinecap="butt"
                    style={{ strokeDasharray: `${arcPct * C} ${C}`, transition: 'stroke-dasharray 0.7s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-slate-900 dark:text-white leading-none">{count}</span>
                <span className="text-[8px] text-slate-400 font-bold">/ {total}</span>
            </div>
        </div>
    );
}

function NutrientPill({ label, val, pct, hit, hitColor, mode, unit = 'mg' }: {
    label: string; val: number; pct: number; hit: boolean; hitColor: string; mode: string; unit?: string;
}) {
    return (
        <div className={cn('flex items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold border',
            hit ? hitColor : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400')}>
            <span>{label}</span>
            <span className={hit ? 'font-black' : ''}>
                {mode === 'value' && `${val.toFixed(label === 'Selenium' ? 1 : 0)}${unit}`}
                {mode === 'percentage' && `${pct}%`}
                {mode === 'both' && `${val.toFixed(label === 'Selenium' ? 1 : 0)}${unit} (${pct}%)`}
            </span>
        </div>
    );
}

function VitaminPill({ fullName, subtitle, val, pct, hit, hitColor, mode }: {
    fullName: string; subtitle: string; val: number; pct: number; hit: boolean; hitColor: string; mode: string;
}) {
    return (
        <div className={cn('flex flex-col items-start justify-between rounded-lg px-2 py-1.5 font-bold border',
            hit ? hitColor : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400')}>
            <div className="text-left w-full">
                <div className="text-[10px] font-black">{fullName}</div>
                <div className="text-[8px] font-normal opacity-60">{subtitle}</div>
            </div>
            <span className={cn('text-[10px] self-end mt-1', hit ? 'font-black' : '')}>
                {mode === 'value' && `${val.toFixed(1)}`}
                {mode === 'percentage' && `${pct}%`}
                {mode === 'both' && `${val.toFixed(1)} (${pct}%)`}
            </span>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────
export function RecipeNutrition({ ctx }: { ctx: RecipeDetailCtx }) {
    const {
        recipe, calculatedNutrition, nutritionViewMode, setNutritionViewMode,
        mineralThreshold, setMineralThreshold, waterSolubleThreshold, setWaterSolubleThreshold,
        storedVitaminThreshold, setStoredVitaminThreshold,
        findNutrientMatch, energyUnit, nutrientDisplayMode, userRDAs, profile
    } = ctx;

    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);

    if (!recipe) return null;

    // Check if recipe has nutrition data saved in DB OR calculated from ingredients
    const hasData = recipe.calories > 0 || calculatedNutrition.calories > 0;

    // No data → Empty state (workflow in side panel)
    if (!hasData) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={64} className="text-indigo-500" /></div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-500 animate-pulse" /> Smart Match
                        </h3>
                        <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mb-4 leading-relaxed">
                            Use the workflow on the right side to match and measure ingredients from our nutrition database.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Shared helpers
    // Use recipe's saved nutrition if available, otherwise use calculated nutrition
    const nutrition = {
        calories: recipe.calories > 0 ? recipe.calories : calculatedNutrition.calories,
        protein: recipe.protein > 0 ? recipe.protein : calculatedNutrition.protein,
        carbs: recipe.carbs > 0 ? recipe.carbs : calculatedNutrition.carbs,
        fat: recipe.fat > 0 ? recipe.fat : calculatedNutrition.fat,
        energyKj: recipe.energy_kj > 0 ? recipe.energy_kj : calculatedNutrition.energyKj,
        micronutrients: recipe.micronutrients && Object.keys(recipe.micronutrients).length > 0 ? recipe.micronutrients : calculatedNutrition.micronutrients || {},
        phytonutrients: recipe.phytonutrients && Object.keys(recipe.phytonutrients).length > 0 ? recipe.phytonutrients : calculatedNutrition.phytonutrients || {}
    };

    const micro = nutrition.micronutrients || {};
    const s = Math.max(recipe.servings || 1, 1);
    const sf = nutritionViewMode === 'per-serving' ? 1 / s : 1;
    const nv = (keys: string[]) => { let v = 0; for (const k of keys) { const m = findNutrientMatch(micro, k); if (m != null && micro[m] != null) { v = micro[m]; break; } } return v * sf; };

    // Macros
    const eV = nutrition.calories * sf, pV = nutrition.protein * sf, cV = nutrition.carbs * sf, fV = nutrition.fat * sf;
    const pR = userRDAs?.['Protein'] || (profile?.weight ? Number(profile.weight) * 1.6 : 100), cR = userRDAs?.['Carbs'] || 250, fR = userRDAs?.['Fat'] || 70;
    const pP = Math.min(Math.round((pV / pR) * 100), 100), cP = Math.min(Math.round((cV / cR) * 100), 100), fP = Math.min(Math.round((fV / fR) * 100), 100);
    const pCal = pV * 4, cCal = cV * 4, fCal = fV * 9, tCal = pCal + cCal + fCal || 1;
    const R = 44, STR = 9, CC = 2 * Math.PI * R;
    const cFr = cCal / tCal, fFr = fCal / tCal, pFr = pCal / tCal;
    let o = 0; const cS = { strokeDasharray: `${cFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` }; o += cFr;
    const fS = { strokeDasharray: `${fFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` }; o += fFr;
    const pS = { strokeDasharray: `${pFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };
    const Bar = ({ pct, color }: { pct: number; color: string }) => (
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
        </div>
    );

    // Electrolytes + Trace
    const elData = [{ l: 'Sodium', k: ['Sodium', 'sodium_mg'] }, { l: 'Potassium', k: ['Potassium', 'potassium_mg'] }, { l: 'Magnesium', k: ['Magnesium', 'magnesium_mg'] }, { l: 'Calcium', k: ['Calcium', 'calcium_mg'] }, { l: 'Phosphorus', k: ['Phosphorus', 'phosphorus_mg'] }]
        .map(({ l, k }) => { const v = nv(k), r = userRDAs?.[l] || 0; return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 }; });
    const trData = [{ l: 'Iron', k: ['Iron', 'iron_mg'] }, { l: 'Zinc', k: ['Zinc', 'zinc_mg'] }, { l: 'Copper', k: ['Copper', 'copper_mg'] }, { l: 'Manganese', k: ['Manganese', 'manganese_mg'] }, { l: 'Selenium', k: ['Selenium', 'selenium_ug'] }]
        .map(({ l, k }) => { const v = nv(k), r = userRDAs?.[l] || 0; return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 }; });
    const wsData = [{ l: 'B1 (Thiamine)', fn: 'Vitamin B1', sub: 'Thiamine' }, { l: 'B2 (Riboflavin)', fn: 'Vitamin B2', sub: 'Riboflavin' }, { l: 'B3 (Niacin)', fn: 'Vitamin B3', sub: 'Niacin' }, { l: 'B5 (Pantothenic Acid)', fn: 'Vitamin B5', sub: 'Pantothenic Acid' }, { l: 'B6 (Pyridoxine)', fn: 'Vitamin B6', sub: 'Pyridoxine' }, { l: 'B9 (Folate)', fn: 'Vitamin B9', sub: 'Folate' }]
        .map(({ l, fn, sub }) => { let v = 0; const m = findNutrientMatch(micro, l); if (m != null && micro[m] != null) v = micro[m] * sf; const r = userRDAs?.[l] || 0; return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 }; });
    const stData = [{ l: 'Vitamin A', fn: 'Vitamin A', sub: 'Retinol' }, { l: 'Vitamin D', fn: 'Vitamin D', sub: 'Calciferol' }, { l: 'Vitamin E', fn: 'Vitamin E', sub: 'Tocopherol' }, { l: 'Vitamin K', fn: 'Vitamin K', sub: 'Phylloquinone' }, { l: 'B12 (Cobalamin)', fn: 'Vitamin B12', sub: 'Cobalamin' }]
        .map(({ l, fn, sub }) => { let v = 0; const m = findNutrientMatch(micro, l); if (m != null && micro[m] != null) v = micro[m] * sf; const r = userRDAs?.[l] || 0; return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 }; });
    
    // Choline data for minerals section
    const cholineVal = nv(['Choline', 'choline_mg']);
    const cholineRDA = userRDAs?.['Choline'] || 0;
    const cholineData = { label: 'Choline', val: cholineVal, pct: cholineRDA > 0 ? Math.round((cholineVal / cholineRDA) * 100) : 0 };

    const ndm = nutrientDisplayMode;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2"><Activity size={16} /> Nutritional Breakdown</h3>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                        {nutritionViewMode === 'per-serving' ? `Per Serving (1 of ${recipe.servings})` : `Total (${recipe.servings} Servings)`}
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    {(['per-serving', 'total'] as const).map(m => (
                        <button key={m} onClick={() => setNutritionViewMode(m)} className={cn("px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-md transition-all",
                            nutritionViewMode === m ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                            {m === 'per-serving' ? 'Per Serving' : 'Total'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Macros 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Energy */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between h-24">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Energy</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(energyUnit === 'kJ' ? eV * 4.184 : eV)} {energyUnit}</p>
                    </div>
                </div>

                {/* Carbohydrates */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between h-24">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Carbohydrates</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{cV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({cP}%)</span></p>
                    </div>
                </div>

                {/* Protein */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between h-24">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Protein</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{pV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({pP}%)</span></p>
                    </div>
                </div>

                {/* Fat */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between h-24">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Fat</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{fV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({fP}%)</span></p>
                    </div>
                </div>
            </div>

            {/* Vitamins + Minerals Two Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Vitamins (Left) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-violet-500">Vitamins + Choline</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Water & Fat Soluble</div>
                    </div>
                    <div className="space-y-2.5">
                        {[...wsData, ...stData].map(d => (
                            <div key={d.label} className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{d.label}</span>
                                <span className={cn("text-[10px] font-bold", d.pct >= 100 ? 'text-emerald-500' : d.pct >= 50 ? 'text-amber-500' : 'text-slate-400')}>
                                    {ndm === 'value' && `${d.val.toFixed(1)}`}
                                    {ndm === 'percentage' && `${d.pct}%`}
                                    {ndm === 'both' && `${d.val.toFixed(1)} (${d.pct}%)`}
                                </span>
                            </div>
                        ))}
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Choline</span>
                                <span className={cn("text-[10px] font-bold", cholineData.pct >= 100 ? 'text-emerald-500' : cholineData.pct >= 50 ? 'text-amber-500' : 'text-slate-400')}>
                                    {ndm === 'value' && `${cholineData.val.toFixed(1)} mg`}
                                    {ndm === 'percentage' && `${cholineData.pct}%`}
                                    {ndm === 'both' && `${cholineData.val.toFixed(1)} mg (${cholineData.pct}%)`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Minerals (Right) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-widest text-teal-500">Minerals</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Electrolytes & Trace</div>
                    </div>
                    <div className="space-y-2.5">
                        {[...elData, ...trData].map(d => (
                            <div key={d.label} className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{d.label}</span>
                                <span className={cn("text-[10px] font-bold", d.pct >= 100 ? 'text-emerald-500' : d.pct >= 50 ? 'text-amber-500' : 'text-slate-400')}>
                                    {ndm === 'value' && `${d.val.toFixed(1)} mg`}
                                    {ndm === 'percentage' && `${d.pct}%`}
                                    {ndm === 'both' && `${d.val.toFixed(1)} mg (${d.pct}%)`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Phytonutrients Tag Cloud */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                <div className="mb-4">
                    <div className="text-[11px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Phytonutrients</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Plant compounds with powerful health benefits • Click a tag to learn more</div>
                </div>
                {nutrition.phytonutrients && Object.keys(nutrition.phytonutrients).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(nutrition.phytonutrients).map(([name, data]) => {
                            const isExpanded = expandedPhyto === name;
                            const description = typeof data === 'object' ? data.description : String(data);
                            const sources = typeof data === 'object' ? data.sources || [] : [];

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
                                        // Expanded view - Show description and sources
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
                                                        {sources.map((source) => (
                                                            <span key={source} className="inline-block text-[8px] bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-300/30 dark:border-green-600/40">
                                                                {source}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Collapsed view - Show tag
                                        <>
                                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-[7px] font-black">•</span>
                                            <span className="text-[10px]">{name}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-[10px] text-slate-400">No phytonutrient data available</p>
                    </div>
                )}
            </div>

            {/* Macros + Electrolytes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                            <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                                <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth={STR} className="text-slate-200 dark:text-slate-800" />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#3b82f6" strokeWidth={STR} strokeLinecap="butt" style={{ ...cS, transition: 'all 0.7s ease' }} />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#f59e0b" strokeWidth={STR} strokeLinecap="butt" style={{ ...fS, transition: 'all 0.7s ease' }} />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#f43f5e" strokeWidth={STR} strokeLinecap="butt" style={{ ...pS, transition: 'all 0.7s ease' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-black text-slate-900 dark:text-white leading-none">{Math.round(energyUnit === 'kJ' ? eV * 4.184 : eV)}</span>
                                <span className="text-[8px] text-slate-400 font-bold mt-0.5">{energyUnit}</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{formatEnergyValue(eV, energyUnit, eV * 4.184)}</div>
                            <div className="space-y-2.5">
                                {[{ l: 'Carbs', p: cP, c: '#3b82f6', t: 'text-blue-500' }, { l: 'Fat', p: fP, c: '#f59e0b', t: 'text-amber-500' }, { l: 'Protein', p: pP, c: '#f43f5e', t: 'text-rose-500' }].map(({ l, p, c, t }) => (
                                    <div key={l} className="flex items-center gap-1.5"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-11 flex-shrink-0">{l}</span><Bar pct={p} color={c} /><span className={cn("text-[10px] font-black w-7 text-right flex-shrink-0", t)}>{p}%</span></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <ThresholdToggle value={mineralThreshold} onChange={setMineralThreshold} />
                    <div className="flex items-center justify-center gap-3">
                        <MiniDonut count={elData.filter(m => m.pct >= mineralThreshold).length} total={elData.length} color="#f97316" />
                        <div><div className="text-lg font-black text-slate-900 dark:text-white">{Math.round((elData.filter(m => m.pct >= mineralThreshold).length / elData.length) * 100)}%</div><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">electrolytes<br />≥ {mineralThreshold}% RDA</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">{elData.map(d => <NutrientPill key={d.label} label={d.label} val={d.val} pct={d.pct} hit={d.pct >= mineralThreshold} hitColor="bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400" mode={ndm} />)}</div>
                </div>
            </div>

            {/* Overlooked + Trace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-3">
                    <div><div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Often Overlooked</div><div className="text-[10px] text-slate-400 mt-0.5">Nutrients people rarely track</div></div>
                    <div className="space-y-3">
                        {[{ l: 'Water', k: ['Water'], u: 'g' }, { l: 'Fiber', k: ['Fiber', 'fiber_g'], u: 'g' }, { l: 'Choline', k: ['Choline', 'choline_mg'], u: 'mg' }].map(({ l, k, u }) => {
                            const v = nv(k);
                            return <div key={l}><div className="flex items-center justify-between mb-1"><span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">{l}</span><span className="text-[10px] text-slate-400">{v.toFixed(1)}{u}</span></div></div>;
                        })}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <ThresholdToggle value={mineralThreshold} onChange={setMineralThreshold} />
                    <div className="flex items-center justify-center gap-3">
                        <MiniDonut count={trData.filter(m => m.pct >= mineralThreshold).length} total={trData.length} color="#ec4899" />
                        <div><div className="text-lg font-black text-slate-900 dark:text-white">{Math.round((trData.filter(m => m.pct >= mineralThreshold).length / trData.length) * 100)}%</div><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">trace<br />minerals<br />≥ {mineralThreshold}% RDA</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">{trData.map(d => <NutrientPill key={d.label} label={d.label} val={d.val} pct={d.pct} hit={d.pct >= mineralThreshold} hitColor="bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400" mode={ndm} unit="μg" />)}</div>
                </div>
            </div>

            {/* Vitamins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <ThresholdToggle value={waterSolubleThreshold} onChange={setWaterSolubleThreshold} />
                    <div className="flex items-center justify-center gap-3">
                        <MiniDonut count={wsData.filter(v => v.pct >= waterSolubleThreshold).length} total={wsData.length} color="#06b6d4" />
                        <div><div className="text-lg font-black text-slate-900 dark:text-white">{Math.round((wsData.filter(v => v.pct >= waterSolubleThreshold).length / wsData.length) * 100)}%</div><div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">daily<br />vitamins</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">{wsData.map(d => <VitaminPill key={d.label} fullName={d.fullName} subtitle={d.subtitle} val={d.val} pct={d.pct} hit={d.pct >= waterSolubleThreshold} hitColor="bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400" mode={ndm} />)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4">
                    <ThresholdToggle value={storedVitaminThreshold} onChange={setStoredVitaminThreshold} />
                    <div className="flex items-center justify-center gap-3">
                        <MiniDonut count={stData.filter(v => v.pct >= storedVitaminThreshold).length} total={stData.length} color="#eab308" />
                        <div><div className="text-lg font-black text-foreground">{Math.round((stData.filter(v => v.pct >= storedVitaminThreshold).length / stData.length) * 100)}%</div><div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-tight">stored<br />vitamins</div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">{stData.map(d => <VitaminPill key={d.label} fullName={d.fullName} subtitle={d.subtitle} val={d.val} pct={d.pct} hit={d.pct >= storedVitaminThreshold} hitColor="bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400" mode={ndm} />)}</div>
                </div>
            </div>
        </div>
    );
}
