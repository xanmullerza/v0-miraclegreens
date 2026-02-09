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
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopFood {
    id: string;
    name: string;
    common_name: string;
    slug: string;
    value: number;
    image_url?: string;
    category?: string[];
}

// Major nutrients mapping for the selector
const NUTRIENTS = [
    { id: 'protein_g', label: 'Protein', unit: 'g', color: 'bg-blue-500', icon: Scale },
    { id: 'fat_g', label: 'Healthy Fats', unit: 'g', color: 'bg-amber-500', icon: Activity },
    { id: 'fiber', label: 'Fiber', unit: 'g', color: 'bg-emerald-500', icon: Activity },
    { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg', color: 'bg-orange-500', icon: ZapIcon },
    { id: 'Iron', label: 'Iron', unit: 'mg', color: 'bg-red-500', icon: Activity },
    { id: 'Calcium', label: 'Calcium', unit: 'mg', color: 'bg-slate-500', icon: Activity },
    { id: 'Magnesium', label: 'Magnesium', unit: 'mg', color: 'bg-purple-500', icon: Activity },
    { id: 'Potassium', label: 'Potassium', unit: 'mg', color: 'bg-indigo-500', icon: Activity },
    { id: 'Zinc', label: 'Zinc', unit: 'mg', color: 'bg-cyan-500', icon: Activity },
];

function ZapIcon({ className }: { className?: string }) {
    return <Activity className={className} />;
}

export function TopTenView() {
    const [selectedNutrient, setSelectedNutrient] = useState(NUTRIENTS[0]);
    const [foods, setFoods] = useState<TopFood[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTopFoods = async () => {
            setIsLoading(true);
            try {
                let query = supabase.from('food_items').select('*');

                // If it's a macro (protein, fat), we can sort directly on the column
                if (['protein_g', 'fat_g'].includes(selectedNutrient.id)) {
                    query = query.order(selectedNutrient.id, { ascending: false });
                } else {
                    // For micronutrients in JSONB, we need to handle it differently.
                    // Since supabase-js direct ordering on jsonb keys without a view or computed column can be tricky,
                    // we'll fetch a larger set and sort client-side for this MVP, or use a raw query if needed.
                    // For performance on small datasets (~1000 items), client-side sort is acceptable.
                    // Fetching mostly everything to sort might be heavy, so let's try to filter non-nulls first if possible.
                }

                const { data, error } = await query;

                if (error) throw error;
                if (!data) return;

                let processedData: TopFood[] = [];

                if (['protein_g', 'fat_g'].includes(selectedNutrient.id)) {
                    processedData = data.slice(0, 10).map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        common_name: item.common_name,
                        slug: item.slug,
                        value: item[selectedNutrient.id],
                        image_url: item.image_url,
                        category: item.category
                    }));
                } else {
                    // Client-side sort for JSONB micronutrients
                    const candidates = data.map((item: any) => {
                        let val = 0;
                        // Handle potential variations in casing or structure if needed, but assuming standard schema
                        if (item.micronutrients) {
                            // Direct key access or simplified check
                            val = item.micronutrients[selectedNutrient.id] || 0;
                        }
                        return {
                            id: item.id,
                            name: item.name,
                            common_name: item.common_name,
                            slug: item.slug,
                            value: val,
                            image_url: item.image_url,
                            category: item.category
                        };
                    });

                    if (selectedNutrient.id === 'fiber') {
                        // Fiber might be a special case depending on how it's stored (macro vs micro)
                        // Assuming it might be in micronutrients for now based on previous context, 
                        // or strict access if it was migrated. 
                        // Let's check typical structure. If logic fails, falls back to 0.
                    }

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
    }, [selectedNutrient]);

    const maxValue = foods.length > 0 ? foods[0].value : 100;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 uppercase tracking-widest text-[10px] gap-1 px-3 py-1">
                            <Trophy size={10} className="fill-yellow-600" />
                            Leaderboard
                        </Badge>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                        Top 10 Sources
                    </h2>
                    <p className="text-slate-500 font-medium text-sm max-w-lg mt-1">
                        Discover the most potent sources of <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedNutrient.label}</span> in our library.
                    </p>
                </div>
            </div>

            {/* Nutrient Selector */}
            <div className="relative">
                <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar snap-x">
                    {NUTRIENTS.map((nutrient) => {
                        const Icon = nutrient.icon;
                        const isSelected = selectedNutrient.id === nutrient.id;
                        return (
                            <button
                                key={nutrient.id}
                                onClick={() => setSelectedNutrient(nutrient)}
                                className={cn(
                                    "flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border transition-all duration-300 flex-shrink-0 snap-start",
                                    isSelected
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105"
                                        : "bg-white dark:bg-slate-900/50 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                )}
                            >
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800")}>
                                    <Icon size={14} className={isSelected ? "text-white" : "text-slate-400"} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">{nutrient.label}</p>
                                    <p className={cn("text-[9px] font-medium leading-none", isSelected ? "text-slate-400" : "text-slate-400")}>Target: High</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {/* Fade indicators for scrolling */}
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-slate-50 dark:from-[#020617] to-transparent pointer-events-none md:hidden" />
            </div>

            {/* Results List */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
                {isLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analyzing Composition...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {foods.map((food, index) => (
                            <div key={food.id} className="group relative">
                                <div className="flex items-center gap-4 md:gap-6 relative z-10">
                                    {/* Rank Badge */}
                                    <div className={cn(
                                        "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl font-black text-lg italic shadow-sm transition-all duration-500 group-hover:scale-110",
                                        index === 0 ? "bg-yellow-400 text-yellow-900 shadow-yellow-400/20" :
                                            index === 1 ? "bg-slate-300 text-slate-800 shadow-slate-300/20" :
                                                index === 2 ? "bg-amber-600 text-amber-100 shadow-amber-600/20" :
                                                    "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate pr-4 text-base">
                                                {food.common_name || food.name}
                                            </h3>
                                            <div className="text-right flex-shrink-0">
                                                <span className="font-black text-lg text-slate-900 dark:text-white tabular-nums tracking-tight">
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
