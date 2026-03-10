'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { MyRecipesView } from '@/components/ingredients/my-recipes-view';

const noop = () => {};
const EMPTY: never[] = [];

export default function MyRecipesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useDataPersistence();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            // Redirect to login if not authenticated
            router.push('/auth/login?redirect=/dashboard/library/my-recipes');
        } else if (!authLoading && user) {
            setIsAuthenticated(true);
        }
    }, [user, authLoading, router]);

    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    if (!isAuthenticated) {
        return (
            <PageContainer maxWidth="max-w-7xl">
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                        Checking Authentication...
                    </p>
                </div>
            </PageContainer>
        );
    }

    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    Loading Your Recipes...
                </p>
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
                        placeholder="SEARCH YOUR RECIPES..."
                        idleTitle="My Recipes"
                    />

                    <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                        <MyRecipesView />
                    </div>
                </div>
            </PageContainer>
        </Suspense>
    );
}
