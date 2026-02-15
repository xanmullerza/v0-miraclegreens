'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Zap,
    Sparkles,
    ChefHat,
    Library,
    User,
    ArrowRight,
    Leaf,
    UtensilsCrossed,
    X
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
    const [hideWelcome, setHideWelcome] = useState(false);

    useEffect(() => {
        // Restore persisted preference for hiding the welcome card
        try {
            const saved = window.localStorage.getItem('hideWelcomeVitala');
            if (saved === 'true') setHideWelcome(true);
        } catch (e) {
            // ignore (e.g., SSR guard)
        }

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

    const hideSession = () => setHideWelcome(true);

    const hideForever = () => {
        try {
            window.localStorage.setItem('hideWelcomeVitala', 'true');
        } catch (e) {
            // ignore
        }
        setHideWelcome(true);
    };

    const tools = [
        {
            name: 'Ingredients',
            desc: 'Browse and explore nutritious food items.',
            href: '/library/ingredients',
            icon: Leaf,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Profile',
            desc: 'Manage your settings and personal info.',
            href: '/dashboard/profile',
            icon: User,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            name: 'Recipes',
            desc: 'Plan meals, manage your pantry, and create shopping lists.',
            href: '/library/recipes',
            icon: ChefHat,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            name: 'Library',
            desc: 'Compare nutrients, rank foods, and explore facts.',
            href: '/library',
            icon: Library,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
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
            <div className={cn("grid gap-6", hideWelcome ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
                {/* Hero Welcome - Takes 2/3 width */}
                {!hideWelcome && (
                    <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16 flex flex-col justify-center min-h-[400px]">
                        <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
                            <Sparkles size={300} className="text-emerald-500" />
                        </div>

                        <div className="relative z-10 max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                                <Zap size={12} className="fill-current" />
                                Your Health Companion
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.9] mb-6">
                                Welcome to <span className="text-emerald-500">Vitala.</span>
                            </h1>
                            <p className="text-base text-slate-400 leading-relaxed">
                                Everything you need to find healthy food, great recipes, and plan your week. Discover how to eat well and feel your best.
                            </p>
                        </div>

                        {/* Hide Button - Bottom Right (session) and Don't show again - Bottom Left (persistent) */}
                        <button
                            onClick={hideSession}
                            className="absolute bottom-6 right-6 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-all duration-300 group"
                            title="Hide welcome card"
                        >
                            <X size={20} className="group-hover:scale-110 transition-transform" />
                        </button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={hideForever}
                            className="absolute bottom-6 left-6 text-xs px-3 py-1 bg-slate-800/60 hover:bg-slate-700 text-slate-300"
                            title="Don't show this welcome message again"
                        >
                            Don't show again
                        </Button>
                    </div>
                )}

                {/* Cards Grid - Takes 1/3 width, grid layout */}
                <div className={cn("grid gap-4 auto-rows-fr", hideWelcome ? "grid-cols-2 grid-rows-2 gap-6 max-w-3xl mx-auto" : "grid-cols-2 lg:col-span-1")}>
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
