'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;
const interactiveGlow = 'transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.14)]';

// ── RecipeManagement ──────────────────────────────────────────
interface RecipeManagementProps {
    ctx: RecipeDetailCtx;
}

export function RecipeManagement({ ctx }: RecipeManagementProps) {
    const { recipe, isOwner, handleEditClick, onBack } = ctx;

    if (!recipe) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Management options moved to recipe section */}
            <p className="text-center text-slate-400 text-sm">Edit and delete options are now available in the recipe details section.</p>
        </div>
    );
}
