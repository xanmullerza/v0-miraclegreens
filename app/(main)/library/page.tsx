'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { FoodsView } from '@/components/foods/food-library-view';
import { useSearch } from '@/lib/context/search-context';

export default function IngredientsPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();

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

    // Clear search on leave
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    return (
        <div className="animate-in fade-in duration-500">
            <TabHeader
                tabs={tabs}
                activeTab="foods"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-7xl">
                <div className="py-6">
                    <FoodsView searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                </div>
            </PageContainer>
        </div>
    );
}
