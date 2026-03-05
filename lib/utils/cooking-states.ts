
/**
 * Cooking State Transformations
 * Logic for scaling nutrients and adjusting measures based on the state of the ingredient.
 */

export type CookingState = 'raw' | 'boiled' | 'steamed' | 'fried' | 'roasted' | 'ground' | 'dried' | 'whole' | 'stored';

export interface StateFactor {
    label: string;
    description: string;
    energy: number;      // Scaling for calories/kj
    protein: number;
    fat: number;
    carbs: number;
    micros: number;      // General scaling for micronutrients
    weightRatio?: number; // approx change in weight due to water loss/gain (1.5 = gains water, 0.5 = loses water)
}

export const COOKING_STATES: Record<CookingState, StateFactor> = {
    'raw': {
        label: 'Raw/Fresh',
        description: 'Unprocessed, fresh state.',
        energy: 1, protein: 1, fat: 1, carbs: 1, micros: 1, weightRatio: 1
    },
    'whole': {
        label: 'Whole/Intact',
        description: 'Intact (seeds, pods, whole vegetables).',
        energy: 1, protein: 1, fat: 1, carbs: 1, micros: 1, weightRatio: 1
    },
    'boiled': {
        label: 'Boiled',
        description: 'Boiled in water. Some nutrients leach into liquid.',
        energy: 0.9, protein: 0.95, fat: 0.8, carbs: 0.9, micros: 0.6, weightRatio: 1.25 // Gains water, significant leaching
    },
    'steamed': {
        label: 'Steamed',
        description: 'Cooked with steam. Retains most nutrients.',
        energy: 0.98, protein: 1.0, fat: 0.98, carbs: 1.0, micros: 0.9, weightRatio: 1.1
    },
    'fried': {
        label: 'Fried',
        description: 'Pan-fried or deep-fried. Increases fat content.',
        energy: 1.4, protein: 1.0, fat: 2.5, carbs: 1.0, micros: 0.8, weightRatio: 0.85 // Loses water, adds fat
    },
    'roasted': {
        label: 'Roasted',
        description: 'Oven-roasted or air-fried. Nutrient concentration due to water loss.',
        energy: 1.1, protein: 1.1, fat: 1.1, carbs: 1.1, micros: 0.95, weightRatio: 0.7
    },
    'ground': {
        label: 'Ground/Powder',
        description: 'Ground into powder or meal.',
        energy: 1, protein: 1, fat: 1, carbs: 1, micros: 1, weightRatio: 1
    },
    'dried': {
        label: 'Dried/Dehydrated',
        description: 'Heavily concentrated via dehydration.',
        energy: 4.5, protein: 4.5, fat: 4.5, carbs: 4.5, micros: 4.0, weightRatio: 0.22
    },
    'stored': {
        label: 'Default/Stored',
        description: 'No adjustment. Uses nutrient profile exactly as stored in database.',
        energy: 1, protein: 1, fat: 1, carbs: 1, micros: 1, weightRatio: 1
    }
};
