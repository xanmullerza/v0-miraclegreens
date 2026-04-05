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
        return 'Planner';
    };


    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { 
            id: 'planner', 
            label: getTrackerLabel(),
            dropdownOptions: [
                { id: 'p1', label: 'Planner', onClick: () => setSubView('planner'), icon: <Calendar size={12} className="text-blue-500" /> },
                { id: 'p2', label: 'Shopping', onClick: () => setSubView('shopping'), icon: <ShoppingBasket size={12} className="text-amber-500" /> },
                { id: 'p3', label: 'Pantry', onClick: () => setSubView('pantry'), icon: <Shapes size={12} className="text-sky-500" /> },
            ]
        },
    ];



    // Themed Tracker dropdown matching Cookbook/Library style
    const trackerDropdown = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "h-10 px-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] shadow-lg ring-1 ring-white/10",
                        subView === 'planner' ? "bg-blue-600 text-white shadow-blue-500/20" :
                        subView === 'shopping' ? "bg-amber-600 text-white shadow-amber-500/20" :
                        "bg-emerald-600 text-white shadow-emerald-500/20"
                    )}
                >
                    {subView === 'planner' ? <Calendar size={14} className="animate-pulse" /> :
                     subView === 'shopping' ? <ShoppingBasket size={14} className="animate-pulse" /> :
                     <Shapes size={14} className="animate-pulse" />}
                    <span className="hidden sm:inline">{getTrackerLabel()}</span>
                    <ChevronDown size={10} />
                </button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 p-2 rounded-2xl shadow-2xl">
                <DropdownMenuItem 
                    className={cn(
                        "gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl mb-1",
                        subView === 'planner' ? "bg-blue-600/20 text-blue-400" : "text-slate-300 focus:bg-slate-800"
                    )}
                    onClick={() => setSubView('planner')}
                >
                    <Calendar size={14} className="text-blue-500" />
                    Planner
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className={cn(
                        "gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl mb-1",
                        subView === 'shopping' ? "bg-amber-600/20 text-amber-400" : "text-slate-300 focus:bg-slate-800"
                    )}
                    onClick={() => setSubView('shopping')}
                >
                    <ShoppingBasket size={14} className="text-amber-500" />
                    Shopping
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className={cn(
                        "gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl",
                        subView === 'pantry' ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 focus:bg-slate-800"
                    )}
                    onClick={() => setSubView('pantry')}
                >
                    <Shapes size={14} className="text-emerald-500" />
                    Pantry
                </DropdownMenuItem>
            </DropdownMenuContent>

        </DropdownMenu>
    );

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'foods') router.push('/library');
        else if (id === 'planner') {
            // Already handled by Dropdown in TabHeader if they are already on planner
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
                    {subView === 'planner' && (
                        <MealPlannerContent
                            onSubViewChange={(view) => setSubView(view)}
                            dropdownContent={trackerDropdown}
                        />
                    )}
                    {subView === 'shopping' && (
                        <ShoppingListView
                            scannerOpen={scannerOpen}
                            onScannerOpenChange={setScannerOpen}
                            dropdownContent={trackerDropdown}
                        />
                    )}
                    {subView === 'pantry' && (
                        <PantryView
                            refreshKey={refreshKey}
                            dropdownContent={trackerDropdown}
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
