'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

const noop = () => {};
const EMPTY: never[] = [];

export default function RecipesPage() {
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
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
                    placeholder="SEARCH RECIPES..."
                    idleTitle="Recipes"
                />

                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <Suspense fallback={
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipes...</p>
                        </div>
                    }>
                        <RecipesView />
                    </Suspense>
                </div>
            </div>
        </PageContainer>
    );
}
