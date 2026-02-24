'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Zap,
    ChefHat,
    Library,
    User,
    ArrowRight,
    Leaf,
    Activity,
    Settings,
    Beaker,
    Scale,
    Calendar,
    Package,
    ShoppingCart,
    Plus,
    Wrench,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';


export default function DashboardOverview() {
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
                console.error('Error fetching dashboard stats:', e);
            }
        };
        fetchStats();
    }, []);

    const heroCards = [
        {
            id: 'library',
            title: 'Library',
            desc: 'Explore our vast library of nutritious foods, essential nutrients, and custom blends. Access professional tools to research ingredients and discover healthy meals tailored to your needs.',
            href: '/dashboard/library',
            icon: Library,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            borderHover: 'hover:border-blue-500/40',
            titleHover: 'group-hover/title:text-blue-400',
            itemTitleHover: 'group-hover/item:text-blue-400',
            itemBorderHover: 'hover:border-blue-500/50',
            gradient: 'from-blue-500 to-indigo-600',
            items: [
                { title: 'Foods', icon: Leaf, href: '/dashboard/library/foods', desc: 'nutritious edibles' },
                { title: 'Mixes', icon: Beaker, href: '/dashboard/library/mixes', desc: 'custom blends' },
                { title: 'Meals', icon: ChefHat, href: '/dashboard/library/meals', desc: 'healthy eating' },
            ]
        },
        {
            id: 'kitchen',
            title: 'Kitchen',
            desc: 'Take full control of your kitchen with our inventory management and meal planning tools. Sync your pantry, create custom meal plans, and generate automated shopping lists based on your goals.',
            href: '/dashboard/kitchen',
            icon: ChefHat,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            borderHover: 'hover:border-emerald-500/40',
            titleHover: 'group-hover/title:text-emerald-400',
            itemTitleHover: 'group-hover/item:text-emerald-400',
            itemBorderHover: 'hover:border-emerald-500/50',
            gradient: 'from-emerald-500 to-teal-600',
            items: [
                { title: 'Mealomatic', icon: Calendar, href: '/dashboard/kitchen/meal-o-matic', desc: 'meal planner' },
                { title: 'Pantry', icon: Package, href: '/dashboard/kitchen/pantry', desc: 'In-stock essentials' },
                { title: 'Groceries', icon: ShoppingCart, href: '/dashboard/kitchen/groceries', desc: 'shopping list' },
            ]
        },
        {
            id: 'workshop',
            title: 'Workshop',
            desc: 'The place for experimentation and trying out new things. Craft personal meal plans, compare ingredients, and use our workshop modules to perfect your diet.',
            href: '/dashboard/workshop',
            icon: Wrench,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            borderHover: 'hover:border-purple-500/40',
            titleHover: 'group-hover/title:text-purple-400',
            itemTitleHover: 'group-hover/item:text-purple-400',
            itemBorderHover: 'hover:border-purple-500/50',
            gradient: 'from-purple-500 to-violet-600',
            items: [
                { title: 'Comparator', icon: Scale, href: '/dashboard/workshop/comparator', desc: 'versus 3 foods' },
                { title: 'Nutridex', icon: Activity, href: '/dashboard/workshop/nutridex', desc: 'biological guide' },
                { title: 'Life Guard', icon: Wallet, href: '/dashboard/workshop/lifeguard', desc: 'survival simulation' },
            ]
        },
    ];

    return (
        <PageContainer>
            <div className="space-y-12 animate-in fade-in duration-700 pb-20 md:pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                {showHeroes && (
                    <div className="w-full md:max-w-[900px] mx-auto relative px-0 mb-6 group/stats">
                        <div className="relative p-5 px-8 w-full transition-all duration-500">
                            <div className="relative z-10 grid grid-cols-2 gap-4 md:flex md:flex-wrap md:items-start md:justify-center md:gap-8 lg:gap-12">
                                <Link href="/dashboard/workshop/lifeguard" className="flex items-center gap-3 group/stat hover:opacity-80 transition-opacity">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Wallet size={16} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">Survival</p>
                                        <p className="text-[9px] uppercase tracking-widest text-amber-500/60 font-bold mt-1">Life Guard</p>
                                    </div>
                                </Link>

                                <div className="flex items-center gap-3 group/stat">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Leaf size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">{stats.foods}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Foods</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 group/stat">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Beaker size={16} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">{stats.mixes}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Mixes</p>
                                    </div>
                                </div>

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

                <div className="w-full max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {heroCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <Link
                                key={card.id}
                                href={card.href}
                                className={cn(
                                    "group relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 transition-all duration-500 min-h-[320px] flex flex-col items-center justify-center text-center",
                                    card.borderHover,
                                    "hover:shadow-2xl hover:-translate-y-1"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500",
                                    card.gradient
                                )} />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                                        card.bg
                                    )}>
                                        <Icon size={40} className={card.color} />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <h3 className={cn("text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors uppercase italic", card.titleHover)}>
                                                {card.title}
                                            </h3>
                                            <ArrowRight size={24} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0", card.color)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Subtle background glow */}
                                <div className={cn(
                                    "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-all duration-700",
                                    card.bg
                                )} />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </PageContainer>
    );
}
