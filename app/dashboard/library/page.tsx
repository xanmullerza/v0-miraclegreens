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
    Heart,
    Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSearch } from '@/lib/context/search-context';

import { FoodsView, CATEGORIES } from '@/components/library/foods-view';
import { RecipesView, MEAL_TYPES } from '@/components/library/recipes-view';
import { NutrientsView } from '@/components/library/nutrients-view';
import { CompareView } from '../ingredients/views/compare-view';
import { TopTenView } from './views/top-ten-view';

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
    const [activeTab, setActiveTab] = useState<'nutrients' | 'compare' | 'top10'>('nutrients');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId, results, isLoading, onResultClickRef } = useSearch();

    // Ingredients Filter State
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
    const [showFoodFavorites, setShowFoodFavorites] = useState(false);
    const [isFoodFilterOpen, setIsFoodFilterOpen] = useState(false);

    // Nutrients Filter State
    const NUTRIENT_CATEGORIES = ["Macros", "Minerals", "Vitamins"];
    const [selectedNutrientCategories, setSelectedNutrientCategories] = useState<string[]>(NUTRIENT_CATEGORIES);
    const [showNutrientFavorites, setShowNutrientFavorites] = useState(false);

    // Top 10 Filter State
    const [showTop10Favorites, setShowTop10Favorites] = useState(false);
    const [selectedTop10Categories, setSelectedTop10Categories] = useState<string[]>(
        CATEGORIES.filter(c => c !== 'Flavour' && c !== 'Supplements')
    );

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        if (tab && ['nutrients', 'compare', 'top10'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'nutrients' | 'compare' | 'top10') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'nutrients', label: 'All Nutrients', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'top10', label: 'Top 10', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        { id: 'compare', label: 'Compare', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    const tabConfig: Record<'nutrients' | 'top10' | 'compare', { heading: string; description: string; color: string }> = {
        nutrients: {
            heading: 'All Nutrients',
            description: 'Browse & explore our essential nutrient database',
            color: 'text-amber-500'
        },
        top10: {
            heading: 'Top 10',
            description: 'Discover the richest food sources for any essential nutrient',
            color: 'text-yellow-500'
        },
        compare: {
            heading: 'Compare Items',
            description: 'Side-by-side nutrition comparison tool',
            color: 'text-blue-500'
        }
    };

    const renderTabGroup = (tabsList: typeof tabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
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
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                </div>

                {/* Center - Tabs area */}
                <div className={cn(
                    "flex items-center justify-center overflow-hidden transition-all duration-500",
                    isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100"
                )}>
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
                            onFocus={() => {
                                setIsFocused(true);
                                setActiveSearchId('pill-bar');
                            }}
                            onBlur={() => {
                                // Small delay to allow clicking results
                                setTimeout(() => {
                                    if (activeSearchId === 'pill-bar') setActiveSearchId(null);
                                }, 200);
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

                {/* Comparison Search Results Dropdown (Pill Bar Context) - Positioned relative to this bar */}
                {activeTab === 'compare' && searchQuery.trim() !== '' && isSearchExpanded && activeSearchId === 'pill-bar' && (
                    <div className="absolute top-full left-0 right-0 mt-3 z-[101] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 w-full">
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


        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[1.5rem] bg-emerald-600 shadow-xl shadow-emerald-500/20 text-white">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            <span className={tabConfig[activeTab].color}>{tabConfig[activeTab].heading}.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">{tabConfig[activeTab].description}</p>
                    </div>
                </div>

                {/* Tab Section & Filters */}
                <div className="flex flex-col gap-6 items-start w-full">
                    {renderTabGroup(tabs, "📚 Sections", "text-slate-500", true)}

                    {activeTab === 'nutrients' && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full mask-linear animate-in fade-in slide-in-from-right-8 duration-700">
                            {/* Favorites Toggle */}
                            <button
                                onClick={() => setShowNutrientFavorites(!showNutrientFavorites)}
                                className={cn(
                                    "flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm group",
                                    showNutrientFavorites
                                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:hover:border-rose-900/50"
                                )}
                            >
                                <Heart size={14} className={cn("transition-transform group-hover:scale-110", showNutrientFavorites && "fill-current scale-110")} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Favorites</span>
                            </button>

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />

                            {/* Nutrient Category Pills */}
                            {NUTRIENT_CATEGORIES.map(category => {
                                const isActive = selectedNutrientCategories.includes(category);
                                return (
                                    <button
                                        key={category}
                                        onClick={() => isActive
                                            ? setSelectedNutrientCategories(prev => prev.filter(c => c !== category))
                                            : setSelectedNutrientCategories(prev => [...prev, category])
                                        }
                                        className={cn(
                                            "px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap shrink-0 border shadow-sm",
                                            isActive
                                                ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-amber-200 hover:text-amber-600 dark:hover:border-amber-900/50"
                                        )}
                                    >
                                        {category}
                                    </button>
                                );
                            })}

                            {selectedNutrientCategories.length > 0 && selectedNutrientCategories.length < NUTRIENT_CATEGORIES.length && (
                                <>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />
                                    <button
                                        onClick={() => setSelectedNutrientCategories(NUTRIENT_CATEGORIES)}
                                        className="px-2.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shrink-0 flex items-center gap-1"
                                    >
                                        <X size={12} /> Clear
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'top10' && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 w-full mask-linear animate-in fade-in slide-in-from-right-8 duration-700">
                            {/* Favorites Toggle */}
                            <button
                                onClick={() => setShowTop10Favorites(!showTop10Favorites)}
                                className={cn(
                                    "flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm group",
                                    showTop10Favorites
                                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500 dark:hover:border-rose-900/50"
                                )}
                            >
                                <Heart size={14} className={cn("transition-transform group-hover:scale-110", showTop10Favorites && "fill-current scale-110")} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Favorites</span>
                            </button>

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />

                            {/* Category Pills */}
                            {CATEGORIES.map(category => {
                                const isActive = selectedTop10Categories.includes(category);
                                return (
                                    <button
                                        key={category}
                                        onClick={() => isActive
                                            ? setSelectedTop10Categories(prev => prev.filter(c => c !== category))
                                            : setSelectedTop10Categories(prev => [...prev, category])
                                        }
                                        className={cn(
                                            "px-3.5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap shrink-0 border shadow-sm",
                                            isActive
                                                ? "bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/20"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-yellow-200 hover:text-yellow-600 dark:hover:border-yellow-900/50"
                                        )}
                                    >
                                        {category}
                                    </button>
                                );
                            })}

                            {selectedTop10Categories.length > 0 && selectedTop10Categories.length < CATEGORIES.length && (
                                <>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 mx-2" />
                                    <button
                                        onClick={() => setSelectedTop10Categories(CATEGORIES)}
                                        className="px-2.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shrink-0 flex items-center gap-1"
                                    >
                                        <X size={12} /> Clear
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>



            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">


                {activeTab === 'compare' && <CompareView />}
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
                    />
                )}
            </div>
        </div>
    );
}
