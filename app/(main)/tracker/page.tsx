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

    // Themed Tracker button with restored dropdown for Shopping/Pantry
    const trackerDropdown = (
        <DropdownMenu>
            <div className="flex items-center gap-1.5">
                {/* Main Action Button */}
                <DropdownMenuTrigger asChild>
                    <button
                        className="h-11 px-5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] shadow-lg ring-1 ring-white/10 bg-blue-600 text-white shadow-blue-500/20"
                    >
                        <Calendar size={14} className="animate-pulse" />
                        <span>Tracker</span>
                    </button>
                </DropdownMenuTrigger>

                {/* Standalone Chevron Button */}
                <DropdownMenuTrigger asChild>
                    <button
                        className="h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-lg ring-1 ring-white/10 bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white"
                    >
                        <ChevronDown size={14} />
                    </button>
                </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 p-2 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl mb-1 bg-blue-600/20 text-blue-400"
                    onClick={() => {}}
                >
                    <Calendar size={14} className="text-blue-500" />
                    Planner
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl mb-1 text-slate-300 focus:bg-slate-800"
                    onClick={() => navigateTo('shopping')}
                >
                    <ShoppingBasket size={14} className="text-amber-500" />
                    Shopping
                </DropdownMenuItem>
                <DropdownMenuItem 
                    className="gap-3 py-2.5 cursor-pointer font-black tracking-widest uppercase text-[10px] rounded-xl text-slate-300 focus:bg-slate-800"
                    onClick={() => navigateTo('pantry')}
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
                        dropdownContent={trackerDropdown}
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
