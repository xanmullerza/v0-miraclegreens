export interface CookwareItem {
    name: string;
    quantity?: string;
}

export interface TimerItem {
    name?: string;
    duration: string;
    unit?: string;
}

export interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    difficulty?: string;
    tags?: string[];
    source_url: string;
    image_url?: string;
    image?: string;
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    meal_type?: string;
    metadata?: Record<string, string | number | string[]>;
    cookware?: CookwareItem[];
    timers?: TimerItem[];
}

export interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    cook_time: number;
    servings: number;
    image: string | null;
    is_favorite: boolean;
    diet: string[];
    tags: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    user_id?: string | null;
    is_curated?: boolean;
    is_mix?: boolean;
    is_remix?: boolean;
    source?: string;
    meal_type?: string;
}
