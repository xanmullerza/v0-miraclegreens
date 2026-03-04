'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChefHat, Leaf, Beaker, Calendar, LayoutGrid } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

const noop = () => {};
const EMPTY: never[] = [];

export default function MealsPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Meals...</p>
            </div>
        }>
            <PageContainer maxWidth="max-w-7xl">
                <div className="space-y-12 animate-in fade-in duration-500">
                    <HeroSearch
                        searchQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                        results={EMPTY}
                        isLoading={false}
                        isActive={isSearchActive}
                        setIsActive={setIsSearchActive}
                        onSelect={noop}
                        hideResults
                        theme="emerald"
                        placeholder="SEARCH MEALS LIBRARY..."
                        idleIconRaw
                        idleIcon={
                            <div className="flex items-center justify-center">
                                {/* Outer left big button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push('/dashboard/meal-o-matic/planner'); }}
                                    className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all active:scale-95 mr-6"
                                    title="Mealomatic"
                                >
                                    <Calendar size={26} />
                                </button>
                                {/* Center 3 nav buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/library/foods'); }}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all active:scale-95"
                                        title="Foods"
                                    >
                                        <Leaf size={16} />
                                    </button>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm relative">
                                        <ChefHat size={20} />
                                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/library/widgets'); }}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all active:scale-95"
                                        title="Widgets"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>
                                {/* Outer right big button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push('/dashboard/meal-o-matic/planner'); }}
                                    className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all active:scale-95 ml-6"
                                    title="Mealomatic"
                                >
                                    <Calendar size={26} />
                                </button>
                            </div>
                        }
                        idleTitle="Meals Library"
                        idleSubtitle="Browse and search our meals library"
                    />

                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        <RecipesView />
                    </div>
                </div>
            </PageContainer>
        </Suspense>
    );
}
