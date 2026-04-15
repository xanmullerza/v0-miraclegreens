import { FoodMeasure } from '@/lib/utils/nutrition-calculator';
import { CookingState } from '@/lib/utils/cooking-states';
import { FoodItemMatch } from '@/lib/services/nutrition';

export interface FoodItemData {
    id?: string;
    name: string;
    common_name?: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    energy_kj?: number;
    micronutrients?: Record<string, number>;
    portions?: FoodMeasure[];
    image?: string;
    source?: string;
    fdcId?: number;
}

export interface RecipeIngredient {
    food_item_id: string;
    food_item_name: string;
    weight_g: number;
    quantity: number;
    measure_label: string;
    modifier?: string;
    image?: string;
    source?: string;
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients: Record<string, number>;
    base_nutrition?: {
        calories: number;
        energy_kj: number;
        protein: number;
        fat: number;
        carbs: number;
        micronutrients: Record<string, number>;
    };
    available_measures?: FoodMeasure[];
    parsedGrams?: number;
    customUnitWeight?: number;
    cooking_state?: CookingState;
}

export interface PendingIngredient {
    raw: {
        amount: number;
        item: string;
        unit?: string;
        modifier?: string;
        weightG?: number;
    };
    status: 'searching' | 'matched' | 'no-match-local' | 'no-match-global' | 'searching-usda';
    matches: FoodItemMatch[];
    selectedMatch: FoodItemMatch | null;
}

export interface IngredientBuilderHandle {
    handleAddIngredient: (foodItem: FoodItemData | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }) => Promise<void>;
}

export interface IngredientBuilderProps {
    ingredients: RecipeIngredient[];
    onChange: (ingredients: RecipeIngredient[]) => void;
    initialShowPicker?: boolean;
    initialShowMagicPaste?: boolean;
    onNext?: () => void;
    showPicker?: boolean;
    onShowPickerChange?: (show: boolean) => void;
}
