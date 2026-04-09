'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, UtensilsCrossed, Lightbulb, Loader2, Leaf } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { cn } from '@/lib/utils';
import { NutrientNode } from './nutrients-view-data';

const COLUMN_MAP: Record<string, string> = {
    'Energy': 'energy_kcal', 'Protein': 'protein_g', 'Carbs': 'carbs_g', 'Fat': 'fat_g',
    'Fiber': 'fiber_g', 'Sodium': 'sodium_mg', 'Potassium': 'potassium_mg',
    'Magnesium': 'magnesium_mg', 'Calcium': 'calcium_mg', 'Phosphorus': 'phosphorus_mg',
    'Iron': 'iron_mg', 'Zinc': 'zinc_mg', 'Copper': 'copper_mg', 'Manganese': 'manganese_mg',
    'Selenium': 'selenium_ug', 'Vitamin A': 'vitamin_a_ug', 'Vitamin C': 'vitamin_c_mg',
    'Vitamin D': 'vitamin_d_ug', 'Vitamin E': 'vitamin_e_mg', 'Vitamin K': 'vitamin_k_ug',
    'B1 (Thiamine)': 'b1_mg', 'B2 (Riboflavin)': 'b2_mg', 'B3 (Niacin)': 'b3_mg',
    'B5 (Pantothenic Acid)': 'b5_mg', 'B6 (Pyridoxine)': 'b6_mg', 'B7 (Biotin)': 'b7_ug',
    'B9 (Folate)': 'b9_ug', 'B12 (Cobalamin)': 'b12_ug', 'Choline': 'choline_mg',
    'Omega-3': 'omega3_ala_g', 'Water': 'water_g',
};

interface FoodRanking {
    rank: number;
    name: string;
    common_name?: string;
    image_url: string | null;
    value: number;
}

interface NutrientDetailContentProps {
    nutrient: NutrientNode;
    excludeFlavour?: boolean;
    excludeSupplements?: boolean;
}

