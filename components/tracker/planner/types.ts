import { Recipe, DietType } from '@/lib/data/recipes';
import { DailyPlan } from '@/lib/utils/meal-generator';

export type { Recipe, DietType, DailyPlan };

export type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type UnitType = 'kcal' | 'kJ';

export interface NutrientBreakdownDef {
    label: string;
    keys: string[];
    unit: string;
    isEssential?: boolean;
    hiddenByDefault?: boolean;
    isExpandable?: boolean;
}

export interface PlannerState {
    step: 1 | 2 | 3;
    generating: boolean;
    pageMode: 'planner' | 'maker';
    makerMode: 'menu' | 'food' | 'meal' | 'mix';
    calories: number;
    diet: DietType;
    goal: GoalType;
    activityLevel: ActivityLevel;
    gender: 'male' | 'female';
    age: number | '';
    weight: number | '';
    height: number | '';
    eatenMeals: Set<string>;
    plan: DailyPlan | null;
}

export interface RecipeCardProps {
    recipe: Recipe;
    mealLabel: string;
    unit?: UnitType;
    onRegenerate?: () => void;
}

export interface RecipeListItemProps extends RecipeCardProps {
    onMarkEaten?: () => void;
    isEaten?: boolean;
    pantryItems?: any[];
    onRecipeClick?: (recipeId: string) => void;
    showFlavours?: boolean;
    showSupplements?: boolean;
}
