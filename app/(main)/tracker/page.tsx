'use client';

import { Suspense, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { useRouter } from 'next/navigation';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';

type TrackerSubView = 'planner' | 'shopping' | 'pantry';

function PlannerPageContent() {
    const router = useRouter();
    const [subView, setSubView] = useState<TrackerSubView>('planner');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey] = useState(0);

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

    // "Back to Tracker" button passed into Shopping/Pantry views as their dropdown slot
    const backButton = (
        <button
            onClick={() => setSubView('planner')}
            className="h-10 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
        >
            <ArrowLeft size={12} />
            Tracker
        </button>
    );

    return (
        <>
            <TabHeader
                tabs={tabs}
                activeTab="planner"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-7xl">
                <div className="py-6 animate-in fade-in duration-300">
                    {subView === 'planner' && (
                        <MealPlannerContent
                            onSubViewChange={(view) => setSubView(view)}
                        />
                    )}
                    {subView === 'shopping' && (
                        <ShoppingListView
                            scannerOpen={scannerOpen}
                            onScannerOpenChange={setScannerOpen}
                            dropdownContent={backButton}
                        />
                    )}
                    {subView === 'pantry' && (
                        <PantryView
                            refreshKey={refreshKey}
                            dropdownContent={backButton}
                        />
                    )}
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
