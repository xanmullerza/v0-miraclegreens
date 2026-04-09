'use client';

import React from 'react';
import MealPlannerContent from '@/components/tracker/planner-content';

interface PlannerPanelProps {
    onBack?: () => void;
    onRecipeClick?: (recipeId: string) => void;
}

export function PlannerPanel({ onBack, onRecipeClick }: PlannerPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative w-full h-full pb-32">
            <MealPlannerContent onRecipeClick={onRecipeClick} />
        </div>
    );
}

