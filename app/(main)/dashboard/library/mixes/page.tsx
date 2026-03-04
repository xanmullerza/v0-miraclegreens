'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2, Beaker, Calendar, LayoutGrid } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

const noop = () => {};
const EMPTY: never[] = [];

export default function MixesPage() {
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Mixes...</p>
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
                        sideNav={{
                            left: { icon: <Calendar size={16} />, label: 'Meals', href: '/dashboard/meal-o-matic/planner' },
                            right: { icon: <LayoutGrid size={16} />, label: 'Widgets', href: '/dashboard/widgets/nutridex' },
                        }}
                        theme="emerald"
                        placeholder="SEARCH MIXES LIBRARY..."
                        idleIcon={<Beaker size={20} className="text-emerald-500" />}
                        idleTitle="Mixes Library"
                        idleSubtitle="Browse and search our mixes library"
                    />

                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        <RecipesView isMix={true} />
                    </div>
                </div>
            </PageContainer>
        </Suspense>
    );
}
