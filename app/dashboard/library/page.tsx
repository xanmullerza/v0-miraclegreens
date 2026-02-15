'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Activity,
    Leaf,
    ChefHat,
    Scale,
    Trophy,
    Sparkles,
    ArrowRight,
    BookOpen,
    Search,
    Zap,
    Star,
    Layers,
    TrendingUp,
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

    const mainFeatures = [
        {
            id: 'nutrients',
            title: 'Explore Nutrients',
            description: 'Discover vitamins, minerals, and essential nutrients. Learn what they do, where to find them, and how much you need every day.',
            href: '/dashboard/nutrients',
            icon: Activity,
            gradient: 'from-blue-500 to-indigo-600',
            shadowColor: 'shadow-blue-500/20',
            bgAccent: 'bg-blue-500/5',
            borderAccent: 'border-blue-500/20',
            hoverBorder: 'hover:border-blue-500/40',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-500',
            stat: `${stats.nutrients}+ tracked`,
            statIcon: TrendingUp,
        },
        {
            id: 'foods',
            title: 'Explore Foods',
            description: 'Browse our collection of whole foods with full nutrient breakdowns. Find the healthiest ingredients for your meals.',
            href: '/dashboard/ingredients',
            icon: Leaf,
            gradient: 'from-emerald-500 to-teal-600',
            shadowColor: 'shadow-emerald-500/20',
            bgAccent: 'bg-emerald-500/5',
            borderAccent: 'border-emerald-500/20',
            hoverBorder: 'hover:border-emerald-500/40',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-500',
            stat: `${stats.foods} foods`,
            statIcon: Layers,
        },
        {
            id: 'recipes',
            title: 'Explore Recipes',
            description: 'Discover nutrient-packed recipes for every meal. See complete nutritional profiles and plan your meals with confidence.',
            href: '/dashboard/recipes',
            icon: ChefHat,
            gradient: 'from-amber-500 to-orange-600',
            shadowColor: 'shadow-amber-500/20',
            bgAccent: 'bg-amber-500/5',
            borderAccent: 'border-amber-500/20',
            hoverBorder: 'hover:border-amber-500/40',
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
            stat: `${stats.recipes} recipes`,
            statIcon: BookOpen,
        },
    ];

    const toolFeatures = [
        {
            id: 'compare',
            title: 'Compare Foods',
            description: 'Put foods side by side and compare their nutrient content. Find out which option gives you more of what you need.',
            href: '/dashboard/ingredients?tab=compare',
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
            href: '/dashboard/library?tab=top10',
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
            href: '/dashboard/library?tab=nutrients',
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

    return (
        <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-700 pb-32">

            {/* ── Hero Section ── */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16 min-h-[340px]">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 opacity-[0.06] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                </div>
                <div className="absolute bottom-0 left-0 w-64 h-64 opacity-[0.04] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-full blur-3xl" />
                </div>

                {/* Floating icons — decorative */}
                <div className="absolute top-8 right-12 opacity-10 animate-pulse">
                    <Sparkles size={60} className="text-emerald-400" />
                </div>
                <div className="absolute bottom-12 right-24 opacity-[0.07]">
                    <BookOpen size={80} className="text-blue-400" />
                </div>

                <div className="relative z-10 max-w-2xl">
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

                    <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-xl">
                        Your personal guide to nutrition. Explore <span className="text-white font-semibold">nutrients</span>,
                        browse <span className="text-white font-semibold">foods</span>,
                        discover <span className="text-white font-semibold">recipes</span>, and
                        compare ingredients — all in one place.
                    </p>

                    {/* Quick stats row */}
                    <div className="flex items-center gap-6 mt-10 flex-wrap">
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
            </div>

            {/* ── Main Features ── */}
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Compass size={18} className="text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            Start Exploring
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            Dive into nutrients, foods, and recipes
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mainFeatures.map((feature) => {
                        const Icon = feature.icon;
                        const StatIcon = feature.statIcon;
                        const isHovered = hoveredCard === feature.id;
                        return (
                            <Link
                                key={feature.id}
                                href={feature.href}
                                onMouseEnter={() => setHoveredCard(feature.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className={cn(
                                    "group relative overflow-hidden rounded-[2rem] border p-8 transition-all duration-500",
                                    "bg-white dark:bg-slate-900",
                                    feature.borderAccent,
                                    feature.hoverBorder,
                                    "hover:shadow-2xl hover:-translate-y-1",
                                    feature.shadowColor,
                                )}
                            >
                                {/* Gradient accent at top */}
                                <div className={cn(
                                    "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500",
                                    feature.gradient,
                                    isHovered ? "opacity-100" : "opacity-0",
                                )} />

                                {/* Background glow */}
                                <div className={cn(
                                    "absolute -top-20 -right-20 w-40 h-40 rounded-full transition-all duration-700 blur-3xl",
                                    feature.bgAccent,
                                    isHovered ? "opacity-100 scale-150" : "opacity-0 scale-100",
                                )} />

                                <div className="relative z-10">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                                        feature.iconBg,
                                    )}>
                                        <Icon size={24} className={feature.iconColor} />
                                    </div>

                                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-2 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                                        {feature.title}
                                    </h3>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                        {feature.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <StatIcon size={12} className={feature.iconColor} />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", feature.iconColor)}>
                                                {feature.stat}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                            feature.iconColor,
                                            "opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0",
                                        )}>
                                            Explore
                                            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
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
                        { label: 'Ingredients', href: '/dashboard/ingredients', icon: Leaf },
                        { label: 'Recipes', href: '/dashboard/recipes', icon: ChefHat },
                        { label: 'Compare', href: '/dashboard/ingredients?tab=compare', icon: Scale },
                        { label: 'Top 10', href: '/dashboard/library?tab=top10', icon: Trophy },
                        { label: 'Nutrients', href: '/dashboard/nutrients', icon: Activity },
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
