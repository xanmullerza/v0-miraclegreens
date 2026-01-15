export type DietType = 'anything' | 'vegan' | 'vegetarian';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Ingredient {
    item: string;
    amount: string;
    isMiracleProduct?: boolean;
}

export interface Recipe {
    id: string;
    title: string;
    type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    diet: DietType[];
    image: string;
    prepTime: number; // in minutes
    ingredients: Ingredient[];
    instructions: string[];
}
