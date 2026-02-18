'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2,
    Sparkles,
    Search,
    LayoutGrid,
    Heart,
    Filter,
    ChevronDown,
    Check,
    CheckSquare,
    Square,
    X
} from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { supabase } from '@/lib/supabase';
import { HeaderActions } from '@/lib/context/header-actions-context';


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
    const [isAdmin, setIsAdmin] = useState(false);

    const { dailyPlan } = useUserPreferences();

    // Lifted Filter State
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    const allTabs: TabId[] = ['mixlab', 'mealplanner', 'browse'];

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as TabId;
        if (tab && allTabs.includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);





    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-8">

                {/* Header Toggle (Teleported to Subheader) */}
                {['browse', 'mealplanner'].includes(activeTab) && (
                    <HeaderActions>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 shrink-0 shadow-sm group outline-none",
                                    isFilterOpen
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                                )}
                            >
                                <Filter size={12} className={cn("transition-transform group-hover:scale-110", isFilterOpen && "fill-current")} />
                                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">
                                    {isFilterOpen ? "Hide Filters" : "Filters"}
                                </span>
                                {(showFavoritesOnly || selectedTypes.length < MEAL_TYPES.length) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
                                )}
                            </button>
                        </div>
                    </HeaderActions>
                )}

                {/* Filter Slider Section */}
                <div className={cn(
                    "relative z-[-1] overflow-hidden transition-all duration-700 ease-in-out -mt-12",
                    isFilterOpen ? "max-h-60 opacity-100 mb-8 pt-12" : "max-h-0 opacity-0 mb-0 pt-0"
                )}>
                    <div className="bg-white/80 dark:bg-slate-900/60 border-x border-b border-slate-200/50 dark:border-slate-800/50 rounded-b-[2rem] p-6 pb-5 flex flex-wrap items-center gap-4 backdrop-blur-md shadow-lg group">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">Configure:</span>

                            {/* Scope/Favorites Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm group outline-none text-[9px] font-black uppercase tracking-widest",
                                        showFavoritesOnly
                                            ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500"
                                    )}>
                                        <Heart size={14} className={cn("transition-transform group-hover:scale-110", showFavoritesOnly && "fill-current")} />
                                        {showFavoritesOnly ? "Favorites Only" : "Explore All"}
                                        <ChevronDown size={12} className="opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Filter Scope</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                    <DropdownMenuCheckboxItem
                                        checked={!showFavoritesOnly}
                                        onCheckedChange={(checked) => checked && setShowFavoritesOnly(false)}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-slate-50 py-3 cursor-pointer"
                                    >
                                        Show All Recipes
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={showFavoritesOnly}
                                        onCheckedChange={(checked) => checked && setShowFavoritesOnly(true)}
                                        className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-3 cursor-pointer"
                                    >
                                        Favorites Only
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Meal Type Dropdown Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 shrink-0 shadow-sm outline-none text-[9px] font-black uppercase tracking-widest",
                                        selectedTypes.length < MEAL_TYPES.length
                                            ? "bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/20"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-emerald-200 hover:text-emerald-600"
                                    )}>
                                        <LayoutGrid size={14} />
                                        {selectedTypes.length === 0 ? "No Types" :
                                            selectedTypes.length === MEAL_TYPES.length ? "All Meal Types" :
                                                `${selectedTypes.length} Types Selected`}
                                        <ChevronDown size={12} className={cn("opacity-50")} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-64 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                    <div className="flex items-center justify-between pr-2">
                                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Types</DropdownMenuLabel>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedTypes(MEAL_TYPES);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 transition-colors"
                                                title="Select All"
                                            >
                                                <CheckSquare size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSelectedTypes([]);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                                title="Select None"
                                            >
                                                <Square size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                    <div className="py-1 max-h-[300px] overflow-y-auto no-scrollbar">
                                        {MEAL_TYPES.map(type => {
                                            const isActive = selectedTypes.includes(type);
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={type}
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedTypes(prev => [...prev, type]);
                                                        } else {
                                                            setSelectedTypes(prev => prev.filter(t => t !== type));
                                                        }
                                                    }}
                                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-emerald-50 dark:focus:bg-emerald-900/10 focus:text-emerald-600 py-3 cursor-pointer"
                                                >
                                                    {type}
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Active Filter Badges (Quick Removal) */}
                        {selectedTypes.length < MEAL_TYPES.length && (
                            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Active:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedTypes.map(t => (
                                        <Badge key={t} variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-black border-none py-0.5 px-2 hover:bg-emerald-200 transition-colors cursor-pointer" onClick={() => setSelectedTypes(prev => prev.filter(x => x !== t))}>
                                            {t} ×
                                        </Badge>
                                    ))}
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
        </PageContainer>
    );
}
