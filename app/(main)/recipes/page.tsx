'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { useSearch } from '@/lib/context/search-context';
import { useSearchParams } from 'next/navigation';

function RecipesPageContent() {
    const { searchQuery, setSearchQuery } = useSearch();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    const isRemix = tab === 'remixes';
    const isMix = tab === 'mixes';

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <RecipesView 
                        searchQuery={searchQuery} 
                        onSearchChange={setSearchQuery}
                        isMix={isMix}
                        isRemix={isRemix}
                    />
                </div>
            </div>
        </PageContainer>
    );
}

export default function RecipesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipes...</p>
            </div>
        }>
            <RecipesPageContent />
        </Suspense>
    );
}
