'use client';

import React from 'react';
import MealPlannerContent from '@/components/planner-content';

interface ChatbotPlannerProps {
    onBack?: () => void;
}

export function ChatbotPlanner({ onBack }: ChatbotPlannerProps) {
    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative w-full h-full">
            <MealPlannerContent />
        </div>
    );
}
