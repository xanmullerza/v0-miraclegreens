'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Activity,
    Leaf,
    ChefHat,
    Scale,
    ArrowRight,
    Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0 });


    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [foodsCount, recipesCount] = await Promise.all([
                    supabase.from('food_items').select('id', { count: 'exact', head: true }),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }),
                ]);
                setStats({
                    foods: foodsCount.count || 0,
                    recipes: recipesCount.count || 0,
                    nutrients: 30,
                });
            } catch (e) {
                console.error('Error fetching stats:', e);
            }
        };
        fetchStats();
    }, []);


    const heroCards = [
        {
            id: 'nutrients',
            title: 'Nutrients',
            desc: 'Vitamins, minerals & more',
            href: '/dashboard/library/nutrients',
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            borderHover: 'hover:border-blue-500/40',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            id: 'foods',
            title: 'Foods',
            desc: 'Browse whole food profiles',
            href: '/dashboard/library/foods',
            icon: Leaf,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            borderHover: 'hover:border-emerald-500/40',
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'recipes',
            title: 'Recipes',
            desc: 'Meals with full nutrition',
            href: '/dashboard/library/recipes',
            icon: ChefHat,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            borderHover: 'hover:border-amber-500/40',
            gradient: 'from-amber-500 to-orange-600',
        },
        {
            id: 'compare',
            title: 'Compare',
            desc: 'Side-by-side food analysis',
            href: '/dashboard/library/comparefoods',
            icon: Scale,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            borderHover: 'hover:border-violet-500/40',
            gradient: 'from-violet-500 to-purple-600',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Library</h2>
                    <p className="text-sm text-slate-500 mt-1">Your personal guide to nutrition: foods, recipes and nutrients.</p>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-600">
                    <div className="text-center">
                        <div className="font-black text-lg">{stats.foods}</div>
                        <div className="text-xs uppercase">Foods</div>
                    </div>
                    <div className="text-center">
                        <div className="font-black text-lg">{stats.recipes}</div>
                        <div className="text-xs uppercase">Recipes</div>
                    </div>
                    <div className="text-center">
                        <div className="font-black text-lg">{stats.nutrients}+</div>
                        <div className="text-xs uppercase">Nutrients</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {heroCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.id}
                            href={card.href}
                            className={cn(
                                'group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/5 p-4 flex flex-col',
                                card.borderHover,
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center', card.bg)}>
                                    <Icon size={18} className={card.color} />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-white">{card.title}</h3>
                                    <p className="text-xs text-slate-400">{card.desc}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Explore →</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

