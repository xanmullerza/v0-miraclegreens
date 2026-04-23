// Cooklang Parser - Updated to use the miniapp parser with token-based rendering
// Integrates the advanced parser from cooklang-miniapp

import type { ParsedRecipe as MiniAppParsedRecipe, Ingredient, Cookware, Timer, StepToken } from '../cooklang-miniapp/lib/cooklang-parser';
import { parseCooklang as miniAppParseCooklang } from '../cooklang-miniapp/lib/cooklang-parser';

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
    // New fields for token-based display
    sections?: any[];
    ingredients?: Ingredient[];
}

// Convert miniapp ParsedRecipe to main app ParsedRecipe
function convertParsedRecipe(miniAppRecipe: MiniAppParsedRecipe): ParsedRecipe {
    const metadata = miniAppRecipe.metadata;

    // Extract title
    const title = metadata.title || 'Untitled Recipe';

    // Convert ingredients to text
    const ingredients_text = miniAppRecipe.ingredients
        .map(ing => {
            let text = ing.name;
            if (ing.quantity) {
                text += ` (${ing.quantity}${ing.unit ? ' ' + ing.unit : ''})`;
            }
            if (ing.preparation) {
                text += `, ${ing.preparation}`;
            }
            return text;
        })
        .join('\n');

    // Convert sections to instructions text
    const instructions_text = miniAppRecipe.sections
        .map(section => {
            let text = '';
            if (section.name) {
                text += `${section.name}:\n`;
            }
            text += section.steps
                .map(step => step.map(token => token.value).join(''))
                .join('\n');
            return text;
        })
        .join('\n\n');

    // Convert servings
    const servings = typeof metadata.servings === 'number' ? metadata.servings :
                     typeof metadata.servings === 'string' ? parseInt(metadata.servings) || 4 : 4;

    // Convert times
    const prep_time = metadata.prep_time || metadata.prepTime ?
                     (typeof metadata.prep_time === 'string' ? parseInt(metadata.prep_time) :
                      typeof metadata.prep_time === 'number' ? metadata.prep_time : 0) : 0;

    const cook_time = metadata.cook_time || metadata.cookTime ?
                     (typeof metadata.cook_time === 'string' ? parseInt(metadata.cook_time) :
                      typeof metadata.cook_time === 'number' ? metadata.cook_time : 0) : 0;

    // Convert tags
    const tags = Array.isArray(metadata.tags) ? metadata.tags : [];

    // Convert cookware
    const cookware: CookwareItem[] = miniAppRecipe.cookware.map(cw => ({
        name: cw.name,
        quantity: cw.quantity
    }));

    // Convert timers
    const timers: TimerItem[] = miniAppRecipe.timers.map(t => ({
        name: t.name,
        duration: t.duration,
        unit: t.unit
    }));

    // Determine type from tags or metadata
    const type = tags.some(tag => tag.toLowerCase().includes('breakfast')) ? 'breakfast' :
                 tags.some(tag => tag.toLowerCase().includes('lunch')) ? 'lunch' :
                 tags.some(tag => tag.toLowerCase().includes('dinner')) ? 'dinner' :
                 tags.some(tag => tag.toLowerCase().includes('snack')) ? 'snack' : 'dinner';

    return {
        title,
        ingredients_text,
        instructions_text,
        servings,
        prep_time,
        cook_time,
        difficulty: String(metadata.difficulty || 'Medium'),
        tags,
        source_url: String(metadata.source || ''),
        image_url: String(metadata.image || metadata.photo || metadata.picture || ''),
        image: String(metadata.image || metadata.photo || metadata.picture || ''),
        type,
        meal_type: type,
        metadata: metadata as Record<string, any>,
        cookware,
        timers,
        sections: miniAppRecipe.sections,
        ingredients: miniAppRecipe.ingredients
    };
}

export function parseCooklang(input: string): ParsedRecipe {
    const miniAppRecipe = miniAppParseCooklang(input);
    return convertParsedRecipe(miniAppRecipe);
}

// Export the miniapp types and functions for use in display components
export type { MiniAppParsedRecipe, Ingredient, Cookware, Timer, StepToken };
export { miniAppParseCooklang };
