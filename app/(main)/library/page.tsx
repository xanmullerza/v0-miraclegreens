'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { FoodsView } from '@/components/foods/food-library-view';
import { useSearch } from '@/lib/context/search-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { cn } from '@/lib/utils';



function LibraryContent() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const { setIsActionPanelOpen, setActiveView } = useActionPanel();

    // Clear search on unmount
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'planner') router.push('/tracker');
        else router.push('/library');
    };



    return (
        <div className="animate-in fade-in duration-500">
            <TabHeader
                tabs={tabs}
                activeTab="foods"
                onTabChange={handleTabChange}
            />
            <PageContainer maxWidth="max-w-7xl">
                <div className="py-2 sm:py-6 animate-in slide-in-from-bottom-4 duration-700">
                    <FoodsView
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </div>
            </PageContainer>
        </div>
    );
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-cyan-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Library...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}
