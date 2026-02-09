'use client';

// This component re-exports the meal planner content for use in the Kitchen tabs.
// The actual meal planner logic is maintained in app/dashboard/mealplanner/page.tsx
// to avoid code duplication.

import { MealPlannerContent } from '@/app/dashboard/mealplanner/page';

interface MealPlannerViewProps {
    showFavoritesOnly?: boolean;
    setShowFavoritesOnly?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedTypes?: string[];
    setSelectedTypes?: React.Dispatch<React.SetStateAction<string[]>>;
    hideControls?: boolean;
    isFilterOpen?: boolean;
    setIsFilterOpen?: React.Dispatch<React.SetStateAction<boolean>>;
    showShoppingList?: boolean;
    setShowShoppingList?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MealPlannerView(props: MealPlannerViewProps) {
    return <MealPlannerContent {...props} />;
}
