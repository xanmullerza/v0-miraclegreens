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
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PantryView } from '@/components/kitchen/pantry-view';
import { MealPlannerView } from '@/components/kitchen/mealplanner-view';

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
    const [activeTab, setActiveTab] = useState<'shoppinglist' | 'pantry' | 'mealplanner'>('mealplanner');

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        if (tab && ['shoppinglist', 'pantry', 'mealplanner'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'shoppinglist' | 'pantry' | 'mealplanner') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'shoppinglist', label: 'Shopping List', icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'pantry', label: 'Pantry', icon: ShoppingBasket, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'mealplanner', label: 'Meal Planner', icon: ChefHat, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

                {/* Tab Switcher */}
                <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl self-start">
                    {tabs.map((tab) => {
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

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'shoppinglist' && <ShoppingListView />}
                {activeTab === 'pantry' && <PantryView />}
                {activeTab === 'mealplanner' && <MealPlannerView />}
            </div>
        </div>
    );
}
