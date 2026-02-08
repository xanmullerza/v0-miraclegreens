'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2,
    Sparkles,
    FlaskConical,
    Bot,
    BookOpen,
    Library
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { MealPlannerView } from '@/components/kitchen/mealplanner-view';
import { MixLabView } from '@/components/kitchen/mix-lab-view';
import { AllMealsView } from '@/components/kitchen/all-meals-view';
import { RecipesView } from '@/components/library/recipes-view';

type TabId = 'mixlab' | 'mealplanner' | 'allmeals' | 'browse';

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
    const [activeTab, setActiveTab] = useState<TabId>('mixlab');

    const allTabs: TabId[] = ['mixlab', 'mealplanner', 'allmeals', 'browse'];

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as TabId;
        if (tab && allTabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    // Meals & Recipes tabs
    const mealsTabs = [
        { id: 'mixlab' as TabId, label: 'Mix Lab', icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'mealplanner' as TabId, label: 'Meal-O-Matic', icon: Bot, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'allmeals' as TabId, label: 'All Meals', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'browse' as TabId, label: 'Browse', icon: Library, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const renderTabGroup = (tabs: typeof mealsTabs, sectionLabel: string, sectionColor: string) => (
        <div className="space-y-3">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-500 whitespace-nowrap group",
                                isActive
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <Icon size={15} className={cn(
                                "transition-transform duration-500 group-hover:scale-110",
                                isActive ? tab.color : "text-slate-400"
                            )} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[1.5rem] bg-amber-500 shadow-xl shadow-amber-500/20 text-white">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            <span className="text-amber-500">Recipes.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Meal Planning Made Easy</p>
                    </div>
                </div>

                {/* Tab Section */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {renderTabGroup(mealsTabs, "🍽️ Meals & Recipes", "text-slate-500")}
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'mixlab' && <MixLabView />}
                {activeTab === 'mealplanner' && <MealPlannerView />}
                {activeTab === 'allmeals' && <AllMealsView />}
                {activeTab === 'browse' && <RecipesView />}
            </div>
        </div>
    );
}
