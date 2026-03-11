'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Search, X, Plus, Trash2, Zap, Gem, Battery, Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';

interface FoodItem {
    id: string;
    name: string;
    common_name?: string;
    image?: string | null;
    image_url?: string | null;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    micronutrients?: Record<string, any>;
}

const NUTRIENT_GROUPS = [
    {
        title: "Macros",
        icon: Zap,
        keys: [
            { label: 'Energy', key: 'energy_kcal', unit: 'kcal' },
            { label: 'Protein', key: 'protein_g', unit: 'g' },
            { label: 'Carbs', key: 'carbs_g', unit: 'g' },
            { label: 'Fat', key: 'fat_g', unit: 'g' },
            { label: 'Fiber', key: 'fiber_g', unit: 'g' }
        ]
    },
    {
        title: "Minerals",
        icon: Gem,
        keys: [
            { label: 'Potassium', key: 'Potassium', unit: 'mg' },
            { label: 'Magnesium', key: 'Magnesium', unit: 'mg' },
            { label: 'Calcium', key: 'Calcium', unit: 'mg' },
            { label: 'Iron', key: 'Iron', unit: 'mg' },
            { label: 'Zinc', key: 'Zinc', unit: 'mg' },
        ]
    },
    {
        title: "Vitamins",
        icon: Battery,
        keys: [
            { label: 'Vitamin A', key: 'Vitamin A', unit: 'μg' },
            { label: 'Vitamin C', key: 'Vitamin C', unit: 'mg' },
            { label: 'Vitamin D', key: 'Vitamin D', unit: 'μg' },
            { label: 'Vitamin E', key: 'Vitamin E', unit: 'mg' },
            { label: 'Vitamin B12', key: 'B12 (Cobalamin)', unit: 'μg' },
        ]
    }
];

