'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ExploreView } from './views/explore-view';
import { ShoppingView } from './views/shopping-view';
import { StaplesView } from '@/components/library/staples-view';
import { CompareView } from './views/compare-view';
import { NutrientsView } from './views/nutrients-view';
import { PageContainer } from '@/components/ui/page-container';

export default function IngredientsHub() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Ingredients Hub...</p>
            </div>
        }>
            <IngredientsContent />
        </Suspense>
    );
}

type FoodTab = 'foods' | 'groceries' | 'pantry' | 'compare' | 'nutrients';

function IngredientsContent() {

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<FoodTab>('foods');


    return (
        <PageContainer maxWidth="max-w-7xl" className="-mt-12 md:-mt-16">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-0">
                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'foods' && <ExploreView hideControls={false} />}
                    {activeTab === 'groceries' && <ShoppingView />}
                    {activeTab === 'pantry' && <StaplesView />}
                    {activeTab === 'compare' && <CompareView />}
                    {activeTab === 'nutrients' && <NutrientsView />}
                </div>
            </div>
        </PageContainer>
    );
}
