'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import MealPlannerContent from '@/components/planner-content';
import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PantryView } from '@/components/kitchen/pantry-view';
import { FoodsView } from '@/components/ingredients/foods-view';
import { NutridexView } from '@/components/nutridex-view';
import { cn } from '@/lib/utils';

type TabId = 'shopping' | 'pantry' | 'planner' | 'foods' | 'nutrients';

export default function TrackerPage() {
    const [activeTab, setActiveTab] = useState<TabId>('shopping');
    const [scannerOpen, setScannerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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
            <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-50 dark:from-slate-950 to-transparent py-4 px-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 max-w-xl mx-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 py-2 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
                                activeTab === tab.id
                                    ? `bg-white dark:bg-slate-800 ${tab.activeColor} shadow-sm`
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                            <FoodsView />
                        </div>
                    )}
                    {activeTab === 'nutrients' && (
                        <div className="animate-in fade-in duration-300">
                            <NutridexView compact={false} />
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}
