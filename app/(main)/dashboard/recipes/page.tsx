"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChefHat, ArrowRight, Leaf, Activity, Calendar, Scale, Beaker, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/lib/context/user-preferences-context";
import { PageContainer } from '@/components/ui/page-container';
export default function RecipesPage() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, recipes: 0, nutrients: 0, mixes: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [foodsCount, recipesCount, mixesCount] = await Promise.all([
                    supabase.from("food_items").select("id", { count: "exact", head: true }),
                    supabase.from("recipes").select("id", { count: "exact", head: true }).eq('is_mix', false),
                    supabase.from("recipes").select("id", { count: "exact", head: true }).eq('is_mix', true),
                ]);
                setStats({
                    foods: foodsCount.count || 0,
                    recipes: recipesCount.count || 0,
                    nutrients: 30,
                    mixes: mixesCount.count || 0
                });
            } catch (e) {
                console.error("Error fetching recipes stats:", e);
            }
        };
        fetchStats();
    }, []);

    const heroCards = [
        { id: "mealomatic", title: "Mealomatic", desc: "Plan your weekly meals", href: "/dashboard/recipes/meal-o-matic", icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", borderHover: "hover:border-amber-500/40", gradient: "from-amber-500 to-orange-600" },
        { id: "mixes", title: "Mixes", desc: "Ingredient blends & bases", href: "/dashboard/recipes/mixes", icon: Beaker, color: "text-indigo-400", bg: "bg-indigo-500/10", borderHover: "hover:border-indigo-500/40", gradient: "from-indigo-500 to-blue-600" },
        { id: "meals", title: "Meals", desc: "Meals with full nutrition", href: "/dashboard/recipes/meals", icon: ChefHat, color: "text-amber-400", bg: "bg-amber-500/10", borderHover: "hover:border-amber-500/40", gradient: "from-amber-500 to-orange-600" },
    ];

    return (
        <PageContainer>
            <div className="space-y-12 animate-in fade-in duration-700 pb-20 md:pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                {showHeroes && (
                    <div className="w-full md:max-w-[900px] mx-auto relative px-0 mb-6 group/stats">
                        <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800/60 p-5 px-8 w-full overflow-hidden backdrop-blur-md transition-all duration-500 hover:bg-slate-900/60 hover:border-slate-700/60">
                            <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none group-hover/stats:opacity-[0.05] transition-opacity duration-500">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 rounded-full blur-3xl" />
                            </div>

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
                                <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
                                <div className="flex items-center gap-3 group/stat">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Leaf size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">{stats.foods}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Foods</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
                                <div className="flex items-center gap-3 group/stat">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Beaker size={16} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">{stats.mixes}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Mixes</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-6 bg-slate-700/40" />
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

                <div className="w-full mx-auto md:max-w-[900px] mt-6 lg:mt-8">
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/60 rounded-[2.5rem] overflow-hidden p-2">
                        {heroCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className={cn(
                                        "group flex items-center justify-between p-6 transition-all duration-300 hover:bg-slate-800/60 rounded-2xl",
                                        index !== heroCards.length - 1 && "border-b border-white/[0.03]"
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg", card.bg)}>
                                            <Icon size={28} className={card.color} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight">{card.title}</h3>
                                            <p className="text-[14px] text-slate-500 leading-relaxed">{card.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}
