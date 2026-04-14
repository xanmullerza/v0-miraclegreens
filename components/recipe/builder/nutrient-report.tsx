import React, { useState } from 'react';
import { Layers, Zap, Gem, Droplet, Sun, Pill, Info, ChevronDown, ChevronUp, Database, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipeIngredient } from './types';

interface NutrientReportProps {
    totals: any;
    userRDAs: Record<string, number>;
    ingredients: RecipeIngredient[];
    energyUnit: 'kcal' | 'kJ';
    profile: any;
}

export function NutrientReport({ totals, userRDAs, ingredients, energyUnit, profile }: NutrientReportProps) {
    const [nutrientDisplayMode, setNutrientDisplayMode] = useState<'percentage' | 'value' | 'both'>('percentage');
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);

    const useKilojoules = energyUnit === 'kJ';

    const getVal = (keys: string[]) => {
        for (const k of keys) {
            if (totals.micronutrients[k] !== undefined) return totals.micronutrients[k];
        }
        return 0;
    };

    const getNutrientLevelStyles = (pct: number, label: string) => {
        if (pct >= 100) return { text: "text-emerald-500", border: "border-emerald-500", borderLight: "border-emerald-500/30", bg: "bg-emerald-500/10", fade: "bg-emerald-500/5", label: "OPTIMAL" };
        if (pct >= 50) return { text: "text-blue-500", border: "border-blue-500", borderLight: "border-blue-500/30", bg: "bg-blue-500/10", fade: "bg-blue-500/5", label: "GOOD" };
        if (pct >= 20) return { text: "text-amber-500", border: "border-amber-500", borderLight: "border-amber-500/30", bg: "bg-amber-500/10", fade: "bg-amber-500/5", label: "FAIR" };
        return { text: "text-slate-400", border: "border-slate-800", borderLight: "border-slate-800", bg: "bg-slate-900", fade: "bg-slate-900/50", label: "LOW" };
    };

    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, forceRaw = false }: { title: string, items: Record<string, string[]>, icon: any, theme?: 'indigo' | 'rose' | 'amber' | 'emerald' | 'blue', subtitle?: string, forceRaw?: boolean }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" }
        };
        const t = (themes as any)[theme] || themes.indigo;

        return (
            <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {Object.entries(items).map(([label, keys]) => {
                        const val = getVal(keys);
                        const rda = userRDAs?.[label];
                        const pct = rda ? Math.round((val / rda) * 100) : null;
                        const styles = getNutrientLevelStyles(pct || 0, label);
                        const unit = label === "Vitamin D" ? "IU" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "µg" : "mg";
                        
                        return (
                            <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 transition-all", t.itemBorder, pct !== null && !forceRaw ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold">
                                        {nutrientDisplayMode === "percentage" && pct !== null && !forceRaw ? `${pct}%` : (val >= 1 ? val.toFixed(1) : val.toFixed(2))}
                                    </span>
                                    {(nutrientDisplayMode !== "percentage" || forceRaw) && (
                                        <span className={cn("text-[10px] font-black opacity-60")}>
                                            {unit}
                                        </span>
                                    )}
                                </div>
                                {pct !== null && !forceRaw && (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                            <div className="text-[10px] font-bold text-slate-400 opacity-80">RDA: {rda}{unit}</div>
                                        )}
                                        {(nutrientDisplayMode === 'percentage' || nutrientDisplayMode === 'both') && (
                                            <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    {(['percentage', 'value', 'both'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setNutrientDisplayMode(mode)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                nutrientDisplayMode === mode ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Macros Breakdown */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
                <div>
                    <h4 className="font-black flex items-center gap-2 mb-1 text-orange-400 uppercase tracking-widest text-[10px]"><Zap className="h-4 w-4" /> Macronutrients</h4>
                    <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Analysis of primary fuel sources</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Energy', val: useKilojoules ? totals.energy_kj : totals.calories, target: 2000, unit: useKilojoules ? 'kJ' : 'kcal' },
                            { label: 'Protein', val: totals.protein, target: 50, unit: 'g' },
                            { label: 'Carbs', val: totals.carbs, target: 250, unit: 'g' },
                            { label: 'Fat', val: totals.fat, target: 70, unit: 'g' },
                        ].map(macro => {
                            const pct = Math.round((macro.val / macro.target) * 100);
                            const styles = getNutrientLevelStyles(pct, macro.label);
                            return (
                                <div key={macro.label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 transition-all relative group flex flex-col justify-between", styles.borderLight, styles.fade)}>
                                    <div>
                                        <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{macro.label}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black">
                                                {nutrientDisplayMode === 'percentage' ? `${pct}%` : (macro.val >= 1 ? macro.val.toFixed(1) : macro.val.toFixed(2))}
                                            </span>
                                            {nutrientDisplayMode !== 'percentage' && (
                                                <span className="text-[10px] text-muted-foreground font-bold">{macro.unit}</span>
                                            )}
                                        </div>
                                        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && (
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Target: {macro.target}{macro.unit}</p>
                                        )}
                                        {nutrientDisplayMode === 'both' && (
                                            <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
                                        )}
                                    </div>
                                    {['Protein', 'Carbs', 'Fat'].includes(macro.label) && (
                                        <button
                                            onClick={() => setBreakdownNutrient(breakdownNutrient === macro.label ? null : macro.label)}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-60 group-hover:opacity-100 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                        >
                                            <Layers className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* Nutrient Breakdown Table */}
                    {breakdownNutrient && (
                        <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-orange-900/30 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                                    <Layers size={12} /> {breakdownNutrient} Source Analysis
                                </h5>
                                <button onClick={() => setBreakdownNutrient(null)} className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-black">Close</button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {ingredients.map((ing, idx) => {
                                    const multiplier = (ing.weight_g || 0) / 100;
                                    const val = (breakdownNutrient === 'Protein' ? ing.protein : breakdownNutrient === 'Carbs' ? ing.carbs : ing.fat) * multiplier;
                                    const total = (breakdownNutrient === 'Protein' ? totals.protein : breakdownNutrient === 'Carbs' ? totals.carbs : totals.fat);
                                    const share = total > 0 ? Math.round((val / total) * 100) : 0;
                                    if (val <= 0) return null;
                                    return (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-1">
                                                    {ing.food_item_name}
                                                    {ing.source === 'usda' ? (
                                                        <Globe size={8} className="text-blue-400" />
                                                    ) : ing.source === 'local' ? (
                                                        <Database size={8} className="text-green-400" />
                                                    ) : null}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-mono text-slate-500">{val.toFixed(1)}g</span>
                                                <span className="text-[10px] font-black text-orange-400 w-12 text-right">{share}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration & Mineral Balance" items={{
                'Sodium': ['Sodium', 'sodium_mg'],
                'Potassium': ['Potassium', 'potassium_mg'],
                'Magnesium': ['Magnesium', 'magnesium_mg'],
                'Calcium': ['Calcium', 'calcium_mg'],
                'Phosphorus': ['Phosphorus', 'phosphorus_mg']
            }} />

            <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-nutrients" items={{
                'Iron': ['Iron', 'iron_mg'],
                'Zinc': ['Zinc', 'zinc_mg'],
                'Copper': ['Copper', 'copper_mg'],
                'Manganese': ['Manganese', 'manganese_mg'],
                'Selenium': ['Selenium', 'selenium_ug']
            }} />

            <NutrientGrid title="Water-Soluble Vitamins" icon={Droplet} theme="blue" subtitle="B-Complex & Vitamin C" items={{
                'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                'B5 (Pantothenic)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
            }} />

            <NutrientGrid title="Fat-Soluble Vitamins" icon={Sun} theme="amber" subtitle="A, D, E, K Bio-availability" items={{
                'Vitamin A': ['Vitamin A', 'vitamin_a_rae_ug'],
                'Vitamin D': ['Vitamin D', 'vitamin_d_iu'],
                'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
            }} />
        </div>
    );
}
