'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Zap,
    Activity,
    Gem,
    Droplet,
    Battery,
    ArrowLeft,
    ChevronLeft,
    Sparkles,
    Scale,
    Beef,
    Search,
    ChevronRight,
    Star,
    Info,
    Calendar,
    ArrowRight,
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export default function NutrientDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const nutrientId = decodeURIComponent(id as string);
    const info = nutrientInfo[nutrientId];
    const { profile, dailyTargets, energyUnit } = useUserPreferences();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    const [favorites, setFavorites] = useState<string[]>([]);
    const [topFoods, setTopFoods] = useState<any[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('nutrient-favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    const toggleFavorite = () => {
        const newFavorites = favorites.includes(nutrientId)
            ? favorites.filter(n => n !== nutrientId)
            : [...favorites, nutrientId];
        setFavorites(newFavorites);
        localStorage.setItem('nutrient-favorites', JSON.stringify(newFavorites));
    };

    const isFav = favorites.includes(nutrientId);

    useEffect(() => {
        if (info) {
            fetchTopFoods();
        }
    }, [nutrientId]);

    const fetchTopFoods = async () => {
        setLoadingFoods(true);
        try {
            // Map common display names to database columns
            const columnMap: Record<string, string> = {
                'Potassium': 'potassium_mg',
                'Magnesium': 'magnesium_mg',
                'Calcium': 'calcium_mg',
                'Sodium': 'sodium_mg',
                'Iron': 'iron_mg',
                'Zinc': 'zinc_mg',
                'Vitamin A': 'vitamin_a_ug',
                'Vitamin C': 'vitamin_c_mg',
                'Vitamin D': 'vitamin_d_ug',
                'Vitamin E': 'vitamin_e_mg',
                'Vitamin K': 'vitamin_k_ug',
                'Protein': 'protein_g',
                'Fiber': 'fiber_g',
                'Carbs': 'carbs_g',
                'Fat': 'fat_g'
            };

            const col = columnMap[nutrientId] || nutrientId.toLowerCase().replace(/ /g, '_').replace(/[()]/g, '');

            // Try to find foods high in this nutrient
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, ' + col)
                .not(col, 'is', null)
                .order(col, { ascending: false })
                .limit(6);

            if (error) {
                // If column doesn't exist, try searching micronutrients JSON
                const { data: jsonMatch, error: jsonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients')
                    .limit(50);

                if (!jsonError && jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => f.micronutrients && f.micronutrients[nutrientId])
                        .sort((a, b) => (b.micronutrients[nutrientId] || 0) - (a.micronutrients[nutrientId] || 0))
                        .slice(0, 6);
                    setTopFoods(sorted);
                }
            } else {
                setTopFoods(data || []);
            }
        } catch (err) {
            console.error('Error fetching typical sources:', err);
        } finally {
            setLoadingFoods(false);
        }
    };

    if (!info) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                    <Info size={40} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Nutrient Not Found</h2>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">The requested biological marker does not exist in our reference library.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/nutrients')} className="rounded-full px-8 bg-emerald-600">
                    Back to Library
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 pt-8 px-4">
            {/* Nav */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back
            </button>

            {/* Header / Hero */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-6xl lg:text-8xl font-black text-emerald-600 dark:text-emerald-400 mb-4 uppercase tracking-tighter italic leading-none">
                        {nutrientId}
                    </h1>
                    <p className="text-xl lg:text-2xl text-slate-400 italic leading-relaxed font-medium">
                        "{info.description}"
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={toggleFavorite}
                        variant="outline"
                        className={cn(
                            "rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] gap-2 border-slate-200 dark:border-slate-800 transition-all shadow-sm",
                            isFav ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                        {isFav ? "Favorited" : "Favorite"}
                    </Button>
                    <div className="px-5 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <Zap size={16} />
                        Clinical Reference Hub
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    {/* Biological Significance */}
                    <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                        <h4 className="font-black text-[11px] mb-4 uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Biological Significance</h4>
                        <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            {info.importance}
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4">
                        <h4 className="font-black text-[11px] px-2 uppercase tracking-[0.2em] text-slate-400">Biological Benefits</h4>
                        <div className="flex flex-wrap gap-2.5">
                            {info.benefits.map((b, i) => (
                                <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-100 px-5 py-2.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    {b}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Typical Sources */}
                    <div className="space-y-4">
                        <h4 className="font-black text-[11px] px-2 uppercase tracking-[0.2em] text-slate-400">Alternative Sources</h4>
                        <div className="flex flex-wrap gap-2">
                            {info.sources.map((s, i) => (
                                <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold border border-slate-200 dark:border-slate-800/50">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Targeted Intake Card */}
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-emerald-600 text-white border-none shadow-2xl shadow-emerald-600/30">
                        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center animate-pulse">
                            <Activity size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Targeted Daily Intake</h3>

                            {(() => {
                                let val = null;
                                let unit = 'mg';

                                if (nutrientId === 'Energy') {
                                    val = energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy;
                                    unit = energyUnit;
                                } else if (nutrientId === 'Protein') {
                                    val = dailyTargets.protein;
                                    unit = 'g';
                                } else if (nutrientId === 'Carbs') {
                                    val = dailyTargets.carbs;
                                    unit = 'g';
                                } else if (nutrientId === 'Fat') {
                                    val = dailyTargets.fat;
                                    unit = 'g';
                                } else if (userRDAs?.[nutrientId]) {
                                    val = userRDAs[nutrientId];
                                    if (nutrientId === 'Vitamin D') unit = 'IU';
                                    else if (nutrientId.includes('Folate') || nutrientId.includes('B12') || nutrientId.includes('Biotin') || nutrientId.includes('Selenium') || nutrientId === 'Vitamin A' || nutrientId === 'Vitamin K' || nutrientId.includes('µg')) unit = 'µg';
                                }

                                if (val) {
                                    return (
                                        <div className="flex flex-col items-center">
                                            <p className="text-6xl font-black tracking-tighter italic">
                                                {val >= 100 ? Math.round(val) : val < 10 ? val.toFixed(1) : Math.round(val)}
                                            </p>
                                            <p className="text-xl font-black opacity-80 uppercase">{unit}</p>
                                        </div>
                                    );
                                }
                                return <p className="text-4xl font-black tracking-tighter italic uppercase">Optimal Level</p>;
                            })()}
                        </div>
                        <p className="text-[10px] font-bold opacity-70 leading-relaxed max-w-[200px]">
                            Biometric target based on your clinical profile and nutrition strategy.
                        </p>
                    </Card>

                    {/* Top Food Sources */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Bio-Available Foods</h4>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest underline cursor-pointer hover:text-emerald-600" onClick={() => router.push('/dashboard/foods')}>Browse All</span>
                        </div>
                        <div className="space-y-3">
                            {loadingFoods ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-3xl" />)
                            ) : topFoods.length > 0 ? (
                                topFoods.map((food: any) => (
                                    <button
                                        key={food.id}
                                        onClick={() => router.push(`/dashboard/foods/${food.id}`)}
                                        className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl transition-all text-left group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Beef size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate italic">
                                                {food.common_name || food.name}
                                            </p>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">View Profile</p>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center p-10 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning laboratory data for typical sources...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
