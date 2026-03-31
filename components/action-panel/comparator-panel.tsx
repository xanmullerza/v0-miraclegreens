'use client';

import React, { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FoodItem {
    id: string;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image_url?: string;
}

export function ComparatorPanel() {
    const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchFoods = async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, calories, protein_g, carbs_g, fat_g, image_url')
                .ilike('name', `%${query}%`)
                .limit(8);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching foods:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchFoods(query);
    };

    const addFood = (food: FoodItem) => {
        if (selectedFoods.find(f => f.id === food.id)) {
            toast.error('Food already added');
            return;
        }
        setSelectedFoods([...selectedFoods, food]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeFood = (id: string) => {
        setSelectedFoods(selectedFoods.filter(f => f.id !== id));
    };

    const avgMacros = selectedFoods.length > 0 ? {
        calories: Math.round(selectedFoods.reduce((sum, f) => sum + f.calories, 0) / selectedFoods.length),
        protein: Math.round((selectedFoods.reduce((sum, f) => sum + f.protein_g, 0) / selectedFoods.length) * 10) / 10,
        carbs: Math.round((selectedFoods.reduce((sum, f) => sum + f.carbs_g, 0) / selectedFoods.length) * 10) / 10,
        fat: Math.round((selectedFoods.reduce((sum, f) => sum + f.fat_g, 0) / selectedFoods.length) * 10) / 10,
    } : null;

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Comparator</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Compare nutrition between foods
                </p>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search foods..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map(food => (
                        <button
                            key={food.id}
                            onClick={() => addFood(food)}
                            className="w-full text-left p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                        >
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{food.name}</span>
                            <Plus size={16} className="text-orange-500" />
                        </button>
                    ))}
                </div>
            )}

            {/* Selected Foods Comparison */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedFoods.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Search and add foods to compare</p>
                    </div>
                ) : (
                    <>
                        {/* Foods List */}
                        <div className="space-y-2">
                            {selectedFoods.map(food => (
                                <div
                                    key={food.id}
                                    className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                                            {food.name}
                                        </p>
                                        <button
                                            onClick={() => removeFood(food.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Cal</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{food.calories}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Pro</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{food.protein_g}g</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Carb</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{food.carbs_g}g</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Fat</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{food.fat_g}g</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Average */}
                        {avgMacros && (
                            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                <p className="font-semibold text-xs text-orange-900 dark:text-orange-200 mb-2">
                                    Average
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div>
                                        <p className="text-orange-700 dark:text-orange-300">Cal</p>
                                        <p className="font-bold text-orange-900 dark:text-orange-100">{avgMacros.calories}</p>
                                    </div>
                                    <div>
                                        <p className="text-orange-700 dark:text-orange-300">Pro</p>
                                        <p className="font-bold text-orange-900 dark:text-orange-100">{avgMacros.protein}g</p>
                                    </div>
                                    <div>
                                        <p className="text-orange-700 dark:text-orange-300">Carb</p>
                                        <p className="font-bold text-orange-900 dark:text-orange-100">{avgMacros.carbs}g</p>
                                    </div>
                                    <div>
                                        <p className="text-orange-700 dark:text-orange-300">Fat</p>
                                        <p className="font-bold text-orange-900 dark:text-orange-100">{avgMacros.fat}g</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
