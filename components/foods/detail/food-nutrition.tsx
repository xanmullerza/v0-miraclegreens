import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Zap, Dna, Layers, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';

export function FoodNutrition({ ctx }: { ctx: FoodDetailContextType }) {
    const router = useRouter();
    const [universalThreshold, setUniversalThreshold] = useState<50 | 75 | 100>(75);
    const [expandedPhyto, setExpandedPhyto] = useState<string | null>(null);
    const { 
        food, amount, selectedPortion, energyUnit, dailyTargets, userRDAs, nutrientDisplayMode,
        breakdownNutrient, setBreakdownNutrient
    } = ctx;

    const getVal = (keys: string[]) => {
        if (!food) return 0;
        const m = food.micronutrients || {};
        let baseVal = 0;

        for (const k of keys) {
            let val = 0;
            if (k === 'energy_kcal') {
                if (energyUnit === 'kJ' && food.energy_kj) val = food.energy_kj;
                else val = food.energy_kcal || 0;
            }
            else if (k === 'energy_kj') {
                if (energyUnit === 'kcal' && food.energy_kcal) val = food.energy_kcal;
                else val = food.energy_kj || 0;
            }
            else if (k === 'Energy' || k === 'Calories' || k === 'calories') {
                if (energyUnit === 'kJ') val = food.energy_kj || (food.energy_kcal ? food.energy_kcal * 4.184 : 0);
                else val = food.energy_kcal || (food.energy_kj ? food.energy_kj / 4.184 : 0);
            }
            else if (k === 'protein_g') val = food.protein_g || 0;
            else if (k === 'carbs_g') val = food.carbs_g || 0;
            else if (k === 'fat_g') val = food.fat_g || 0;
            else {
                if (m[k] !== undefined) val = m[k];
                else {
                    const match = findNutrientMatch(m, k);
                    if (match) val = m[match];
                }
            }

            if (val > 0) {
                baseVal = val;
                break;
            }
        }

        if (baseVal === 0 && (keys.includes('fat_g') || keys.includes('Fat'))) {
            const sat = m['Saturated Fat'] || 0;
            const mono = m['Monounsaturated Fat'] || 0;
            const poly = m['Polyunsaturated Fat'] || 0;
            const trans = m['Trans Fat'] || 0;
            const sum = sat + mono + poly + trans;
            if (sum > 0) baseVal = sum;
        }

        if (baseVal === 0 && keys.some(k => k.toLowerCase().includes('energy') || k.toLowerCase().includes('calorie'))) {
            const p = food.protein_g || 0;
            const c = food.carbs_g || 0;
            const f = food.fat_g || 0;
            if (p > 0 || c > 0 || f > 0) {
                const kcal = (p * 4) + (c * 4) + (f * 9);
                baseVal = energyUnit === 'kJ' ? kcal * 4.184 : kcal;
            }
        }

        const currentWeight = selectedPortion ? (amount * selectedPortion.weight_g) : amount;
        return (baseVal * currentWeight) / 100;
    };

    const NUTRIENT_BREAKDOWNS: Record<string, any[]> = {
        'Vitamin A': [
            { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
            { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
            { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
            { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
            { label: 'Lutein + Zeaxanthin', keys: ['Lutein + Zeaxanthin', 'Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
            { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
        ],
        'Vitamin E': [
            { label: 'Alpha-tocopherol', keys: ['Alpha-tocopherol', 'Vitamin E', 'alpha_tocopherol_mg'], unit: 'mg' },
            { label: 'Beta-tocopherol', keys: ['Beta-tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
            { label: 'Delta-tocopherol', keys: ['Delta-tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
            { label: 'Gamma-tocopherol', keys: ['Gamma-tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
        ],
        'Protein': [
            { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
            { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
            { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
            { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
            { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
            { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
            { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
            { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
            { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
        ],
        'Carbs': [
            { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
            { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
            { label: 'Sugars', keys: ['Sugars', 'sugars_g'], unit: 'g' },
        ],
        'Fat': [
            { label: 'Saturated Fat', keys: ['Saturated Fat'], unit: 'g' },
            { label: 'Monounsaturated', keys: ['Monounsaturated Fat'], unit: 'g' },
            { label: 'Polyunsaturated', keys: ['Polyunsaturated Fat'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3'], unit: 'g', isExpandable: true },
            { label: 'ALA', keys: ['ALA', 'alpha_linolenic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'EPA', keys: ['EPA', 'eicosapentaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'DHA', keys: ['DHA', 'docosahexaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
            { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
            { label: 'Cholesterol', keys: ['Cholesterol'], unit: 'mg' },
        ],
    };

    if (!food) return null;

    // Modern Macronutrients component with donut chart
    const MacroNutrients = ({ getVal, energyUnit, dailyTargets, userRDAs }: any) => {
        const eV = getVal(['Energy', 'energy_kcal', 'Calories']);
        const pV = getVal(['Protein', 'protein_g']);
        const cV = getVal(['Carbohydrates', 'carbs_g']);
        const fV = getVal(['Fat', 'fat_g']);

        const pR = userRDAs?.['Protein'] || dailyTargets.protein;
        const cR = userRDAs?.['Carbs'] || dailyTargets.carbs;
        const fR = userRDAs?.['Fat'] || dailyTargets.fat;
        const eR = userRDAs?.['Energy'] || dailyTargets.energy;

        const pP = Math.min(Math.round((pV / pR) * 100), 100);
        const cP = Math.min(Math.round((cV / cR) * 100), 100);
        const fP = Math.min(Math.round((fV / fR) * 100), 100);

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

        return (
            <div className="space-y-6 p-6 pt-5 rounded-3xl border bg-gradient-to-br bg-slate-900 border-slate-800 mb-6">
                <div className="flex items-center justify-between">
                    <h4 className="font-black flex items-center gap-2 uppercase tracking-widest text-[10px] text-orange-400">
                        <Zap className="h-4 w-4" /> Macronutrients
                    </h4>
                    <div className="flex bg-slate-700 rounded-lg p-0.5 border border-slate-600">
                        {([50, 75, 100] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setUniversalThreshold(t)}
                                className={cn('flex-1 text-[10px] font-black py-1.5 px-2 rounded-md transition-all uppercase tracking-widest',
                                    universalThreshold === t ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300')}
                            >
                                {t}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Macros Grid - Donut + 3 Cards */}
                <div className="flex gap-3">
                    {/* Energy Donut */}
                    <div className="flex-shrink-0 p-4 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                            <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                                <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth={STR} className="text-slate-700" />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#3b82f6" strokeWidth={STR} strokeLinecap="butt" style={{ ...cS, transition: 'all 0.7s ease' }} />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#f59e0b" strokeWidth={STR} strokeLinecap="butt" style={{ ...fS, transition: 'all 0.7s ease' }} />
                                <circle cx="48" cy="48" r={R} fill="none" stroke="#f43f5e" strokeWidth={STR} strokeLinecap="butt" style={{ ...pS, transition: 'all 0.7s ease' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-black text-white leading-none">
                                    {Math.round(eV)}
                                </span>
                                <span className="text-[8px] text-slate-400 font-bold mt-0.5">{energyUnit}</span>
                            </div>
                        </div>
                    </div>

                    {/* Macro Cards */}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                        {/* Carbs */}
                        <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Carbs</p>
                                <p className="text-sm font-bold text-white">
                                    {cV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({cP}%)</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(cP, 100)}%`, backgroundColor: '#3b82f6' }} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{cV.toFixed(1)}g</span>
                                    <span>{cR.toFixed(1)}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Protein */}
                        <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-1">Protein</p>
                                <p className="text-sm font-bold text-white">
                                    {pV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({pP}%)</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pP, 100)}%`, backgroundColor: '#f43f5e' }} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{pV.toFixed(1)}g</span>
                                    <span>{pR.toFixed(1)}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Fat */}
                        <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/50 flex flex-col gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1">Fat</p>
                                <p className="text-sm font-bold text-white">
                                    {fV.toFixed(1)}g <span className="text-[10px] text-slate-400 font-normal">({fP}%)</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(fP, 100)}%`, backgroundColor: '#f59e0b' }} />
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                                    <span>{fV.toFixed(1)}g</span>
                                    <span>{fR.toFixed(1)}g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Modern micronutrients component
    const MicroNutrients = ({ getVal, userRDAs }: any) => {
        const nv = (keys: string[]) => {
            const v = getVal(keys);
            return v !== null ? v : 0;
        };

        // Electrolytes & Trace data
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

        return (
            <div className="space-y-6">
                {/* Vitamins + Minerals Two Column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Vitamins (Left) */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-black uppercase tracking-widest text-violet-400">Vitamins + Choline</div>
                                <div className="text-[10px] font-bold text-violet-400 bg-violet-500/20 px-2.5 py-1 rounded-full">
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
                                        <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-violet-400' : 'text-slate-400')}>
                                            {d.label}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold',
                                                d.pct >= 100 ? 'text-emerald-400' : d.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-500'
                                            )}
                                        >
                                            {nutrientDisplayMode === 'value' && `${d.val.toFixed(1)}`}
                                            {nutrientDisplayMode === 'percentage' && `${d.pct}%`}
                                            {nutrientDisplayMode === 'both' && `${d.val.toFixed(1)} (${d.pct}%)`}
                                        </span>
                                    </div>
                                );
                            })}
                            <div className="border-t border-slate-700 pt-2 mt-2">
                                <div className="flex items-center justify-between">
                                    <span className={cn('text-[10px] font-semibold', cholineData.pct >= universalThreshold ? 'text-violet-400' : 'text-slate-400')}>
                                        Choline
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-bold',
                                            cholineData.pct >= 100 ? 'text-emerald-400' : cholineData.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-500'
                                        )}
                                    >
                                        {nutrientDisplayMode === 'value' && `${cholineData.val.toFixed(1)} mg`}
                                        {nutrientDisplayMode === 'percentage' && `${cholineData.pct}%`}
                                        {nutrientDisplayMode === 'both' && `${cholineData.val.toFixed(1)} mg (${cholineData.pct}%)`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Minerals (Right) */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-black uppercase tracking-widest text-teal-400">Minerals</div>
                                <div className="text-[10px] font-bold text-teal-400 bg-teal-500/20 px-2.5 py-1 rounded-full">
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
                                        <span className={cn('text-[10px] font-semibold', meetsThreshold ? 'text-teal-400' : 'text-slate-400')}>
                                            {d.label}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[10px] font-bold',
                                                d.pct >= 100 ? 'text-emerald-400' : d.pct >= universalThreshold ? 'text-amber-400' : 'text-slate-500'
                                            )}
                                        >
                                            {nutrientDisplayMode === 'value' && `${d.val.toFixed(1)} mg`}
                                            {nutrientDisplayMode === 'percentage' && `${d.pct}%`}
                                            {nutrientDisplayMode === 'both' && `${d.val.toFixed(1)} mg (${d.pct}%)`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
            <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6 flex items-center justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 italic flex items-center gap-2 shrink-0">
                    <Activity size={18} />
                    Essential Nutrients
                </h3>
                <span className="text-xs font-black italic text-slate-400 tracking-tight">
                    {selectedPortion ? `${amount} × ${selectedPortion.label}` : `${amount}g`}
                </span>
            </div>

            <MacroNutrients getVal={getVal} energyUnit={energyUnit} dailyTargets={dailyTargets} userRDAs={userRDAs} />

            <MicroNutrients getVal={getVal} userRDAs={userRDAs} />

            <Phytonutrients />

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && food.micronutrients && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setBreakdownNutrient(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBreakdownNutrient(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-current/10",
                                breakdownNutrient === 'Protein' ? "bg-red-100 text-red-600" :
                                    breakdownNutrient === 'Carbs' ? "bg-amber-100 text-amber-600" :
                                        breakdownNutrient === 'Fat' ? "bg-orange-100 text-orange-600" :
                                            "bg-emerald-100 text-emerald-600"
                            )}>
                                <Layers className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">{breakdownNutrient}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Breakdown</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                const items = NUTRIENT_BREAKDOWNS[breakdownNutrient] || [];
                                return items.map((item, idx) => {
                                    const val = getVal(item.keys);
                                    return (
                                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">
                                                        {item.label}
                                                        {item.isEssential && <span className="ml-2 text-[8px] px-2 py-0.5 bg-emerald-500 text-white rounded-md uppercase font-black">Essential</span>}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">{val.toFixed(2)}</span>
                                                    <span className="ml-1 text-[10px] font-bold text-slate-400 uppercase">{item.unit === 'µg' ? 'µg' : item.unit}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar for constituent */}
                                            {(() => {
                                                const rda = userRDAs?.[item.label];
                                                if (!rda || val === 0) return null;
                                                const pct = Math.min(100, Math.round((val / rda) * 100));
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full transition-all duration-1000 bg-emerald-500"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-40">
                                                            <span>Target Progress</span>
                                                            <span>{pct}% of {rda.toFixed(1)}{item.unit === 'µg' ? 'µg' : item.unit}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Values represent a customized {selectedPortion ? `${amount} × ${selectedPortion.label}` : `${amount}g`} sample volume</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
