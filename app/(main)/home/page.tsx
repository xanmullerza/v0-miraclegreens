'use client';

import React, { useState } from 'react';
import { ChatbotModal } from '@/components/chatbot-modal';
import { RecipePreview } from '@/components/recipe/recipe-preview';

interface ParsedRecipe {
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
}

export default function HomePage() {
    const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
    const [detectedRecipe, setDetectedRecipe] = useState<ParsedRecipe | null>(null);

    const handleRecipeDetected = (recipe: ParsedRecipe) => {
        setDetectedRecipe(recipe);
        setRecipeEditorOpen(true);
    };

    return (
        <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
            {/* Full Screen Chatbot */}
            <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ChatbotModal 
                    isInline={true} 
                    onClose={() => {}} 
                    onRecipeDetected={handleRecipeDetected}
                />
            </div>

            {/* Recipe Preview Modal for URL-parsed recipes */}
            <RecipePreview
                isOpen={recipeEditorOpen}
                recipe={detectedRecipe}
                onClose={() => {
                    setRecipeEditorOpen(false);
                    setDetectedRecipe(null);
                }}
                onSave={(recipe) => {
                    setRecipeEditorOpen(false);
                    setDetectedRecipe(null);
                }}
            />
        </div>
    );
}
