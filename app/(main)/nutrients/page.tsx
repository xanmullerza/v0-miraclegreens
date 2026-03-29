'use client';

import { NutridexView } from '@/components/tracker/nutridex-view';

export default function NutrientsPage() {
    return (
        <div className="flex flex-col w-full min-h-screen">
            <div className="max-w-7xl mx-auto w-full px-4 pt-8 flex-1">
                <NutridexView compact={false} />
            </div>
        </div>
    );
}

