'use client';

import React from 'react';
import MealPlannerContent from '@/components/tracker/planner-content';

interface ChatbotPlannerProps {
    onBack?: () => void;
    onRecipeClick?: (recipeId: string) => void;
}

export function ChatbotPlanner({ onBack, onRecipeClick }: ChatbotPlannerProps) {
    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full h-full">
            <MealPlannerContent onRecipeClick={onRecipeClick} />
        </div>
    );
}

