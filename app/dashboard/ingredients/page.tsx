'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    ShoppingBasket,
    ShoppingCart,
    Activity,
    Scale,
    Beaker,
    ShoppingBag,
    Loader2,
    UtensilsCrossed,
    Search,
    X,
    LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

import { ExploreView } from './views/explore-view';
import { StaplesView } from './views/staples-view';
import { ShoppingView } from './views/shopping-view';
import { NutrientsView } from './views/nutrients-view';
import { CompareView } from './views/compare-view';
import { LabView } from './views/lab-view';
import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PantryView } from '@/components/kitchen/pantry-view';

type FoodTab = 'groceries' | 'pantry' | 'allfoods' | 'explore' | 'staples' | 'shopping' | 'nutrients' | 'compare' | 'lab';

function FoodsHubContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = (searchParams.get('tab') as FoodTab) || 'groceries';
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery } = useSearch();

    const setTab = (tab: FoodTab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/dashboard/ingredients?${params.toString()}`);
    };

    // First row: Ingredients section (moved from Kitchen)
    const ingredientTabs = [
        { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'pantry', label: 'Pantry', icon: ShoppingBasket, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'allfoods', label: 'All Foods', icon: UtensilsCrossed, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    // Second row: Tools section
    const toolsTabs = [
        { id: 'compare', label: 'Compare', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const renderTabGroup = (tabsList: typeof ingredientTabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500">
                <div className="flex items-center">
                    {showHomeButton && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all mr-2 flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id as FoodTab)}
                                    className={cn(
                                        "flex items-center gap-3 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-500 whitespace-nowrap group flex-shrink-0",
                                        isActive
                                            ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                        isSearchExpanded ? "px-4" : "px-5"
                                    )}
                                >
                                    <Icon size={15} className={cn(
                                        "transition-transform duration-500 group-hover:scale-110",
                                        isActive ? tab.color : "text-slate-400"
                                    )} />
                                    {!isSearchExpanded && tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-end pl-2">
                    <div className={cn(
                        "flex items-center transition-all duration-500 overflow-hidden",
                        isSearchExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                    )}>
                        <input
                            type="text"
                            autoFocus
                            placeholder={`Search ${currentTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-12 rounded-[1.5rem] px-6 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all flex-shrink-0",
                            isSearchExpanded
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                        )}
                        title="Search"
                    >
                        {isSearchExpanded ? <X size={18} /> : <Search size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
            {/* Unified Hub Navigation */}
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85] mb-2">
                        <span className="text-emerald-500">Ingredients.</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                        Manage your ingredients and explore nutritional data
                    </p>
                </div>

                {/* Tab Sections */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {renderTabGroup(ingredientTabs, "📦 Ingredients", "text-slate-500", true)}
                    {renderTabGroup(toolsTabs, "🔬 Tools", "text-slate-500")}
                </div>
            </div>

            {/* View Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {currentTab === 'groceries' && <ShoppingListView />}
                {currentTab === 'pantry' && <PantryView />}
                {currentTab === 'allfoods' && <ExploreView />}
                {currentTab === 'explore' && <ExploreView />}
                {currentTab === 'staples' && <StaplesView />}
                {currentTab === 'shopping' && <ShoppingView />}
                {currentTab === 'nutrients' && <NutrientsView />}
                {currentTab === 'compare' && <CompareView />}
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
