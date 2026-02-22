'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity,
    Scale,
    ChevronDown,
    Gem,
    Battery,
    Sparkles,
    Droplet,
    Zap,
    Library,
    Dna,
    Target
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { PageContainer } from '@/components/ui/page-container';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';

export default function NutrientsPage() {
    const router = useRouter();
    const { profile, dailyTargets, energyUnit } = useUserPreferences();
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>(null);

    // Context-aware RDAs for the profile
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    const handleNutrientSelect = (id: string) => {
        const encodedId = encodeURIComponent(id);
        router.push(`/dashboard/library/nutrients/${encodedId}`);
    };

    // Header Actions
    const { setFilterContent } = useHeaderActions();

    // Groups for sections
    const MACROS_MAP = {
        'Energy': ['Energy', 'energy_kcal', 'Calories'],
        'Protein': ['Protein', 'protein_g'],
        'Carbs': ['Carbohydrates', 'Carbs', 'carbs_g'],
        'Fat': ['Fat', 'fat_g']
    };

    const MINERALS_MAP = {
        'Sodium': ['Sodium', 'sodium_mg'],
        'Potassium': ['Potassium', 'potassium_mg'],
        'Magnesium': ['Magnesium', 'magnesium_mg'],
        'Calcium': ['Calcium', 'calcium_mg'],
        'Phosphorus': ['Phosphorus', 'phosphorus_mg'],
        'Iron': ['Iron', 'iron_mg'],
        'Zinc': ['Zinc', 'zinc_mg'],
        'Copper': ['Copper', 'copper_mg'],
        'Manganese': ['Manganese', 'manganese_mg'],
        'Selenium': ['Selenium', 'selenium_ug']
    };

    const VITAMINS_MAP = {
        'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
        'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
        'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
        'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
        'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
        'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
        'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
        'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
        'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
        'B7 (Biotin)': ['Biotin', 'B7 (Biotin)', 'biotin_ug'],
        'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
        'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
        'Vitamin C': ['Vitamin C', 'vitamin_c_mg']
    };

    const OTHER_MAP = {
        'Fiber': ['Fiber', 'fiber_g'],
        'Choline': ['Choline', 'choline_mg'],
        'Omega-3': ['Omega-3', 'omega_3_g'],
        'ALA': ['ALA', 'alpha_linolenic_acid_g'],
        'EPA + DHA': ['EPA + DHA', 'epa_dha_combined_mg'],
        'Oxalate': ['Oxalate', 'oxalate_mg'],
        'Sugars': ['Sugars', 'Sugar', 'sugars_g'],
        'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
        'Water': ['Water', 'water_g']
    };

    useEffect(() => {
        setFilterContent(
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 flex items-center gap-2 shrink-0 shadow-sm outline-none transition-all">
                            <Scale size={12} />
                            <span>Macros</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                        {Object.keys(MACROS_MAP).map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                onCheckedChange={() => handleNutrientSelect(id)}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 flex items-center gap-2 shrink-0 shadow-sm outline-none transition-all">
                            <Gem size={12} />
                            <span>Minerals</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        {Object.keys(MINERALS_MAP).map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                onCheckedChange={() => handleNutrientSelect(id)}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500 flex items-center gap-2 shrink-0 shadow-sm outline-none transition-all">
                            <Battery size={12} />
                            <span>Vitamins</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        {Object.keys(VITAMINS_MAP).map(id => (
                            <DropdownMenuCheckboxItem
                                key={id}
                                onCheckedChange={() => handleNutrientSelect(id)}
                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer"
                            >
                                {id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
        return () => setFilterContent(null);
    }, [handleNutrientSelect, dailyTargets, profile, energyUnit, userRDAs]);

    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, string[]>, icon: any, theme?: string, subtitle?: string }) => {
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
            <div className={cn("p-6 pt-5 rounded-[2.5rem] border bg-gradient-to-br mb-10", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}>
                    <Icon className="h-4 w-4" /> {title}
                </h4>
                {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(items).map(([label, keys]) => {
                        let rda = 0;
                        let unitStr = '';

                        // Special handling for Energy units to match preferred kJ/kcal
                        const macroRDAs: Record<string, number> = {
                            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                            'Protein': dailyTargets.protein,
                            'Carbs': dailyTargets.carbs,
                            'Fat': dailyTargets.fat,
                            'Fiber': (dailyTargets.energy / 1000) * 14,
                            'Sugars': (dailyTargets.energy * 0.10) / 4
                        };

                        // Primary RDA lookup
                        rda = userRDAs?.[label] || macroRDAs[label] || 0;

                        // Fallback unit determination
                        unitStr = (label === 'Energy') ? energyUnit :
                            (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars' || label === 'ALA' || label === 'Water') ? 'g' :
                                (label === 'Vitamin D') ? 'IU' :
                                    (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';

                        return (
                            <div
                                key={label}
                                onClick={() => handleNutrientSelect(label)}
                                className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all relative group", t.itemBorder)}
                            >
                                <p className="text-[9px] font-black truncate mb-2 uppercase text-foreground/60 tracking-widest group-hover:text-blue-500 transition-colors">
                                    {label}
                                </p>
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                                            {rda > 0 ? (rda >= 100 ? Math.round(rda) : rda.toFixed(1)) : '—'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground">{unitStr}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Target size={10} className="text-emerald-500/50" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            Daily Target
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <PageContainer maxWidth="max-w-6xl">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-4">

                {/* Section Header */}
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/10">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                            Essential Nutrients
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                            Biological reference guide & profile targets
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <NutrientGrid
                        title="Macronutrients"
                        icon={Zap}
                        theme="orange"
                        subtitle="Detailed breakdown of energy and macro density"
                        items={MACROS_MAP}
                    />

                    <NutrientGrid
                        title="Electrolytes"
                        icon={Zap}
                        theme="indigo"
                        subtitle="Essential minerals for cellular hydration and nerve signal transmission"
                        items={{
                            'Sodium': MINERALS_MAP['Sodium'],
                            'Potassium': MINERALS_MAP['Potassium'],
                            'Magnesium': MINERALS_MAP['Magnesium'],
                            'Calcium': MINERALS_MAP['Calcium'],
                            'Phosphorus': MINERALS_MAP['Phosphorus']
                        }}
                    />

                    <NutrientGrid
                        title="Trace Minerals"
                        icon={Gem}
                        theme="rose"
                        subtitle="Essential minerals for energy and immune support"
                        items={{
                            'Iron': MINERALS_MAP['Iron'],
                            'Zinc': MINERALS_MAP['Zinc'],
                            'Copper': MINERALS_MAP['Copper'],
                            'Manganese': MINERALS_MAP['Manganese'],
                            'Selenium': MINERALS_MAP['Selenium']
                        }}
                    />

                    <NutrientGrid
                        title="Water-Soluble Vitamins"
                        icon={Droplet}
                        theme="blue"
                        subtitle="Daily vitamins for a healthy mind and body"
                        items={{
                            'B1 (Thiamine)': VITAMINS_MAP['B1 (Thiamine)'],
                            'B2 (Riboflavin)': VITAMINS_MAP['B2 (Riboflavin)'],
                            'B3 (Niacin)': VITAMINS_MAP['B3 (Niacin)'],
                            'B5 (Pantothenic Acid)': VITAMINS_MAP['B5 (Pantothenic Acid)'],
                            'B6 (Pyridoxine)': VITAMINS_MAP['B6 (Pyridoxine)'],
                            'B7 (Biotin)': VITAMINS_MAP['B7 (Biotin)'],
                            'B9 (Folate)': VITAMINS_MAP['B9 (Folate)'],
                            'B12 (Cobalamin)': VITAMINS_MAP['B12 (Cobalamin)'],
                            'Vitamin C': VITAMINS_MAP['Vitamin C'],
                            'Choline': OTHER_MAP['Choline']
                        }}
                    />

                    <NutrientGrid
                        title="Fat-Soluble Vitamins"
                        icon={Battery}
                        theme="emerald"
                        subtitle="Stored vitamins for long-term vitality"
                        items={{
                            'Vitamin A': VITAMINS_MAP['Vitamin A'],
                            'Vitamin D': VITAMINS_MAP['Vitamin D'],
                            'Vitamin E': VITAMINS_MAP['Vitamin E'],
                            'Vitamin K': VITAMINS_MAP['Vitamin K'],
                        }}
                    />

                    <div className="pt-8 px-2 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Dna size={18} className="text-amber-500" />
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic">Advanced Nutrition</h3>
                        </div>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <NutrientGrid
                        title="Extra Markers"
                        icon={Activity}
                        theme="amber"
                        subtitle="Key health markers and constituent nutrients"
                        items={OTHER_MAP}
                    />
                </div>

                {/* Info Card at the bottom */}
                <div className="pt-10">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                            <Sparkles size={32} />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-500">Biological Reference</h4>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Profile-Aware Intelligence</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-blue-500/20 pl-6">
                                "The targets shown above are custom-calculated based on your age, gender, and activity levels. Tap any card to discover life-enhancing benefits, deficiency warnings, and the best whole-food sources."
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}
