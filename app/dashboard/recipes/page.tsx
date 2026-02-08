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
    Globe,
    Heart,
    Filter,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';
import { Switch } from '@/components/ui/switch';

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
    const [activeTab, setActiveTab] = useState<TabId>('mixlab');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery } = useSearch();

    // Lifted Filter State
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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

    // Meals & Recipes tabs
    const mealsTabs = [
        { id: 'mixlab' as TabId, label: 'Mix Lab', icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { id: 'mealplanner' as TabId, label: 'Meal-O-Matic', icon: Bot, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'browse' as TabId, label: 'All Meals', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    const renderTabGroup = (tabsList: typeof mealsTabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500 w-full max-w-[450px]">
                <div className="flex items-center">
                    {showHomeButton && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all mr-2 flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
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
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            <span className="text-amber-500">Recipes.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Meal Planning Made Easy</p>
                    </div>
                </div>

                {/* Tab Section & Filters */}
                <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start xl:items-end justify-between w-full">
                    {renderTabGroup(mealsTabs, "🍽️ Meals & Recipes", "text-slate-500", true)}

                    {['browse', 'mealplanner'].includes(activeTab) && (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500 w-full xl:w-auto overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                            {/* Favorites Switch Toggle */}
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-all">
                                <Globe
                                    size={18}
                                    className={cn(
                                        "transition-all cursor-pointer",
                                        !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-400 hover:text-slate-500"
                                    )}
                                    onClick={() => setShowFavoritesOnly(false)}
                                />
                                <Switch
                                    id="favorites-mode"
                                    checked={showFavoritesOnly}
                                    onCheckedChange={setShowFavoritesOnly}
                                    className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600 dark:data-[state=unchecked]:bg-blue-600"
                                />
                                <Heart
                                    size={18}
                                    className={cn(
                                        "transition-all cursor-pointer",
                                        showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-400 hover:text-slate-500"
                                    )}
                                    onClick={() => setShowFavoritesOnly(true)}
                                />
                            </div>

                            {/* Type Filter */}
                            <div className="relative">
                                <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 items-center h-14 shadow-xl">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={cn(
                                            "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300",
                                            isFilterOpen ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                        )}
                                    >
                                        <Filter size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                                        <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                                    </button>

                                    <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-1" />

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
                                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                    isActive
                                                        ? "bg-blue-600/10 text-blue-600 border border-blue-600/20"
                                                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 uppercase"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
                        isFilterOpen={isFilterOpen}
                        setIsFilterOpen={setIsFilterOpen}
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
