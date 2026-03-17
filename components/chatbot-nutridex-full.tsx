'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, ChevronLeft, Activity, Zap, Gem, Battery, ChevronDown, Lightbulb, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { nutrientInfo } from '@/lib/data/nutrient-info';
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
    const [detailTab, setDetailTab] = useState<'foods' | 'learn'>('foods');
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
            // Map display names to database column names
            const columnMap: Record<string, string> = {
                'Energy': 'energy_kcal',
                'Protein': 'protein_g',
                'Carbs': 'carbs_g',
                'Fat': 'fat_g',
                'Fiber': 'fiber_g',
                'Sodium': 'sodium_mg',
                'Potassium': 'potassium_mg',
                'Magnesium': 'magnesium_mg',
                'Calcium': 'calcium_mg',
                'Phosphorus': 'phosphorus_mg',
                'Iron': 'iron_mg',
                'Zinc': 'zinc_mg',
                'Copper': 'copper_mg',
                'Manganese': 'manganese_mg',
                'Selenium': 'selenium_ug',
                'Vitamin A': 'vitamin_a_ug',
                'Vitamin C': 'vitamin_c_mg',
                'Vitamin D': 'vitamin_d_ug',
                'Vitamin E': 'vitamin_e_mg',
                'Vitamin K': 'vitamin_k_ug',
                'B1 (Thiamine)': 'b1_mg',
                'B2 (Riboflavin)': 'b2_mg',
                'B3 (Niacin)': 'b3_mg',
                'B5 (Pantothenic Acid)': 'b5_mg',
                'B6 (Pyridoxine)': 'b6_mg',
                'B7 (Biotin)': 'b7_ug',
                'B9 (Folate)': 'b9_ug',
                'B12 (Cobalamin)': 'b12_ug',
                'Choline': 'choline_mg',
                'Omega-3': 'omega3_ala_g',
                'Water': 'water_g'
            };

            const col = columnMap[nutrient.id];
            if (!col) {
                console.warn(`No column mapping for nutrient: ${nutrient.id}`);
                setTopFoods([]);
                return;
            }

            // Try to find foods high in this nutrient
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, category, ' + col)
                .not(col, 'is', null)
                .neq('category', 'Flavour')
                .neq('category', 'Supplements')
                .order(col, { ascending: false })
                .limit(10);

            if (error || !data || data.length === 0) {
                // FALLBACK: Try micronutrients JSONB column
                const { data: jsonMatch, error: jsonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('micronutrients', 'is', null)
                    .limit(200);

                if (!jsonError && jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => f.micronutrients && f.micronutrients[nutrient.id] !== undefined && f.category !== 'Flavour' && f.category !== 'Supplements')
                        .sort((a, b) => (b.micronutrients[nutrient.id] || 0) - (a.micronutrients[nutrient.id] || 0))
                        .slice(0, 10);
                    
                    const rankings: FoodRanking[] = sorted.map((item: any, idx) => ({
                        rank: idx + 1,
                        name: item.name,
                        common_name: item.common_name,
                        image_url: item.image || null,
                        value: item.micronutrients[nutrient.id] || 0
                    }));
                    setTopFoods(rankings);
                } else {
                    setTopFoods([]);
                }
            } else {
                const rankings: FoodRanking[] = (data || []).map((item: any, idx) => ({
                    rank: idx + 1,
                    name: item.name,
                    common_name: item.common_name,
                    image_url: item.image || null,
                    value: item[col] || 0
                }));
                setTopFoods(rankings);
            }
        } catch (error) {
            console.error('Error fetching nutrient data:', error);
            setTopFoods([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Detail View
    if (selectedNutrient) {
        const info = nutrientInfo[selectedNutrient.id];
        
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <button
                    onClick={() => {
                        setSelectedNutrient(null);
                        setTopFoods([]);
                        setDetailTab('foods');
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

                {/* Tab Buttons */}
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setDetailTab('foods')}
                        className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-wider px-2 py-1.5 rounded transition-colors",
                            detailTab === 'foods'
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <span className="inline-flex items-center gap-1">
                            <UtensilsCrossed size={12} /> Foods
                        </span>
                    </button>
                    <button
                        onClick={() => setDetailTab('learn')}
                        className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-wider px-2 py-1.5 rounded transition-colors",
                            detailTab === 'learn'
                                ? "bg-amber-600 text-white"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        <span className="inline-flex items-center gap-1">
                            <Lightbulb size={12} /> Learn
                        </span>
                    </button>
                </div>

                {/* Foods Tab */}
                {detailTab === 'foods' && (
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
                )}

                {/* Learn Tab */}
                {detailTab === 'learn' && info && (
                <div className="space-y-4">
                    {/* History & Importance Header */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                        <p className="text-xs leading-relaxed italic text-slate-700 dark:text-slate-300 border-l-4 border-amber-500/40 pl-3">
                            "{info.history} {info.importance}"
                        </p>
                    </div>

                    {/* Why It Matters */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/30">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-2">Why It Matters</h4>
                        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">{info.importance}</p>
                    </div>

                    {/* 5 Fast Facts */}
                    {info.relatedFacts && info.relatedFacts.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-3">5 Fast Facts</h4>
                        <div className="space-y-2.5">
                            {info.relatedFacts.map((fact, i) => (
                                <div key={i} className="flex gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-black shrink-0 text-[10px]">{i + 1}</span>
                                    <span className="leading-relaxed">{fact}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Benefits */}
                    {info.benefits && info.benefits.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-2">Benefits</h4>
                        <ul className="space-y-1.5">
                            {info.benefits.map((benefit, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                                    <span className="text-emerald-500 font-black">✓</span>
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    )}

                    {/* Deficiency Signs */}
                    {info.deficiencySigns && info.deficiencySigns.length > 0 && (
                    <div className="bg-red-50/50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200/50 dark:border-red-800/30">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-red-700 dark:text-red-400 mb-2">Deficiency Signs</h4>
                        <ul className="space-y-1.5">
                            {info.deficiencySigns.map((sign, i) => (
                                <li key={i} className="flex gap-2 text-xs text-red-900 dark:text-red-200">
                                    <span className="font-black">·</span>
                                    <span>{sign}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    )}

                    {/* Sources */}
                    {info.sources && info.sources.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-2">Food Sources</h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{info.sources.join(', ')}</p>
                    </div>
                    )}
                </div>
                )}
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
