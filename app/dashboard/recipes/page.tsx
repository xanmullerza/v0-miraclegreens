'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2,
    Sparkles,
    FlaskConical,
    Bot,
    BookOpen,
    Search,
    X,
    LayoutGrid,
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

import { MealPlannerView } from '@/components/kitchen/mealplanner-view';
import { MixLabView } from '@/components/kitchen/mix-lab-view';
import { RecipesView, MEAL_TYPES } from '@/components/library/recipes-view';

type TabId = 'mixlab' | 'mealplanner' | 'browse';

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
    const [activeTab, setActiveTab] = useState<TabId>('browse');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery } = useSearch();
    const { dailyPlan } = useUserPreferences();

    // Lifted Filter State
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const allTabs: TabId[] = ['mixlab', 'mealplanner', 'browse'];

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

    // Tab configuration with headings and descriptions
    const tabConfig: Record<TabId, { heading: string; description: string }> = {
        browse: {
            heading: 'All Meals',
            description: 'Explore our complete recipe collection and find meals that match your nutritional goals'
        },
        mealplanner: {
            heading: 'Meal-O-Matic',
            description: 'Let AI create personalized meal plans based on your preferences and nutritional needs'
        },
        mixlab: {
            heading: 'Mix Lab',
            description: 'Create custom recipes by mixing and matching ingredients to your exact specifications'
        }
    };

    // Meals & Recipes tabs
    const mealsTabs = [
        { id: 'browse' as TabId, label: 'All Meals', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { id: 'mealplanner' as TabId, label: 'Meal-O-Matic', icon: Bot, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'mixlab' as TabId, label: 'Mix Lab', icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    const renderTabGroup = (tabsList: typeof mealsTabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3 w-full">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className={cn(
                "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0"
            )}>
                {/* Left side - Home Button area */}
                <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0" : "w-12")}>
                    {showHomeButton && !isSearchExpanded && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                </div>

                {/* Center - Tabs area */}
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500", isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")}>
                    <div className="flex items-center gap-4 overflow-hidden py-1">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
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
                                        "transition-all duration-300 overflow-hidden hidden md:block",
                                        isSearchExpanded ? "w-0 opacity-0" : "w-auto opacity-100"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right side - Search area */}
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
                            placeholder={`Search ${activeTab}...`}
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
                                : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
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
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[1.5rem] bg-amber-500 shadow-xl shadow-amber-500/20 text-white">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85] mb-2">
                            <span className="text-amber-500">{tabConfig[activeTab].heading}.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">
                            {tabConfig[activeTab].description}
                        </p>
                    </div>
                </div>

                {/* Tab Section & Filters */}
                <div className="flex flex-col gap-6 items-start w-full">
                    {renderTabGroup(mealsTabs, "🍽️ Meals & Recipes", "text-slate-500", true)}
                </div>

                {['browse', 'mealplanner'].includes(activeTab) && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full mask-linear animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Favorites Toggle */}
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={cn(
                                "flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm group",
                                showFavoritesOnly
                                    ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:hover:border-rose-900/50"
                            )}
                        >
                            <Heart size={14} className={cn("transition-transform group-hover:scale-110", showFavoritesOnly && "fill-current scale-110")} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Favorites</span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />

                        {/* Type Pills */}
                        {MEAL_TYPES.map(type => {
                            const isActive = selectedTypes.includes(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => isActive
                                        ? setSelectedTypes(prev => prev.filter(t => t !== type))
                                        : setSelectedTypes(prev => [...prev, type])
                                    }
                                    className={cn(
                                        "px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap shrink-0 border shadow-sm",
                                        isActive
                                            ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-amber-200 hover:text-amber-600 dark:hover:border-amber-900/50"
                                    )}
                                >
                                    {type}
                                </button>
                            );
                        })}

                        {selectedTypes.length > 0 && selectedTypes.length < MEAL_TYPES.length && (
                            <>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />
                                <button
                                    onClick={() => setSelectedTypes(MEAL_TYPES)}
                                    className="px-2.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shrink-0 flex items-center gap-1"
                                >
                                    <X size={12} /> Clear
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'mixlab' && <MixLabView />}
                {activeTab === 'mealplanner' && (
                    <MealPlannerView
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                        hideControls={true}
                    />
                )}
                {activeTab === 'browse' && (
                    <RecipesView
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                        hideControls={true}
                    />
                )}
            </div>
        </div>
    );
}
