'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShoppingCart,
    ShoppingBasket,
    ChefHat,
    Loader2,
    Search,
    X,
    Sparkles,
    UtensilsCrossed
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PantryView } from '@/components/kitchen/pantry-view';
import { MealPlannerView } from '@/components/kitchen/mealplanner-view';
import { AllFoodsView } from '@/components/kitchen/all-foods-view';

export default function KitchenPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Getting things ready...</p>
            </div>
        }>
            <KitchenContent />
        </Suspense>
    );
}

function KitchenContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'shoppinglist' | 'pantry' | 'allfoods' | 'mealplanner'>('shoppinglist');

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        if (tab && ['shoppinglist', 'pantry', 'allfoods', 'mealplanner'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'shoppinglist' | 'pantry' | 'allfoods' | 'mealplanner') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const mainTabs = [
        { id: 'shoppinglist', label: 'Groceries', icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'pantry', label: 'Pantry', icon: ShoppingBasket, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'allfoods', label: 'All Foods', icon: UtensilsCrossed, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-[1.5rem] bg-amber-500 shadow-xl shadow-amber-500/20 text-white">
                            <Sparkles size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                                The <span className="text-amber-500">Kitchen.</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Meal Planning Made Easy</p>
                        </div>
                    </div>
                </div>

                {/* Main Tab Switcher */}
                <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl self-start">
                    {mainTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 whitespace-nowrap group",
                                    isActive
                                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <Icon size={16} className={cn(
                                    "transition-transform duration-500 group-hover:scale-110",
                                    isActive ? tab.color : "text-slate-400"
                                )} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Meal Planner Section - Separate */}
            <div
                onClick={() => handleTabChange('mealplanner')}
                className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all group",
                    activeTab === 'mealplanner'
                        ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/30 hover:shadow-lg"
                )}
            >
                <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    activeTab === 'mealplanner' ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white"
                )}>
                    <ChefHat size={20} />
                </div>
                <div className="flex-1">
                    <h3 className={cn(
                        "text-sm font-black uppercase tracking-widest transition-colors",
                        activeTab === 'mealplanner' ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"
                    )}>
                        Meal Planner
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Generate personalized meal plans based on your pantry
                    </p>
                </div>
                <div className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors",
                    activeTab === 'mealplanner'
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-amber-500 group-hover:text-white"
                )}>
                    {activeTab === 'mealplanner' ? 'Active' : 'Open'}
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'shoppinglist' && <ShoppingListView />}
                {activeTab === 'pantry' && <PantryView />}
                {activeTab === 'allfoods' && <AllFoodsView />}
                {activeTab === 'mealplanner' && <MealPlannerView />}
            </div>
        </div>
    );
}
