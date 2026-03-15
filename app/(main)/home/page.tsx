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
            <div className="space-y-6 animate-in fade-in duration-500 pb-4">
                {/* Hero Section - Simplified for Chatbot Focus */}
                <div className="text-center space-y-2 py-4">
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Vitala Intelligence
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-bold uppercase tracking-widest">
                        Your personal nutrition assistant
                    </p>
                </div>

                {/* Main Chatbot Area */}
                <div className="h-[calc(100vh-140px)] animate-in slide-in-from-bottom-4 duration-700">
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
