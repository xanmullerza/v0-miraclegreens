'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    Apple,
    ChefHat,
    Activity,
    Search,
    Loader2,
    Zap,
    Scale,
    X,
    Filter,
    ChevronDown,
    Plus,
    LayoutGrid,
    Globe,
    Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSearch } from '@/lib/context/search-context';

import { FoodsView, CATEGORIES } from '@/components/library/foods-view';
import { RecipesView, MEAL_TYPES } from '@/components/library/recipes-view';
import { NutrientsView } from '@/components/library/nutrients-view';
import { CompareView } from '../ingredients/views/compare-view';

export default function ClinicalLibrary() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Getting things ready...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'recipes' | 'nutrients' | 'compare'>('recipes');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, results, isLoading, onResultClickRef } = useSearch();

    // Ingredients Filter State
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
    const [showFoodFavorites, setShowFoodFavorites] = useState(false);
    const [isFoodFilterOpen, setIsFoodFilterOpen] = useState(false);

    // Meals Filter State
    const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>(MEAL_TYPES);
    const [showMealFavorites, setShowMealFavorites] = useState(false);
    const [isMealFilterOpen, setIsMealFilterOpen] = useState(false);

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        if (tab && ['recipes', 'nutrients', 'compare'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'recipes' | 'nutrients' | 'compare') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'recipes', label: 'Meals', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-600/10' },
        { id: 'compare', label: 'Compare', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'nutrients', label: 'Nutrients', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    const renderTabGroup = (tabsList: typeof tabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className="flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500 w-full md:w-[800px] mx-auto xl:mx-0">
                {/* Left side - Home Button area */}
                <div className="flex-shrink-0 w-12 flex items-center justify-start">
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
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-4 overflow-hidden py-1">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
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
                                        "transition-all duration-300 overflow-hidden",
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
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
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

            {/* Comparison Search Results Dropdown (Pill Bar Context) */}
            {activeTab === 'compare' && searchQuery.trim() !== '' && isSearchExpanded && (
                <div className="absolute top-full left-0 right-0 mt-3 z-[101] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 w-full md:w-[800px] mx-auto xl:mx-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">
                            <Activity className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
                            <p className="mt-2 text-[10px] font-black uppercase tracking-widest">Analyzing Samples...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p className="font-bold text-sm">No items found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10">
                                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-3">Direct Matches</p>
                            </div>
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        if (onResultClickRef.current) {
                                            onResultClickRef.current(result);
                                        }
                                        setSearchQuery('');
                                    }}
                                    className="w-full text-left p-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex justify-between items-center group border-b border-slate-100 dark:border-slate-800 last:border-0"
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-bold text-slate-900 dark:text-white capitalize group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className="text-[10px] text-slate-500 italic mt-0.5">{result.subtitle}</div>
                                        )}
                                    </div>
                                    <Plus size={14} className="text-slate-300 group-hover:text-emerald-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[1.5rem] bg-emerald-600 shadow-xl shadow-emerald-500/20 text-white">
                        <Library size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            The <span className="text-emerald-500">Library.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Healthy Eating Made Easy v0.4</p>
                    </div>
                </div>

                {/* Tab Section & Filters */}
                <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start xl:items-end justify-between w-full">
                    {renderTabGroup(tabs, "📚 Sections", "text-slate-500", true)}

                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500 w-full xl:w-auto overflow-x-auto no-scrollbar pb-2 xl:pb-0">


                        {activeTab === 'recipes' && (
                            <>
                                {/* Recipes Favorites Toggle */}
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-all">
                                    <Globe
                                        size={18}
                                        className={cn(
                                            "transition-all cursor-pointer",
                                            !showMealFavorites ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-400 hover:text-slate-500"
                                        )}
                                        onClick={() => setShowMealFavorites(false)}
                                    />
                                    <Switch
                                        checked={showMealFavorites}
                                        onCheckedChange={setShowMealFavorites}
                                        className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600"
                                    />
                                    <Heart
                                        size={18}
                                        className={cn(
                                            "transition-all cursor-pointer",
                                            showMealFavorites ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-400 hover:text-slate-500"
                                        )}
                                        onClick={() => setShowMealFavorites(true)}
                                    />
                                </div>

                                {/* Meal Type Filter */}
                                <div className="relative">
                                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 items-center h-14 shadow-xl overflow-x-auto no-scrollbar">
                                        <button
                                            onClick={() => setIsMealFilterOpen(!isMealFilterOpen)}
                                            className={cn(
                                                "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300",
                                                isMealFilterOpen ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <Filter size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                                            <ChevronDown size={14} className={cn("transition-transform", isMealFilterOpen && "rotate-180")} />
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-1" />
                                        {MEAL_TYPES.map(type => {
                                            const isActive = selectedMealTypes.includes(type);
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => isActive
                                                        ? setSelectedMealTypes(prev => prev.filter(t => t !== type))
                                                        : setSelectedMealTypes(prev => [...prev, type])
                                                    }
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                        isActive ? "bg-blue-600/10 text-blue-600 border border-blue-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500"
                                                    )}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>



            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">

                {activeTab === 'recipes' && (
                    <RecipesView
                        showFavoritesOnly={showMealFavorites}
                        setShowFavoritesOnly={setShowMealFavorites}
                        selectedTypes={selectedMealTypes}
                        setSelectedTypes={setSelectedMealTypes}
                        hideControls={true}
                    />
                )}
                {activeTab === 'compare' && <CompareView />}
                {activeTab === 'nutrients' && <NutrientsView />}
            </div>
        </div>
    );
}
