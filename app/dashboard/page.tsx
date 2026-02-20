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
    ShoppingCart
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

export default function DashboardOverview() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0 });
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            if (user?.email && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()) {
                setIsAdmin(true);
            }
        };
        checkUser();

        const fetchStats = async () => {
            try {
                const [foodsCount, recipesCount] = await Promise.all([
                    supabase.from('food_items').select('id', { count: 'exact', head: true }),
                    supabase.from('recipes').select('id', { count: 'exact', head: true }),
                ]);
                setStats({ foods: foodsCount.count || 0, recipes: recipesCount.count || 0, nutrients: 30 });
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
            desc: 'Nutrient database & tools',
            href: '/dashboard/library',
            icon: Library,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            borderHover: 'hover:border-blue-500/40',
            gradient: 'from-blue-500 to-indigo-600',
            items: [
                { title: 'Nutrients', icon: Activity, href: '/dashboard/library/nutrients', desc: 'Vitamins & minerals' },
                { title: 'Foods', icon: Leaf, href: '/dashboard/library/foods', desc: 'Whole food profiles' },
                { title: 'Mixes', icon: Beaker, href: '/dashboard/library/mixes', desc: 'Blends & bases' },
                { title: 'Recipes', icon: ChefHat, href: '/dashboard/library/recipes', desc: 'Full nutrition meals' },
            ]
        },
        {
            id: 'kitchen',
            title: 'Kitchen',
            desc: 'Manage your pantry & meals',
            href: '/dashboard/kitchen',
            icon: ChefHat,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            borderHover: 'hover:border-emerald-500/40',
            gradient: 'from-emerald-500 to-teal-600',
            items: [
                { title: 'Mealomatic', icon: Calendar, href: '/dashboard/kitchen/meal-o-matic', desc: 'Weekly planner' },
                { title: 'Compare', icon: Scale, href: '/dashboard/kitchen/comparefoods', desc: 'Side-by-side analysis' },
                { title: 'Pantry', icon: Package, href: '/dashboard/kitchen/pantry', desc: 'In-stock essentials' },
                { title: 'Groceries', icon: ShoppingCart, href: '/dashboard/kitchen/groceries', desc: 'Shopping lists' },
            ]
        },
    ];

    return (
        <PageContainer>
            <div className="space-y-16 animate-in fade-in duration-700 pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                {showHeroes ? (
                    <div className="w-full md:max-w-[900px] mx-auto relative px-0">
                        <div className="relative rounded-[2.5rem] bg-slate-900 border border-slate-800 mt-6 pt-12 pb-8 px-8 lg:mt-8 lg:pt-16 lg:pb-12 lg:px-12 xl:mt-10 xl:pt-20 xl:pb-16 xl:px-16 w-full flex flex-col lg:flex-row items-start lg:items-center gap-12">
                            <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.06] pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                            </div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.04] pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full blur-3xl" />
                            </div>

                            <div className="flex-1 relative z-10 w-full lg:w-auto">
                                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                                    Welcome to <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Vitala.</span>
                                </h1>

                                <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-md">Everything you need to find healthy food, great recipes, and plan your week. Discover how to eat well and feel your best.</p>

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

                            <div className="flex-none w-full lg:w-[480px]">
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {heroCards.map((card) => {
                                        const Icon = card.icon;
                                        const isKitchen = card.id === 'kitchen';
                                        const isDisabled = isKitchen && !isAdmin;

                                        if (isDisabled) {
                                            return (
                                                <div key={card.id} className="relative overflow-hidden rounded-[2rem] border border-slate-700/30 bg-slate-800/20 p-6 opacity-60 cursor-not-allowed select-none group">
                                                    <div className="absolute top-4 right-4 z-20"><span className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-500">Locked</span></div>
                                                    <div className="relative z-10 grayscale opacity-50">
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800/50"><Icon size={24} className="text-slate-500" /></div>
                                                            <div>
                                                                <h3 className="text-lg font-black text-slate-400 tracking-tight">{card.title}</h3>
                                                                <p className="text-[13px] text-slate-600 leading-snug">{card.desc}</p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[1, 2, 3, 4].map((i) => (
                                                                <div key={i} className="h-12 rounded-xl bg-slate-800/30 border border-slate-700/20" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={card.id} className={cn("group/main relative overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-6 transition-all duration-500", card.borderHover, "hover:bg-slate-800/70 hover:shadow-2xl")}>
                                                <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover/main:opacity-100 transition-all duration-500", card.gradient)} />

                                                <div className="relative z-10">
                                                    <Link href={card.href} className="flex items-center gap-4 mb-6 group/title">
                                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/title:scale-110", card.bg)}><Icon size={24} className={card.color} /></div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-lg font-black text-white tracking-tight group-hover/title:text-emerald-400 transition-colors">{card.title}</h3>
                                                                <ArrowRight size={14} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0", card.color)} />
                                                            </div>
                                                            <p className="text-[13px] text-slate-500 leading-snug">{card.desc}</p>
                                                        </div>
                                                    </Link>

                                                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                                        {card.items?.map((item) => {
                                                            const ItemIcon = item.icon;
                                                            return (
                                                                <Link
                                                                    key={item.href}
                                                                    href={item.href}
                                                                    className="group/item relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/40 p-3 transition-all duration-300 hover:border-slate-500/40 hover:bg-slate-800/60"
                                                                >
                                                                    <div className="flex items-center gap-2.5 relative z-10">
                                                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 transition-colors group-hover/item:bg-slate-700")}>
                                                                            <ItemIcon size={14} className={card.color} />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[11px] font-black text-white leading-none mb-1 truncate">{item.title}</p>
                                                                            <p className="text-[9px] text-slate-500 leading-none truncate">{item.desc}</p>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full mx-auto mt-6 lg:mt-8 md:max-w-[900px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full">
                            {heroCards.map((card) => {
                                const Icon = card.icon;
                                const isKitchen = card.id === 'kitchen';
                                const isDisabled = isKitchen && !isAdmin;

                                if (isDisabled) {
                                    return (
                                        <div key={card.id} className="relative overflow-hidden rounded-[2rem] border border-slate-700/30 bg-slate-800/20 p-6 opacity-60 cursor-not-allowed select-none group">
                                            <div className="absolute top-4 right-4 z-20"><span className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-500">Locked</span></div>
                                            <div className="relative z-10 grayscale opacity-50">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800/50"><Icon size={24} className="text-slate-500" /></div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-400 tracking-tight">{card.title}</h3>
                                                        <p className="text-[13px] text-slate-600 leading-snug">{card.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <div key={i} className="h-12 rounded-xl bg-slate-800/30 border border-slate-700/20" />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={card.id} className={cn("group/main relative overflow-hidden rounded-[2rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-6 transition-all duration-500", card.borderHover, "hover:bg-slate-800/70 hover:shadow-2xl")}>
                                        <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover/main:opacity-100 transition-all duration-500", card.gradient)} />

                                        <div className="relative z-10">
                                            <Link href={card.href} className="flex items-center gap-4 mb-6 group/title">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/title:scale-110", card.bg)}><Icon size={24} className={card.color} /></div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-black text-white tracking-tight group-hover/title:text-emerald-400 transition-colors">{card.title}</h3>
                                                        <ArrowRight size={14} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0", card.color)} />
                                                    </div>
                                                    <p className="text-[13px] text-slate-500 leading-snug">{card.desc}</p>
                                                </div>
                                            </Link>

                                            <div className="grid grid-cols-2 gap-2 lg:gap-3">
                                                {card.items?.map((item) => {
                                                    const ItemIcon = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            className="group/item relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/40 p-3 transition-all duration-300 hover:border-slate-500/40 hover:bg-slate-800/60"
                                                        >
                                                            <div className="flex items-center gap-2.5 relative z-10">
                                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 transition-colors group-hover/item:bg-slate-700")}>
                                                                    <ItemIcon size={14} className={card.color} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-black text-white leading-none mb-1 truncate">{item.title}</p>
                                                                    <p className="text-[9px] text-slate-500 leading-none truncate">{item.desc}</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </PageContainer>
    );
}
