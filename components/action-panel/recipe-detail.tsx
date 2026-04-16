'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    useRecipeDetail,
    RecipeHeader,
    RecipeSection,
    RecipeNutrition,
    RecipeManagement,
} from '@/components/recipe/detail';

interface RecipeDetailProps {
    recipeId: string;
    onBack?: () => void;
    onShare?: (recipe: any) => void;
    onRemix?: (recipe: any, ingredients: any[], instructions: any[]) => void;
    /** @deprecated — standalone mode now uses app/(main)/recipes/[id]/page.tsx directly */
    isStandalone?: boolean;
}

export function RecipeDetail({ recipeId, onBack, onShare, onRemix }: RecipeDetailProps) {
    console.log('[RecipeDetail] Component rendering with recipeId:', recipeId);
    toast.info(`📖 Loading recipe: ${recipeId}`);
    const ctx = useRecipeDetail({ recipeId, onBack, onShare, onRemix });
    const { recipe, loading, activeSection } = ctx;

    console.log('[RecipeDetail] Context state:', { recipe: !!recipe, loading, activeSection });
    if (recipe) {
        toast.success(`✅ Recipe loaded: "${recipe.title}"`);
    }

    // ── Loading ──────────────────────────────────────────────
    if (loading) {
        console.log('[RecipeDetail] Showing loading state');
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-500">Loading recipe...</p>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────
    if (!recipe) {
        console.log('[RecipeDetail] Recipe not found');
        toast.error(`❌ Recipe not found: ${recipeId}`);
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
    console.log('[RecipeDetail] Rendering main content, activeSection:', activeSection);
    toast.info(`📋 Showing section: ${activeSection}`);
    return (
        <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
            {/* Chatbot-style header (sticky title bar + image grid) */}
            <RecipeHeader ctx={ctx} standalone={false} />

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-4">
                {activeSection === 'recipe' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <RecipeSection ctx={ctx} />
                    </div>
                )}

                {activeSection === 'nutrition' && (
                    <div className="space-y-4">
                        <RecipeNutrition ctx={ctx} />
                    </div>
                )}

                {activeSection === 'management' && (
                    <RecipeManagement ctx={ctx} />
                )}
            </div>
        </div>
    );
}
