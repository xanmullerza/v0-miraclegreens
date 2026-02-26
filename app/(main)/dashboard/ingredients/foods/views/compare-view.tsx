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
    Beef,
    Trophy,
    Medal,
    Award,
    ChevronRight,
    RefreshCw,
    ChefHat,
    History,
    ArrowRight,
    Leaf,
    Beaker
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HeroSearch } from '@/components/ui/hero-search';
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

interface RelatedMeal {
    id: string;
    title: string;
    image: string | null;
    diet: string[];
    type: string;
}

const NUTRIENT_GROUPS = [
    {
        title: "Macros",
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
        title: "Minerals",
        icon: Gem,
        theme: "rose",
        keys: [
            { label: 'Potassium', key: 'Potassium', unit: 'mg' },
            { label: 'Magnesium', key: 'Magnesium', unit: 'mg' },
            { label: 'Calcium', key: 'Calcium', unit: 'mg' },
            { label: 'Sodium', key: 'Sodium', unit: 'mg' },
            { label: 'Phosphorus', key: 'Phosphorus', unit: 'mg' },
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
            { label: 'Vitamin B1', key: 'B1 (Thiamine)', unit: 'mg' },
            { label: 'Vitamin B2', key: 'B2 (Riboflavin)', unit: 'mg' },
            { label: 'Vitamin B3', key: 'B3 (Niacin)', unit: 'mg' },
            { label: 'Vitamin B5', key: 'B5 (Pantothenic Acid)', unit: 'mg' },
            { label: 'Vitamin B6', key: 'B6 (Pyridoxine)', unit: 'mg' },
            { label: 'Vitamin B9', key: 'B9 (Folate)', unit: 'µg' },
            { label: 'Vitamin B12', key: 'B12 (Cobalamin)', unit: 'µg' },
            { label: 'Choline', key: 'Choline', unit: 'mg' }
        ]
    }
];

interface CompareViewProps {
    showStats?: boolean;
    stats?: {
        foods: number;
        recipes: number;
        nutrients: number;
        mixes: number;
    };
}

