'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { useRouter } from 'next/navigation';
import MealPlannerContent from '@/components/tracker/planner-content';

function PlannerPageContent() {
    const router = useRouter();

    const tabs = [
        { id: 'recipes', label: 'Recipes' },
        { id: 'foods', label: 'Foods' },
        { id: 'planner', label: 'Planner' },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/recipes');
        else if (id === 'planner') router.push('/planner');
        else router.push(`/recipes?tab=${id}`);
    };

    return (
        <>
            <TabHeader
                tabs={tabs}
                activeTab="planner"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-7xl">
                <div className="py-6">
                    <MealPlannerContent />
                </div>
            </PageContainer>
        </>
    );
}

export default function RecipesPlannerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Planner...</p>
            </div>
        }>
            <PlannerPageContent />
        </Suspense>
    );
}
