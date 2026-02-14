'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Activity,
    Search,
    Loader2,
    X,
    LayoutGrid,
    Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

import { NutrientsView } from '@/components/library/nutrients-view';
import { TopTenView } from './views/top-ten-view';

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Library...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'nutrients' | 'top10'>('nutrients');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, setActiveSearchId } = useSearch();

    // Local state for views
    const [showNutrientFavorites, setShowNutrientFavorites] = useState(false);
    const [selectedNutrientCategories, setSelectedNutrientCategories] = useState<string[]>([]);

    const [showTop10Favorites, setShowTop10Favorites] = useState(false);
    const [selectedTop10Categories, setSelectedTop10Categories] = useState<string[]>([]);
    const [selectedNutrientId, setSelectedNutrientId] = useState<string | undefined>(undefined);

    // Sync from URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['nutrients', 'top10'].includes(tab)) {
            setActiveTab(tab as 'nutrients' | 'top10');
        }

        const nutrientId = searchParams.get('nutrientId');
        if (nutrientId) {
            setSelectedNutrientId(nutrientId);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'nutrients' | 'top10') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'nutrients', label: 'All Nutrients', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'top10', label: 'Top 10', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    const tabConfig: Record<'nutrients' | 'top10', { heading: string; description: string; color: string }> = {
        nutrients: {
            heading: 'All Nutrients',
            description: 'Browse & explore our essential nutrient database',
            color: 'text-blue-500'
        },
        top10: {
            heading: 'Top 10 Richest',
            description: 'Discover the richest food sources per nutrient',
            color: 'text-amber-500'
        },
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3.5 rounded-[1.5rem] shadow-xl shadow-slate-200 dark:shadow-slate-900/20 text-white transition-colors duration-500",
                        activeTab === 'nutrients' ? "bg-blue-600 shadow-blue-500/20" :
                            "bg-amber-500 shadow-amber-500/20"
                    )}>
                        {activeTab === 'nutrients' && <Activity size={28} />}
                        {activeTab === 'top10' && <Trophy size={28} />}
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
                                                onClick={() => handleTabChange(tab.id as 'nutrients' | 'top10')}
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

                            {/* Right side - Global Search */}
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
                {activeTab === 'nutrients' && (
                    <NutrientsView
                        showFavoritesOnly={showNutrientFavorites}
                        setShowFavoritesOnly={setShowNutrientFavorites}
                        selectedCategories={selectedNutrientCategories}
                        setSelectedCategories={setSelectedNutrientCategories}
                    />
                )}
                {activeTab === 'top10' && (
                    <TopTenView
                        showFavoritesOnly={showTop10Favorites}
                        setShowFavoritesOnly={setShowTop10Favorites}
                        selectedCategories={selectedTop10Categories}
                        setSelectedCategories={setSelectedTop10Categories}
                        selectedNutrientId={selectedNutrientId}
                        onNutrientChange={setSelectedNutrientId}
                    />
                )}
            </div>
        </div>
    );
}
