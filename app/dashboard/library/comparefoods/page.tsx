'use client';

import { Scale } from 'lucide-react';
import { CompareView } from '../foods/views/compare-view';

export default function CompareFoodsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32 pt-8">
            {/* Header Removed */}

            {/* Content */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                <CompareView />
            </div>
        </div>
    );
}

