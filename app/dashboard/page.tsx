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
    ArrowRight,
    ShieldCheck,
    Scale,
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
            name: 'View Nutrients',
            desc: 'Deep-dive into the biological markers that fuel human performance.',
            href: '/dashboard/nutrients',
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            name: 'Explore Foods',
            desc: 'Explore the global database of nutritional data.',
            href: '/dashboard/foods',
            icon: Library,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Find Recipes',
            desc: 'View and manage your optimized meal library.',
            href: '/dashboard/recipes',
            icon: ChefHat,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            name: 'Compare Foods',
            desc: 'Analyze and compare nutritional profiles side-by-side.',
            href: '/dashboard/compare',
            icon: Scale,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            name: 'Plan Your Meals',
            desc: 'Generate optimized daily nutrition protocols.',
            href: '/dashboard/plan',
            icon: Calendar,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            name: 'Profile & Settings',
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
                            Vitala Intelligence Beta
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.9] mb-6">
                            Welcome to your <span className="text-emerald-500">Dashboard.</span>
                        </h1>
                        <p className="text-base text-slate-400 leading-relaxed">
                            Your unified platform for biological data, nutritional protocols, and healthy eating choices. Optimize your performance through high-density nutrition.
                        </p>
                    </div>
                </div>

                {/* Cards Grid - Takes 1/3 width, grid layout */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-4 auto-rows-fr">
                    {tools.map((tool) => (
                        <Link key={tool.href} href={tool.href}>
                            <Card className="p-4 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:rotate-6", tool.bg, tool.color)}>
                                    <tool.icon size={18} />
                                </div>
                                <h3 className="text-xs font-bold tracking-tight mb-1 group-hover:text-emerald-500 transition-colors uppercase">{tool.name}</h3>
                                <p className="text-[10px] text-slate-500 leading-tight mb-2 flex-grow line-clamp-2">{tool.desc}</p>
                                <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Open
                                    <ArrowRight size={8} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
