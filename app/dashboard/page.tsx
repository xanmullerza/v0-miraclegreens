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
    Wrench, // Added Wrench icon
    ChevronRight // Added ChevronRight icon
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

import { Carousel } from '@/components/ui/carousel';

export default function DashboardOverview() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0, mixes: 0 });
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
                { title: 'Nutrients', icon: Activity, href: '/dashboard/library/nutrients', desc: 'Vitamins & minerals' },
                { title: 'Foods', icon: Leaf, href: '/dashboard/library/foods', desc: 'nutritious edibles' },
                { title: 'Mixes', icon: Beaker, href: '/dashboard/library/mixes', desc: 'custom blends' },
                { title: 'Meals', icon: ChefHat, href: '/dashboard/library/recipes', desc: 'healthy eating' },
            ]
        },
        {
            id: 'workshop',
            title: 'Workshop',
            desc: 'The place for experimentation and trying out new things. Craft personal meal plans, compare ingredients, and use our workshop modules to perfect your diet.',
            href: '/dashboard/workshop',
            icon: Wrench,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            borderHover: 'hover:border-indigo-500/40',
            titleHover: 'group-hover/title:text-indigo-400',
            itemTitleHover: 'group-hover/item:text-indigo-400',
            itemBorderHover: 'hover:border-indigo-500/50',
            gradient: 'from-indigo-500 to-purple-600',
            items: [
                { title: 'Comparator', icon: Scale, href: '/dashboard/workshop/comparefoods', desc: 'versus 3 foods' },
                { title: 'Feature Request', icon: Plus, href: '#', desc: 'suggest a tool' },
                { title: 'Feature Request', icon: Plus, href: '#', desc: 'new features' },
                { title: 'Feature Request', icon: Plus, href: '#', desc: 'research' },
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
                { title: 'Feature Request', icon: Plus, href: '#', desc: 'kitchen tool' },
            ]
        },
    ];

    return (
        <PageContainer>
            <div className="space-y-12 animate-in fade-in duration-700 pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                {showHeroes && (
                    <div className="w-full md:max-w-[900px] mx-auto relative px-0 mb-6 group/stats">
                        <div className="relative p-5 px-8 w-full transition-all duration-500">
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
                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Beaker size={16} className="text-indigo-400" />
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

                <div className="w-full mx-auto md:max-w-[700px] mt-6 lg:mt-8 px-4">
                    <Carousel
                        indicators={[
                            <Library key="lib" size={20} />,
                            <Wrench key="work" size={20} />,
                            <ChefHat key="kit" size={20} />
                        ]}
                    >
                        {heroCards.map((card) => {
                            const Icon = card.icon;
                            const isKitchen = card.id === 'kitchen';
                            const isDisabled = isKitchen && !isAdmin;

                            if (isDisabled) {
                                return (
                                    <div key={card.id} className="relative overflow-hidden rounded-[2.5rem] border border-slate-700/30 bg-slate-800/20 p-8 opacity-60 cursor-not-allowed select-none group h-full">
                                        <div className="absolute top-6 right-6 z-20"><span className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span></div>
                                        <div className="relative z-10 grayscale opacity-50">
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-800/50"><Icon size={28} className="text-slate-500" /></div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white tracking-tight">{card.title}</h3>
                                                    <p className="text-[14px] text-slate-600 leading-relaxed max-w-[280px]">{card.desc}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="h-14 rounded-xl bg-slate-800/30 border border-slate-700/20" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={card.id} className={cn("group/main relative overflow-hidden rounded-[2.5rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-8 transition-all duration-500 h-full", card.borderHover, "hover:bg-slate-800/70 hover:shadow-2xl")}>
                                    <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover/main:opacity-100 transition-all duration-500", card.gradient)} />

                                    <div className="relative z-10">
                                        <Link href={card.href} className="flex items-center gap-5 mb-8 group/title">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/title:scale-110", card.bg)}><Icon size={28} className={card.color} /></div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn("text-xl font-black text-white tracking-tight transition-colors", card.titleHover)}>{card.title}</h3>
                                                    <ArrowRight size={16} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0", card.color)} />
                                                </div>
                                                <p className="text-[14px] text-slate-500 leading-relaxed">{card.desc}</p>
                                            </div>
                                        </Link>

                                        <div className="grid grid-cols-2 gap-3">
                                            {card.items?.map((item) => {
                                                const ItemIcon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className={cn("group/item relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 transition-all duration-300 hover:bg-slate-800/60", card.itemBorderHover)}
                                                    >
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 transition-colors group-hover/item:bg-slate-700")}>
                                                                <ItemIcon size={16} className={card.color} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={cn("text-[12px] font-black text-white leading-none mb-1 truncate transition-colors", card.itemTitleHover)}>{item.title}</p>
                                                                <p className="text-[10px] text-slate-500 leading-none truncate">{item.desc}</p>
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
                    </Carousel>
                </div>
            </div>
        </PageContainer>
    );
}
