'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Sparkles } from 'lucide-react';

interface DailyNutritionProps {
    plan: any;
    userRDAs: Record<string, number>;
    profile?: any;
    energyUnit?: string;
    nutrientDisplayMode?: 'value' | 'percentage' | 'both';
}

export function DailyNutrition({
    plan,
    userRDAs,
    profile,
    energyUnit = 'kJ',
    nutrientDisplayMode = 'both',
}: DailyNutritionProps) {
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);

    if (!plan || !userRDAs) return null;

    // Aggregate nutrition from all meals
    const mealsArray = [];
    if (plan.breakfast && typeof plan.breakfast === 'object') mealsArray.push(plan.breakfast);
    if (plan.lunch && typeof plan.lunch === 'object') mealsArray.push(plan.lunch);
    if (plan.dinner && typeof plan.dinner === 'object') mealsArray.push(plan.dinner);
    if (plan.snacks && Array.isArray(plan.snacks)) {
        plan.snacks.forEach((snack: any) => {
            if (snack && typeof snack === 'object') mealsArray.push(snack);
        });
    }

    // Calculate totals
    const totals = mealsArray.reduce(
        (acc: any, recipe: any) => {
            acc.calories += recipe.calories || 0;
            acc.energy_kj += recipe.energy_kj || 0;
            acc.protein += recipe.protein || 0;
            acc.fat += recipe.fat || 0;
            acc.carbs += recipe.carbs || 0;

            Object.entries(recipe.micronutrients || {}).forEach(([key, val]) => {
                acc.micronutrients[key] = (acc.micronutrients[key] || 0) + (val as number);
            });

            return acc;
        },
        { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} }
    );

    const micro = totals.micronutrients || {};

    // Helper to find nutrient value by multiple possible keys
    const findNutrientMatch = (obj: Record<string, number>, ...keys: string[]): number | null => {
        for (const k of keys) {
            if (obj[k] !== undefined) return obj[k];
        }
        return null;
    };

    const nv = (keys: string[]) => {
        const v = findNutrientMatch(micro, ...keys);
        return v !== null ? v : 0;
    };

    // Macros
    const eV = totals.calories;
    const pV = totals.protein;
    const cV = totals.carbs;
    const fV = totals.fat;

    const pR = userRDAs?.['Protein'] || (profile?.weight ? Number(profile.weight) * 1.6 : 100);
    const cR = userRDAs?.['Carbs'] || 250;
    const fR = userRDAs?.['Fat'] || 70;
    const eR = userRDAs?.['Energy'] || 2000;

    const pP = Math.min(Math.round((pV / pR) * 100), 100);
    const cP = Math.min(Math.round((cV / cR) * 100), 100);
    const fP = Math.min(Math.round((fV / fR) * 100), 100);
    const eP = Math.min(Math.round(((energyUnit === 'kJ' ? totals.energy_kj : totals.calories) / eR) * 100), 100);

    // Donut chart calculations
    const pCal = pV * 4;
    const cCal = cV * 4;
    const fCal = fV * 9;
    const tCal = pCal + cCal + fCal || 1;
    const R = 44, STR = 9, CC = 2 * Math.PI * R;
    const cFr = cCal / tCal, fFr = fCal / tCal, pFr = pCal / tCal;
    let o = 0;
    const cS = { strokeDasharray: `${cFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };
    o += cFr;
    const fS = { strokeDasharray: `${fFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };
    o += fFr;
    const pS = { strokeDasharray: `${pFr * CC} ${CC}`, strokeDashoffset: `${-o * CC}` };

    // Micronutrient data
    const elData = [
        { l: 'Sodium', k: ['Sodium', 'sodium_mg'] },
        { l: 'Potassium', k: ['Potassium', 'potassium_mg'] },
        { l: 'Magnesium', k: ['Magnesium', 'magnesium_mg'] },
        { l: 'Calcium', k: ['Calcium', 'calcium_mg'] },
        { l: 'Phosphorus', k: ['Phosphorus', 'phosphorus_mg'] },
    ].map(({ l, k }) => {
        const v = nv(k);
        const r = userRDAs?.[l] || 0;
        return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
    });

    const trData = [
        { l: 'Iron', k: ['Iron', 'iron_mg'] },
        { l: 'Zinc', k: ['Zinc', 'zinc_mg'] },
        { l: 'Copper', k: ['Copper', 'copper_mg'] },
        { l: 'Manganese', k: ['Manganese', 'manganese_mg'] },
        { l: 'Selenium', k: ['Selenium', 'selenium_ug'] },
    ].map(({ l, k }) => {
        const v = nv(k);
        const r = userRDAs?.[l] || 0;
        return { label: l, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
    });

    const wsData = [
        { l: 'B1 (Thiamine)', fn: 'Vitamin B1', sub: 'Thiamine' },
        { l: 'B2 (Riboflavin)', fn: 'Vitamin B2', sub: 'Riboflavin' },
        { l: 'B3 (Niacin)', fn: 'Vitamin B3', sub: 'Niacin' },
        { l: 'B5 (Pantothenic Acid)', fn: 'Vitamin B5', sub: 'Pantothenic Acid' },
        { l: 'B6 (Pyridoxine)', fn: 'Vitamin B6', sub: 'Pyridoxine' },
        { l: 'B9 (Folate)', fn: 'Vitamin B9', sub: 'Folate' },
    ].map(({ l, fn, sub }) => {
        const v = nv([l]);
        const r = userRDAs?.[l] || 0;
        return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
    });

    const stData = [
        { l: 'Vitamin A', fn: 'Vitamin A', sub: 'Retinol' },
        { l: 'Vitamin D', fn: 'Vitamin D', sub: 'Calciferol' },
        { l: 'Vitamin E', fn: 'Vitamin E', sub: 'Tocopherol' },
        { l: 'Vitamin K', fn: 'Vitamin K', sub: 'Phylloquinone' },
        { l: 'B12 (Cobalamin)', fn: 'Vitamin B12', sub: 'Cobalamin' },
    ].map(({ l, fn, sub }) => {
        const v = nv([l]);
        const r = userRDAs?.[l] || 0;
        return { label: l, fullName: fn, subtitle: sub, val: v, pct: r > 0 ? Math.round((v / r) * 100) : 0 };
    });

    const cholineVal = nv(['Choline', 'choline_mg']);
    const cholineRDA = userRDAs?.['Choline'] || 0;
    const cholineData = { label: 'Choline', val: cholineVal, pct: cholineRDA > 0 ? Math.round((cholineVal / cholineRDA) * 100) : 0 };

    const ndm = nutrientDisplayMode;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                        <Activity size={16} /> Daily Nutrition Totals
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1">Combined nutrition from all meals</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    {([50, 75, 100] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setUniversalThreshold(t as 50 | 75 | 100)}
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
            </div>

            {/* Macros Grid - Donut + 3 Cards Horizontal */}
            <div className="flex gap-3">
                {/* Energy Donut */}
                <div className="flex-shrink-0 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:from-slate-900/30 dark:to-slate-900/10">
                    <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth={STR} className="text-slate-200 dark:text-slate-800" />
                            <circle cx="48" cy="48" r={R} fill="none" stroke="#3b82f6" strokeWidth={STR} strokeLinecap="butt" style={{ ...cS, transition: 'all 0.7s ease' }} />
                            <circle cx="48" cy="48" r={R} fill="none" stroke="#f59e0b" strokeWidth={STR} strokeLinecap="butt" style={{ ...fS, transition: 'all 0.7s ease' }} />
                            <circle cx="48" cy="48" r={R} fill="none" stroke="#f43f5e" strokeWidth={STR} strokeLinecap="butt" style={{ ...pS, transition: 'all 0.7s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                                {Math.round(energyUnit === 'kJ' ? totals.energy_kj : totals.calories)}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">{energyUnit}</span>
                        </div>
                    </div>
                </div>

                {/* Macro Cards Grid */}
                <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Carbohydrates */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">Carbohydrates</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {cV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({cP}%)</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(cP, 100)}%`, backgroundColor: '#3b82f6' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                                <span>{cV.toFixed(1)}g</span>
                                <span>{cR.toFixed(1)}g</span>
                            </div>
                        </div>
                    </div>

                    {/* Protein */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Protein</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {pV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({pP}%)</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(pP, 100)}%`, backgroundColor: '#f43f5e' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                                <span>{pV.toFixed(1)}g</span>
                                <span>{pR.toFixed(1)}g</span>
                            </div>
                        </div>
                    </div>

                    {/* Fat */}
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Fat</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {fV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({fP}%)</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${Math.min(fP, 100)}%`, backgroundColor: '#f59e0b' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                                <span>{fV.toFixed(1)}g</span>
                                <span>{fR.toFixed(1)}g</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vitamins + Minerals Two Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Vitamins (Left) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col gap-4">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black uppercase tracking-widest text-violet-500">Vitamins + Choline</div>
                            <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full">
                                {[...wsData, ...stData].filter((v) => v.pct >= universalThreshold).length} / {wsData.length + stData.length}
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Water & Fat Soluble • Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2.5">
                        {[...wsData, ...stData].map((d) => {
                            const meetsThreshold = d.pct >= universalThreshold;
                            return (
                                <div key={d.label} className="flex items-center justify-between">
                                    <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-violet-700 dark:text-violet-400' : 'text-slate-600 dark:text-slate-400')}>
                                        {d.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold',
                                            d.pct >= 100 ? 'text-emerald-500' : d.pct >= universalThreshold ? 'text-amber-500' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${d.val.toFixed(1)}`}
                                        {ndm === 'percentage' && `${d.pct}%`}
                                        {ndm === 'both' && `${d.val.toFixed(1)} (${d.pct}%)`}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                                <span className={cn('text-[10px] font-semibold', cholineData.pct >= universalThreshold ? 'text-violet-700 dark:text-violet-400' : 'text-slate-600 dark:text-slate-400')}>
                                    Choline
                                </span>
                                <span
                                    className={cn(
                                        'text-[10px] font-bold',
                                        cholineData.pct >= 100 ? 'text-emerald-500' : cholineData.pct >= universalThreshold ? 'text-amber-500' : 'text-slate-400'
                                    )}
                                >
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
                        <div className="flex items-center justify-between">
                            <div className="text-[11px] font-black uppercase tracking-widest text-teal-500">Minerals</div>
                            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                                {[...elData, ...trData].filter((m) => m.pct >= universalThreshold).length} / {elData.length + trData.length}
                            </div>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Electrolytes & Trace • Threshold: ≥ {universalThreshold}% RDA</div>
                    </div>
                    <div className="space-y-2.5">
                        {[...elData, ...trData].map((d) => {
                            const meetsThreshold = d.pct >= universalThreshold;
                            return (
                                <div key={d.label} className="flex items-center justify-between">
                                    <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400')}>
                                        {d.label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold',
                                            d.pct >= 100 ? 'text-emerald-500' : d.pct >= universalThreshold ? 'text-amber-500' : 'text-slate-400'
                                        )}
                                    >
                                        {ndm === 'value' && `${d.val.toFixed(1)} mg`}
                                        {ndm === 'percentage' && `${d.pct}%`}
                                        {ndm === 'both' && `${d.val.toFixed(1)} mg (${d.pct}%)`}
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
