'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Loader2,
    Sparkles,

    Search,
    X,
    LayoutGrid,
    Heart,
    Filter,
    ChevronDown,
    Check,
    CheckSquare,
    Square
} from 'lucide-react';
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
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 pt-8">

            {/* Header Actions (Teleported to Subheader) */}
            {['browse', 'mealplanner'].includes(activeTab) && (
                <HeaderActions>
                    <div className="flex items-center gap-2">
                        {/* Scope/Favorites Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-300 shrink-0 shadow-sm group outline-none",
                                    showFavoritesOnly
                                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-200 hover:text-rose-500"
                                )}>
                                    <Heart size={12} className={cn("transition-transform group-hover:scale-110", showFavoritesOnly && "fill-current")} />
                                    <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">
                                        {showFavoritesOnly ? "Favorites" : "All Results"}
                                    </span>
                                    <ChevronDown size={10} className="opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Filter Scope</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />
                                <DropdownMenuCheckboxItem
                                    checked={!showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(false)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-slate-50 py-2.5 cursor-pointer"
                                >
                                    Show All Recipes
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={showFavoritesOnly}
                                    onCheckedChange={(checked) => checked && setShowFavoritesOnly(true)}
                                    className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-rose-50 dark:focus:bg-rose-900/10 focus:text-rose-600 py-2.5 cursor-pointer"
                                >
                                    Favorites Only
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Meal Type Dropdown Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className={cn(
                                    "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 shrink-0 border shadow-sm outline-none",
                                    selectedTypes.length < MEAL_TYPES.length
                                        ? "bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-yellow-200 hover:text-yellow-600"
                                )}>
                                    <Filter size={12} />
                                    <span className="hidden sm:inline">
                                        {selectedTypes.length === 0 ? "No Types" :
                                            selectedTypes.length === MEAL_TYPES.length ? "Meal Types" :
                                                `${selectedTypes.length} Types`}
                                    </span>
                                    <ChevronDown size={10} className={cn("opacity-50")} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
                                <div className="flex items-center justify-between pr-2">
                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Select Types</DropdownMenuLabel>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedTypes(MEAL_TYPES);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-yellow-500 transition-colors"
                                            title="Select All"
                                        >
                                            <CheckSquare size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedTypes([]);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                                            title="Select None"
                                        >
                                            <Square size={14} />
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
                                                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-yellow-50 dark:focus:bg-yellow-900/10 focus:text-yellow-600 py-2.5 cursor-pointer"
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </HeaderActions>
            )}

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
