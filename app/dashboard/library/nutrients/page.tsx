'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
    Search,
    X,
    Library
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

const NUTRIENTS = [
    { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B3 (Niacin)', label: 'B3 (Niacin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B9 (Folate)', label: 'B9 (Folate)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'Calcium', label: 'Calcium', unit: 'mg', color: 'bg-slate-500', icon: Gem },
    { id: 'carbs_g', label: 'Carbs', unit: 'g', color: 'bg-orange-500', icon: Zap },
    { id: 'Choline', label: 'Choline', unit: 'mg', color: 'bg-indigo-500', icon: Droplet },
    { id: 'Copper', label: 'Copper', unit: 'mg', color: 'bg-rose-500', icon: Gem },
    { id: 'energy_kcal', label: 'Energy', unit: 'kcal', color: 'bg-amber-500', icon: Zap },
    { id: 'fat_g', label: 'Fat', unit: 'g', color: 'bg-amber-500', icon: Zap },
    { id: 'Fiber', label: 'Fiber', unit: 'g', color: 'bg-emerald-500', icon: Activity },
    { id: 'Iron', label: 'Iron', unit: 'mg', color: 'bg-red-500', icon: Gem },
    { id: 'Magnesium', label: 'Magnesium', unit: 'mg', color: 'bg-purple-500', icon: Gem },
    { id: 'Manganese', label: 'Manganese', unit: 'mg', color: 'bg-stone-500', icon: Gem },
    { id: 'Phosphorus', label: 'Phosphorus', unit: 'mg', color: 'bg-indigo-400', icon: Gem },
    { id: 'Potassium', label: 'Potassium', unit: 'mg', color: 'bg-sky-500', icon: Gem },
    { id: 'protein_g', label: 'Protein', unit: 'g', color: 'bg-blue-600', icon: Scale },
    { id: 'Selenium', label: 'Selenium', unit: 'µg', color: 'bg-pink-500', icon: Gem },
    { id: 'Sodium', label: 'Sodium', unit: 'mg', color: 'bg-slate-400', icon: Gem },
    { id: 'Vitamin A', label: 'Vitamin A', unit: 'µg', color: 'bg-orange-400', icon: Battery },
    { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg', color: 'bg-yellow-400', icon: Droplet },
    { id: 'Vitamin D', label: 'Vitamin D', unit: 'IU', color: 'bg-yellow-200', icon: Battery },
    { id: 'Vitamin E', label: 'Vitamin E', unit: 'mg', color: 'bg-emerald-400', icon: Battery },
    { id: 'Vitamin K', label: 'Vitamin K', unit: 'µg', color: 'bg-green-600', icon: Battery },
    { id: 'Zinc', label: 'Zinc', unit: 'mg', color: 'bg-cyan-500', icon: Gem },
    { id: 'Cholesterol', label: 'Cholesterol', unit: 'mg', color: 'bg-red-400', icon: Activity },
    { id: 'Omega-3', label: 'Omega-3', unit: 'g', color: 'bg-teal-500', icon: Droplet },
    { id: 'Oxalate', label: 'Oxalate', unit: 'mg', color: 'bg-amber-600', icon: Gem },
    { id: 'Sugar', label: 'Sugar', unit: 'g', color: 'bg-pink-400', icon: Zap },
    { id: 'welcome', label: 'Welcome', unit: '', color: 'bg-emerald-500', icon: Sparkles },
];

export default function NutrientsPage() {
    const router = useRouter();
    const pathname = usePathname();

    // We maintain a 'selected' state just for the UI of the dropdowns (to show what was last picked or highlight hierarchy)
    // But realistically, selecting one navigates away.
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | null>('welcome');

    // Filter States passed to NutrientsView if we want to filter the grid (optional, but good for "Browse" feel)
    // The user asked for the "exact same filter", which usually implies the strip of dropdowns.
    // In the Library page, those dropdowns controlled the 'Top 10' view.
    // Here, we'll use them as quick navigation or high-level filtering.
    // Since the dropdowns pick a SPECIFIC nutrient, navigation is the best UX.

    const MACROS = ['energy_kcal', 'protein_g', 'carbs_g', 'fat_g', 'Fiber'];
    const MINERALS = ['Sodium', 'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Iron', 'Zinc', 'Copper', 'Manganese', 'Selenium'];
    const VITAMINS = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline'];

    const handleNutrientSelect = (id: string) => {
        setSelectedNutrientId(id);
        const encodedId = encodeURIComponent(id);
        router.push(`/dashboard/library/nutrients/${encodedId}`);
    };

    // Hero Search State
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [isHeroActive, setIsHeroActive] = useState(false);

    const heroResults = useMemo(() => {
        if (!heroSearchQuery || heroSearchQuery.length < 1) return [];
        const q = heroSearchQuery.toLowerCase();
        return NUTRIENTS.filter(n =>
            n.id !== 'welcome' &&
            (n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
        ).slice(0, 8);
    }, [heroSearchQuery]);

    const handleHeroSearchInput = (val: string) => {
        setHeroSearchQuery(val);
    };

    const { setFilterContent } = useHeaderActions();

    useEffect(() => {
        setFilterContent(
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* Macro Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            selectedNutrientId && MACROS.includes(selectedNutrientId)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Scale size={12} />
                            <span>{selectedNutrientId && MACROS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Macros"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Macro</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {MACROS.map(id => {
                            const nutrient = NUTRIENTS.find(n => n.id === id);
                            if (!nutrient) return null;
                            return (
                                <DropdownMenuCheckboxItem
                                    key={id}
                                    checked={selectedNutrientId === id}
                                    onCheckedChange={() => handleNutrientSelect(id)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                >
                                    {nutrient.label}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Mineral Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            selectedNutrientId && MINERALS.includes(selectedNutrientId)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Gem size={12} />
                            <span>{selectedNutrientId && MINERALS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Minerals"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Mineral</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {MINERALS.map(id => {
                            const nutrient = NUTRIENTS.find(n => n.id === id);
                            if (!nutrient) return null;
                            return (
                                <DropdownMenuCheckboxItem
                                    key={id}
                                    checked={selectedNutrientId === id}
                                    onCheckedChange={() => handleNutrientSelect(id)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                >
                                    {nutrient.label}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Vitamin Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                            selectedNutrientId && VITAMINS.includes(selectedNutrientId)
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-500"
                        )}>
                            <Battery size={12} />
                            <span>{selectedNutrientId && VITAMINS.includes(selectedNutrientId) ? NUTRIENTS.find(n => n.id === selectedNutrientId)?.label : "Vitamins"}</span>
                            <ChevronDown size={10} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950 max-h-[400px] overflow-y-auto no-scrollbar">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Vitamin</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                        {VITAMINS.map(id => {
                            const nutrient = NUTRIENTS.find(n => n.id === id);
                            if (!nutrient) return null;
                            return (
                                <DropdownMenuCheckboxItem
                                    key={id}
                                    checked={selectedNutrientId === id}
                                    onCheckedChange={() => handleNutrientSelect(id)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-blue-50 dark:focus:bg-blue-900/10 focus:text-blue-600 py-2.5 cursor-pointer"
                                >
                                    {nutrient.label}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );

        return () => setFilterContent(null);
    }, [selectedNutrientId, router]); // Added dependencies

    return (
        <PageContainer maxWidth="max-w-7xl" className="-mt-12 md:-mt-16">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-0">
                <div className="flex flex-col w-full min-h-screen">

                    {/* Nutrient Search Hero Workspace */}
                    <div className="w-full md:max-w-[900px] mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col mb-10">
                        <div className="min-h-[180px] max-h-[420px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                            {isHeroActive ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    {heroResults.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {heroResults.map(nutrient => {
                                                const Icon = nutrient.icon;
                                                return (
                                                    <button
                                                        key={nutrient.id}
                                                        onClick={() => handleNutrientSelect(nutrient.id)}
                                                        className="w-full p-4 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 text-left"
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className={cn("w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center", nutrient.color + '/10')}>
                                                                <Icon size={20} className={cn(nutrient.color.replace('bg-', 'text-'))} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{nutrient.label}</h4>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                                    {nutrient.unit ? `Measured in ${nutrient.unit}` : 'Nutrient'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="text-slate-200 group-hover:text-blue-500 transition-colors shrink-0" size={20} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : heroSearchQuery.length > 0 ? (
                                        <div className="py-12 text-center text-slate-400">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                                <Search size={24} className="opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching nutrients found</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Enter nutrient name to explore</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-700">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center relative shrink-0">
                                            <Sparkles size={18} className="text-blue-500" />
                                            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Essential Nutrients Guide</h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search or use the filters above</p>
                                        </div>
                                    </div>

                                    {/* Condensed Info Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Activity size={14} className="text-emerald-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">The Basics</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Essential nutrients are substances your body needs but cannot make on its own — carbs, proteins, fats, vitamins, minerals, and water. We need all of them to stay healthy.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gem size={14} className="text-purple-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">Minerals</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Calcium strengthens bones, iron carries oxygen, potassium keeps your heart beating, and magnesium helps muscles relax. Eat a variety of vegetables, whole grains, nuts, and beans.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Battery size={14} className="text-yellow-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Vitamins</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                13 essential vitamins keep your body running — C fights infections, B vitamins give energy, D helps absorb calcium. Eat fruits, vegetables, and whole foods to cover your needs.
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap size={14} className="text-amber-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Macros</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Carbs fuel your brain, proteins build muscle, fats protect organs. Fiber keeps digestion smooth and blood sugar stable. Balance all three for optimal health.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2 rounded-b-[2.5rem]">
                            <div className="flex-1 relative flex items-center">
                                <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-blue-500/50" : "text-slate-300")}>
                                    <Search size={16} className="md:w-5 md:h-5" />
                                </div>
                                <input
                                    placeholder={isHeroActive ? "SEARCH NUTRIENTS..." : "CLICK TO SEARCH..."}
                                    className={cn(
                                        "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-12 md:h-14 rounded-[1.5rem] md:rounded-[2rem] pl-12 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300",
                                        isHeroActive
                                            ? "border-blue-500/30 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-800/80"
                                            : "border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500/20"
                                    )}
                                    value={heroSearchQuery}
                                    onFocus={() => setIsHeroActive(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsHeroActive(false);
                                            setHeroSearchQuery('');
                                        }
                                    }}
                                    onChange={(e) => {
                                        if (!isHeroActive) setIsHeroActive(true);
                                        handleHeroSearchInput(e.target.value);
                                    }}
                                />
                            </div>
                            {isHeroActive ? (
                                <button
                                    onClick={() => {
                                        setIsHeroActive(false);
                                        setHeroSearchQuery("");
                                    }}
                                    className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                                    title="Close Search"
                                >
                                    <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                                </button>
                            ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-300 flex items-center justify-center">
                                    <Search size={18} className="md:w-6 md:h-6" />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </PageContainer>
    );
}
