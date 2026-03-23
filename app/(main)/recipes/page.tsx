'use client';

import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { useSearch } from '@/lib/context/search-context';

export default function RecipesPage() {
    const { searchQuery, setSearchQuery } = useSearch();

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <Suspense fallback={
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipes...</p>
                        </div>
                    }>
                        <RecipesView searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                    </Suspense>
                </div>
            </div>
        </PageContainer>
    );
}
