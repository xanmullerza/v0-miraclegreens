'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { ChatbotModal } from '@/components/chatbot-modal';
import { RecipePreview } from '@/components/recipe/recipe-preview';

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
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
        <PageContainer maxWidth="max-w-7xl">
            <div className="animate-in fade-in duration-500 pt-2 pb-2">
                {/* Main Chatbot Area */}
                <div className="h-[calc(100vh-60px)] animate-in slide-in-from-bottom-4 duration-700">
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
        </PageContainer>
    );
}
