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
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-amber-600 font-bold text-sm transition-colors group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Library
                </button>
                <div className="flex gap-3">
                    <Button
                        onClick={toggleFavorite}
                        variant="outline"
                        className={cn(
                            "rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] gap-2 border-slate-200 dark:border-slate-800 shadow-sm transition-all",
                            isFav ? "bg-rose-500 text-white border-rose-600 hover:bg-rose-600" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Heart size={14} fill={isFav ? "currentColor" : "none"} />
                        {isFav ? "Favorited" : "Favorite"}
                    </Button>
                    <Button className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20">
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Hero Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/5">
                            <Activity size={12} className="fill-current" />
                            Clinical Reference Profile
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-[0.85]">
                            {nutrientId}
                        </h1>
                        <p className="text-2xl font-medium text-slate-500 leading-relaxed italic border-l-4 border-amber-500 pl-6 bg-slate-50 dark:bg-slate-900/50 py-4 rounded-r-3xl">
                            "{info.description}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <Card className="p-8 space-y-4 border-none bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Significance</h4>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                {info.importance}
                            </p>
                        </Card>
                        <Card className="p-8 space-y-4 border-none bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical History</h4>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
                                {info.history}
                            </p>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-amber-500 text-white border-none shadow-2xl shadow-amber-500/30">
                        <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center animate-pulse">
                            <Zap size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Reference Intake</h3>
                            <p className="text-4xl font-black tracking-tighter italic">OPTIMAL</p>
                        </div>
                        <p className="text-[10px] font-bold opacity-70 leading-relaxed max-w-[200px]">
                            Ensure balanced consumption to prevent cellular oxidative stress and maintain peak metabolic rate.
                        </p>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 lg:mt-8">Biological Benefits</h4>
                        <div className="flex flex-wrap gap-2">
                            {info.benefits.map((b, i) => (
                                <Badge key={i} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl">
                                    {b}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Deficiency Markers</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Warning Signs</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {info.deficiencySigns.map((s, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group hover:border-rose-500/30 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide group-hover:text-rose-500 transition-colors">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <Beef size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">High Sources</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio-Available Foods</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {loadingFoods ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />)
                            ) : topFoods.length > 0 ? (
                                topFoods.map((food: any) => (
                                    <button
                                        key={food.id}
                                        onClick={() => router.push(`/dashboard/food/${food.id}`)}
                                        className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden flex-shrink-0">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Beef size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                                                {food.common_name || food.name}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Consult scientific abstracts for typical sources</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