export function CompareView({ showStats = false, stats }: CompareViewProps) {
    const [selectedFoods, setSelectedFoods] = useState<(FoodItem | null)[]>([null, null, null]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSlot, setActiveSlot] = useState<number | null>(null); // Which box are we picking for?
    const [relatedMeals, setRelatedMeals] = useState<RelatedMeal[]>([]);
    const [isLoadingMeals, setIsLoadingMeals] = useState(false);
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

    // Fetch meals containing selected ingredients
    useEffect(() => {
        const fetchRelatedMeals = async () => {
            const foodIds = selectedFoods.filter(f => f !== null).map(f => f!.id);
            if (foodIds.length === 0) {
                setRelatedMeals([]);
                return;
            }

            setIsLoadingMeals(true);
            try {
                // Find recipes that contain these food items
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from('ingredients')
                    .select('recipe_id')
                    .in('food_item_id', foodIds);

                if (ingredientError) throw ingredientError;

                const recipeIds = Array.from(new Set(ingredientData?.map(i => i.recipe_id) || []));

                if (recipeIds.length === 0) {
                    setRelatedMeals([]);
                    return;
                }

                // Fetch recipe details
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, title, image, diet, type')
                    .in('id', recipeIds)
                    .limit(6);

                if (recipeError) throw recipeError;
                setRelatedMeals(recipeData || []);
            } catch (error) {
                console.error('Error fetching related meals:', error);
            } finally {
                setIsLoadingMeals(false);
            }
        };

        fetchRelatedMeals();
    }, [selectedFoods]);

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

        if (rank === 0) return { icon: Trophy, color: "text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]", label: "1st" };
        if (rank === 1) return { icon: Medal, color: "text-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]", label: "2nd" };
        if (rank === 2) return { icon: Award, color: "text-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.3)]", label: "3rd" };
        return null;
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">

            {/* Shared search hero */}
            <div className="pt-6"> {/* extra padding to drop the viewer */}
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={activeSlot !== null}
                    setIsActive={(active) => {
                        if (!active) setActiveSlot(null);
                    }}
                    onSelect={selectFood}
                    onFocus={() => {
                        if (activeSlot === null) {
                            const firstEmpty = selectedFoods.findIndex(f => f === null);
                            setActiveSlot(firstEmpty !== -1 ? firstEmpty : 0);
                        }
                    }}
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleTitle="Ready to Compare?"
                    idleSubtitle="Search below to add your first food item"
                    noResultsMessage="No matching items found"
                    enterMessage="Enter item name to compare"
                    searchingMessage="Searching Library..."
                    idleExtra={
                        activeSlot === null && selectedFoods.some(f => f !== null) ? (
                            <div className="flex flex-col items-center justify-center h-full animate-in fade-in duration-500 mt-4">
                                <button
                                    onClick={clearAll}
                                    className="px-5 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:border-rose-500/50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                                >
                                    <Trash2 size={14} /> Clear All
                                </button>
                            </div>
                        ) : null
                    }
                    renderResult={(food: any) => (
                        <>
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
                    </>
                )}
            />
            </div>

            {/* Comparison Table */}
            {showStats && stats && (
                <div className="w-full md:max-w-[900px] mx-auto relative px-0 group/stats">
                    <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 px-8 w-full overflow-hidden backdrop-blur-md transition-all duration-500 hover:bg-slate-900/60 hover:border-slate-700/60">
                        <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none group-hover/stats:opacity-[0.05] transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 md:flex md:flex-wrap md:items-start md:justify-center md:gap-8 lg:gap-12">
                            <div className="flex items-center gap-3 group/stat">
                                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                    <Activity size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.nutrients}+</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Nutrients</p>
                                </div>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
                            <div className="flex items-center gap-3 group/stat">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                    <Leaf size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.foods}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Foods</p>
                                </div>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
                            <div className="flex items-center gap-3 group/stat">
                                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                    <Beaker size={16} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.mixes}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Mixes</p>
                                </div>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
                            <div className="flex items-center gap-3 group/stat">
                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                    <ChefHat size={16} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.recipes}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Meals</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Table */}
            <div className="w-full md:max-w-[900px] mx-auto bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse table-fixed md:table-auto">
                        <thead className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                            <tr>
                                <th className="p-2 md:p-8 text-left bg-slate-50/50 dark:bg-slate-800/30 w-[100px] md:w-1/4 min-w-[100px] md:min-w-[200px] sticky left-0 z-40 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)] border-r border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1 md:gap-3">
                                        <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Scale size={14} className="md:w-5 md:h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[9px] md:text-sm uppercase italic text-slate-900 dark:text-white leading-none mb-1">Nutrition</h3>
                                            <p className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">per 100g</p>
                                        </div>
                                    </div>
                                </th>
                                {[0, 1, 2].map((i) => (
                                    <th key={i} className="p-2 md:p-8 text-center border-l border-slate-100 dark:border-slate-800 w-[85px] md:w-1/4 min-w-[85px] md:min-w-0">
                                        <div className="flex flex-col items-center gap-1 md:gap-2">
                                            {selectedFoods[i] ? (
                                                <div className="relative group/card flex flex-col items-center">
                                                    <div className="flex justify-center mb-1 animate-in zoom-in duration-500">
                                                        {getMedal(i) ? React.createElement(getMedal(i)!.icon, {
                                                            size: 16,
                                                            className: cn("md:w-6 md:h-6", getMedal(i)!.color)
                                                        }) : (
                                                            <div className="w-4 h-4 md:w-6 md:h-6" /> // Placeholder to maintain height
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-[9px] md:text-sm uppercase italic text-slate-900 dark:text-white line-clamp-1 mb-1 text-center">
                                                        {selectedFoods[i]?.common_name || selectedFoods[i]?.name}
                                                    </h4>
                                                    <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-2 justify-center">
                                                        <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-none font-black text-[6px] md:text-[8px] uppercase tracking-widest px-1 md:px-2">
                                                            {scores[i]} Score
                                                        </Badge>
                                                        {getMedal(i) && (
                                                            <span className={cn("text-[7px] md:text-[10px] font-black uppercase italic tracking-tighter leading-none whitespace-nowrap", getMedal(i)!.color.split(' ')[0])}>
                                                                {getMedal(i)!.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Swap Button - Always Visible */}
                                                    <button
                                                        onClick={() => setActiveSlot(i)}
                                                        className="mt-1.5 md:mt-2 flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-orange-500 text-white hover:bg-orange-600 border border-orange-600/20 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                                    >
                                                        <RefreshCw size={10} className="md:w-3 md:h-3" />
                                                        <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">Swap</span>
                                                    </button>
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
                                        <td colSpan={4} className="px-2 md:px-8 py-2 md:py-3 sticky left-0 z-20 bg-slate-50/80 dark:bg-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <group.icon size={11} className={cn("md:w-[14px] md:h-[14px]", themes[group.theme as keyof typeof themes].split(' ')[0])} />
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
                                                <td className="p-2 md:p-6 px-2 md:px-12 sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] focus-within:z-30">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[11px] font-black uppercase tracking-wider md:tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors truncate">
                                                            {nutrient.label}
                                                        </span>
                                                        <span className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {nutrient.key === 'energy_kcal' ? energyUnit : nutrient.unit}
                                                        </span>
                                                    </div>
                                                </td>
                                                {[0, 1, 2].map((i) => {
                                                    const val = values[i];
                                                    const rank = val !== null ? sortedUniqueValues.indexOf(val) : -1;
                                                    const colorClass = rank === 0 ? "text-emerald-500" : rank === 1 ? "text-blue-500" : rank === 2 ? "text-rose-500" : "text-slate-900 dark:text-white";

                                                    return (
                                                        <td key={i} className="p-2 md:p-6 text-center border-l border-slate-100 dark:border-slate-800">
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

            {/* Related Meals Section */}
            {(relatedMeals.length > 0 || isLoadingMeals) && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between px-2 md:px-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <ChefHat size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm md:text-lg uppercase italic text-slate-900 dark:text-white leading-none mb-1">Related Meals</h3>
                                <p className="text-[9px] md:text-[11px] font-black text-indigo-500 uppercase tracking-widest leading-none">Meals containing these ingredients</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <History size={14} className="opacity-50" />
                            Suggested
                        </div>
                    </div>

                    {isLoadingMeals ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="aspect-[4/5] rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {relatedMeals.map((meal) => (
                                <a
                                    key={meal.id}
                                    href={`/dashboard/recipes/meals/${meal.id}`}
                                    className="group relative flex flex-col items-center text-center gap-3 p-4 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all duration-500 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1"
                                >
                                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform duration-700">
                                        {meal.image ? (
                                            <img src={meal.image} className="w-full h-full object-cover" alt={meal.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ChefHat className="text-slate-200" size={32} />
                                            </div>
                                        )}
                                        {/* Overlay with Type */}
                                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border border-slate-100 dark:border-slate-800">
                                            <p className="text-[7px] font-black uppercase tracking-widest text-indigo-500">{meal.type}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 px-1">
                                        <h4 className="font-black text-[10px] md:text-xs uppercase italic text-slate-900 dark:text-white line-clamp-2 min-h-[2.5em]">
                                            {meal.title}
                                        </h4>
                                        <div className="flex flex-wrap gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {meal.diet.slice(0, 2).map((d) => (
                                                <span key={d} className="text-[6px] font-black uppercase tracking-widest text-slate-400">
                                                    #{d}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/20 rounded-[2.5rem] transition-all duration-500 pointer-events-none" />
                                    <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-lg shadow-indigo-500/40">
                                        <ArrowRight size={14} />
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div >
    );
}
