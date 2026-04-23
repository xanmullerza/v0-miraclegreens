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
    description?: string;
    author?: string;
    source?: string;
    servings?: number;
    time?: string;
    prep_time?: number;
    cook_time?: number;
    prepTime?: number;
    cookTime?: number;
    cuisine?: string;
    course?: string;
    yields?: string;
    difficulty?: string;
    tags?: string[];
    source_url: string;
    image_url?: string;
    image?: string;
    type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    meal_type?: string;
    metadata?: Record<string, any>;
    cookware?: CookwareItem[];
    timers?: TimerItem[];
    notes?: string | string[];
    // New fields for token-based display
    sections?: any[];
    ingredients?: any[];
    steps?: Array<{ text: string }>;
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
