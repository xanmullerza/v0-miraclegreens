'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import MealPlannerContent from '@/components/tracker/planner-content';
import { ShoppingListView } from '@/components/tracker/shopping-list-view';
import { PantryView } from '@/components/tracker/pantry-view';
import { FoodsView } from '@/components/foods/food-library-view';
import { NutrientsView } from '@/components/nutrients/nutrients-view';
import { cn } from '@/lib/utils';

type TabId = 'shopping' | 'pantry' | 'planner' | 'foods' | 'nutrients';

export default function TrackerPage() {
    const [activeTab, setActiveTab] = useState<TabId>('shopping');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'cart'>('list');

    const tabs: { id: TabId; label: string; activeColor: string }[] = [
        { id: 'shopping', label: 'Shopping', activeColor: 'text-emerald-500' },
        { id: 'pantry', label: 'Pantry', activeColor: 'text-amber-500' },
        { id: 'planner', label: 'Planner', activeColor: 'text-blue-500' },
        { id: 'foods', label: 'Foods', activeColor: 'text-cyan-500' },
        { id: 'nutrients', label: 'Nutrients', activeColor: 'text-violet-500' },
    ];

    return (
        <>
            {/* Tab Bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4 border-b border-border/50">
                <div className="flex items-center justify-between max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4",
                                activeTab === tab.id
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <PageContainer maxWidth="max-w-7xl">
                <div className="space-y-8 animate-in fade-in duration-500">
                    {activeTab === 'shopping' && (
                        <ShoppingListView
                            scannerOpen={scannerOpen}
                            onScannerOpenChange={setScannerOpen}
                        />
                    )}
                    {activeTab === 'pantry' && (
                        <PantryView refreshKey={refreshKey} />
                    )}
                    {activeTab === 'planner' && (
                        <MealPlannerContent />
                    )}
                    {activeTab === 'foods' && (
                        <div className="animate-in fade-in duration-300">
                            <FoodsView 
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                            />
                        </div>
                    )}
                    {activeTab === 'nutrients' && (
                        <div className="animate-in fade-in duration-300">
                            <NutrientsView compact={false} />
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}

