'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { RecipesView } from '@/components/ingredients/recipes-view';

export default function MixesPage() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Mixes...</p>
            </div>
        }>
            <PageContainer maxWidth="max-w-7xl">
                <div className="animate-in fade-in duration-500">
                    <RecipesView isMix={true} />
                </div>
            </PageContainer>
        </Suspense>
    );
}
