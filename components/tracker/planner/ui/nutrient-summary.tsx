import React, { useState } from 'react';
import { Scale, ChevronDown, ChevronUp, Info, HelpCircle, Activity, Heart, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { NUTRIENT_BREAKDOWNS, MORINGA_TSP } from '../utils';

interface Totals {
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients: Record<string, number>;
}

export const NutrientSummary = ({
    plan, userRDAs, unit = 'kJ', eatenMeals = new Set(), dailyMoringaGrams = 0,
}: {
    plan: any; userRDAs: any; unit?: string; eatenMeals?: Set<string>; dailyMoringaGrams?: number;
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    
    if (!plan || !userRDAs) return null;

    const mealsArray = Object.values(plan).filter((m: any) => m && typeof m === 'object');
    const totals = mealsArray.reduce((acc: Totals, recipe: any) => {
        acc.calories += recipe.calories || 0;
        acc.energy_kj += recipe.energy_kj || 0;
        acc.protein += recipe.protein || 0;
        acc.fat += recipe.fat || 0;
        acc.carbs += recipe.carbs || 0;
        
        Object.entries(recipe.micronutrients || {}).forEach(([key, val]) => {
            acc.micronutrients[key] = (acc.micronutrients[key] || 0) + (val as number);
        });
        return acc;
    }, { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} });

    // Add Moringa boost if active
    if (dailyMoringaGrams > 0) {
        const factor = dailyMoringaGrams / 2.0; // Moringa def is per 2g (1 tsp)
        totals.calories += MORINGA_TSP.energy_kcal * factor;
        totals.energy_kj += MORINGA_TSP.energy_kj * factor;
        totals.protein += MORINGA_TSP.protein_g * factor;
        totals.fat += MORINGA_TSP.fat_g * factor;
        totals.carbs += MORINGA_TSP.carbs_g * factor;
        Object.entries(MORINGA_TSP.micronutrients).forEach(([k, v]) => {
            totals.micronutrients[k] = (totals.micronutrients[k] || 0) + v * factor;
        });
    }

    const macros = [
        { label: 'Energy', val: unit === 'kJ' ? totals.energy_kj : totals.calories, target: userRDAs.Energy, unit, color: 'bg-orange-500' },
        { label: 'Protein', val: totals.protein, target: userRDAs.Protein, unit: 'g', color: 'bg-emerald-500' },
        { label: 'Fat', val: totals.fat, target: userRDAs.Fat, unit: 'g', color: 'bg-amber-500' },
        { label: 'Carbs', val: totals.carbs, target: userRDAs.Carbs, unit: 'g', color: 'bg-blue-500' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Macro Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {macros.map((m, i) => {
                    const pct = Math.min(100, (m.val / (m.target || 1)) * 100);
                    return (
                        <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
                                <span className="text-[10px] font-black text-slate-900 dark:text-white">{Math.round(pct)}%</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black">{Math.round(m.val)}</span>
                                <span className="text-[10px] font-bold text-slate-400">{m.unit}</span>
                            </div>
                            <Progress value={pct} className={cn("h-1.5", m.color)} />
                        </div>
                    );
                })}
            </div>

            {/* Micro Breakdown */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Micro-Biological Targets</h4>
                    <span className="text-[8px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full"><Activity size={10}/> Dynamic Analysis</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(userRDAs).map(([key, target]: [string, any]) => {
                        if (['Energy', 'Protein', 'Fat', 'Carbs'].includes(key)) return null;
                        const val = totals.micronutrients[key] || 0;
                        const pct = Math.min(100, (val / (target || 1)) * 100);
                        const isHit = pct >= 100;

                        return (
                            <div key={key} className="group py-2 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors px-2 rounded-lg">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-tight">{key}</span>
                                        {isHit && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />}
                                    </div>
                                    <span className={cn("text-[10px] font-black", isHit ? "text-emerald-500" : "text-slate-400")}>{Math.round(pct)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full transition-all duration-1000", isHit ? "bg-emerald-500" : pct > 75 ? "bg-blue-500" : "bg-slate-400")} 
                                        style={{ width: `${pct}%` }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
