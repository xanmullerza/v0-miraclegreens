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
    Plus,
    X,
    Filter,
    ChevronDown,
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
    const [activeTab, setActiveTab] = useState<'foods' | 'recipes' | 'nutrients'>('nutrients');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery } = useSearch();

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
        if (tab && ['foods', 'recipes', 'nutrients'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'foods' | 'recipes' | 'nutrients') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'nutrients', label: 'Nutrients', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'foods', label: 'Ingredients', icon: Apple, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'recipes', label: 'Meals', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-600/10' },
    ];

    const renderTabGroup = (tabsList: typeof tabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3">
            <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>
            <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-500 w-full max-w-[450px]">
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
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
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
                        {activeTab === 'foods' && (
                            <>
                                {/* Foods Favorites Toggle */}
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-all">
                                    <Globe
                                        size={18}
                                        className={cn(
                                            "transition-all cursor-pointer",
                                            !showFoodFavorites ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-400 hover:text-slate-500"
                                        )}
                                        onClick={() => setShowFoodFavorites(false)}
                                    />
                                    <Switch
                                        checked={showFoodFavorites}
                                        onCheckedChange={setShowFoodFavorites}
                                        className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600"
                                    />
                                    <Heart
                                        size={18}
                                        className={cn(
                                            "transition-all cursor-pointer",
                                            showFoodFavorites ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-400 hover:text-slate-500"
                                        )}
                                        onClick={() => setShowFoodFavorites(true)}
                                    />
                                </div>

                                {/* Category Filter */}
                                <div className="relative">
                                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 items-center h-14 shadow-xl overflow-x-auto no-scrollbar">
                                        <button
                                            onClick={() => setIsFoodFilterOpen(!isFoodFilterOpen)}
                                            className={cn(
                                                "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300",
                                                isFoodFilterOpen ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <Filter size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                                            <ChevronDown size={14} className={cn("transition-transform", isFoodFilterOpen && "rotate-180")} />
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-1" />
                                        {CATEGORIES.slice(0, 5).map(category => {
                                            const isActive = selectedCategories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    onClick={() => isActive
                                                        ? setSelectedCategories(prev => prev.filter(c => c !== category))
                                                        : setSelectedCategories(prev => [...prev, category])
                                                    }
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                        isActive ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500"
                                                    )}
                                                >
                                                    {category}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

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
                {activeTab === 'foods' && (
                    <FoodsView
                        showFavoritesOnly={showFoodFavorites}
                        setShowFavoritesOnly={setShowFoodFavorites}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        hideControls={true}
                    />
                )}
                {activeTab === 'recipes' && (
                    <RecipesView
                        showFavoritesOnly={showMealFavorites}
                        setShowFavoritesOnly={setShowMealFavorites}
                        selectedTypes={selectedMealTypes}
                        setSelectedTypes={setSelectedMealTypes}
                        hideControls={true}
                    />
                )}
                {activeTab === 'nutrients' && <NutrientsView />}
            </div>
        </div>
    );
}
