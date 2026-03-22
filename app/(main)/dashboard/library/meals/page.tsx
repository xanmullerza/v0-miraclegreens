'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChefHat, Leaf, Beaker, Calendar, LayoutGrid } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';
import { cn } from '@/lib/utils';

const noop = () => {};
const EMPTY: never[] = [];

export default function MealsPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [cookbookTab, setCookbookTab] = useState<'recipes' | 'remixes' | 'mixes'>('recipes');

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
                        idleTitle="Recipes"
                    />

                    <div className="flex bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl p-1.5 max-w-lg mx-auto mb-12 border border-slate-200 dark:border-slate-800 shadow-lg">
                        <button 
                            onClick={() => setCookbookTab('recipes')} 
                            className={cn(
                                "flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300", 
                                cookbookTab === 'recipes' 
                                    ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <ChefHat size={14} className={cookbookTab === 'recipes' ? "opacity-100" : "opacity-40"} />
                                <span>Recipes</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setCookbookTab('remixes')} 
                            className={cn(
                                "flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300", 
                                cookbookTab === 'remixes' 
                                    ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Leaf size={14} className={cookbookTab === 'remixes' ? "opacity-100" : "opacity-40"} />
                                <span>Remixes</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setCookbookTab('mixes')} 
                            className={cn(
                                "flex-1 py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300", 
                                cookbookTab === 'mixes' 
                                    ? "bg-white dark:bg-slate-800 text-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Beaker size={14} className={cookbookTab === 'mixes' ? "opacity-100" : "opacity-40"} />
                                <span>Mixes</span>
                            </div>
                        </button>
                    </div>
 
                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        <RecipesView 
                            key={cookbookTab}
                            isMix={cookbookTab === 'mixes'}
                            isRemix={cookbookTab === 'remixes'}
                        />
                    </div>
                </div>
            </PageContainer>
        </Suspense>
    );
}
