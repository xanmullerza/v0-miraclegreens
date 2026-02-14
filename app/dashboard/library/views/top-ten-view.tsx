'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Trophy,
    Activity,
    ArrowRight,
    Loader2,
    Info,
    TrendingUp,
    Scale,
    Zap,
    Gem,
    Droplet,
    Battery,
    Heart,
    Filter,
    ChevronDown,
    Apple,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '../../../../components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../../../components/ui/tooltip";
import { CATEGORIES } from '@/components/library/foods-view';

interface TopFood {
    id: string;
    name: string;
    common_name: string;
    slug: string;
    value: number;
    image?: string;
    category?: string[];
}

// Full tracked nutrients list in alphabetical order
export const NUTRIENTS = [
    { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B3 (Niacin)', label: 'B3 (Niacin)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', unit: 'mg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B9 (Folate)', label: 'B9 (Folate)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', unit: 'µg', color: 'bg-blue-500', icon: Droplet },
    { id: 'Calcium', label: 'Calcium', unit: 'mg', color: 'bg-slate-500', icon: Gem },
    { id: 'carbs_g', label: 'Carbs', unit: 'g', color: 'bg-orange-500', icon: Zap },
    { id: 'Choline', label: 'Choline', unit: 'mg', color: 'bg-indigo-500', icon: Droplet },
    { id: 'Copper', label: 'Copper', unit: 'mg', color: 'bg-rose-500', icon: Gem },
    { id: 'energy_kcal', label: 'Energy (Calories)', unit: 'kcal', color: 'bg-amber-500', icon: Zap },
    { id: 'fat_g', label: 'Fat', unit: 'g', color: 'bg-amber-500', icon: Zap },
    { id: 'Fiber', label: 'Fiber', unit: 'g', color: 'bg-emerald-500', icon: Activity },
    { id: 'Iron', label: 'Iron', unit: 'mg', color: 'bg-red-500', icon: Gem },
    { id: 'Magnesium', label: 'Magnesium', unit: 'mg', color: 'bg-purple-500', icon: Gem },
    { id: 'Manganese', label: 'Manganese', unit: 'mg', color: 'bg-stone-500', icon: Gem },
    { id: 'Phosphorus', label: 'Phosphorus', unit: 'mg', color: 'bg-indigo-400', icon: Gem },
    { id: 'Potassium', label: 'Potassium', unit: 'mg', color: 'bg-sky-500', icon: Gem },
    { id: 'protein_g', label: 'Protein', unit: 'g', color: 'bg-blue-600', icon: Scale },
    { id: 'Selenium', label: 'Selenium', unit: 'µg', color: 'bg-pink-500', icon: Gem },
    { id: 'Sodium', label: 'Sodium', unit: 'mg', color: 'bg-slate-400', icon: Gem },
    { id: 'Vitamin A', label: 'Vitamin A', unit: 'µg', color: 'bg-orange-400', icon: Battery },
    { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg', color: 'bg-yellow-400', icon: Droplet },
    { id: 'Vitamin D', label: 'Vitamin D', unit: 'IU', color: 'bg-yellow-200', icon: Battery },
    { id: 'Vitamin E', label: 'Vitamin E', unit: 'mg', color: 'bg-emerald-400', icon: Battery },
    { id: 'Vitamin K', label: 'Vitamin K', unit: 'µg', color: 'bg-green-600', icon: Battery },
    { id: 'Zinc', label: 'Zinc', unit: 'mg', color: 'bg-cyan-500', icon: Gem },
    { id: 'Cholesterol', label: 'Cholesterol', unit: 'mg', color: 'bg-red-400', icon: Activity },
    { id: 'Omega-3', label: 'Omega-3', unit: 'g', color: 'bg-teal-500', icon: Droplet },
    { id: 'Oxalate', label: 'Oxalate', unit: 'mg', color: 'bg-amber-600', icon: Gem },
    { id: 'Sugar', label: 'Sugar', unit: 'g', color: 'bg-pink-400', icon: Zap },
    { id: 'welcome', label: 'Welcome', unit: '', color: 'bg-emerald-500', icon: Sparkles },
];

interface TopTenViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: (value: boolean) => void;
    selectedCategories?: string[];
    setSelectedCategories?: (value: string[]) => void;
    selectedNutrientId?: string;
    onNutrientChange?: (id: string) => void;
}

export function TopTenView({
    showFavoritesOnly: externalShowFavorites,
    setShowFavoritesOnly: externalSetShowFavorites,
    selectedCategories: externalSelectedCategories,
    setSelectedCategories: externalSetSelectedCategories,
    onNutrientChange,
    selectedNutrientId: externalSelectedNutrientId,
}: TopTenViewProps = {}) {
    const [localSelectedNutrientId, setLocalSelectedNutrientId] = useState('protein_g');
    const selectedNutrientId = externalSelectedNutrientId || localSelectedNutrientId;
    const selectedNutrient = NUTRIENTS.find(n => n.id === selectedNutrientId) || NUTRIENTS[19];

    const [foods, setFoods] = useState<TopFood[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>(
        CATEGORIES.filter(c => c !== 'Flavour' && c !== 'Supplements')
    );
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [localShowFavoritesOnly, setLocalShowFavoritesOnly] = useState(false);

    // Use external state if provided, otherwise use local state
    const showFavoritesOnly = externalShowFavorites !== undefined ? externalShowFavorites : localShowFavoritesOnly;
    const setShowFavoritesOnly = externalSetShowFavorites || setLocalShowFavoritesOnly;
    const selectedCategories = externalSelectedCategories !== undefined ? externalSelectedCategories : localSelectedCategories;
    const setSelectedCategories = externalSetSelectedCategories || setLocalSelectedCategories;

    useEffect(() => {
        const fetchTopFoods = async () => {
            setIsLoading(true);
            try {
                let query = supabase.from('food_items').select('*');

                if (selectedCategories.length < CATEGORIES.length) {
                    query = query.in('category', selectedCategories);
                }

                // If it's a macro or top-level column, we can sort directly
                if (['protein_g', 'fat_g', 'carbs_g', 'energy_kcal'].includes(selectedNutrient.id)) {
                    query = query.order(selectedNutrient.id, { ascending: false });
                }

                const { data, error } = await query;

                if (error) throw error;
                if (!data) return;

                let processedData: TopFood[] = [];

                if (['protein_g', 'fat_g', 'carbs_g', 'energy_kcal'].includes(selectedNutrient.id)) {
                    processedData = data.slice(0, 10).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        common_name: item.common_name,
                        slug: item.slug,
                        value: item[selectedNutrient.id],
                        image: item.image,
                        category: item.category
                    }));
                } else {
                    // Client-side sort for JSONB micronutrients
                    const candidates = data.map((item: any) => {
                        let val = 0;
                        if (item.micronutrients) {
                            val = item.micronutrients[selectedNutrient.id] || 0;
                        }
                        return {
                            id: item.id,
                            name: item.name,
                            common_name: item.common_name,
                            slug: item.slug,
                            value: val,
                            image: item.image,
                            category: item.category
                        };
                    });

                    processedData = candidates
                        .sort((a: any, b: any) => b.value - a.value)
                        .slice(0, 10);
                }

                setFoods(processedData.filter(f => f.value > 0));

            } catch (err) {
                console.error("Error fetching top foods:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopFoods();
    }, [selectedNutrient, selectedCategories]);

    const maxValue = foods.length > 0 ? foods[0].value : 100;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">



            {/* Results List */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
                {isLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading results...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {foods.length > 0 ? foods.map((food, index) => (
                            <div key={food.id} className="group relative">
                                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                                    {/* Food Image */}
                                    <div className={cn(
                                        "w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center",
                                        index === 0 ? "border-4 border-yellow-400 shadow-lg shadow-yellow-400/20" :
                                            index === 1 ? "border-4 border-slate-300 shadow-lg shadow-slate-300/20" :
                                                index === 2 ? "border-4 border-amber-600 shadow-lg shadow-amber-600/20" :
                                                    "border border-slate-200 dark:border-slate-800"
                                    )}>
                                        {food.image ? (
                                            <img
                                                src={food.image}
                                                alt={food.common_name || food.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <Apple size={24} className="text-slate-400" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-4 text-sm">
                                                {food.common_name || food.name}
                                            </h3>
                                            <div className="text-right flex-shrink-0">
                                                <span className="font-black text-base text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                    {food.value < 10 && food.value !== 0 ? food.value.toFixed(1) : Math.round(food.value)}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 ml-1">{selectedNutrient.unit}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar Container */}
                                        <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out", selectedNutrient.color)}
                                                style={{ width: `${(food.value / maxValue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Filter size={32} className="mb-4 opacity-50" />
                                <p className="text-sm font-bold">No items found matching your filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
