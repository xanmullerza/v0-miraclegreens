'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ChefHat,
    ArrowRight,
    Leaf,
    Activity,
    Calendar,
    FlaskConical,
    Package,
    ShoppingCart,
    Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

export default function KitchenPage() {
    const { showHeroes, setShowHeroes } = useUserPreferences();
    const [stats, setStats] = useState({
        foods: 0,
        recipes: 0,
        nutrients: 0
    });

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
                console.error('Error fetching kitchen stats:', e);
            }
        };
        fetchStats();
    }, []);

    const heroCards = [
        {
            id: 'mealomatic',
            title: 'Mealomatic',
            desc: 'Plan your weekly meals',
            href: '/dashboard/kitchen/meal-o-matic',
            icon: Calendar,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            borderHover: 'hover:border-amber-500/40',
            gradient: 'from-amber-500 to-orange-600',
        },
        {
            id: 'mixlab',
            title: 'Mix Lab',
            desc: 'Create custom recipes',
            href: '/dashboard/kitchen/mix-lab',
            icon: FlaskConical,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            borderHover: 'hover:border-violet-500/40',
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            id: 'pantry',
            title: 'Pantry',
            desc: 'Manage what you have',
            href: '/dashboard/kitchen/pantry',
            icon: Package,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            borderHover: 'hover:border-emerald-500/40',
            gradient: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'groceries',
            title: 'Groceries',
            desc: 'Shopping list & needs',
            href: '/dashboard/kitchen/groceries',
            icon: ShoppingCart,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            borderHover: 'hover:border-blue-500/40',
            gradient: 'from-blue-500 to-indigo-600',
        },
    ];

    return (
        <div className="w-full space-y-16 animate-in fade-in duration-700 pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)] px-4">
            {/* ── Hero Section — Split Layout ── */}
            {showHeroes && (
            <div className="relative rounded-[2.5rem] bg-slate-900 border border-slate-800 mt-6 p-8 lg:mt-8 lg:p-12 xl:mt-10 xl:p-16 max-w-7xl w-full">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.06] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                </div>
                <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.04] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center">
                    {/* Left — Welcome Text */}
                    <div>
                        
                        
                        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                            Welcome to the{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                Kitchen.
                            </span>
                        </h1>

                        <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-md">
                            Tools, measures and pantry essentials to build better recipes. Plan meals, create custom recipes, manage your pantry, and organize shopping lists.
                        </p>

                        {/* Quick stats row */}
                        <div className="flex items-center gap-5 mt-10 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Leaf size={14} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.foods}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Foods</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-700/60" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <ChefHat size={14} className="text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.recipes}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Recipes</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-700/60" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Activity size={14} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white leading-none">{stats.nutrients}+</p>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">Nutrients</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right — 2×2 Action Grid */}
                    <div className="grid grid-cols-2 gap-1 lg:gap-2 justify-items-center">
                        {heroCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className={cn(
                                        "group relative overflow-hidden rounded-2xl lg:rounded-[1.5rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 lg:p-6 transition-all duration-500 w-40 sm:w-44 lg:w-48 aspect-square",
                                        card.borderHover,
                                        "hover:bg-slate-800/70 hover:shadow-2xl",
                                    )}
                                >
                                    {/* Gradient accent at top */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500",
                                        card.gradient,
                                    )} />

                                    {/* Glow */}
                                    <div className={cn(
                                        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100",
                                        card.bg,
                                    )} />

                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-500",
                                            card.bg,
                                        )}>
                                            <Icon size={18} className={card.color} />
                                        </div>

                                        <h3 className="text-sm font-black text-white mb-1 tracking-tight group-hover:text-white transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 leading-snug mb-4">
                                            {card.desc}
                                        </p>

                                        <div className={cn(
                                            "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                            card.color,
                                            "opacity-60 group-hover:opacity-100",
                                        )}>
                                            Explore
                                            <ArrowRight size={10} className="transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
            )}

            {/* Grid Display When Hero is Hidden */}
            {!showHeroes && (
                <div className="w-full max-w-7xl flex justify-center mt-6 lg:mt-8">
                    <div className="grid grid-cols-2 gap-1 lg:gap-2 justify-items-center">
                        {heroCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className={cn(
                                        "group relative overflow-hidden rounded-2xl lg:rounded-[1.5rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 lg:p-6 transition-all duration-500 w-40 sm:w-44 lg:w-48 aspect-square",
                                        card.borderHover,
                                        "hover:bg-slate-800/70 hover:shadow-2xl",
                                    )}
                                >
                                    {/* Gradient accent at top */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500",
                                        card.gradient,
                                    )} />

                                    {/* Glow */}
                                    <div className={cn(
                                        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100",
                                        card.bg,
                                    )} />

                                    <div className="relative z-10">
                                        <div className={cn(
                                            "w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-500",
                                            card.bg,
                                        )}>
                                            <Icon size={18} className={card.color} />
                                        </div>

                                        <h3 className="text-sm font-black text-white mb-1 tracking-tight group-hover:text-white transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 leading-snug mb-4">
                                            {card.desc}
                                        </p>

                                        <div className={cn(
                                            "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                            card.color,
                                            "opacity-60 group-hover:opacity-100",
                                        )}>
                                            Explore
                                            <ArrowRight size={10} className="transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

