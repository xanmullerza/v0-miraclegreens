'use client';

import { Suspense, useState } from 'react';
import { Loader2, ArrowLeft, Calendar, ShoppingBasket, Shapes, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { useRouter } from 'next/navigation';
import MealPlannerContent from '@/components/tracker/planner-content';
import { useActionPanel } from '@/lib/context/action-panel-context';


function PlannerPageContent() {
    const router = useRouter();
    const { navigateTo } = useActionPanel();
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey] = useState(0);

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    // Themed Tracker button (previously a dropdown)
    const trackerButton = (
        <div className="h-10 px-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <Calendar size={14} className="animate-pulse" />
            <span className="hidden sm:inline">Tracker</span>
        </div>
    );

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
                <div className="py-6 animate-in fade-in duration-300">
                    <MealPlannerContent
                        onSubViewChange={(view) => navigateTo(view as any)}
                        dropdownContent={trackerButton}
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
