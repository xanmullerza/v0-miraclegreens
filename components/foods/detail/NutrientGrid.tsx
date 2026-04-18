import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';

interface NutrientGridProps {
    title: string;
    items: Record<string, string[]>;
    icon: any;
    theme?: string;
    subtitle?: string;
    breakdownLabels?: string[];
    forceRaw?: boolean;
    food?: any;
    getVal: (keys: string[]) => number;
    setBreakdownNutrient?: (nutrient: string | null) => void;
    nutrientDisplayMode?: string;
    userRDAs?: Record<string, number>;
    energyUnit?: string;
    dailyTargets?: { energy: number; protein: number; carbs: number; fat: number };
}

export function NutrientGrid({
    title,
    items,
    icon: Icon,
    theme = 'indigo',
    subtitle,
    breakdownLabels = [],
    forceRaw = false,
    food,
    getVal,
    setBreakdownNutrient,
    nutrientDisplayMode = 'percentage',
    userRDAs = {},
    energyUnit = 'kcal',
    dailyTargets = { energy: 2000, protein: 50, carbs: 300, fat: 65 },
}: NutrientGridProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const handleNutrientClick = (nutrientName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('nutrientId', nutrientName);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const themes = {
        indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
        rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
        orange: { bg: "bg-slate-900 border-slate-800", text: "text-orange-400", border: "border-slate-800", itemBorder: "border-orange-900/50" },
        emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
        blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
        amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
    };
    const t = (themes as any)[theme] || themes.indigo;

    return (
        <div className={cn("p-6 pt-5 rounded-3xl border bg-gradient-to-br mb-6", t.bg)}>
            <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
            {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(items).map(([label, keys]) => {
                    let val = 0;
                    let rda = null;
                    let unitStr = '';
                    const m = food?.micronutrients || {};

                    if (title === 'Biological Ratios') {
                        const k1 = findNutrientMatch(m, keys[0]);
                        const k2 = findNutrientMatch(m, keys[1]);
                        const v1 = k1 ? m[k1] : 0;
                        const v2 = k2 ? m[k2] : 0;
                        val = v2 > 0 ? v1 / v2 : 0;
                        unitStr = ' to 1';
                    } else {
                        val = getVal(keys as string[]);
                        const macroRDAs: Record<string, number> = {
                            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                            'Protein': dailyTargets.protein,
                            'Carbs': dailyTargets.carbs,
                            'Fat': dailyTargets.fat
                        };
                        const nutrientKey = label === 'C (Ascorbic Acid)' ? 'Vitamin C' : label === 'A (Retinol)' ? 'Vitamin A' : label === 'D (Calciferol)' ? 'Vitamin D' : label === 'E (Tocopherol)' ? 'Vitamin E' : label === 'K (Phylloquinone)' ? 'Vitamin K' : label;
                        rda = userRDAs?.[nutrientKey] || macroRDAs[label];
                        unitStr = (label === 'Energy') ? energyUnit :
                            (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars' || label === 'Starch' || label === 'Omega-3' || label === 'Omega-6') ? 'g' :
                                (label === 'Vitamin D' || label === 'D (Calciferol)') ? 'IU' :
                                    (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') || label === 'Vitamin A' || label === 'A (Retinol)' || label === 'Vitamin K' || label === 'K (Phylloquinone)' || label.includes('µg')) ? 'µg' : 'mg';
                    }

                    const pct = rda ? Math.round((val / rda) * 100) : 0;
                    let styles = getNutrientLevelStyles(pct || 0, label);

                    if (title === 'Biological Ratios') {
                        let ratioStatus: 'good' | 'fair' | 'poor' = 'good';
                        if (label === 'Sodium & Potassium') ratioStatus = val <= 1.0 ? 'good' : val <= 2.0 ? 'fair' : 'poor';
                        if (label === 'Zinc & Copper') ratioStatus = (val >= 8 && val <= 12) ? 'good' : (val >= 5 && val <= 15) ? 'fair' : 'poor';
                        if (label === 'Omega 3 to 6 ratio') ratioStatus = val <= 4.0 ? 'good' : val <= 10.0 ? 'fair' : 'poor';
                        if (label === 'Calcium & Magnesium') ratioStatus = (val >= 1.7 && val <= 2.5) ? 'good' : (val >= 1.5 && val <= 3.0) ? 'fair' : 'poor';
                        if (label === 'Calcium & Phosphorus') ratioStatus = (val >= 1.0 && val <= 2.0) ? 'good' : (val >= 0.8 && val <= 2.5) ? 'fair' : 'poor';

                        styles = ratioStatus === 'good' ? { text: "text-emerald-500", borderLight: "border-emerald-500/30", fade: "bg-emerald-500/5", textFill: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" } :
                            ratioStatus === 'fair' ? { text: "text-amber-500", borderLight: "border-amber-500/30", fade: "bg-amber-500/5", textFill: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500" } :
                                { text: "text-rose-500", borderLight: "border-rose-500/30", fade: "bg-rose-500/5", textFill: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500" };
                    }

                    const ratioTarget = title === 'Biological Ratios' ? (
                        label === 'Sodium & Potassium' ? 'Under 1 to 1' :
                            label === 'Zinc & Copper' ? '8 to 1 - 12 to 1' :
                                label === 'Omega 3 to 6 ratio' ? 'Under 4 to 1' :
                                    label === 'Calcium & Magnesium' ? '1.7 to 1 - 2.5 to 1' :
                                        label === 'Calcium & Phosphorus' ? '1 to 1 - 2 to 1' : null
                    ) : null;

                    const hasBreakdown = breakdownLabels.includes(label);

                    return (
                        <div key={label} onClick={() => handleNutrientClick(label)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                            <p className={cn(
                                "text-[9px] font-black truncate mb-1 whitespace-nowrap overflow-hidden transition-colors",
                                title === 'Biological Ratios' ? 'text-slate-400 dark:text-slate-500' : 'uppercase text-foreground/60'
                            )}>
                                {label}
                            </p>
                            <div className="space-y-0.5">
                                {(nutrientDisplayMode === 'percentage' && !forceRaw) ? (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400">
                                            {val.toFixed(1)}{unitStr}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn("text-lg font-bold", title === 'Biological Ratios' ? styles.text : "")}>{val.toFixed(1)}</span>
                                            <span className={cn("text-[10px] font-bold", (unitStr === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitStr}</span>
                                        </div>
                                        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                Target: {Math.round(rda)}{unitStr}
                                            </p>
                                        )}
                                        {ratioTarget && (
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                Ideal: {ratioTarget}
                                            </p>
                                        )}
                                        {nutrientDisplayMode === 'both' && pct > 0 && !forceRaw && (
                                            <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
                                        )}
                                    </>
                                )}
                            </div>

                            {hasBreakdown && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setBreakdownNutrient?.(label); }}
                                    className="absolute top-2 right-2 p-1 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-40 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                >
                                    <Layers className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
