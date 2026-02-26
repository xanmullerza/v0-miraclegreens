'use client';

// This component re-exports the meal planner content for use in the Recipes tabs.
// The actual meal planner logic is maintained in app/dashboard/recipes/meal-o-matic/page.tsx
// to avoid code duplication.

import { MealPlannerContent } from '@/app/(main)/dashboard/recipes/meal-o-matic/page';

interface MealPlannerViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MealPlannerView(props: MealPlannerViewProps) {
    return <MealPlannerContent {...props} />;
}
