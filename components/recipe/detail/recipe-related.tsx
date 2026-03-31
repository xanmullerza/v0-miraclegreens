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
                    {loadingRelated ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {relatedRecipes.map((meal) => (
                                <a
                                    key={meal.id}
                                    href={`/recipes/${meal.id}`}
                                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all active:scale-95 flex flex-col justify-between h-24 group relative overflow-hidden"
                                >
                                    <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-all duration-500">
                                        {meal.image ? (
                                            <img src={meal.image} className="w-16 h-16 object-cover rounded-lg filter grayscale" alt="" />
                                        ) : (
                                            <Layers size={32} />
                                        )}
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">
                                            {(meal as any).overlapMatch} Shared
                                        </p>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                                            {meal.title}
                                        </h4>
                                    </div>
                                    <Layers size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors relative z-10" />
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
