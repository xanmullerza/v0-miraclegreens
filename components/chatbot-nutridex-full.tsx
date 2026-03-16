'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, ChevronLeft, Activity, Zap, Gem, Battery, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

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

const NUTRIENT_LIBRARY_BASE: Nutrient[] = [
    // Macros
    { id: 'Energy', label: 'Energy', group: 'Macros', unit: 'kcal', rda: 2000 },
    { id: 'Protein', label: 'Protein', group: 'Macros', unit: 'g', rda: 50 },
    { id: 'Carbs', label: 'Carbohydrates', group: 'Macros', unit: 'g', rda: 300 },
    { id: 'Fat', label: 'Fat', group: 'Macros', unit: 'g', rda: 78 },
    { id: 'Fiber', label: 'Fiber', group: 'Macros', unit: 'g', rda: 25 },
    // Electrolytes
    { id: 'Sodium', label: 'Sodium', group: 'Electrolytes', unit: 'mg', rda: 2300 },
    { id: 'Potassium', label: 'Potassium', group: 'Electrolytes', unit: 'mg', rda: 3500 },
    { id: 'Magnesium', label: 'Magnesium', group: 'Electrolytes', unit: 'mg', rda: 400 },
    { id: 'Calcium', label: 'Calcium', group: 'Electrolytes', unit: 'mg', rda: 1000 },
    { id: 'Phosphorus', label: 'Phosphorus', group: 'Electrolytes', unit: 'mg', rda: 1000 },
    // Trace Minerals
    { id: 'Iron', label: 'Iron', group: 'Trace Minerals', unit: 'mg', rda: 18 },
    { id: 'Zinc', label: 'Zinc', group: 'Trace Minerals', unit: 'mg', rda: 11 },
    { id: 'Copper', label: 'Copper', group: 'Trace Minerals', unit: 'mg', rda: 0.9 },
    { id: 'Manganese', label: 'Manganese', group: 'Trace Minerals', unit: 'mg', rda: 2.3 },
    { id: 'Selenium', label: 'Selenium', group: 'Trace Minerals', unit: 'μg', rda: 55 },
    // Water-Soluble Vitamins
    { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 1.2 },
    { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 1.3 },
    { id: 'B3 (Niacin)', label: 'B3 (Niacin)', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 16 },
    { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 5 },
    { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 1.7 },
    { id: 'B7 (Biotin)', label: 'B7 (Biotin)', group: 'Water-Soluble Vitamins', unit: 'μg', rda: 30 },
    { id: 'B9 (Folate)', label: 'B9 (Folate)', group: 'Water-Soluble Vitamins', unit: 'μg', rda: 400 },
    { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', group: 'Water-Soluble Vitamins', unit: 'μg', rda: 2.4 },
    { id: 'Vitamin C', label: 'Vitamin C', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 90 },
    { id: 'Choline', label: 'Choline', group: 'Water-Soluble Vitamins', unit: 'mg', rda: 550 },
    // Fat-Soluble Vitamins
    { id: 'Vitamin A', label: 'Vitamin A', group: 'Fat-Soluble Vitamins', unit: 'μg', rda: 900 },
    { id: 'Vitamin D', label: 'Vitamin D', group: 'Fat-Soluble Vitamins', unit: 'μg', rda: 20 },
    { id: 'Vitamin E', label: 'Vitamin E', group: 'Fat-Soluble Vitamins', unit: 'mg', rda: 15 },
    { id: 'Vitamin K', label: 'Vitamin K', group: 'Fat-Soluble Vitamins', unit: 'μg', rda: 120 },
    // Other
    { id: 'Omega-3', label: 'Omega-3 (ALA)', group: 'Other', unit: 'g', rda: 1.6 },
    { id: 'Water', label: 'Water (Adequate Intake)', group: 'Other', unit: 'L', rda: 3.7 },
];

const GROUP_ICONS: Record<string, any> = {
    'Macros': Zap,
    'Electrolytes': Zap,
    'Trace Minerals': Gem,
    'Water-Soluble Vitamins': Battery,
    'Fat-Soluble Vitamins': Battery,
    'Other': Activity
};

export function ChatbotNutridexFull() {
    const { profile, dailyTargets } = useUserPreferences();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedNutrient, setSelectedNutrient] = useState<Nutrient | null>(null);
    const [topFoods, setTopFoods] = useState<FoodRanking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Enhance RDAs based on user profile and daily targets
    const personalizedNutrientLibrary = useMemo(() => {
        const energy = dailyTargets?.energy || 2000;
        const baseEnergy = 2000;
        const energyMultiplier = energy / baseEnergy;

        return NUTRIENT_LIBRARY_BASE.map(nutrient => {
            let personalizedRda = nutrient.rda;
            
            // Scale energetic macros by user's caloric needs
            if (nutrient.id === 'Protein') {
                personalizedRda = Math.round((50 * energyMultiplier));
            } else if (nutrient.id === 'Carbs') {
                personalizedRda = Math.round((300 * energyMultiplier));
            } else if (nutrient.id === 'Fat') {
                personalizedRda = Math.round((78 * energyMultiplier));
            } else if (nutrient.id === 'Fiber') {
                personalizedRda = Math.round((energy / 1000) * 14);
            }
            
            return { ...nutrient, rda: personalizedRda };
        });
    }, [dailyTargets]);

    const filteredNutrients = useMemo(() => {
        let nutrients = personalizedNutrientLibrary;
        
        // Filter by search query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            nutrients = nutrients.filter(n =>
                n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
            );
        }
        
        // Filter by selected group
        if (selectedGroup) {
            nutrients = nutrients.filter(n => n.group === selectedGroup);
        }
        
        return nutrients;
    }, [personalizedNutrientLibrary, searchQuery, selectedGroup]);

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
                                {food.value >= ((selectedNutrient.rda || 0) / 10) && (
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
            <div className="relative sticky top-0 z-20 bg-white dark:bg-slate-900 pb-3 space-y-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search nutrients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>
                
                {/* Group Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-lg flex items-center justify-between transition-colors">
                            <span>{selectedGroup ? selectedGroup : 'All Groups'}</span>
                            <ChevronDown size={12} className="opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-2 rounded-lg border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-950">
                        <DropdownMenuItem 
                            onClick={() => setSelectedGroup(null)}
                            className={cn(
                                "text-xs font-bold uppercase tracking-widest cursor-pointer rounded px-2 py-1.5 transition-colors",
                                !selectedGroup ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            All Groups
                        </DropdownMenuItem>
                        <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
                        {Array.from(new Set(personalizedNutrientLibrary.map(n => n.group))).map(group => (
                            <DropdownMenuItem
                                key={group}
                                onClick={() => setSelectedGroup(group)}
                                className={cn(
                                    "text-xs font-bold uppercase tracking-widest cursor-pointer rounded px-2 py-1.5 transition-colors flex items-center gap-2",
                                    selectedGroup === group ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {React.createElement(GROUP_ICONS[group] || Activity, { size: 12 })}
                                {group}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
