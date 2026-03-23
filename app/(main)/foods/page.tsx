'use client';

import { useEffect } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { ExploreView } from './views/explore-view';
import { useSearch } from '@/lib/context/search-context';

export default function IngredientsPage() {
    const { searchQuery, setSearchQuery } = useSearch();

    // Clear the shared search query when leaving this page so other pages
    // (pantry, groceries) are not filtered by a food-page search term.
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <ExploreView searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                </div>
            </div>
        </PageContainer>
    );
}
