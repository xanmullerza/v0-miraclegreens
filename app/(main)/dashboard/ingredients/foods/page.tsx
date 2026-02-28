'use client';

import { useState, useMemo } from 'react';
import { Leaf, Plus } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

export default function IngredientsPage() {
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [showAddFood, setShowAddFood] = useState(false);

    const addButton = useMemo(() => (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowAddFood(true); }}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-500/10 shrink-0 relative z-10"
        >
            <Plus size={16} className="text-slate-900 dark:text-white" />
        </button>
    ), []);

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={setSearchQuery}
                    results={[]}
                    isLoading={false}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={() => {}}
                    hideResults
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleIcon={<Leaf size={20} className="text-emerald-500" />}
                    idleTitle="Food Library"
                    idleSubtitle="Explore whole food profiles with full nutrition data"
                    powerButton={addButton}
                />

                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <ExploreView showAddFood={showAddFood} setShowAddFood={setShowAddFood} />
                </div>
            </div>
        </PageContainer>
    );
}
