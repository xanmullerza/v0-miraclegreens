'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/library/recipes-view';

export default function MixesPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Mixes...</p>
            </div>
        }>
            <MixesContent />
        </Suspense>
    );
}

function MixesContent() {
    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-10 animate-in fade-in duration-700 pb-32 pt-8">
                {/* Dynamic Content Area */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <RecipesView hideControls={false} isMix={true} />
                </div>
            </div>
        </PageContainer>
    );
}
