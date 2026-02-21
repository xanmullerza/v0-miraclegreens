'use client';

import React, { useEffect, useState } from 'react';
import { Scale, Activity, Leaf, Beaker, ChefHat } from 'lucide-react';
import { CompareView } from '../../library/foods/views/compare-view';
import { PageContainer } from '@/components/ui/page-container';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

export default function CompareFoodsPage() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0, mixes: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [foodsCount, recipesCount, mixesCount] = await Promise.all([
                    supabase.from('food_items').select('id', { count: 'exact', head: true }),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('is_mix', false),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('is_mix', true),
                ]);
                setStats({
                    foods: foodsCount.count || 0,
                    recipes: recipesCount.count || 0,
                    nutrients: 30,
                    mixes: mixesCount.count || 0
                });
            } catch (e) {
                console.error('Error fetching comparefoods stats:', e);
            }
        };
        fetchStats();
    }, []);

    return (
        <PageContainer maxWidth="max-w-7xl" className="-mt-12 md:-mt-16">
            <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 pt-0">
                {/* Stats Bar */}
                {showHeroes && (
                    <div className="w-full md:max-w-[900px] mx-auto relative px-0 mb-6 group/stats">
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

                {/* Content */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <CompareView />
                </div>
            </div>
        </PageContainer>
    );
}

