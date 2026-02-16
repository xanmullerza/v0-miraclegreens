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
    Medal
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
    const [searchQueries, setSearchQueries] = useState<string[]>(['', '', '']);
    const [searchResults, setSearchResults] = useState<FoodItem[][]>([[], [], []]);
    const [isLoading, setIsLoading] = useState<boolean[]>([false, false, false]);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const { energyUnit } = useUserPreferences();
    const [supabaseOK, setSupabaseOK] = useState<boolean | null>(null);
    const [sampleCount, setSampleCount] = useState<number | null>(null);
    const [lastSearchLog, setLastSearchLog] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setActiveSearchIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Test Supabase connectivity on mount
    useEffect(() => {
        const testSupabaseConnection = async () => {
            try {
                console.log('[CompareView] Testing Supabase connectivity...');
                const { data, error } = await supabase
                    .from('food_items')
                    .select('id, name, common_name')
                    .limit(1);
                
                if (error) {
                    console.error('[CompareView] Supabase error:', error);
                    toast.error(`Database connection error: ${error.message}`);
                    setSupabaseOK(false);
                    setSampleCount(0);
                } else {
                    console.log('[CompareView] Supabase connection successful. Sample data:', data);
                    setSupabaseOK(true);
                    setSampleCount(data?.length || 0);
                    if (!data || data.length === 0) {
                        console.warn('[CompareView] Warning: food_items table appears to be empty');
                    }
                }
            } catch (err) {
                console.error('[CompareView] Error testing Supabase connection:', err);
            }
        };
        
        testSupabaseConnection();
    }, []);

    const performSearch = async (query: string, index: number) => {
        if (!query || query.length < 2) {
            setSearchResults(prev => {
                const next = [...prev];
                next[index] = [];
                return next;
            });
            return;
        }

        setIsLoading(prev => {
            const next = [...prev];
            next[index] = true;
            return next;
        });

        try {
            const searchingMsg = `[CompareView] Searching for: "${query}" in index ${index}`;
            console.log(searchingMsg);
            setLastSearchLog(searchingMsg);
            
            // Primary search using .or() syntax
            let { data, error } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(5);

            const primaryMsg = `[CompareView] Primary search result count: ${data?.length || 0}, error: ${error?.message || 'none'}`;
            console.log(primaryMsg);
            setLastSearchLog(primaryMsg);

            // Fallback: If primary search fails or returns no results, try alternative approach
            if (error || !data || data.length === 0) {
                const fallbackMsg = '[CompareView] Trying fallback search method...';
                console.log(fallbackMsg);
                setLastSearchLog(fallbackMsg);
                
                // Try searching name field only first
                const { data: nameData, error: nameError } = await supabase
                    .from('food_items')
                    .select('*')
                    .ilike('name', `%${query}%`)
                    .limit(5);
                
                if (nameError) {
                    console.error('[CompareView] Fallback name search error:', nameError);
                } else if (nameData && nameData.length > 0) {
                    const nameFoundMsg = `[CompareView] Fallback name search successful, found ${nameData.length} results`;
                    console.log(nameFoundMsg);
                    setLastSearchLog(nameFoundMsg);
                    data = nameData;
                    error = null;
                } else {
                    // Try searching common_name field
                    const { data: commonData, error: commonError } = await supabase
                        .from('food_items')
                        .select('*')
                        .ilike('common_name', `%${query}%`)
                        .limit(5);
                    
                    if (commonError) {
                        console.error('[CompareView] Fallback common_name search error:', commonError);
                    } else if (commonData && commonData.length > 0) {
                        const commonFoundMsg = `[CompareView] Fallback common_name search successful, found ${commonData.length} results`;
                        console.log(commonFoundMsg);
                        setLastSearchLog(commonFoundMsg);
                        data = commonData;
                        error = null;
                    }
                }
            }

            if (error) {
                console.error('Search error details:', error);
                throw error;
            }

            setSearchResults(prev => {
                const next = [...prev];
                next[index] = data || [];
                return next;
            });
            
            const updatedMsg = `[CompareView] Updated search results for index ${index}: ${(data || []).length} items`;
            console.log(updatedMsg);
            setLastSearchLog(updatedMsg);
        } catch (error) {
            console.error('Search error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Search failed';
            toast.error(`Search failed: ${errorMsg}`);
        } finally {
            setIsLoading(prev => {
                const next = [...prev];
                next[index] = false;
                return next;
            });
        }
    };

    const handleSearchChange = (val: string, index: number) => {
        const nextQueries = [...searchQueries];
        nextQueries[index] = val;
        setSearchQueries(nextQueries);
        performSearch(val, index);
    };

    const handleSelectFood = (food: FoodItem, index: number) => {
        setSelectedFoods(prev => {
            const next = [...prev];
            next[index] = food;
            return next;
        });
        setSearchQueries(prev => {
            const next = [...prev];
            next[index] = '';
            return next;
        });
        setSearchResults(prev => {
            const next = [...prev];
            next[index] = [];
            return next;
        });
        setActiveSearchIndex(null);
    };

    const removeFood = (index: number) => {
        setSelectedFoods(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

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

    // Calculate Scores
    const scores = [0, 0, 0];
    const totalSelected = selectedFoods.filter(f => f !== null).length;

    if (totalSelected > 0) {
        NUTRIENT_GROUPS.forEach(group => {
            group.keys.forEach(nutrient => {
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
    }

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
        <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Search Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6" ref={searchRef}>
                {[0, 1, 2].map((index) => (
                    <div key={index} className="relative group overflow-visible">
                        <div className={cn(
                            "bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500",
                            activeSearchIndex === index ? "ring-2 ring-emerald-500/50" : ""
                        )}>
                            <div className="p-3 md:p-4 flex flex-col items-center gap-4">
                                {selectedFoods[index] ? (
                                    <div className="w-full flex items-center justify-between gap-3 md:gap-4">
                                        <div className="flex items-center gap-3 md:gap-4 flex-1">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                {selectedFoods[index]?.image ? (
                                                    <img src={selectedFoods[index]?.image!} alt={selectedFoods[index]?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Beef size={18} className="opacity-10" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Box {index + 1}</p>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500">{scores[index]} PTS</p>
                                                </div>
                                                <h3 className="font-black text-xs md:text-sm uppercase italic text-slate-900 dark:text-white truncate">
                                                    {selectedFoods[index]?.common_name || selectedFoods[index]?.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFood(index)}
                                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-12 md:h-14 bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Search className="text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search food..."
                                                value={searchQueries[index]}
                                                onChange={(e) => handleSearchChange(e.target.value, index)}
                                                onFocus={() => setActiveSearchIndex(index)}
                                                className="bg-transparent border-none focus:ring-0 text-[10px] md:text-[11px] font-black uppercase tracking-widest w-full text-slate-900 dark:text-white placeholder:text-slate-300"
                                            />
                                            {isLoading[index] && <Activity className="animate-spin text-emerald-500" size={14} />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {activeSearchIndex === index && searchResults[index].length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] overflow-visible animate-in slide-in-from-top-4 duration-300">
                                {searchResults[index].map((food) => (
                                    <button
                                        key={food.id}
                                        onMouseDown={(e) => { e.preventDefault(); handleSelectFood(food, index); }}
                                        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b last:border-none border-slate-100 dark:border-slate-800 text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Beef size={16} className="opacity-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-xs uppercase text-slate-900 dark:text-white truncate">
                                                {food.common_name || food.name}
                                            </h4>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                {energyUnit === 'kJ'
                                                    ? `${(food.energy_kcal * 4.184).toFixed(0)} kJ`
                                                    : `${food.energy_kcal.toFixed(0)} kcal`
                                                } / 100g
                                            </p>
                                        </div>
                                        <Plus size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Inline debug list (always visible for dev) */}
                        {searchResults[index].length > 0 && (
                            <div className="mt-2 p-2 bg-slate-800/60 dark:bg-slate-800 rounded-lg text-[12px] text-slate-100">
                                {searchResults[index].slice(0,5).map(f => (
                                    <div key={f.id} className="py-1 border-b last:border-b-0 border-slate-700">{f.common_name || f.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Debug Panel */}
            <div className="px-4">
                <div className="text-xs bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-black">Search Debug</div>
                        <div className="text-[11px]">
                            Supabase: {supabaseOK === null ? 'testing...' : supabaseOK ? `OK (${sampleCount || 0})` : 'ERROR'}
                        </div>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-2">Last log: {lastSearchLog || '—'}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[0,1,2].map((i) => (
                            <div key={i} className="text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                <div className="font-black">Box {i+1}</div>
                                <div>Query: {searchQueries[i] || '—'}</div>
                                <div>Results: {searchResults[i]?.length || 0}</div>
                                <div>Loading: {isLoading[i] ? 'yes' : 'no'}</div>
                            </div>
                        ))}
                    </div>
                </div>
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
                                                <>
                                                    <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl mb-0.5 md:mb-1 animate-in zoom-in duration-500", getMedal(i)?.bg)}>
                                                        {getMedal(i) ? React.createElement(getMedal(i)!.icon, {
                                                            size: 16,
                                                            className: cn("md:w-6 md:h-6", getMedal(i)!.color)
                                                        }) : (
                                                            <div className="w-4 h-4 md:w-6 md:h-6" /> // Placeholder to maintain height
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-[9px] md:text-sm uppercase italic text-slate-900 dark:text-white line-clamp-1">
                                                        {selectedFoods[i]?.common_name || selectedFoods[i]?.name}
                                                    </h4>
                                                    <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2">
                                                        <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[6px] md:text-[8px] uppercase tracking-widest px-1 md:px-2">
                                                            {scores[i]} PTS
                                                        </Badge>
                                                        {getMedal(i) && (
                                                            <span className={cn("text-[7px] md:text-[10px] font-black uppercase italic tracking-tighter leading-none", getMedal(i)!.color.split(' ')[0])}>
                                                                {getMedal(i)!.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 opacity-20">
                                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-dashed border-slate-400 flex items-center justify-center">
                                                        <Plus size={10} className="text-slate-400" />
                                                    </div>
                                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Add</p>
                                                </div>
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

                {/* Empty State */}
                {!selectedFoods.some(f => f !== null) && (
                    <div className="p-10 md:p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 md:mb-6">
                            <Info size={24} className={cn("text-slate-300", "md:w-8 md:h-8")} />
                        </div>
                        <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Engine Ready</h3>
                        <p className="text-slate-500 font-medium text-[10px] md:text-sm max-w-[240px] md:max-w-sm">
                            Search and select up to 3 samples above for side-by-side analysis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
