'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Search, X, Plus, Trash2, Zap, Gem, Battery } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    image_url: string | null;
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
    const [selectedFoods, setSelectedFoods] = useState<(FoodItem | null)[]>([null, null, null]);
    const [searchQueries, setSearchQueries] = useState<string[]>(['', '', '']);
    const [searchResults, setSearchResults] = useState<FoodItem[][]>([[], [], []]);
    const [isSearching, setIsSearching] = useState<boolean[]>([false, false, false]);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const searchTimeoutRef = useRef<(NodeJS.Timeout | null)[]>([null, null, null]);

    const performSearch = useCallback(async (query: string, slot: number) => {
        if (!query || query.length < 2) {
            const newResults = [...searchResults];
            newResults[slot] = [];
            setSearchResults(newResults);
            return;
        }

        const newIsSearching = [...isSearching];
        newIsSearching[slot] = true;
        setIsSearching(newIsSearching);

        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image_url, energy_kcal, protein_g, carbs_g, fat_g, fiber_g, micronutrients')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);

            if (error) throw error;
            const newResults = [...searchResults];
            newResults[slot] = data || [];
            setSearchResults(newResults);
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('Search failed');
        } finally {
            const newIsSearching = [...isSearching];
            newIsSearching[slot] = false;
            setIsSearching(newIsSearching);
        }
    }, [searchResults, isSearching]);

    const handleSearch = useCallback((value: string, slot: number) => {
        const newQueries = [...searchQueries];
        newQueries[slot] = value;
        setSearchQueries(newQueries);

        if (searchTimeoutRef.current[slot]) {
            clearTimeout(searchTimeoutRef.current[slot]);
        }
        searchTimeoutRef.current[slot] = setTimeout(() => {
            performSearch(value, slot);
        }, 300);
    }, [searchQueries, performSearch]);

    const selectFood = useCallback((food: FoodItem, slot: number) => {
        const newFoods = [...selectedFoods];
        newFoods[slot] = food;
        setSelectedFoods(newFoods);

        const newQueries = [...searchQueries];
        newQueries[slot] = '';
        setSearchQueries(newQueries);

        const newResults = [...searchResults];
        newResults[slot] = [];
        setSearchResults(newResults);

        setActiveSlot(null);
    }, [selectedFoods, searchQueries, searchResults]);

    const removeFood = useCallback((slot: number) => {
        const newFoods = [...selectedFoods];
        newFoods[slot] = null;
        setSelectedFoods(newFoods);
    }, [selectedFoods]);

    const averages = useMemo(() => {
        const activeFoods = selectedFoods.filter((f) => f !== null) as FoodItem[];
        if (activeFoods.length === 0) return null;

        return {
            energy_kcal: Math.round(activeFoods.reduce((acc, f) => acc + f.energy_kcal, 0) / activeFoods.length),
            protein_g: Math.round(activeFoods.reduce((acc, f) => acc + f.protein_g, 0) / activeFoods.length),
            carbs_g: Math.round(activeFoods.reduce((acc, f) => acc + f.carbs_g, 0) / activeFoods.length),
            fat_g: Math.round(activeFoods.reduce((acc, f) => acc + f.fat_g, 0) / activeFoods.length),
        };
    }, [selectedFoods]);

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {/* Food Selection Slots */}
            <div className="space-y-3">
                {[0, 1, 2].map((slot) => (
                    <div key={slot} className="relative">
                        <div
                            onFocus={() => setActiveSlot(slot)}
                            className="p-3 rounded-lg border-2 border-dashed cursor-text hover:border-blue-400"
                        >
                            {selectedFoods[slot] ? (
                                <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        {selectedFoods[slot].image_url && (
                                            <img
                                                src={selectedFoods[slot].image_url}
                                                alt={selectedFoods[slot].name}
                                                className="w-8 h-8 rounded object-cover"
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{selectedFoods[slot].name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedFoods[slot].energy_kcal} kcal</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFood(slot)}
                                        className="p-1 hover:bg-red-100 rounded"
                                    >
                                        <X size={16} className="text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setActiveSlot(slot)}
                                    className="text-center text-muted-foreground text-sm py-2"
                                >
                                    Click to select food {slot + 1}
                                </div>
                            )}
                        </div>

                        {activeSlot === slot && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg p-2 z-50">
                                <div className="relative mb-2">
                                    <Search className="absolute left-2 top-2 text-muted-foreground" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search foods..."
                                        value={searchQueries[slot]}
                                        onChange={(e) => handleSearch(e.target.value, slot)}
                                        autoFocus
                                        className="w-full pl-8 pr-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                    {isSearching[slot] ? (
                                        <div className="text-center text-sm text-muted-foreground py-2">Searching...</div>
                                    ) : searchResults[slot].length > 0 ? (
                                        searchResults[slot].map((food) => (
                                            <button
                                                key={food.id}
                                                onClick={() => selectFood(food, slot)}
                                                className="w-full text-left p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {food.image_url && (
                                                        <img src={food.image_url} alt={food.name} className="w-6 h-6 rounded" />
                                                    )}
                                                    <span className="font-medium">{food.name}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : searchQueries[slot] ? (
                                        <div className="text-xs text-muted-foreground py-2 text-center">No foods found</div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Comparison Results */}
            {selectedFoods.some((f) => f !== null) && (
                <div className="space-y-4 pt-4 border-t">
                    {NUTRIENT_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <group.icon size={14} /> {group.title}
                            </h4>
                            {group.keys.map((nutrient) => {
                                const activeFoods = selectedFoods.filter((f) => f !== null) as FoodItem[];
                                return (
                                    <div key={nutrient.key} className="space-y-1">
                                        <p className="text-xs font-medium">{nutrient.label}</p>
                                        <div className="grid grid-cols-4 gap-1">
                                            {[0, 1, 2].map((slot) => {
                                                const food = selectedFoods[slot];
                                                if (!food) return <div key={slot} className="bg-muted rounded p-1"></div>;
                                                const value = (food as any)[nutrient.key] || 0;
                                                return (
                                                    <div key={slot} className="bg-blue-50 dark:bg-blue-900/20 rounded p-1 text-center">
                                                        <p className="text-xs font-bold">{typeof value === 'number' ? value.toFixed(1) : value}</p>
                                                    </div>
                                                );
                                            })}
                                            {activeFoods.length > 0 && (
                                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-1 text-center border-2 border-orange-200">
                                                    <p className="text-xs font-bold text-orange-600">
                                                        {(activeFoods.reduce((acc, f) => acc + ((f as any)[nutrient.key] || 0), 0) / activeFoods.length).toFixed(1)}
                                                    </p>
                                                </div>
                                            )}
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
