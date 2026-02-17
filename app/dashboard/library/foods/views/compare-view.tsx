'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    X,
    Activity,
    Zap,
    Droplet,
    Gem,
    Battery,
    Scale,
    Trash2,
    Plus,
    Info,
    Beef,
    Trophy,
    Medal,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    image: string | null;
    micronutrients: Record<string, any>;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
}

const NUTRIENT_GROUPS = [
    {
        title: "Macronutrients",
        icon: Zap,
        theme: "orange",
        keys: [
            { label: 'Energy', key: 'energy_kcal', unit: 'kcal' },
            { label: 'Protein', key: 'protein_g', unit: 'g' },
            { label: 'Carbs', key: 'carbs_g', unit: 'g' },
            { label: 'Fat', key: 'fat_g', unit: 'g' },
            { label: 'Fiber', key: 'fiber_g', unit: 'g' }
        ]
    },
    {
        title: "Electrolytes",
        icon: Droplet,
        theme: "indigo",
        keys: [
            { label: 'Potassium', key: 'Potassium', unit: 'mg' },
            { label: 'Magnesium', key: 'Magnesium', unit: 'mg' },
            { label: 'Calcium', key: 'Calcium', unit: 'mg' },
            { label: 'Sodium', key: 'Sodium', unit: 'mg' },
            { label: 'Phosphorus', key: 'Phosphorus', unit: 'mg' }
        ]
    },
    {
        title: "Trace Minerals",
        icon: Gem,
        theme: "rose",
        keys: [
            { label: 'Iron', key: 'Iron', unit: 'mg' },
            { label: 'Zinc', key: 'Zinc', unit: 'mg' },
            { label: 'Selenium', key: 'Selenium', unit: 'µg' },
            { label: 'Copper', key: 'Copper', unit: 'mg' },
            { label: 'Manganese', key: 'Manganese', unit: 'mg' }
        ]
    },
    {
        title: "Vitamins",
        icon: Battery,
        theme: "emerald",
        keys: [
            { label: 'Vitamin A', key: 'Vitamin A', unit: 'µg' },
            { label: 'Vitamin C', key: 'Vitamin C', unit: 'mg' },
            { label: 'Vitamin D', key: 'Vitamin D', unit: 'µg' },
            { label: 'Vitamin E', key: 'Vitamin E', unit: 'mg' },
            { label: 'Vitamin K', key: 'Vitamin K', unit: 'µg' },
            { label: 'B1 (Thiamine)', key: 'B1 (Thiamine)', unit: 'mg' },
            { label: 'B2 (Riboflavin)', key: 'B2 (Riboflavin)', unit: 'mg' },
            { label: 'B3 (Niacin)', key: 'B3 (Niacin)', unit: 'mg' },
            { label: 'B5 (Pantothenic Acid)', key: 'B5 (Pantothenic Acid)', unit: 'mg' },
            { label: 'B6 (Pyridoxine)', key: 'B6 (Pyridoxine)', unit: 'mg' },
            { label: 'B9 (Folate)', key: 'B9 (Folate)', unit: 'µg' },
            { label: 'B12 (Cobalamin)', key: 'B12 (Cobalamin)', unit: 'µg' },
            { label: 'Choline', key: 'Choline', unit: 'mg' }
        ]
    }
];

