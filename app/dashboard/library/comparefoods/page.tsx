'use client';

import { Scale } from 'lucide-react';
import { CompareView } from '../foods/views/compare-view';
import { PageContainer } from '@/components/ui/page-container';

export default function CompareFoodsPage() {
    return (
        <PageContainer maxWidth="max-w-7xl" className="-mt-12 md:-mt-16">
            <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 pt-0">
                {/* Header Removed */}

                {/* Content */}
                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    <CompareView />
                </div>
            </div>
        </PageContainer>
    );
}

