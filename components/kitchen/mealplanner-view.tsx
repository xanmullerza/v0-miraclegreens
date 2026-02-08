'use client';

// This component re-exports the meal planner content for use in the Kitchen tabs.
// The actual meal planner logic is maintained in app/dashboard/mealplanner/page.tsx
// to avoid code duplication.

import { MealPlannerContent } from '@/app/dashboard/mealplanner/page';

export function MealPlannerView() {
    return <MealPlannerContent />;
}