export function CompareView() {
    const [selectedFoods, setSelectedFoods] = useState<(FoodItem | null)[]>([null, null, null]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null); // Which box are we picking for?
    const { energyUnit } = useUserPreferences();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Perform Search
    const performSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
            // toast.error("Database search failed");
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce handler
    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    const selectFood = (food: FoodItem) => {
        if (activeSlot === null) return;
        const next = [...selectedFoods];
        next[activeSlot] = food;
        setSelectedFoods(next);
        setActiveSlot(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const clearAll = () => {
        setSelectedFoods([null, null, null]);
        setActiveSlot(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeFood = (index: number) => {
        setSelectedFoods(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const calculateScores = (foods: (FoodItem | null)[]) => {
        const scores = [0, 0, 0];
        const totalSelected = foods.filter(f => f !== null).length;
        if (totalSelected === 0) return scores;

        NUTRIENT_GROUPS.forEach(group => {
            group.keys.forEach(nutrient => {
                const values = foods.map(food => {
                    if (!food) return null;
                    if (nutrient.key in food && typeof (food as any)[nutrient.key] === 'number') {
                        return (food as any)[nutrient.key];
                    }
                    if (food.micronutrients && food.micronutrients[nutrient.key]) {
                        const v = food.micronutrients[nutrient.key];
                        return typeof v === 'number' ? v : 0;
                    }
                    return 0;
                });
                const sortedUniqueValues = Array.from(new Set(values.filter((v): v is number => v !== null)))
                    .sort((a, b) => b - a);
                values.forEach((val, i) => {
                    if (val !== null) {
                        const rank = sortedUniqueValues.indexOf(val);
                        if (rank === 0) scores[i] += 3;
                        else if (rank === 1) scores[i] += 2;
                        else if (rank === 2) scores[i] += 1;
                    }
                });
            });
        });
        return scores;
    };

    // Auto-shuffle effect
    useEffect(() => {
        if (selectedFoods.every(f => f === null)) return;

        const currentScores = calculateScores(selectedFoods);

        // Create indexed items to detect changes
        const items = selectedFoods.map((food, i) => ({ food, score: currentScores[i], originalIndex: i }));

        // Sort: 1. Presence of food (nulls last) 2. Score descending 3. Orignal index (tie-breaker for stability)
        const sorted = [...items].sort((a, b) => {
            if (a.food && !b.food) return -1;
            if (!a.food && b.food) return 1;
            if (b.score !== a.score) return b.score - a.score;
            return a.originalIndex - b.originalIndex;
        });

        // Check if order actually changed
        const hasChanged = sorted.some((item, i) => item.originalIndex !== i);

        if (hasChanged) {
            // Apply new order
            setSelectedFoods(sorted.map(s => s.food));
        }
    }, [selectedFoods]);

    const getNutrientValue = (food: FoodItem | null, key: string, unit: string) => {
        if (!food) return '-';

        let val: number | string = 0;

        // Check top level first for macros
        if (key in food && typeof (food as any)[key] === 'number') {
            val = (food as any)[key];
        } else if (food.micronutrients && food.micronutrients[key]) {
            // Check micronutrients JSONB
            const v = food.micronutrients[key];
            if (typeof v === 'number' || typeof v === 'string') val = v;
        }

        // Special handling for Energy conversion
        if (key === 'energy_kcal') {
            const kcal = typeof val === 'number' ? val : 0;
            if (energyUnit === 'kJ') {
                return (kcal * 4.184).toFixed(0);
            }
            return kcal.toFixed(0);
        }

        if (typeof val === 'number') return val.toFixed(1);
        return val.toString();
    };

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    // Calculate Scores for Display
    const scores = calculateScores(selectedFoods);
    const totalSelected = selectedFoods.filter(f => f !== null).length;

    // Determine Ranks
    const sortedScores = Array.from(new Set(scores.filter((s, i) => selectedFoods[i] !== null)))
        .sort((a, b) => b - a);

    const getMedal = (index: number) => {
        if (selectedFoods[index] === null) return null;
        const score = scores[index];
        const rank = sortedScores.indexOf(score);

        if (rank === 0) return { icon: Trophy, color: "text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]", label: "1st", bg: "bg-yellow-50 dark:bg-yellow-900/20" };
        if (rank === 1) return { icon: Medal, color: "text-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]", label: "2nd", bg: "bg-slate-50 dark:bg-slate-800/50" };
        if (rank === 2) return { icon: Medal, color: "text-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.3)]", label: "3rd", bg: "bg-amber-50 dark:bg-amber-900/20" };
        return null;
    };

    return (
        <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-20 pt-4">

            {/* Dynamic Workspace: Onboarding OR Search OR Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500">
                {activeSlot !== null ? (
                    /* Search Active State */
                    <div className="animate-in slide-in-from-top-4 duration-500">
                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-pulse">
                                <Search size={20} />
                            </div>
                            <input
                                autoFocus
                                placeholder={`Search for Sample ${activeSlot + 1}...`}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white placeholder:text-slate-300"
                                value={searchQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setActiveSlot(null);
                                }}
                                onChange={(e) => handleSearchInput(e.target.value)}
                            />
                            <button
                                onClick={() => setActiveSlot(null)}
                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-slate-200 dark:border-slate-800"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-white dark:bg-slate-900">
                            {isSearching ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="relative">
                                        <Activity className="animate-spin text-emerald-500" size={32} />
                                        <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Querying Library...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {searchResults.map(food => (
                                        <button
                                            key={food.id}
                                            onClick={() => selectFood(food)}
                                            className="w-full p-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 text-left"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                                    {food.image ? <img src={food.image} className="w-full h-full object-cover" /> : <Beef className="m-auto opacity-10 h-full w-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{food.common_name || food.name}</h4>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                        {energyUnit === 'kJ' ? (food.energy_kcal * 4.184).toFixed(0) : food.energy_kcal.toFixed(0)} {energyUnit} <span className="text-slate-200 dark:text-slate-700">|</span> 100g
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.length > 1 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                        <Search size={24} className="opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No matching items found</p>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Enter item name to compare</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : !selectedFoods.some(f => f !== null) ? (
                    /* Initial Engine Ready State */
                    <div className="p-10 md:p-20 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
                            <Info size={32} className="text-emerald-500" />
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        </div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic mb-3 tracking-tight">Engine Ready</h3>
                        <p className="text-slate-500 font-medium text-xs md:text-base max-w-[280px] md:max-w-md leading-relaxed mb-8">
                            Nutritional comparison engine is online. <br />
                            Use the <span className="text-emerald-500 font-bold italic">Add Buttons</span> in the table below to begin analysis.
                        </p>
                        <button
                            onClick={() => setActiveSlot(0)}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Start Investigation
                        </button>
                    </div>
                ) : (
                    /* Summary / Lab Header State (Mini Dashboard) */
                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/20 animate-in fade-in duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-lg uppercase italic text-slate-900 dark:text-white leading-none mb-1">Comparison Lab</h3>
                                <div className="flex gap-2">
                                    <Badge className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-widest">
                                        {selectedFoods.filter(f => f !== null).length} / 3 SAMPLES
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-200 dark:border-slate-800 font-black text-[8px] uppercase tracking-widest text-slate-400">
                                        ACTIVE ANALYSIS
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {selectedFoods.filter(f => f !== null).length < 3 && (
                                <button
                                    onClick={() => setActiveSlot(selectedFoods.findIndex(f => f === null))}
                                    className="px-5 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Add Sample
                                </button>
                            )}
                            <button
                                onClick={clearAll}
                                className="px-5 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:border-rose-500/50 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Reset Engine
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Comparison Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mx-[-1rem] md:mx-0">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse table-fixed md:table-auto">
                        <thead className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                            <tr>
                                <th className="p-4 md:p-8 text-left bg-slate-50/50 dark:bg-slate-800/30 w-[140px] md:w-1/4 min-w-[140px] md:min-w-[200px] sticky left-0 z-40 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Scale size={16} className="md:w-5 md:h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[10px] md:text-sm uppercase italic text-slate-900 dark:text-white leading-none mb-1">Nutrition</h3>
                                            <p className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">per 100g</p>
                                        </div>
                                    </div>
                                </th>
                                {[0, 1, 2].map((i) => (
                                    <th key={i} className="p-4 md:p-8 text-center border-l border-slate-100 dark:border-slate-800 w-[100px] md:w-1/4 min-w-[100px] md:min-w-0">
                                        <div className="flex flex-col items-center gap-1 md:gap-2">
                                            {selectedFoods[i] ? (
                                                <div className="relative group/card">
                                                    <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl mb-0.5 md:mb-1 animate-in zoom-in duration-500", getMedal(i)?.bg)}>
                                                        {getMedal(i) ? React.createElement(getMedal(i)!.icon, {
                                                            size: 16,
                                                            className: cn("md:w-6 md:h-6", getMedal(i)!.color)
                                                        }) : (
                                                            <div className="w-4 h-4 md:w-6 md:h-6" /> // Placeholder to maintain height
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-[9px] md:text-sm uppercase italic text-slate-900 dark:text-white line-clamp-1 mb-1">
                                                        {selectedFoods[i]?.common_name || selectedFoods[i]?.name}
                                                    </h4>
                                                    <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2">
                                                        <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[6px] md:text-[8px] uppercase tracking-widest px-1 md:px-2">
                                                            {scores[i]} PTS
                                                        </Badge>
                                                        {getMedal(i) && (
                                                            <span className={cn("text-[7px] md:text-[10px] font-black uppercase italic tracking-tighter leading-none whitespace-nowrap", getMedal(i)!.color.split(' ')[0])}>
                                                                {getMedal(i)!.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Floating Remove Button */}
                                                    <button
                                                        onClick={() => removeFood(i)}
                                                        className="absolute -top-1 -right-1 md:-top-2 md:-right-2 p-1.5 md:p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100"
                                                    >
                                                        <X size={10} className="md:w-3 md:h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveSlot(i)}
                                                    className="flex flex-col items-center gap-2 group/add transition-all active:scale-95"
                                                >
                                                    <div className="relative">
                                                        {/* Attractor Pulse Glow */}
                                                        <div className="absolute inset-[-4px] rounded-full bg-emerald-500/20 animate-pulse" />

                                                        <div className="relative w-7 h-7 md:w-10 md:h-10 rounded-full border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover/add:bg-emerald-500 transition-all duration-300">
                                                            <Plus size={16} className="text-emerald-500 group-hover/add:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 group-hover/add:tracking-[0.3em] transition-all duration-500">
                                                        Add
                                                    </p>
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {NUTRIENT_GROUPS.map((group) => (
                                <React.Fragment key={group.title}>
                                    <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                                        <td colSpan={4} className="px-4 md:px-8 py-2 md:py-3 sticky left-0 z-20 bg-slate-50/80 dark:bg-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <group.icon size={12} className={cn("md:w-[14px] md:h-[14px]", themes[group.theme as keyof typeof themes].split(' ')[0])} />
                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-slate-400">{group.title}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {group.keys.map((nutrient) => {
                                        // Calculate ranks for this row
                                        const values = selectedFoods.map(food => {
                                            if (!food) return null;
                                            if (nutrient.key in food && typeof (food as any)[nutrient.key] === 'number') {
                                                return (food as any)[nutrient.key];
                                            }
                                            if (food.micronutrients && food.micronutrients[nutrient.key]) {
                                                const v = food.micronutrients[nutrient.key];
                                                return typeof v === 'number' ? v : 0;
                                            }
                                            return 0;
                                        });

                                        const sortedUniqueValues = Array.from(new Set(values.filter((v): v is number => v !== null)))
                                            .sort((a, b) => b - a);

                                        return (
                                            <tr key={nutrient.key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="p-3 md:p-6 px-4 md:px-12 sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] focus-within:z-30">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-wider md:tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors truncate">
                                                            {nutrient.label}
                                                        </span>
                                                        <span className="text-[7px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {nutrient.key === 'energy_kcal' ? energyUnit : nutrient.unit}
                                                        </span>
                                                    </div>
                                                </td>
                                                {[0, 1, 2].map((i) => {
                                                    const val = values[i];
                                                    const rank = val !== null ? sortedUniqueValues.indexOf(val) : -1;
                                                    const colorClass = rank === 0 ? "text-emerald-500" : rank === 1 ? "text-blue-500" : rank === 2 ? "text-rose-500" : "text-slate-900 dark:text-white";

                                                    return (
                                                        <td key={i} className="p-3 md:p-6 text-center border-l border-slate-100 dark:border-slate-800">
                                                            <span className={cn(
                                                                "text-[11px] md:text-xs font-black tracking-widest transition-colors duration-500",
                                                                selectedFoods[i] ? colorClass : "text-slate-200 dark:text-slate-800"
                                                            )}>
                                                                {getNutrientValue(selectedFoods[i], nutrient.key, nutrient.unit)}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
