'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Layers } from 'lucide-react';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeRelatedProps {
    ctx: RecipeDetailCtx;
}

export function RecipeRelated({ ctx }: RecipeRelatedProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const handleRelatedClick = (recipeId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('recipeId', recipeId);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Create array of 4 slots, filled with recipes or empty
    const gridSlots = Array.from({ length: 4 }, (_, i) => relatedRecipes[i] || null);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
                {loadingRelated ? (
                    // Loading state: 4 skeleton cards
                    Array.from({ length: 4 }).map((_, i) => (
                        <div 
                            key={`skeleton-${i}`} 
                            className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700 h-24" 
                        />
                    ))
                ) : (
                    // Render up to 4 grid slots
                    gridSlots.map((meal, idx) => (
                        meal ? (
                            // Recipe card
                            <button
                                key={meal.id}
                                onClick={() => handleRelatedClick(meal.id)}
                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left transition-all active:scale-95 flex flex-col justify-between h-24 group relative overflow-hidden hover:border-emerald-400/50 dark:hover:border-emerald-500/50"
                            >
                                {/* Background image */}
                                {meal.image && (
                                    <img 
                                        src={meal.image} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity" 
                                        alt={meal.title} 
                                    />
                                )}

                                {/* Content */}
                                <div className="relative z-10">
                                    {(meal as any).overlapMatch && (
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">
                                            {(meal as any).overlapMatch} Shared
                                        </p>
                                    )}
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                        {meal.title}
                                    </h4>
                                </div>

                                {/* Icon indicator */}
                                <Layers size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors relative z-10" />
                            </button>
                        ) : (
                            // Empty slot - "Recipe not found"
                            <div
                                key={`empty-${idx}`}
                                className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between h-24 text-center"
                            >
                                <div />
                                <div className="space-y-1">
                                    <Layers size={16} className="text-slate-300 dark:text-slate-600 mx-auto" />
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                        Recipe not found
                                    </p>
                                </div>
                                <div />
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
}
