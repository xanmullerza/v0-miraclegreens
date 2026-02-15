'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Activity,
    Leaf,
    ChefHat,
    Scale,
    Trophy,
    ArrowRight,
    Search,
    Zap,
    Lightbulb,
    Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0 });
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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


    const toolFeatures = [
        {
            id: 'compare',
            title: 'Compare Foods',
            description: 'Put foods side by side and compare their nutrient content. Find out which option gives you more of what you need.',
            href: '/library/ingredients?tab=compare',
            icon: Scale,
            gradient: 'from-violet-500 to-purple-600',
            shadowColor: 'shadow-violet-500/20',
            bgAccent: 'bg-violet-500/5',
            borderAccent: 'border-violet-500/20',
            hoverBorder: 'hover:border-violet-500/40',
            iconBg: 'bg-violet-500/10',
            iconColor: 'text-violet-500',
        },
        {
            id: 'top10',
            title: 'Top 10 Rankings',
            description: 'See which foods rank highest for each nutrient. The ultimate cheat sheet for nutrient-dense eating.',
            href: '/library?tab=top10',
            icon: Trophy,
            gradient: 'from-amber-500 to-yellow-500',
            shadowColor: 'shadow-amber-500/20',
            bgAccent: 'bg-amber-500/5',
            borderAccent: 'border-amber-500/20',
            hoverBorder: 'hover:border-amber-500/40',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
        },
        {
            id: 'allnutrients',
            title: 'Nutrient Database',
            description: 'Browse through our complete nutrient database. Filter by category and find detailed information on every tracked nutrient.',
            href: '/library?tab=nutrients',
            icon: Search,
            gradient: 'from-cyan-500 to-blue-500',
            shadowColor: 'shadow-cyan-500/20',
            bgAccent: 'bg-cyan-500/5',
            borderAccent: 'border-cyan-500/20',
            hoverBorder: 'hover:border-cyan-500/40',
            iconBg: 'bg-cyan-500/10',
            iconColor: 'text-cyan-500',
        },
    ];

    const tips = [
        { text: 'Eating a rainbow of colours helps cover a wider spectrum of nutrients.', icon: '🌈' },
        { text: 'Cooking tomatoes increases their lycopene content — a powerful antioxidant.', icon: '🍅' },
        { text: 'Pairing iron-rich foods with vitamin C boosts absorption.', icon: '🍊' },
        { text: 'Dark leafy greens are packed with calcium, iron, and folate.', icon: '🥬' },
    ];

    const [currentTip, setCurrentTip] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % tips.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [tips.length]);

    const heroCards = [
        {
            id: 'nutrients',
            title: 'Nutrients',
            desc: 'Vitamins, minerals & more',
            href: '/library/nutrients',
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
            href: '/library/ingredients',
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
            href: '/library/recipes',
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
            href: '/library/ingredients?tab=compare',
            icon: Scale,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            borderHover: 'hover:border-violet-500/40',
            gradient: 'from-violet-500 to-purple-600',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700 pb-32">

            {/* ── Hero Section — Split Layout ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 lg:p-12 xl:p-16">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.06] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                </div>
                <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.04] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
                    {/* Left — Welcome Text */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-8">
                            <Compass size={12} className="fill-current" />
                            Your Nutrition Library
                        </div>

                        <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                            Welcome to the{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                                Library.
                            </span>
                        </h1>

                        <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-md">
                            Your personal guide to nutrition. Explore <span className="text-white font-semibold">nutrients</span>,
                            browse <span className="text-white font-semibold">foods</span>,
                            discover <span className="text-white font-semibold">recipes</span>, and
                            compare ingredients — all in one place.
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
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        {heroCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className={cn(
                                        "group relative overflow-hidden rounded-2xl lg:rounded-[1.5rem] border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 lg:p-6 transition-all duration-500",
                                        card.borderHover,
                                        "hover:bg-slate-800/70 hover:shadow-2xl hover:-translate-y-0.5",
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
                                            "w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
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
                                            <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Tools Section ── */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                        <Zap size={18} className="text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            Powerful Tools
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            Compare, rank, and discover
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {toolFeatures.map((feature) => {
                        const Icon = feature.icon;
                        const isHovered = hoveredCard === feature.id;
                        return (
                            <Link
                                key={feature.id}
                                href={feature.href}
                                onMouseEnter={() => setHoveredCard(feature.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={cn(
                                    "group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500",
                                    "bg-white dark:bg-slate-900",
                                    feature.borderAccent,
                                    feature.hoverBorder,
                                    "hover:shadow-xl hover:-translate-y-0.5",
                                    feature.shadowColor,
                                )}
                            >
                                {/* Background glow */}
                                <div className={cn(
                                    "absolute -top-16 -right-16 w-32 h-32 rounded-full transition-all duration-700 blur-3xl",
                                    feature.bgAccent,
                                    isHovered ? "opacity-100 scale-150" : "opacity-0 scale-100",
                                )} />

                                <div className="relative z-10 flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                        feature.iconBg,
                                    )}>
                                        <Icon size={20} className={feature.iconColor} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <ArrowRight size={16} className={cn(
                                        "flex-shrink-0 mt-1 transition-all duration-300",
                                        feature.iconColor,
                                        "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0",
                                    )} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Nutrition Tip ── */}
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/80 p-8 lg:p-10">
                <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-3xl" />
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Lightbulb size={20} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-amber-500 font-black mb-2">
                            Did You Know?
                        </p>
                        <div className="relative h-14 overflow-hidden">
                            {tips.map((tip, i) => (
                                <p
                                    key={i}
                                    className={cn(
                                        "absolute top-0 left-0 text-sm lg:text-base text-slate-600 dark:text-slate-300 leading-relaxed transition-all duration-700",
                                        currentTip === i
                                            ? "opacity-100 translate-y-0"
                                            : "opacity-0 translate-y-4",
                                    )}
                                >
                                    <span className="mr-2">{tip.icon}</span>
                                    {tip.text}
                                </p>
                            ))}
                        </div>
                        {/* Progress dots */}
                        <div className="flex items-center gap-2 mt-4">
                            {tips.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentTip(i)}
                                    className={cn(
                                        "transition-all duration-500 rounded-full",
                                        currentTip === i
                                            ? "w-6 h-1.5 bg-amber-500"
                                            : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-amber-400",
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick Links Footer ── */}
            <div className="text-center space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                    Quick Links
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    {[
                        { label: 'Ingredients', href: '/library/ingredients', icon: Leaf },
                        { label: 'Recipes', href: '/library/recipes', icon: ChefHat },
                        { label: 'Compare', href: '/library/ingredients?tab=compare', icon: Scale },
                        { label: 'Top 10', href: '/library?tab=top10', icon: Trophy },
                        { label: 'Nutrients', href: '/library/nutrients', icon: Activity },
                    ].map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                        >
                            <link.icon size={12} />
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
