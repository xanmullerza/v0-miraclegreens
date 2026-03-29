'use client';

import { Suspense } from 'react';
import { FoodItemCreatorContent } from '@/components/maker/food-item-creator';

export default function DashboardFoodPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>}>
                <FoodItemCreatorContent />
            </Suspense>
        </div>
    );
}
