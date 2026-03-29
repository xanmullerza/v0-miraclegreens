'use client';

import React, { useState, useEffect } from 'react';
import { parseRecipeText, parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { RecipeFormDialog } from '@/components/admin/ingredients/recipe-form-dialog';
import { RecipeIngredient } from '@/components/recipe/ingredient-builder';

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    source_url: string;
    image_url?: string;
}

interface RecipeURLHandlerProps {
    isOpen: boolean;
    recipe: ParsedRecipe | null;
    onClose: () => void;
    onSave?: () => void;
}

export function RecipeURLHandler({ isOpen, recipe, onClose, onSave }: RecipeURLHandlerProps) {
    const [processedRecipe, setProcessedRecipe] = useState<{
        title: string;
        servings: number;
        prepTime: number;
        ingredients_text: string;
        instructions_text: string;
        source_url: string;
        image_url?: string;
    } | null>(null);

    // Process recipe when it changes
    useEffect(() => {
        if (recipe && isOpen) {
            // Parse the recipe text to get better structure
            const parsed = parseRecipeText(recipe.ingredients_text + '\n' + recipe.instructions_text);
            
            setProcessedRecipe({
                title: recipe.title,
                servings: recipe.servings || 4,
                prepTime: recipe.prep_time || 30,
                ingredients_text: recipe.ingredients_text,
                instructions_text: recipe.instructions_text,
                source_url: recipe.source_url,
                image_url: recipe.image_url,
            });
        }
    }, [recipe, isOpen]);

    if (!isOpen || !recipe || !processedRecipe) {
        return null;
    }

    return (
        <RecipeFormDialog
            onClose={onClose}
            onSave={onSave}
            initialData={{
                title: processedRecipe.title,
                servings: processedRecipe.servings,
                prepTime: processedRecipe.prepTime,
                ingredients_text: processedRecipe.ingredients_text,
                instructions_text: processedRecipe.instructions_text,
                source: processedRecipe.source_url,
                image: processedRecipe.image_url,
            }}
        />
    );
}
