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
    Beef
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setActiveSearchIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;

            setSearchResults(prev => {
                const next = [...prev];
                next[index] = data || [];
                return next;
            });
        } catch (error) {
            console.error('Search error:', error);
            toast.error("Search failed");
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

        // Check top level first for macros
        if (key in food && typeof (food as any)[key] === 'number') {
            return (food as any)[key].toFixed(1);
        }

        // Check micronutrients JSONB
        if (food.micronutrients && food.micronutrients[key]) {
            const val = food.micronutrients[key];
            if (typeof val === 'number') return val.toFixed(1);
            if (typeof val === 'string') return val;
        }

        return '0';
    };

    const themes = {
        orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        indigo: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Search Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={searchRef}>
                {[0, 1, 2].map((index) => (
                    <div key={index} className="relative group">
                        <div className={cn(
                            "bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500",
                            activeSearchIndex === index ? "ring-2 ring-emerald-500/50" : ""
                        )}>
                            <div className="p-4 flex flex-col items-center gap-4">
                                {selectedFoods[index] ? (
                                    <div className="w-full flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                {selectedFoods[index]?.image ? (
                                                    <img src={selectedFoods[index]?.image!} alt={selectedFoods[index]?.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Beef size={20} className="opacity-10" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Selection {index + 1}</p>
                                                <h3 className="font-black text-sm uppercase italic text-slate-900 dark:text-white truncate">
                                                    {selectedFoods[index]?.common_name || selectedFoods[index]?.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFood(index)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 px-4 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Search className="text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search food to compare..."
                                                value={searchQueries[index]}
                                                onChange={(e) => handleSearchChange(e.target.value, index)}
                                                onFocus={() => setActiveSearchIndex(index)}
                                                className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest w-full text-slate-900 dark:text-white placeholder:text-slate-300"
                                            />
                                            {isLoading[index] && <Activity className="animate-spin text-emerald-500" size={16} />}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {activeSearchIndex === index && searchResults[index].length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                                {searchResults[index].map((food) => (
                                    <button
                                        key={food.id}
                                        onClick={() => handleSelectFood(food, index)}
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
                                                {food.energy_kcal} kcal / 100g
                                            </p>
                                        </div>
                                        <Plus size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="p-8 text-left bg-slate-50/50 dark:bg-slate-800/30 w-1/4 min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Scale size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-sm uppercase italic text-slate-900 dark:text-white">Nutrition Facts</h3>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Values per 100g</p>
                                        </div>
                                    </div>
                                </th>
                                {[0, 1, 2].map((i) => (
                                    <th key={i} className="p-8 text-center border-l border-slate-100 dark:border-slate-800 w-1/4">
                                        <div className="flex flex-col items-center gap-2">
                                            {selectedFoods[i] ? (
                                                <>
                                                    <h4 className="font-black text-sm uppercase italic text-slate-900 dark:text-white line-clamp-1">
                                                        {selectedFoods[i]?.common_name || selectedFoods[i]?.name}
                                                    </h4>
                                                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest">
                                                        Clinical Sample
                                                    </Badge>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 opacity-20">
                                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center">
                                                        <Plus size={14} className="text-slate-400" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add food</p>
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
                                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                                        <td colSpan={4} className="px-8 py-3">
                                            <div className="flex items-center gap-2">
                                                <group.icon size={14} className={cn(themes[group.theme as keyof typeof themes].split(' ')[0])} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{group.title}</span>
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

                                        // Get unique non-null values and sort them descending
                                        const sortedUniqueValues = Array.from(new Set(values.filter((v): v is number => v !== null)))
                                            .sort((a, b) => b - a);

                                        return (
                                            <tr key={nutrient.key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                <td className="p-6 px-12">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">
                                                            {nutrient.label}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {nutrient.unit}
                                                        </span>
                                                    </div>
                                                </td>
                                                {[0, 1, 2].map((i) => {
                                                    const val = values[i];
                                                    const rank = val !== null ? sortedUniqueValues.indexOf(val) : -1;
                                                    const colorClass = rank === 0 ? "text-emerald-500" : rank === 1 ? "text-blue-500" : rank === 2 ? "text-rose-500" : "text-slate-900 dark:text-white";

                                                    return (
                                                        <td key={i} className="p-6 text-center border-l border-slate-100 dark:border-slate-800">
                                                            <span className={cn(
                                                                "text-xs font-black tracking-widest transition-colors duration-500",
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
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
                            <Info className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Comparison Engine Ready</h3>
                        <p className="text-slate-500 font-medium text-sm max-w-sm">
                            Search and select up to 3 clinical food samples in the boxes above to start your side-by-side nutritional analysis.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
