'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Beef,
    Utensils,
    Scale,
    Plus,
    ArrowRight,
    Zap,
    Activity,
    Database,
    Clock,
    Sparkles,
    ChefHat,
    Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export default function DashboardOverview() {
    const [stats, setStats] = useState({
        foodItems: 0,
        recipes: 0,
        recentAdditions: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [itemsCount, recipesCount, recent] = await Promise.all([
                    supabase.from('food_items').select('id', { count: 'exact', head: true }),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }),
                    supabase.from('food_items').select('*').order('created_at', { ascending: false }).limit(3)
                ]);

                setStats({
                    foodItems: itemsCount.count || 0,
                    recipes: recipesCount.count || 0,
                    recentAdditions: recent.data || []
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const tools = [
        {
            name: 'Add Foods',
            desc: 'Add and manage food nutrition data in your library.',
            href: '/dashboard/food',
            icon: Beef,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Add Recipes',
            desc: 'Create and track recipes with automatic nutrition calculation.',
            href: '/dashboard/recipes',
            icon: Utensils,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            name: 'Compare Foods',
            desc: 'Compare nutritional values side-by-side using the radar chart.',
            href: '/dashboard/compare',
            icon: Scale,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            name: 'Plan Meals',
            desc: 'Generate personalized daily meal plans based on your goals.',
            href: '/dashboard/plan',
            icon: Calendar,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        }
    ];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Hero Welcome */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16">
                <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
                    <Sparkles size={300} className="text-emerald-500" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Zap size={12} className="fill-current" />
                        Miracle Greens Pre-release
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6">
                        Welcome to your <span className="text-emerald-500">Dashboard.</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                        A simple way to manage your food and recipes. Add ingredients, create healthy recipes, and check nutrition details in one easy dashboard.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button className="rounded-2xl h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-3 shadow-xl shadow-emerald-500/20" asChild>
                            <Link href="/dashboard/recipes">
                                <Plus size={18} />
                                Create New Recipe
                            </Link>
                        </Button>
                        <Button variant="outline" className="rounded-2xl h-14 px-8 border-slate-700 text-white hover:bg-slate-800 gap-3" asChild>
                            <Link href="/dashboard/compare">
                                <Activity size={18} />
                                Compare Foods
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 relative z-10 border-t border-slate-800 pt-10">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Library Items</p>
                        <p className="text-3xl font-black text-white">{stats.foodItems}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Recipes</p>
                        <p className="text-3xl font-black text-white">{stats.recipes}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Status</p>
                        <p className="text-3xl font-black text-white">Online</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System</p>
                        <p className="text-3xl font-black text-emerald-500 flex items-center gap-2">
                            READY <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                    </div>
                </div>
            </div>

            {/* Application Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool) => (
                    <Link key={tool.href} href={tool.href}>
                        <Card className="p-8 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:rotate-6", tool.bg, tool.color)}>
                                <tool.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-emerald-500 transition-colors">{tool.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">{tool.desc}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                Access Tool
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold flex items-center gap-3">
                            <Database size={18} className="text-emerald-500" />
                            Recently Added Foods
                        </h3>
                        <Link href="/dashboard/browse" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors">View All Foods</Link>
                    </div>
                    <div className="space-y-4">
                        {stats.recentAdditions.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-emerald-500">
                                        <Beef size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Synced from {item.source || 'manual'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">{item.energy_kcal} kcal</p>
                                    <p className="text-[10px] text-slate-400">per 100g</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-8 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/10">
                    <div className="h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <ChefHat size={18} className="text-emerald-500" />
                            <h3 className="font-bold">Recommended for You</h3>
                        </div>
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-emerald-500/20 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6 font-black text-xl">?</div>
                            <h4 className="text-lg font-bold mb-2 italic text-slate-400">Experimental Feature</h4>
                            <p className="text-sm text-slate-500 max-w-xs">Our system is looking at your recipes to suggest your next healthy recipe based on the nutrients you have.</p>
                            <Button className="mt-8 rounded-full bg-slate-950 text-white hover:bg-slate-800 border-none px-10 font-bold" disabled>Get Suggestions</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