export function NutrientDetailContent({ 
    nutrient, 
    excludeFlavour = false, 
    excludeSupplements = false 
}: NutrientDetailContentProps) {
    const { profile, dailyTargets, energyUnit } = useUserPreferences();
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    const [topFoods, setTopFoods] = useState<FoodRanking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [detailTab, setDetailTab] = useState<'foods' | 'learn'>('foods');

    const getRDA = useCallback((nutrientId: string): number => {
        const macroRDAs: Record<string, number> = {
            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
            'Protein': dailyTargets.protein,
            'Carbs': dailyTargets.carbs,
            'Fat': dailyTargets.fat,
            'Fiber': (dailyTargets.energy / 1000) * 14,
            'Sugars': (dailyTargets.energy * 0.10) / 4
        };
        return userRDAs?.[nutrientId] || macroRDAs[nutrientId] || 0;
    }, [userRDAs, dailyTargets, energyUnit]);

    const fetchTopFoods = useCallback(async () => {
        if (!nutrient) return;
        setIsLoading(true);

        try {
            const col = COLUMN_MAP[nutrient.id];
            if (!col) {
                // Try micronutrients JSONB
                const { data: jsonMatch, error: jsonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('micronutrients', 'is', null)
                    .limit(200);

                if (!jsonError && jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => {
                            if (!f.micronutrients || f.micronutrients[nutrient.id] === undefined) return false;
                            if (excludeFlavour && f.category === 'Flavour') return false;
                            if (excludeSupplements && f.category === 'Supplements') return false;
                            return true;
                        })
                        .sort((a, b) => (b.micronutrients[nutrient.id] || 0) - (a.micronutrients[nutrient.id] || 0))
                        .slice(0, 10);

                    setTopFoods(sorted.map((item: any, idx) => ({
                        rank: idx + 1,
                        name: item.name,
                        common_name: item.common_name,
                        image_url: item.image || null,
                        value: item.micronutrients[nutrient.id] || 0
                    })));
                } else {
                    setTopFoods([]);
                }
                return;
            }

            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, category, ' + col)
                .not(col, 'is', null)
                .order(col, { ascending: false })
                .limit(20);

            const filterData = (items: any[]) => items.filter(item => {
                if (excludeFlavour && item.category === 'Flavour') return false;
                if (excludeSupplements && item.category === 'Supplements') return false;
                return true;
            }).slice(0, 10);

            if (error || !data || data.length === 0) {
                // Fallback to JSONB
                const { data: jsonMatch } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('micronutrients', 'is', null)
                    .limit(200);

                if (jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => {
                            if (!f.micronutrients || f.micronutrients[nutrient.id] === undefined) return false;
                            if (excludeFlavour && f.category === 'Flavour') return false;
                            if (excludeSupplements && f.category === 'Supplements') return false;
                            return true;
                        })
                        .sort((a, b) => (b.micronutrients[nutrient.id] || 0) - (a.micronutrients[nutrient.id] || 0))
                        .slice(0, 10);

                    setTopFoods(sorted.map((item: any, idx) => ({
                        rank: idx + 1, name: item.name, common_name: item.common_name,
                        image_url: item.image || null, value: item.micronutrients[nutrient.id] || 0
                    })));
                } else {
                    setTopFoods([]);
                }
            } else {
                const filtered = filterData(data);
                setTopFoods(filtered.map((item: any, idx) => ({
                    rank: idx + 1, name: item.name, common_name: item.common_name,
                    image_url: item.image || null, value: item[col] || 0
                })));
            }
        } catch (err) {
            console.error('Error fetching nutrient data:', err);
            setTopFoods([]);
        } finally {
            setIsLoading(false);
        }
    }, [nutrient, excludeFlavour, excludeSupplements]);

    useEffect(() => {
        fetchTopFoods();
    }, [fetchTopFoods]);

    const rda = getRDA(nutrient.id);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-3xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-emerald-900 dark:text-emerald-100 uppercase tracking-tighter italic italic-bold">{nutrient.label}</h3>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mt-0.5 opacity-75">
                                Target: {rda >= 100 ? Math.round(rda) : parseFloat(rda.toFixed(1))} {nutrient.unit}
                            </p>
                        </div>
                    </div>
                    {nutrientInfo[nutrient.id]?.importance && (
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300/80 leading-relaxed max-w-2xl">
                            {nutrientInfo[nutrient.id].importance}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 max-w-md">
                <button onClick={() => setDetailTab('foods')} className={cn("flex-1 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all", detailTab === 'foods' ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-md border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
                    <span className="inline-flex items-center gap-2"><UtensilsCrossed size={14} /> Top Foods</span>
                </button>
                <button onClick={() => setDetailTab('learn')} className={cn("flex-1 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all", detailTab === 'learn' ? "bg-white dark:bg-slate-800 text-amber-600 shadow-md border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
                    <span className="inline-flex items-center gap-2"><Lightbulb size={14} /> Information</span>
                </button>
            </div>

            {detailTab === 'foods' ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center animate-pulse">
                                <Loader2 size={32} className="mx-auto text-emerald-500 animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Library...</p>
                            </div>
                        ) : topFoods.length > 0 ? (
                            topFoods.map(food => (
                                <Link key={food.name} href={`/foods/${encodeURIComponent(food.name)}`} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-400/50 hover:shadow-lg transition-all group">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                                        {food.image_url ? <img src={food.image_url} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Leaf size={24} className="opacity-10" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider">#{food.rank}</span>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate capitalize">{food.common_name || food.name}</p>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            {food.value >= 100 ? Math.round(food.value) : food.value.toFixed(1)} {nutrient.unit} <span className="text-[8px] opacity-40 ml-1">/ 100G</span>
                                        </p>
                                    </div>
                                    {profile.isPremium && food.value >= ((getRDA(nutrient.id) || 0) / 10) && (
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 border border-emerald-500/20">PREMIUM SOURCE</span>
                                    )}
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No food data available for this nutrient.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(() => {
                        const info = nutrientInfo[nutrient.id];
                        if (!info) return <p className="text-center text-slate-400 italic">No scientific briefing available yet.</p>;
                        return (
                            <>
                                <div className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                                        <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2"><Activity size={14} /> Biological Role</h4>
                                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{info.history}</p>
                                    </div>
                                    {info.benefits && (
                                        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/10">
                                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4">Core Benefits</h4>
                                            <ul className="space-y-3">{info.benefits.map((b, i) => (<li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium"><span className="text-emerald-500 shrink-0 mt-0.5">✓</span><span>{b}</span></li>))}</ul>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    {info.relatedFacts && (
                                        <div className="bg-blue-500/5 dark:bg-blue-500/5 rounded-3xl p-6 border border-blue-500/10">
                                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4">Discovery & Science</h4>
                                            <div className="space-y-4">{info.relatedFacts.map((f, i) => (<div key={i} className="flex gap-4 group"><span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black shrink-0 text-[10px]">{i + 1}</span><p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">{f}</p></div>))}</div>
                                        </div>
                                    )}
                                    {info.deficiencySigns && (
                                        <div className="bg-rose-500/5 dark:bg-rose-500/5 rounded-3xl p-6 border border-rose-500/10">
                                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-4">Deficiency Signals</h4>
                                            <ul className="space-y-3">{info.deficiencySigns.map((s, i) => (<li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium"><span className="text-rose-500 shrink-0 mt-1">●</span><span>{s}</span></li>))}</ul>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
