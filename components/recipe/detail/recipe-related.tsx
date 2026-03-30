'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeRelatedProps {
    ctx: RecipeDetailCtx;
}

export function RecipeRelated({ ctx }: RecipeRelatedProps) {
    const { relatedRecipes, loadingRelated } = ctx;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {(relatedRecipes.length > 0 || loadingRelated) ? (
                <div className="space-y-4">
                    <div className="pb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 italic flex items-center gap-2">
                            Related Meals
                        </h3>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Recipes with shared ingredients</p>
                    </div>

                    {loadingRelated ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {relatedRecipes.map((meal) => (
                                <a
                                    key={meal.id}
                                    href={`/recipes/${meal.id}`}
                                    className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-emerald-500/30 hover:bg-muted transition-all"
                                >
                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted border border-border flex-shrink-0">
                                        {meal.image ? (
                                            <img src={meal.image} className="w-full h-full object-cover" alt={meal.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <Layers size={14} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                                            {meal.title}
                                        </h4>
                                        <div className="mt-1 inline-block px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-bold uppercase tracking-wider">
                                            {(meal as any).overlapMatch} Shared
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-slate-400 font-semibold py-6 text-center">No related meals found.</p>
            )}
        </div>
    );
}
