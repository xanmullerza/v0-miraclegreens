'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    ShoppingBasket,
    Activity,
    Scale,
    Beaker,
    ShoppingBag,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { ExploreView } from './views/explore-view';
import { StaplesView } from './views/staples-view';
import { ShoppingView } from './views/shopping-view';
import { NutrientsView } from './views/nutrients-view';
import { CompareView } from './views/compare-view';
import { LabView } from './views/lab-view';

type FoodTab = 'explore' | 'staples' | 'shopping' | 'nutrients' | 'compare' | 'lab';

function FoodsHubContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = (searchParams.get('tab') as FoodTab) || 'explore';

    const setTab = (tab: FoodTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/dashboard/foods?${params.toString()}`);
    };

    const tabs = [
        { id: 'explore', label: 'Explore', icon: Library, color: 'emerald' },
        { id: 'staples', label: 'Staples', icon: ShoppingBasket, color: 'amber' },
        { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'rose' },
        { id: 'nutrients', label: 'Nutrients', icon: Activity, color: 'indigo' },
        { id: 'compare', label: 'Compare', icon: Scale, color: 'blue' },
        { id: 'lab', label: 'Lab', icon: Beaker, color: 'violet' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Unified Hub Navigation */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic leading-[0.85] mb-2">
                        Food <span className="text-emerald-500">Intelligence.</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Access the complete clinical database, manage your kitchen, and analyze molecular nutrition.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-x-auto no-scrollbar items-center gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setTab(tab.id as FoodTab)}
                                className={cn(
                                    "flex items-center gap-3 px-6 h-12 rounded-[1.5rem] transition-all duration-300 whitespace-nowrap group",
                                    isActive
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105 z-10"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive ? "bg-white/10 dark:bg-slate-900/10" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white/50"
                                )}>
                                    <Icon size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* View Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentTab === 'explore' && <ExploreView />}
                {currentTab === 'staples' && <StaplesView />}
                {currentTab === 'shopping' && <ShoppingView />}
                {currentTab === 'nutrients' && <NutrientsView />}
                {currentTab === 'compare' && <CompareView />}
                {currentTab === 'lab' && <LabView />}
            </div>
        </div>
    );
}

export default function FoodsHub() {
    return (
        <Suspense fallback={
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Synchronizing Scientific Data...</p>
            </div>
        }>
            <FoodsHubContent />
        </Suspense>
    );
}
