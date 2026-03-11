'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, ChevronLeft, Heart, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Nutrient {
    id: string;
    label: string;
    group: string;
    unit: string;
    rda?: number;
}

const NUTRIENT_LIBRARY: Nutrient[] = [
    // Macros
    { id: 'energy_kcal', label: 'Energy', group: 'Macros', unit: 'kcal', rda: 2000 },
    { id: 'protein_g', label: 'Protein', group: 'Macros', unit: 'g', rda: 50 },
    { id: 'carbs_g', label: 'Carbohydrates', group: 'Macros', unit: 'g', rda: 300 },
    { id: 'fat_g', label: 'Total Fat', group: 'Macros', unit: 'g', rda: 78 },
    { id: 'fiber_g', label: 'Fiber', group: 'Macros', unit: 'g', rda: 25 },
    // Minerals
    { id: 'Sodium', label: 'Sodium', group: 'Minerals', unit: 'mg', rda: 2300 },
    { id: 'Potassium', label: 'Potassium', group: 'Minerals', unit: 'mg', rda: 3500 },
    { id: 'Calcium', label: 'Calcium', group: 'Minerals', unit: 'mg', rda: 1000 },
    { id: 'Iron', label: 'Iron', group: 'Minerals', unit: 'mg', rda: 18 },
    { id: 'Magnesium', label: 'Magnesium', group: 'Minerals', unit: 'mg', rda: 400 },
    { id: 'Zinc', label: 'Zinc', group: 'Minerals', unit: 'mg', rda: 11 },
    { id: 'Selenium', label: 'Selenium', group: 'Minerals', unit: 'μg', rda: 55 },
    { id: 'Copper', label: 'Copper', group: 'Minerals', unit: 'mg', rda: 0.9 },
    { id: 'Manganese', label: 'Manganese', group: 'Minerals', unit: 'mg', rda: 2.3 },
    // Vitamins
    { id: 'Vitamin A', label: 'Vitamin A', group: 'Vitamins', unit: 'μg', rda: 900 },
    { id: 'Vitamin C', label: 'Vitamin C', group: 'Vitamins', unit: 'mg', rda: 90 },
    { id: 'Vitamin D', label: 'Vitamin D', group: 'Vitamins', unit: 'μg', rda: 20 },
    { id: 'Vitamin E', label: 'Vitamin E', group: 'Vitamins', unit: 'mg', rda: 15 },
    { id: 'Vitamin K', label: 'Vitamin K', group: 'Vitamins', unit: 'μg', rda: 120 },
    { id: 'B1 (Thiamine)', label: 'Vitamin B1', group: 'Vitamins', unit: 'mg', rda: 1.2 },
    { id: 'B2 (Riboflavin)', label: 'Vitamin B2', group: 'Vitamins', unit: 'mg', rda: 1.3 },
    { id: 'B3 (Niacin)', label: 'Vitamin B3', group: 'Vitamins', unit: 'mg', rda: 16 },
    { id: 'B5 (Pantothenic Acid)', label: 'Vitamin B5', group: 'Vitamins', unit: 'mg', rda: 5 },
    { id: 'B6 (Pyridoxine)', label: 'Vitamin B6', group: 'Vitamins', unit: 'mg', rda: 1.7 },
    { id: 'B9 (Folate)', label: 'Vitamin B9 (Folate)', group: 'Vitamins', unit: 'μg', rda: 400 },
    { id: 'B12 (Cobalamin)', label: 'Vitamin B12', group: 'Vitamins', unit: 'μg', rda: 2.4 },
    { id: 'Choline', label: 'Choline', group: 'Other', unit: 'mg', rda: 550 },
];

interface FoodRanking {
    rank: number;
    name: string;
    image: string | null;
    value: number;
}

export function ChatbotNutridexFull() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNutrient, setSelectedNutrient] = useState<Nutrient | null>(null);
    const [topFoods, setTopFoods] = useState<FoodRanking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    const filteredNutrients = useMemo(() => {
        if (!searchQuery) return NUTRIENT_LIBRARY;
        const q = searchQuery.toLowerCase();
        return NUTRIENT_LIBRARY.filter(n =>
            n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
        );
    }, [searchQuery, NUTRIENT_LIBRARY]);

    const groupedNutrients = useMemo(() => {
        const groups: Record<string, Nutrient[]> = {};
        filteredNutrients.forEach(nutrient => {
            if (!groups[nutrient.group]) groups[nutrient.group] = [];
            groups[nutrient.group].push(nutrient);
        });
        return groups;
    }, [filteredNutrients]);

    const selectNutrient = useCallback(async (nutrient: Nutrient) => {
        setSelectedNutrient(nutrient);
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, image_url, ' + nutrient.id)
                .order(nutrient.id, { ascending: false })
                .limit(10);

            if (error) throw error;
            const rankings: FoodRanking[] = (data || []).map((item: any, idx) => ({
                rank: idx + 1,
                name: item.name,
                image: item.image_url,
                value: item[nutrient.id] || 0
            }));
            setTopFoods(rankings);
        } catch (error) {
            console.error('Error fetching nutrient data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    if (selectedNutrient) {
        return (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <button
                    onClick={() => {
                        setSelectedNutrient(null);
                        setTopFoods([]);
                    }}
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 mb-4"
                >
                    <ChevronLeft size={16} /> Back to Nutrients
                </button>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="font-bold text-lg">{selectedNutrient.label}</h3>
                            <p className="text-sm text-muted-foreground">Daily Target: {selectedNutrient.rda} {selectedNutrient.unit}</p>
                        </div>
                        <Target className="text-blue-500" size={20} />
                    </div>
                </div>

                <div className="space-y-2">
                    {isLoading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading top sources...</div>
                    ) : (
                        topFoods.map((food) => (
                            <div key={food.rank} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent">
                                {food.image && (
                                    <img src={food.image} alt={food.name} className="w-12 h-12 rounded object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-600">#{food.rank}</span>
                                        <p className="font-medium truncate">{food.name}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {food.value.toFixed(1)} {selectedNutrient.unit}
                                    </p>
                                </div>
                                {food.value >= (selectedNutrient.rda || 0) && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                                        HIGH
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Search nutrients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {Object.entries(groupedNutrients).map(([group, nutrients]) => (
                <div key={group} className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase">{group}</h3>
                    <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                        {nutrients.map((nutrient) => (
                            <button
                                key={nutrient.id}
                                onClick={() => selectNutrient(nutrient)}
                                className="text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{nutrient.label}</p>
                                        <p className="text-xs text-muted-foreground">Target: {nutrient.rda} {nutrient.unit}</p>
                                    </div>
                                    <Heart
                                        size={16}
                                        className={favorites.includes(nutrient.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
