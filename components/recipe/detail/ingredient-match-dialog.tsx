'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ChevronRight, ChevronLeft, Search, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { searchFoodItem, getUSDAFoodDetails } from '@/lib/services/nutrition';
import { supabase } from '@/lib/supabase';
import { extractCoreName } from '@/lib/utils/parsing-utils';

interface UnmatchedIngredient {
    id: string;
    item: string;
    base_ingredient: string;
    amount: string;
}

interface IngredientMatchDialogProps {
    unmatchedIngredients: UnmatchedIngredient[];
    onComplete: () => void;
    isOpen: boolean;
    onMatched: (ingId: string, foodItem: any) => void;
}

export function IngredientMatchDialog({
    unmatchedIngredients,
    onComplete,
    isOpen,
    onMatched
}: IngredientMatchDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [skipped, setSkipped] = useState<Set<string>>(new Set());
    const [selectedMatches, setSelectedMatches] = useState<Record<string, any>>({});

    if (!isOpen || unmatchedIngredients.length === 0) return null;

    const current = unmatchedIngredients[currentIndex];
    const isSkipped = skipped.has(current.id);
    const isSearchLoading = isSearching;

    // Initialize search query with ingredient name
    React.useEffect(() => {
        if (currentIndex < unmatchedIngredients.length) {
            const coreName = extractCoreName(current.base_ingredient || current.item);
            setSearchQuery(coreName);
            executeSearch(coreName);
        }
    }, [currentIndex]);

    const executeSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchFoodItem(query);
            setSearchResults(results.slice(0, 8));
        } catch (err) {
            console.error('Search error:', err);
            toast.error('Search failed');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = async (result: any) => {
        // Check if food already exists or import from USDA
        let finalFood = result;

        if (result.source === 'usda') {
            try {
                const toastId = toast.loading(`Importing ${result.name}...`);
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id || null;

                const details = await getUSDAFoodDetails(result.fdcId);
                const foodData = {
                    name: result.name,
                    common_name: result.common_name || null,
                    source: 'usda',
                    category: 'General',
                    energy_kcal: result.energy_kcal || 0,
                    energy_kj: result.energy_kj || Math.round((result.energy_kcal || 0) * 4.184),
                    protein_g: result.protein_g || 0,
                    carbs_g: result.carbs_g || 0,
                    fat_g: result.fat_g || 0,
                    micronutrients: details.micronutrients || result.micronutrients || {},
                    portions: details.portions || [],
                    user_id: userId,
                    is_curated: false
                };

                let insertedFood;
                const { data: existingFood } = await supabase
                    .from('food_items')
                    .select('*')
                    .eq('name', result.name)
                    .single();

                if (existingFood) {
                    insertedFood = existingFood;
                } else {
                    const { data: newFood, error } = await supabase
                        .from('food_items')
                        .insert(foodData)
                        .select()
                        .single();

                    if (error) {
                        if (error.code === '23505') {
                            const { data: fallbackFood } = await supabase
                                .from('food_items')
                                .select('*')
                                .eq('name', result.name)
                                .single();
                            if (fallbackFood) insertedFood = fallbackFood;
                            else throw error;
                        } else throw error;
                    } else {
                        insertedFood = newFood;
                    }
                }

                finalFood = { ...insertedFood, source: 'usda' };
                toast.success(`✓ Matched: ${result.name}`, { id: toastId });
            } catch (err: any) {
                console.error('Import error:', err);
                toast.error(err.message || 'Failed to import');
                return;
            }
        }

        setSelectedMatches(prev => ({ ...prev, [current.id]: finalFood }));
        onMatched(current.id, finalFood);
        moveToNext();
    };

    const handleSkip = () => {
        setSkipped(prev => new Set(prev).add(current.id));
        toast.info(`⊘ Skipped "${current.base_ingredient || current.item}"`);
        moveToNext();
    };

    const moveToNext = () => {
        if (currentIndex < unmatchedIngredients.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSearchResults([]);
        } else {
            onComplete();
        }
    };

    const moveToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setSearchResults([]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in scale-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Search size={20} className="text-white" />
                        <h2 className="text-lg font-bold text-white">Match Helper</h2>
                    </div>
                    <p className="text-indigo-100 text-sm">
                        Step {currentIndex + 1} of {unmatchedIngredients.length}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Current Ingredient Display */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 mb-2">
                            Ingredient
                        </p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {current.base_ingredient || current.item}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {current.amount}
                        </p>
                    </div>

                    {/* Search Box */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 block mb-2">
                            Search & Select
                        </label>
                        <div className="relative group">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') executeSearch(searchQuery);
                                }}
                                placeholder="Search food items..."
                                className="w-full px-4 py-3 pl-8 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Search Results */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {isSearchLoading ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <Loader2 size={14} className="animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-500">Searching...</span>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500">No results found. Try a different search term.</p>
                            </div>
                        ) : (
                            searchResults.map((result, idx) => (
                                <button
                                    key={result.id || idx}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                                >
                                    <div className="flex-1 min-w-0 mr-2">
                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {result.name}
                                        </p>
                                        {result.source === 'usda' && (
                                            <p className="text-[8px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest">USDA</p>
                                        )}
                                        {result.energy_kcal && (
                                            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                {result.energy_kcal}kcal · P:{result.protein_g}g · C:{result.carbs_g}g · F:{result.fat_g}g
                                            </p>
                                        )}
                                    </div>
                                    <Check size={16} className="text-indigo-500 flex-shrink-0" />
                                </button>
                            ))
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSkip}
                            className="flex-1 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wide border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                        >
                            Skip
                        </button>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                    <button
                        onClick={moveToPrevious}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {currentIndex + 1} / {unmatchedIngredients.length}
                    </span>
                    <button
                        onClick={moveToNext}
                        disabled={currentIndex === unmatchedIngredients.length - 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Skip <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
