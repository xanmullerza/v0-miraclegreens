"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    Leaf,
    ChevronRight,
    Package,
    ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useUserPreferences } from "@/lib/context/user-preferences-context";
import { PageContainer } from '@/components/ui/page-container';

export default function IngredientsPage() {
    const { showHeroes } = useUserPreferences();
    const [stats, setStats] = useState({ foods: 0, nutrients: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [foodsCount] = await Promise.all([
                    supabase.from("food_items").select("id", { count: "exact", head: true }),
                ]);
                setStats({
                    foods: foodsCount.count || 0,
                    nutrients: 30
                });
            } catch (e) {
                console.error("Error fetching stats:", e);
            }
        };
        fetchStats();
    }, []);

    const heroCards = [
        { id: "foods", title: "Foods", desc: "Browse whole food profiles", href: "/dashboard/ingredients/foods", icon: Leaf, color: "text-emerald-400", bg: "bg-emerald-500/10", borderHover: "hover:border-emerald-500/40", gradient: "from-emerald-500 to-teal-600" },
        { id: "pantry", title: "Pantry", desc: "Manage what you have", href: "/dashboard/ingredients/pantry", icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10", borderHover: "hover:border-emerald-500/40", gradient: "from-emerald-500 to-teal-600" },
        { id: "groceries", title: "Groceries", desc: "Shopping list & needs", href: "/dashboard/ingredients/groceries", icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10", borderHover: "hover:border-blue-500/40", gradient: "from-blue-500 to-indigo-600" },
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

                            <div className="relative z-10 grid grid-cols-1 gap-4 md:flex md:flex-wrap md:items-start md:justify-center md:gap-8 lg:gap-16">
                                <div className="flex items-center gap-3 group/stat">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover/stat:scale-110">
                                        <Leaf size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-white leading-none">{stats.foods}</p>
                                        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1">Foods</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="w-full mx-auto md:max-w-[900px] mt-6 lg:mt-8">
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/60 rounded-[2.5rem] p-2">
                        {heroCards.map((card, index) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.id}
                                    href={card.href}
                                    className={cn(
                                        "group flex items-center justify-between p-6 transition-all duration-300 hover:bg-slate-800/60 rounded-2xl relative",
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

