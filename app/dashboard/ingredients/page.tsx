'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    ShoppingBasket,
    ShoppingCart,
    Activity,
    ShoppingBag,
    Loader2,
    UtensilsCrossed,
    Search,
    X,
    LayoutGrid,
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

import { ExploreView } from './views/explore-view';
import { StaplesView } from './views/staples-view';
import { ShoppingView } from './views/shopping-view';
import { NutrientsView } from './views/nutrients-view';
import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PantryView } from '@/components/kitchen/pantry-view';
import { CATEGORIES } from '@/components/library/foods-view';

type FoodTab = 'groceries' | 'pantry' | 'allfoods' | 'explore' | 'staples' | 'shopping' | 'nutrients';

function FoodsHubContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = (searchParams.get('tab') as FoodTab) || 'groceries';
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();

    // Lifted Filter State
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    const toolsTabs: any[] = [
    ];

    const renderTabGroup = (tabsList: typeof ingredientTabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3">
            {sectionLabel && <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>}
            <div className={cn(
                "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0"
            )}>
                {/* Left side - Home Button area */}
                <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0" : "w-12")}>
                    {showHomeButton && !isSearchExpanded && (
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
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500", isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")}>
                    <div className="flex items-center gap-4 overflow-hidden py-1">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = currentTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id as FoodTab)}
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
                            placeholder={`Search ${currentTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                setIsFocused(true);
                                setActiveSearchId('ingredients-bar');
                            }}
                            onBlur={() => {
                                // Small delay to allow selections
                                setTimeout(() => {
                                    if (activeSearchId === 'ingredients-bar') setActiveSearchId(null);
                                }, 200);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-12 rounded-[1.5rem] px-6 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (isSearchExpanded) setSearchQuery('');
                            setIsSearchExpanded(!isSearchExpanded);
                        }}
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

                {/* Tab Sections & Filters */}
                <div className="flex flex-col gap-6 items-start w-full">
                    {renderTabGroup(ingredientTabs, "", "text-slate-500", true)}
                </div>

                {(currentTab === 'allfoods' || currentTab === 'explore' || currentTab === 'pantry') && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full mask-linear animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Favorites Toggle */}
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm group",
                                showFavoritesOnly
                                    ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:hover:border-rose-900/50"
                            )}
                        >
                            <Heart size={16} className={cn("transition-transform group-hover:scale-110", showFavoritesOnly && "fill-current scale-110")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Favorites</span>
                        </button>

                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />

                        {/* Category Chips */}
                        {CATEGORIES.map(category => {
                            const isActive = selectedCategories.includes(category);
                            return (
                                <button
                                    key={category}
                                    onClick={() => isActive
                                        ? setSelectedCategories(prev => prev.filter(c => c !== category))
                                        : setSelectedCategories(prev => [...prev, category])
                                    }
                                    className={cn(
                                        "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap shrink-0 border shadow-sm",
                                        isActive
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-200 hover:text-emerald-600 dark:hover:border-emerald-900/50"
                                    )}
                                >
                                    {category}
                                </button>
                            );
                        })}

                        {selectedCategories.length > 0 && (
                            <>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shrink-0 flex items-center gap-2"
                                >
                                    <X size={14} /> Clear
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* View Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    {currentTab === 'groceries' && <ShoppingListView />}
                    {currentTab === 'pantry' && <PantryView
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        hideControls={true}
                    />}
                    {currentTab === 'allfoods' && <ExploreView
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        hideControls={true}
                    />}
                    {currentTab === 'explore' && <ExploreView
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        hideControls={true}
                    />}
                    {currentTab === 'staples' && <StaplesView />}
                    {currentTab === 'shopping' && <ShoppingView />}
                    {currentTab === 'nutrients' && <NutrientsView />}
                </div>
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
