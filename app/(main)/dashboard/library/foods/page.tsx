'use client';

import { useState, useEffect } from 'react';
import { Leaf, Calendar, LayoutGrid } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

const noop = () => {};
const EMPTY: never[] = [];

export default function IngredientsPage() {
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Clear the shared search query when leaving this page so other pages
    // (pantry, groceries) are not filtered by a food-page search term.
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
                    sideNav={{
                        left: { icon: <Calendar size={16} />, label: 'Meals', href: '/dashboard/meal-o-matic/planner' },
                        right: { icon: <LayoutGrid size={16} />, label: 'Widgets', href: '/dashboard/widgets/nutridex' },
                    }}
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleIcon={<Leaf size={20} className="text-emerald-500" />}
                    idleTitle="Food Library"
                    idleSubtitle="Browse and search our foods library"
                />

                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <ExploreView />
                </div>
            </div>
        </PageContainer>
    );
}
