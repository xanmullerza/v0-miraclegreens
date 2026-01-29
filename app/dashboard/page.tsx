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
            name: 'Browse Foods',
            desc: 'Explore the global database of nutritional data.',
            href: '/dashboard/browse',
            icon: Library,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Browse Meals',
            desc: 'View and manage your optimized meal library.',
            href: '/dashboard/meals',
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
                </div>
            </div>

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

                {/* Data Card */}
                <Card className="p-8 h-full bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <BarChart3 size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] font-black uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </div>
                    </div>
                    <div className="space-y-4 flex-grow">
                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Foods</p>
                                <p className="text-lg font-black">{stats.foodItems}</p>
                            </div>
                            <Zap size={14} className="text-amber-500 mb-1" />
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recipes</p>
                                <p className="text-lg font-black">{stats.recipes}</p>
                            </div>
                            <ChefHat size={14} className="text-blue-500 mb-1" />
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                <p className="text-lg font-black text-emerald-500 italic">Online</p>
                            </div>
                            <Activity size={14} className="text-emerald-500 mb-1" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
