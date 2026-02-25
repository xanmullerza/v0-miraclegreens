'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/library/recipes-view';
import { HeroSearch } from '@/components/ui/hero-search';

export default function MealsPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Meals...</p>
            </div>
        }>
            <MealsContent />
        </Suspense>
    );
}

function MealsContent() {
    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                {/* Search Hero */}
                <HeroSearch
                    searchQuery=""
                    onQueryChange={() => {}}
                    results={[]}
                    isLoading={false}
                    isActive={false}
                    setIsActive={() => {}}
                    onSelect={() => {}}
                    theme="amber"
                    placeholder="SEARCH MEALS..."
                    idleTitle="Ready to Discover?"
                    idleSubtitle="Search for nutritious meal ideas"
                    noResultsMessage="No matching meals found"
                    enterMessage="Enter meal name to search"
                    searchingMessage="Searching Meals..."
                />

                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <RecipesView hideControls={true} />
                </div>
            </div>
        </PageContainer>
    );
}
