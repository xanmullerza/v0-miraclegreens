'use client';

import React, { useState } from 'react';
import { FoodsView } from './food-library-view';
import { FoodTabShell } from './food-tab-shell';
import { useActionPanel } from '@/lib/context/action-panel-context';

interface FoodsCombinedViewProps {
    onFoodClick?: (foodId: string) => void;
    fullHeight?: boolean;
}

export function FoodsCombinedView({ onFoodClick, fullHeight }: FoodsCombinedViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showAddFood, setShowAddFood] = useState(false);
    const { navigateTo } = useActionPanel();

    return (
        <FoodTabShell
            title="Library"
            fullHeight={fullHeight}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            showAddFood={showAddFood}
            setShowAddFood={setShowAddFood}
        >
            <FoodsView onFoodClick={onFoodClick} hideControls={true} noContainer={true} showAddFood={showAddFood} setShowAddFood={setShowAddFood} />
        </FoodTabShell>
    );
}
