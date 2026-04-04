export type DietType = 'anything' | 'vegan' | 'vegetarian' | 'pescatarian';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
    item: string;
    amount: string;
    isMiracleProduct?: boolean;
    baseIngredient?: string; // What you buy (e.g., "Egg" for "Egg, Scrambled")
    food_item_id?: string;
    weightG?: number; // Structured weight in grams (base amount before scaling)
    measureLabel?: string; // e.g., "cup", "slice"
    modifier?: string; // e.g. "chopped", "shredded"
    foodName?: string | null; // Authoritative name from food_items table (common_name or name)
}

export interface Recipe {
    id: string;
    title: string;
    type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    energy_kj?: number;
    diet: DietType[];
    image: string;
    prepTime: number; // in minutes
    cookTime?: number; // in minutes
    difficulty?: string; // e.g., "Easy", "Medium", "Hard"
    tags?: string[]; // e.g., ["Freezable", "Vegetarian"]
    ingredients: Ingredient[];
    instructions: string[];
    servings?: number;
    originalServings?: number;
    micronutrients?: Record<string, number>;
    phytonutrients?: Record<string, string>;
    calculated_nutrition?: import('@/lib/utils/nutrition-calculator').CalculatedNutrition;
}
