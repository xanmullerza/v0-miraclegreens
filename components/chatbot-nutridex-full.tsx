'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, ChevronLeft, Activity, Zap, Gem, Battery } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Nutrient {
    id: string;
    label: string;
    group: string;
    unit: string;
    rda?: number;
}

interface FoodRanking {
    rank: number;
    name: string;
    common_name?: string;
    image_url: string | null;
    value: number;
}

const NUTRIENT_LIBRARY: Nutrient[] = [
    { id: 'Energy', label: 'Energy', group: 'Macros', unit: 'kcal', rda: 2000 },
    { id: 'Protein', label: 'Protein', group: 'Macros', unit: 'g', rda: 50 },
    { id: 'Carbs', label: 'Carbohydrates', group: 'Macros', unit: 'g', rda: 300 },
    { id: 'Fat', label: 'Fat', group: 'Macros', unit: 'g', rda: 78 },
    { id: 'Fiber', label: 'Fiber', group: 'Macros', unit: 'g', rda: 25 },
    { id: 'Sodium', label: 'Sodium', group: 'Minerals', unit: 'mg', rda: 2300 },
    { id: 'Potassium', label: 'Potassium', group: 'Minerals', unit: 'mg', rda: 3500 },
    { id: 'Calcium', label: 'Calcium', group: 'Minerals', unit: 'mg', rda: 1000 },
    { id: 'Iron', label: 'Iron', group: 'Minerals', unit: 'mg', rda: 18 },
    { id: 'Magnesium', label: 'Magnesium', group: 'Minerals', unit: 'mg', rda: 400 },
    { id: 'Zinc', label: 'Zinc', group: 'Minerals', unit: 'mg', rda: 11 },
    { id: 'Selenium', label: 'Selenium', group: 'Minerals', unit: 'μg', rda: 55 },
    { id: 'Vitamin A', label: 'Vitamin A', group: 'Vitamins', unit: 'μg', rda: 900 },
    { id: 'Vitamin C', label: 'Vitamin C', group: 'Vitamins', unit: 'mg', rda: 90 },
    { id: 'Vitamin D', label: 'Vitamin D', group: 'Vitamins', unit: 'μg', rda: 20 },
    { id: 'Vitamin E', label: 'Vitamin E', group: 'Vitamins', unit: 'mg', rda: 15 },
    { id: 'B12 (Cobalamin)', label: 'Vitamin B12', group: 'Vitamins', unit: 'μg', rda: 2.4 },
];

const GROUP_ICONS: Record<string, any> = {
    'Macros': Zap,
    'Minerals': Gem,
    'Vitamins': Battery
};

export function ChatbotNutridexFull() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNutrient, setSelectedNutrient] = useState<Nutrient | null>(null);
    const [topFoods, setTopFoods] = useState<FoodRanking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const filteredNutrients = useMemo(() => {
        if (!searchQuery) return NUTRIENT_LIBRARY;
        const q = searchQuery.toLowerCase();
        return NUTRIENT_LIBRARY.filter(n =>
            n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
        );
    }, [searchQuery]);

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
                .select('id, name, common_name, image_url, ' + nutrient.id)
                .order(nutrient.id, { ascending: false })
                .limit(10);

            if (error) throw error;
            const rankings: FoodRanking[] = (data || []).map((item: any, idx) => ({
                rank: idx + 1,
                name: item.name,
                common_name: item.common_name,
                image_url: item.image_url,
                value: item[nutrient.id] || 0
            }));
            setTopFoods(rankings);
        } catch (error) {
            console.error('Error fetching nutrient data:', error);
            setTopFoods([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Detail View
    if (selectedNutrient) {
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <button
                    onClick={() => {
                        setSelectedNutrient(null);
                        setTopFoods([]);
                    }}
                    className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold uppercase tracking-wider mb-2"
                >
                    <ChevronLeft size={14} /> Back to Nutrients
                </button>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">{selectedNutrient.label}</h3>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 opacity-75">
                                Daily Target: {selectedNutrient.rda} {selectedNutrient.unit}
                            </p>
                        </div>
                        <Activity className="text-emerald-600 dark:text-emerald-400" size={18} />
                    </div>
                </div>

                <div className="space-y-2">
                    {isLoading ? (
                        <div className="text-center py-6 text-xs text-muted-foreground">Loading...</div>
                    ) : topFoods.length > 0 ? (
                        topFoods.map((food) => (
                            <div key={food.rank} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors">
                                {food.image_url && (
                                    <img src={food.image_url} alt={food.name} className="w-10 h-10 rounded object-cover shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">#{food.rank}</span>
                                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{food.common_name || food.name}</p>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {food.value.toFixed(1)} {selectedNutrient.unit} / 100g
                                    </p>
                                </div>
                                {food.value >= (selectedNutrient.rda || 0) && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-[9px] font-bold whitespace-nowrap shrink-0">
                                        HIGH
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-xs text-muted-foreground">No foods found</div>
                    )}
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-3 max-h-[550px] overflow-y-auto">
            <div className="relative sticky top-0 z-10 bg-white dark:bg-slate-900 pb-2">
                <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="Search nutrients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700"
                />
            </div>

            {Object.entries(groupedNutrients).map(([group, nutrients]) => {
                const GroupIcon = GROUP_ICONS[group] || Activity;
                return (
                    <div key={group} className="space-y-2">
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
                            <GroupIcon size={12} /> {group}
                        </h3>
                        <div className="space-y-1">
                            {nutrients.map((nutrient) => (
                                <button
                                    key={nutrient.id}
                                    onClick={() => selectNutrient(nutrient)}
                                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors bg-slate-50 dark:bg-slate-900/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-xs text-slate-900 dark:text-white">{nutrient.label}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                Target: {nutrient.rda} {nutrient.unit}
                                            </p>
                                        </div>
                                        <Activity size={14} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