export function ChatbotComparatorFull() {
    const { energyUnit } = useUserPreferences();
    const [selectedFoods, setSelectedFoods] = useState<(FoodItem | null)[]>([null, null, null]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Perform Search
    const performSearch = useCallback(async (query: string) => {
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
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounce handler
    const handleSearchInput = useCallback((val: string) => {
        setSearchQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    }, [performSearch]);

    const selectFood = useCallback((food: FoodItem) => {
        if (activeSlot === null) return;
        const next = [...selectedFoods];
        next[activeSlot] = food;
        setSelectedFoods(next);
        setActiveSlot(null);
        setSearchQuery('');
        setSearchResults([]);
    }, [activeSlot, selectedFoods]);

    const removeFood = useCallback((index: number) => {
        setSelectedFoods(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        setSelectedFoods([null, null, null]);
        setActiveSlot(null);
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    // Calculate Scores for ranking
    const calculateScores = useCallback((foods: (FoodItem | null)[]) => {
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
    }, []);

    // Auto-shuffle effect
    useEffect(() => {
        if (selectedFoods.every(f => f === null)) return;

        const currentScores = calculateScores(selectedFoods);
        const items = selectedFoods.map((food, i) => ({ food, score: currentScores[i], originalIndex: i }));
        const sorted = [...items].sort((a, b) => {
            if (a.food && !b.food) return -1;
            if (!a.food && b.food) return 1;
            if (b.score !== a.score) return b.score - a.score;
            return a.originalIndex - b.originalIndex;
        });

        const hasChanged = sorted.some((item, i) => item.originalIndex !== i);
        if (hasChanged) {
            setSelectedFoods(sorted.map(s => s.food));
        }
    }, [selectedFoods, calculateScores]);

    const getNutrientValue = useCallback((food: FoodItem | null, key: string, unit: string) => {
        if (!food) return '-';
        let val: number | string = 0;

        if (key in food && typeof (food as any)[key] === 'number') {
            val = (food as any)[key];
        } else if (food.micronutrients && food.micronutrients[key]) {
            const v = food.micronutrients[key];
            if (typeof v === 'number' || typeof v === 'string') val = v;
        }

        if (key === 'energy_kcal') {
            const kcal = typeof val === 'number' ? val : 0;
            if (energyUnit === 'kJ') {
                return (kcal * 4.184).toFixed(0);
            }
            return kcal.toFixed(0);
        }

        if (typeof val === 'number') return val.toFixed(1);
        return val.toString();
    }, [energyUnit]);

    const scores = calculateScores(selectedFoods);
    const sortedScores = Array.from(new Set(scores.filter((s, i) => selectedFoods[i] !== null)))
        .sort((a, b) => b - a);

    const getMedal = (index: number) => {
        if (selectedFoods[index] === null) return null;
        const score = scores[index];
        const rank = sortedScores.indexOf(score);

        if (rank === 0) return { icon: Trophy, color: "text-yellow-500", label: "🥇" };
        if (rank === 1) return { icon: Medal, color: "text-slate-400", label: "🥈" };
        if (rank === 2) return { icon: Award, color: "text-amber-700", label: "🥉" };
        return null;
    };

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-2 top-2.5 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => {
                        if (activeSlot === null) {
                            const firstEmpty = selectedFoods.findIndex(f => f === null);
                            setActiveSlot(firstEmpty !== -1 ? firstEmpty : 0);
                        }
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700"
                />
            </div>

            {/* Search Results Dropdown */}
            {activeSlot !== null && searchQuery && (
                <div className="border rounded-lg shadow-lg p-2 space-y-1 max-h-[150px] overflow-y-auto bg-white dark:bg-slate-800">
                    {isSearching ? (
                        <div className="text-center text-sm text-muted-foreground py-2">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((food) => (
                            <button
                                key={food.id}
                                onClick={() => selectFood(food)}
                                className="w-full text-left p-2 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {(food.image_url || food.image) && food.image_url && (
                                        <img src={food.image_url} alt={food.name} className="w-6 h-6 rounded" />
                                    )}
                                    <span className="font-medium truncate">{food.common_name || food.name}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-xs text-muted-foreground py-2 text-center">No foods found</div>
                    )}
                </div>
            )}

            {/* Food Selection Cards */}
            <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slot) => (
                    <div key={slot} className="relative">
                        {selectedFoods[slot] ? (
                            <div className="p-2 rounded-lg border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 group/card">
                                <div className="flex justify-center mb-1">
                                    {getMedal(slot) && <span className="text-lg">{getMedal(slot)?.label}</span>}
                                </div>
                                {selectedFoods[slot]?.image_url && (
                                    <img
                                        src={selectedFoods[slot]?.image_url}
                                        alt={selectedFoods[slot]?.name}
                                        className="w-full h-16 rounded object-cover mb-1"
                                    />
                                )}
                                <h4 className="font-bold text-xs text-center line-clamp-2 mb-1">
                                    {selectedFoods[slot]?.common_name || selectedFoods[slot]?.name}
                                </h4>
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded px-1 py-0.5 text-[10px] font-bold">
                                        {scores[slot]} Score
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setActiveSlot(slot)}
                                        className="flex-1 flex items-center justify-center gap-0.5 px-1.5 py-1 rounded bg-orange-500 text-white text-[10px] font-bold hover:bg-orange-600 transition-colors"
                                    >
                                        <RefreshCw size={10} />
                                        Swap
                                    </button>
                                    <button
                                        onClick={() => removeFood(slot)}
                                        className="px-1.5 py-1 rounded bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setActiveSlot(slot)}
                                className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 transition-colors bg-emerald-50/50 dark:bg-emerald-950/20"
                            >
                                <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Add</span>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison Table */}
            {selectedFoods.some((f) => f !== null) && (
                <div className="space-y-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nutrients</h3>
                        {selectedFoods.some(f => f !== null) && (
                            <button
                                onClick={clearAll}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Clear All
                            </button>
                        )}
                    </div>

                    {NUTRIENT_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-1">
                            <h4 className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <group.icon size={12} /> {group.title}
                            </h4>
                            {group.keys.map((nutrient) => {
                                const values = [0, 1, 2].map(i => {
                                    const food = selectedFoods[i];
                                    if (!food) return null;
                                    if (nutrient.key in food) return (food as any)[nutrient.key];
                                    if (food.micronutrients?.[ nutrient.key]) {
                                        const v = food.micronutrients[nutrient.key];
                                        return typeof v === 'number' ? v : 0;
                                    }
                                    return 0;
                                });

                                const sortedUnique = Array.from(new Set(values.filter((v): v is number => v !== null)))
                                    .sort((a, b) => b - a);

                                return (
                                    <div key={nutrient.key} className="text-[10px]">
                                        <p className="font-bold text-muted-foreground mb-0.5">{nutrient.label}</p>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[0, 1, 2].map(i => {
                                                const food = selectedFoods[i];
                                                const val = values[i];
                                                const rank = val !== null ? sortedUnique.indexOf(val) : -1;
                                                const color = rank === 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                                    rank === 1 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                                        rank === 2 ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                                                            "bg-slate-100 dark:bg-slate-800 text-slate-500";
                                                return (
                                                    <div key={i} className={cn("rounded p-1 text-center font-bold", color)}>
                                                        {food ? getNutrientValue(food, nutrient.key, nutrient.unit) : '-'}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
