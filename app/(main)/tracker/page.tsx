'use client';

import { Suspense, useState } from 'react';
import { Loader2, ArrowLeft, Sparkles, ShoppingBasket, Shapes } from 'lucide-react';

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
    const getTrackerLabel = () => {

        if (subView === 'shopping') return 'Shopping';
        if (subView === 'pantry') return 'Pantry';
        return 'Tracker';
    };

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { 
            id: 'planner', 
            label: getTrackerLabel(),
            dropdownOptions: [
                { id: 'p1', label: 'Planner', onClick: () => setSubView('planner'), icon: <Sparkles size={12} className="text-blue-500" /> },
                { id: 'p2', label: 'Shopping List', onClick: () => setSubView('shopping'), icon: <ShoppingBasket size={12} className="text-amber-500" /> },
                { id: 'p3', label: 'Pantry Inventory', onClick: () => setSubView('pantry'), icon: <Shapes size={12} className="text-sky-500" /> },
            ]
        },
    ];


    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'planner') {
            if (subView !== 'planner') setSubView('planner');
            else router.push('/tracker');
        }
        else router.push('/library');
    };


    // "Back to Tracker" button passed into Shopping/Pantry views as their dropdown slot
    const backButton = (
        <button
            onClick={() => setSubView('planner')}
            className="h-10 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] ring-1 ring-white/10"
        >
            <ArrowLeft size={12} />
            Planner
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
