'use client';

import React from 'react';
import { PantryView } from '@/components/kitchen/pantry-view';
import { ShoppingBasket } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';

export default function PantryPage() {
    return (
        <PageContainer maxWidth="max-w-5xl">
            <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
                    <ShoppingBasket size={12} className="fill-current" />
                    Kitchen Management
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic uppercase">
                    My <span className="text-amber-500">Pantry inventory.</span>
                </h1>
                <p className="text-sm text-slate-500 mt-2 max-w-xl">
                    Manage your household staples, track quantities, and sync with your shopping list.
                </p>
            </div>

            <PantryView />
            </div>
        </PageContainer>
    );
}

