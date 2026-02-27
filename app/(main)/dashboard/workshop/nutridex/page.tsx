'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity,
    Scale,
    ChevronDown,
    ChevronRight,
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
import { HeaderFilter } from '@/lib/context/header-actions-context';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';

// --- Sub-components ---

const NutrientItem = ({
    label,
    rda,
    unitStr,
    onClick,
    themeBorder,
    isSelected
}: {
    label: string,
    rda: number,
    unitStr: string,
    onClick: () => void,
    themeBorder: string,
    isSelected: boolean
}) => (
    <div
        onClick={onClick}
        className={cn(
            "p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all relative group",
            themeBorder,
            isSelected && "ring-2 ring-blue-500 shadow-lg"
        )}
    >
        <p className="text-[9px] font-black truncate mb-2 uppercase text-foreground/60 tracking-widest group-hover:text-blue-500 transition-colors">
            {label}
        </p>
        <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                    {rda > 0 ? (rda >= 100 ? Math.round(rda) : parseFloat(rda.toFixed(1))) : '—'}
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

const NutrientGrid = ({
    title,
    items,
    icon: Icon,
    theme = 'indigo',
    subtitle,
    energyUnit,
    dailyTargets,
    userRDAs,
    onSelect,
    selectedId
}: {
    title: string,
    items: Record<string, string[]>,
    icon: any,
    theme?: string,
    subtitle?: string,
    energyUnit: 'kJ' | 'kcal',
    dailyTargets: any,
    userRDAs: any,
    onSelect: (id: string) => void,
    selectedId: string | null
}) => {
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
                    let unitStr = (label === 'Energy') ? energyUnit :
                        (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars' || label === 'ALA' || label === 'Water') ? 'g' :
                            (label === 'Vitamin D') ? 'IU' :
                                (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';

                    const macroRDAs: Record<string, number> = {
                        'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                        'Protein': dailyTargets.protein,
                        'Carbs': dailyTargets.carbs,
                        'Fat': dailyTargets.fat,
                        'Fiber': (dailyTargets.energy / 1000) * 14,
                        'Sugars': (dailyTargets.energy * 0.10) / 4
                    };

                    rda = userRDAs?.[label] || macroRDAs[label] || 0;

                    return (
                        <NutrientItem
                            key={label}
                            label={label}
                            rda={rda}
                            unitStr={unitStr}
                            onClick={() => onSelect(label)}
                            themeBorder={t.itemBorder}
                            isSelected={selectedId === label}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// --- Main Page ---

export default function NutrientsPage() {
    const router = useRouter();
    const { profile, dailyTargets, energyUnit } = useUserPreferences();
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>(null);

    // HeroSearch state for nutrient search
    const [heroQuery, setHeroQuery] = useState('');
    const [heroResults, setHeroResults] = useState<{ id: string; label: string; group: string }[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);

    // All searchable nutrients
    const ALL_NUTRIENTS = useMemo(() => [
        { id: 'Energy', label: 'Energy', group: 'Macros' },
        { id: 'Protein', label: 'Protein', group: 'Macros' },
        { id: 'Carbs', label: 'Carbs', group: 'Macros' },
        { id: 'Fat', label: 'Fat', group: 'Macros' },
        { id: 'Sodium', label: 'Sodium', group: 'Electrolytes' },
        { id: 'Potassium', label: 'Potassium', group: 'Electrolytes' },
        { id: 'Magnesium', label: 'Magnesium', group: 'Electrolytes' },
        { id: 'Calcium', label: 'Calcium', group: 'Electrolytes' },
        { id: 'Phosphorus', label: 'Phosphorus', group: 'Electrolytes' },
        { id: 'Iron', label: 'Iron', group: 'Minerals' },
        { id: 'Zinc', label: 'Zinc', group: 'Minerals' },
        { id: 'Copper', label: 'Copper', group: 'Minerals' },
        { id: 'Manganese', label: 'Manganese', group: 'Minerals' },
        { id: 'Selenium', label: 'Selenium', group: 'Minerals' },
        { id: 'Vitamin A', label: 'Vitamin A', group: 'Vitamins' },
        { id: 'Vitamin D', label: 'Vitamin D', group: 'Vitamins' },
        { id: 'Vitamin E', label: 'Vitamin E', group: 'Vitamins' },
        { id: 'Vitamin K', label: 'Vitamin K', group: 'Vitamins' },
        { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', group: 'Vitamins' },
        { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', group: 'Vitamins' },
        { id: 'B3 (Niacin)', label: 'B3 (Niacin)', group: 'Vitamins' },
        { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', group: 'Vitamins' },
        { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', group: 'Vitamins' },
        { id: 'B7 (Biotin)', label: 'B7 (Biotin)', group: 'Vitamins' },
        { id: 'B9 (Folate)', label: 'B9 (Folate)', group: 'Vitamins' },
        { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', group: 'Vitamins' },
        { id: 'Vitamin C', label: 'Vitamin C', group: 'Vitamins' },
        { id: 'Choline', label: 'Choline', group: 'Other' },
        { id: 'Fiber', label: 'Fiber', group: 'Other' },
        { id: 'Omega-3', label: 'Omega-3', group: 'Other' },
        { id: 'ALA', label: 'ALA', group: 'Other' },
        { id: 'Sugars', label: 'Sugars', group: 'Other' },
        { id: 'Cholesterol', label: 'Cholesterol', group: 'Other' },
        { id: 'Water', label: 'Water', group: 'Other' },
    ], []);

    const handleHeroInput = useCallback((val: string) => {
        setHeroQuery(val);
        if (!val || val.length < 1) { setHeroResults([]); return; }
        const q = val.toLowerCase();
        const matches = ALL_NUTRIENTS.filter(n =>
            n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
        );
        setHeroResults(matches);
    }, [ALL_NUTRIENTS]);

    // Context-aware RDAs for the profile
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    const handleNutrientSelect = useCallback((id: string) => {
        setSelectedNutrientId(id);
        const encodedId = encodeURIComponent(id);
        router.push(`/dashboard/workshop/nutridex/${encodedId}`);
    }, [router]);

    // Data Maps
    const MACROS_MAP = useMemo(() => ({
        'Energy': ['Energy'], 'Protein': ['Protein'], 'Carbs': ['Carbohydrates'], 'Fat': ['Fat']
    }), []);

    const MINERALS_MAP = useMemo(() => ({
        'Sodium': ['Sodium'], 'Potassium': ['Potassium'], 'Magnesium': ['Magnesium'], 'Calcium': ['Calcium'],
        'Phosphorus': ['Phosphorus'], 'Iron': ['Iron'], 'Zinc': ['Zinc'], 'Copper': ['Copper'],
        'Manganese': ['Manganese'], 'Selenium': ['Selenium']
    }), []);

    const VITAMINS_MAP = useMemo(() => ({
        'Vitamin A': ['Vitamin A'], 'Vitamin D': ['Vitamin D'], 'Vitamin E': ['Vitamin E'], 'Vitamin K': ['Vitamin K'],
        'B1 (Thiamine)': ['B1 (Thiamine)'], 'B2 (Riboflavin)': ['B2 (Riboflavin)'], 'B3 (Niacin)': ['B3 (Niacin)'],
        'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)'], 'B6 (Pyridoxine)': ['B6 (Pyridoxine)'],
        'B7 (Biotin)': ['Biotin'], 'B9 (Folate)': ['B9 (Folate)'], 'B12 (Cobalamin)': ['B12 (Cobalamin)'], 'Vitamin C': ['Vitamin C']
    }), []);

    const OTHER_MAP = useMemo(() => ({
        'Fiber': ['Fiber'], 'Choline': ['Choline'], 'Omega-3': ['Omega-3'], 'ALA': ['ALA'],
        'EPA + DHA': ['EPA + DHA'], 'Oxalate': ['Oxalate'], 'Sugars': ['Sugars'], 'Cholesterol': ['Cholesterol'], 'Water': ['Water']
    }), []);

    const headerFilterItems = useMemo(() => (
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
                            checked={selectedNutrientId === id}
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
                            checked={selectedNutrientId === id}
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
                            checked={selectedNutrientId === id}
                            onCheckedChange={() => handleNutrientSelect(id)}
                            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 py-2.5 cursor-pointer"
                        >
                            {id}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    ), [handleNutrientSelect, MACROS_MAP, MINERALS_MAP, VITAMINS_MAP, selectedNutrientId]);

    return (
        <PageContainer maxWidth="max-w-6xl">
            {/* Header Injection via Component to avoid useEffect loop */}
            <HeaderFilter>
                {headerFilterItems}
            </HeaderFilter>

            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-4">

                {/* Hero Search for Nutrients */}
                <HeroSearch
                    searchQuery={heroQuery}
                    onQueryChange={handleHeroInput}
                    results={heroResults}
                    isLoading={isHeroSearching}
                    isActive={isHeroActive}
                    setIsActive={setIsHeroActive}
                    onSelect={(item) => {
                        handleNutrientSelect(item.id);
                        setIsHeroActive(false);
                        setHeroQuery('');
                    }}
                    theme="emerald"
                    placeholder="SEARCH NUTRIENTS..."
                    idleIcon={<Activity size={20} className="text-emerald-500" />}
                    idleTitle="Nutridex"
                    idleSubtitle="Search vitamins, minerals, and macronutrients"
                    noResultsMessage="No matching nutrients found"
                    enterMessage="Enter nutrient name to search"
                    searchingMessage="Searching Nutrients..."
                    renderResult={(item: any) => (
                        <div className="flex items-center gap-4 min-w-0 w-full">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Activity size={16} className="text-emerald-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{item.label}</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.group}</p>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </div>
                    )}
                />

                {/* Section Header */}
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/10">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                            Nutridex
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
                        energyUnit={energyUnit}
                        dailyTargets={dailyTargets}
                        userRDAs={userRDAs}
                        onSelect={handleNutrientSelect}
                        selectedId={selectedNutrientId}
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
