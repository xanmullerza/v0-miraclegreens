'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
    useRecipeDetail,
    RecipeHeader,
    RecipeSection,
    RecipeNutrition,
    RecipeSmartMatch,
    RecipeRelated,
    RecipeManagement,
} from '@/components/recipe/detail';
import FoodItemPicker from '@/components/recipe/food-item-picker';

interface RecipeDetailProps {
    recipeId: string;
    onBack?: () => void;
    onShare?: (recipe: any) => void;
    onRemix?: (recipe: any, ingredients: any[], instructions: any[]) => void;
    /** @deprecated — standalone mode now uses app/(main)/recipes/[id]/page.tsx directly */
    isStandalone?: boolean;
}

export function RecipeDetail({ recipeId, onBack, onShare, onRemix }: RecipeDetailProps) {
    const ctx = useRecipeDetail({ recipeId, onBack, onShare, onRemix });
    const { recipe, loading, activeSection } = ctx;

    // ── Loading ──────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-500">Loading recipe...</p>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────
    if (!recipe) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
                <p className="text-slate-500 text-center">Recipe not found</p>
                {onBack && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    // ── Main render ──────────────────────────────────────────
    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 relative">
            {/* Chatbot-style header (sticky title bar + image grid) */}
            <RecipeHeader ctx={ctx} standalone={false} />

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSection === 'recipe' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <RecipeSection ctx={ctx} />
                    </div>
                )}

                {activeSection === 'nutrition' && (
                    <div className="space-y-4">
                        <RecipeNutrition ctx={ctx} />
                        <RecipeSmartMatch ctx={ctx} />
                    </div>
                )}

                {activeSection === 'related' && (
                    <RecipeRelated ctx={ctx} />
                )}

                {activeSection === 'management' && (
                    <RecipeManagement ctx={ctx} />
                )}
            </div>

            {/* Smart Match Picker Sidebar Overlay */}
            {ctx.smartMatch.showPicker && ctx.smartMatch.queue.length > 0 && (
                <div className="absolute inset-0 z-[100] bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col">
                    <FoodItemPicker
                        onSelect={ctx.handleSmartMatchPickerSelect}
                        onSkip={ctx.handleSmartMatchSkip}
                        onDelete={ctx.handleSmartMatchDelete}
                        onClose={() => ctx.smartMatch.reset()}
                        mode="all"
                        isAdmin={false}
                        inline={true}
                        initialSearchQuery={ctx.smartMatch.queue[ctx.smartMatch.currentIdx]?.ingredient?.base_ingredient || ctx.smartMatch.queue[ctx.smartMatch.currentIdx]?.ingredient?.item || ''}
                        initialResults={ctx.smartMatch.results}
                    />
                </div>
            )}
        </div>
    );
}
