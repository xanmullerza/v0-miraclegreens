'use client';

import React, { useState, useMemo } from 'react';
import { Search, Zap, Heart, Brain, Droplet, Shield, ChevronDown, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Nutrient {
    id: string;
    label: string;
    group: string;
    icon?: React.ReactNode;
}

export function ChatbotNutrients() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);
    const [topFoods, setTopFoods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    const ALL_NUTRIENTS: Nutrient[] = useMemo(() => [
        { id: 'Energy', label: 'Energy', group: 'Macros' },
        { id: 'Protein', label: 'Protein', group: 'Macros' },
        { id: 'Carbs', label: 'Carbs', group: 'Macros' },
        { id: 'Fat', label: 'Fat', group: 'Macros' },
        { id: 'Fiber', label: 'Fiber', group: 'Other' },
        { id: 'Sodium', label: 'Sodium', group: 'Electrolytes' },
        { id: 'Potassium', label: 'Potassium', group: 'Electrolytes' },
        { id: 'Calcium', label: 'Calcium', group: 'Minerals' },
        { id: 'Iron', label: 'Iron', group: 'Minerals' },
        { id: 'Zinc', label: 'Zinc', group: 'Minerals' },
        { id: 'Magnesium', label: 'Magnesium', group: 'Minerals' },
        { id: 'Vitamin A', label: 'Vitamin A', group: 'Vitamins' },
        { id: 'Vitamin C', label: 'Vitamin C', group: 'Vitamins' },
        { id: 'Vitamin D', label: 'Vitamin D', group: 'Vitamins' },
        { id: 'Vitamin E', label: 'Vitamin E', group: 'Vitamins' },
        { id: 'B12', label: 'B12 (Cobalamin)', group: 'Vitamins' },
        { id: 'Folate', label: 'Folate', group: 'Vitamins' },
    ], []);

    const filteredNutrients = useMemo(() => {
        if (!searchQuery) return ALL_NUTRIENTS;
        const q = searchQuery.toLowerCase();
        return ALL_NUTRIENTS.filter(n =>
            n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
        );
    }, [searchQuery, ALL_NUTRIENTS]);

    const groupedNutrients = useMemo(() => {
        const groups: Record<string, Nutrient[]> = {};
        filteredNutrients.forEach(nutrient => {
            if (!groups[nutrient.group]) groups[nutrient.group] = [];
            groups[nutrient.group].push(nutrient);
        });
        return groups;
    }, [filteredNutrients]);

    const fetchTopFoods = async (nutrientId: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, image_url, ' + nutrientId.toLowerCase() + '_per_100g')
                .order(nutrientId.toLowerCase() + '_per_100g', { ascending: false })
                .limit(5);

            if (error) throw error;
            setTopFoods(data || []);
        } catch (error) {
            console.error('Error fetching foods:', error);
            setTopFoods([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectNutrient = (id: string) => {
        setSelectedNutrient(id);
        fetchTopFoods(id);
    };

    const toggleGroup = (group: string) => {
        setOpenGroup(prev => prev === group ? null : group);
    };

    if (selectedNutrient) {
        return (
            <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => {
                            setSelectedNutrient(null);
                            setTopFoods([]);
                        }}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium mb-3"
                    >
                        ← Back to Nutrients
                    </button>
                    <h3 className="font-bold text-slate-900 dark:text-white">{selectedNutrient}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Top sources of this nutrient
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : topFoods.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No foods found for this nutrient
                        </div>
                    ) : (
                        topFoods.map((food, idx) => (
                            <div
                                key={food.id}
                                className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                                            #{idx + 1} {food.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                            High
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">Nutrients</h3>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nutrients..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {Object.entries(groupedNutrients).map(([group, nutrients]) => {
                    const isOpen = openGroup === group;
                    return (
                        <div key={group} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            {/* Accordion header */}
                            <button
                                onClick={() => toggleGroup(group)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {group}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Accordion body */}
                            {isOpen && (
                                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-slate-900">
                                    {nutrients.map(nutrient => (
                                        <div
                                            key={nutrient.id}
                                            className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-left transition-colors flex items-center justify-between gap-2"
                                        >
                                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                                                {nutrient.label}
                                            </p>
                                            <button
                                                onClick={() => handleSelectNutrient(nutrient.id)}
                                                title={`Learn about ${nutrient.label}`}
                                                className="flex-shrink-0 p-1.5 rounded-md text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                                            >
                                                <BookOpen size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
