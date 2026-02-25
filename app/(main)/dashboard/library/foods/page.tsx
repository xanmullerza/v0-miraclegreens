'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { ShoppingView } from './views/shopping-view';
import { StaplesView } from '@/components/library/staples-view';
import { CompareView } from './views/compare-view';
import { NutrientsView } from './views/nutrients-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';

export default function IngredientsHub() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Ingredients Hub...</p>
            </div>
        }>
            <IngredientsContent />
        </Suspense>
    );
}

type FoodTab = 'foods' | 'groceries' | 'pantry' | 'compare' | 'nutrients';

function IngredientsContent() {

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<FoodTab>('foods');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                {/* Search Hero */}
                {activeTab === 'foods' && (
                    <HeroSearch
                        searchQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                        results={searchResults}
                        isLoading={isSearching}
                        isActive={isSearchActive}
                        setIsActive={setIsSearchActive}
                        onSelect={() => {}}
                        theme="emerald"
                        placeholder="SEARCH FOOD LIBRARY..."
                        idleTitle="Ready to Explore?"
                        idleSubtitle="Search for nutritious foods and ingredients"
                        noResultsMessage="No matching foods found"
                        enterMessage="Enter food name to search"
                        searchingMessage="Searching Library..."
                    />
                )}

                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'foods' && <ExploreView hideControls={false} />}
                    {activeTab === 'groceries' && <ShoppingView />}
                    {activeTab === 'pantry' && <StaplesView />}
                    {activeTab === 'compare' && <CompareView />}
                    {activeTab === 'nutrients' && <NutrientsView />}
                </div>
            </div>
        </PageContainer>
    );
}
