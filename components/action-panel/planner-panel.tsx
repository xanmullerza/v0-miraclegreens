'use client';

import React from 'react';
import MealPlannerContent from '@/components/tracker/planner-content';

interface PlannerPanelProps {
    onBack?: () => void;
    onRecipeClick?: (recipeId: string) => void;
}

export function PlannerPanel({ onBack, onRecipeClick }: PlannerPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full h-full">
            <MealPlannerContent onRecipeClick={onRecipeClick} />
        </div>
    );
}

