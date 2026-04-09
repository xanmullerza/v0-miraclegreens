'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ChevronLeft } from 'lucide-react';
import { TabHeader } from '@/components/ui/tab-header';
import { PageContainer } from '@/components/ui/page-container';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { NutrientDetailContent } from '@/components/nutrients/nutrient-detail-content';
import { findNutrientById } from '@/lib/utils/nutrient-utils';
import { useActionPanel } from '@/lib/context/action-panel-context';

export default function NutrientDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const { setCustomSegmentLabel } = useHeaderActions();
    const { excludeFlavour, excludeSupplements } = useActionPanel();

    const nutrient = findNutrientById(decodeURIComponent(String(id)));

    // Push nutrient label into breadcrumb
    useEffect(() => {
        if (nutrient?.label) setCustomSegmentLabel(nutrient.label);
        return () => setCustomSegmentLabel(null);
    }, [nutrient?.label, setCustomSegmentLabel]);

    const handleTabChange = (tabId: string) => {
        if (tabId === 'recipes') router.push('/');
        else if (tabId === 'planner') router.push('/?tab=planner');
        else router.push(`/?tab=${tabId}`);
    };

    if (!nutrient) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nutrient not found</p>
                <button onClick={() => router.push('/')} className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Return Home</button>
            </div>
        );
    }

    return (
        <>
            <TabHeader
                tabs={[
                    { id: 'recipes', label: 'Cookbook' },
                    { id: 'foods', label: 'Library' },
                    { id: 'planner', label: 'Tracker' },
                ]}
                activeTab="foods"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-6xl">
                <div className="space-y-6 pb-20 animate-in fade-in duration-700">
                    <div className="bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Header with back button */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                <ChevronLeft size={14} /> Back
                            </button>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50">Nutrient Intelligence</div>
                        </div>

                        <div className="p-6 md:p-10">
                            <NutrientDetailContent 
                                nutrient={nutrient} 
                                excludeFlavour={excludeFlavour}
                                excludeSupplements={excludeSupplements}
                            />
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}
