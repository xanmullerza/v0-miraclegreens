'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Zap,
    Activity,
    Sparkles,
    ChefHat,
    Library,
    User,
    BarChart3,
    ArrowRight
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
            name: 'Foods Hub',
            desc: 'Explore the global database of nutritional data.',
            href: '/dashboard/foods',
            icon: Library,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Recipes Hub',
            desc: 'View and manage your optimized meal library.',
            href: '/dashboard/recipes',
            icon: ChefHat,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            name: 'My Profile',
            desc: 'Manage your personal settings and lab access.',
            href: '/dashboard/profile',
            icon: User,
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
        <div className="max-w-7xl mx-auto">
            {/* Main Layout: Hero (2/3) + Cards (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero Welcome - Takes 2/3 width */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16 flex flex-col justify-center min-h-[400px]">
                    <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
                        <Sparkles size={300} className="text-emerald-500" />
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                            <Zap size={12} className="fill-current" />
                            Miracle Greens Beta
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.9] mb-6">
                            Welcome to your <span className="text-emerald-500">Dashboard.</span>
                        </h1>
                        <p className="text-base text-slate-400 leading-relaxed">
                            A simple way to manage your food and recipes. Add ingredients, create healthy recipes, and check nutrition details in one easy dashboard.
                        </p>
                    </div>
                </div>

                {/* Cards Grid - Takes 1/3 width, 2x2 layout */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                    {tools.map((tool) => (
                        <Link key={tool.href} href={tool.href}>
                            <Card className="p-5 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6", tool.bg, tool.color)}>
                                    <tool.icon size={20} />
                                </div>
                                <h3 className="text-sm font-bold tracking-tight mb-1.5 group-hover:text-emerald-500 transition-colors">{tool.name}</h3>
                                <p className="text-[11px] text-slate-500 leading-relaxed mb-3 flex-grow line-clamp-2">{tool.desc}</p>
                                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Open
                                    <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Card>
                        </Link>
                    ))}

                    {/* Data Card - 4th card in the grid */}
                    <Card className="p-5 h-full bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <BarChart3 size={20} />
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[7px] font-black uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </div>
                        </div>
                        <div className="space-y-2 flex-grow">
                            <div className="flex justify-between items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Foods</p>
                                <p className="text-sm font-black">{stats.foodItems}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Recipes</p>
                                <p className="text-sm font-black">{stats.recipes}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                <p className="text-sm font-black text-emerald-500">Online</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
