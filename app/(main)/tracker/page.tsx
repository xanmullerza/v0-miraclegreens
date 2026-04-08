'use client';

import { Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';



import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { useRouter } from 'next/navigation';
import MealPlannerContent from '@/components/tracker/planner-content';
import { useActionPanel } from '@/lib/context/action-panel-context';


function PlannerPageContent() {
    const router = useRouter();
    const { navigateTo } = useActionPanel();

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'foods') router.push('/library');
        else if (id === 'planner') {
            router.push('/tracker');
        }
    };

    return (
        <>
            <TabHeader
                tabs={tabs}
                activeTab="planner"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-7xl">
                <div className="py-2 sm:py-6 animate-in fade-in duration-300">
                    <MealPlannerContent
                        onSubViewChange={(view) => navigateTo(view as any)}
                    />
                </div>
            </PageContainer>
        </>
    );
}

export default function RecipesPlannerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Tracker...</p>
            </div>
        }>
            <PlannerPageContent />
        </Suspense>
    );
}
