'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    UtensilsCrossed,
    ShoppingCart,
    ShoppingBasket,
    Scale,
    Battery,
    Search,
    Loader2,
    X,
    LayoutGrid,
    ChefHat,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

// Views
import { ExploreView } from './views/explore-view';
import { ShoppingView } from './views/shopping-view';
import { StaplesView } from '@/components/library/staples-view';
import { CompareView } from './views/compare-view';
import { NutrientsView } from './views/nutrients-view';

export default function IngredientsHub() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Ingredients Hub...</p>
            </div>
        }>
            <IngredientsContent />
        </Suspense>
    );
}

type FoodTab = 'foods' | 'groceries' | 'pantry' | 'compare' | 'nutrients';

function IngredientsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<FoodTab>('foods');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();

    // Check for admin/user context if needed (omitted for brevity unless required by logic)
    // The previous implementation snippet hinted at admin checks but views handle them mostly.

    // Sync tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab') as FoodTab;
        if (tab && ['foods', 'groceries', 'pantry', 'compare', 'nutrients'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: FoodTab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'foods', label: 'Foods', icon: UtensilsCrossed, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'pantry', label: 'Pantry', icon: ShoppingBasket, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'compare', label: 'Compare Foods', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'nutrients', label: 'Nutrients', icon: Battery, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    const tabConfig: Record<FoodTab, { heading: string; description: string; color: string }> = {
        foods: {
            heading: 'Foods',
            description: 'Explore our complete database of nutritional building blocks',
            color: 'text-emerald-500'
        },
        groceries: {
            heading: 'Shopping List',
            description: 'Plan your purchases and manage grocery needs',
            color: 'text-rose-500'
        },
        pantry: {
            heading: 'My Staples',
            description: 'Manage your kitchen inventory and available stocks',
            color: 'text-amber-500'
        },
        compare: {
            heading: 'Compare Foods',
            description: 'Analyze and compare nutritional profiles side-by-side',
            color: 'text-blue-500'
        },
        nutrients: {
            heading: 'Nutrients',
            description: 'Deep dive into micronutrients and health benefits',
            color: 'text-indigo-500'
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3.5 rounded-[1.5rem] shadow-xl shadow-slate-200 dark:shadow-slate-900/20 text-white transition-colors duration-500",
                        activeTab === 'foods' ? "bg-emerald-600 shadow-emerald-500/20" :
                            activeTab === 'groceries' ? "bg-rose-600 shadow-rose-500/20" :
                                activeTab === 'pantry' ? "bg-amber-500 shadow-amber-500/20" :
                                    activeTab === 'compare' ? "bg-blue-600 shadow-blue-500/20" :
                                        "bg-indigo-600 shadow-indigo-500/20"
                    )}>
                        {activeTab === 'foods' && <UtensilsCrossed size={28} />}
                        {activeTab === 'groceries' && <ShoppingCart size={28} />}
                        {activeTab === 'pantry' && <ShoppingBasket size={28} />}
                        {activeTab === 'compare' && <Scale size={28} />}
                        {activeTab === 'nutrients' && <Battery size={28} />}
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            <span className={tabConfig[activeTab].color}>{tabConfig[activeTab].heading}.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">{tabConfig[activeTab].description}</p>
                    </div>
                </div>

                {/* Tab Pillbox */}
                <div className="flex flex-col gap-6 items-start w-full">
                    <div className="space-y-3 w-full">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Navigation</p>
                        <div className={cn(
                            "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0"
                        )}>
                            {/* Left side - Home/Dashboard Button */}
                            <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0" : "w-12")}>
                                {!isSearchExpanded && (
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex-shrink-0"
                                        title="Back to Dashboard"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Center - Tabs area */}
                            <div className={cn(
                                "flex items-center justify-center overflow-x-auto no-scrollbar transition-all duration-500",
                                isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100"
                            )}>
                                <div className="flex items-center gap-2 md:gap-4 py-1 px-1">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabChange(tab.id as FoodTab)}
                                                className={cn(
                                                    "flex items-center gap-3 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-500 whitespace-nowrap group flex-shrink-0",
                                                    isActive
                                                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                                    "px-4 md:px-5"
                                                )}
                                            >
                                                <Icon size={15} className={cn(
                                                    "transition-transform duration-500 group-hover:scale-110",
                                                    isActive ? tab.color : "text-slate-400"
                                                )} />
                                                <span className={cn(
                                                    "transition-all duration-300 overflow-hidden hidden md:inline",
                                                )}>
                                                    {tab.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right side - Global Search (for supported views) */}
                            <div className={cn(
                                "flex items-center justify-end transition-all duration-500",
                                isSearchExpanded ? "flex-1 pl-2" : "w-12"
                            )}>
                                <div className={cn(
                                    "flex items-center transition-all duration-500 overflow-hidden",
                                    isSearchExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                                )}>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder={`Search ${tabConfig[activeTab].heading}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => {
                                            setIsFocused(true);
                                            setActiveSearchId('pill-bar');
                                        }}
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
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'foods' && <ExploreView hideControls={false} />}
                {activeTab === 'groceries' && <ShoppingView />}
                {activeTab === 'pantry' && <StaplesView />}
                {activeTab === 'compare' && <CompareView />}
                {activeTab === 'nutrients' && <NutrientsView />}
            </div>
        </div>
    );
}
