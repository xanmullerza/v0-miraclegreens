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

    // Create array of 4 slots, filled with recipes or empty
    const gridSlots = Array.from({ length: 4 }, (_, i) => relatedRecipes[i] || null);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4 auto-rows-max">
                {loadingRelated ? (
                    // Loading state: 4 skeleton cards
                    Array.from({ length: 4 }).map((_, i) => (
                        <div 
                            key={`skeleton-${i}`} 
                            className="w-full aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" 
                        />
                    ))
                ) : (
                    // Render up to 4 grid slots
                    gridSlots.map((meal, idx) => (
                        meal ? (
                            // Recipe card
                            <a
                                key={meal.id}
                                href={`/recipes/${meal.id}`}
                                className="w-full aspect-square rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 transition-all overflow-hidden flex flex-col group relative"
                            >
                                {/* Recipe Image Background */}
                                {meal.image ? (
                                    <img 
                                        src={meal.image} 
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        alt={meal.title} 
                                    />
                                ) : (
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                        <Layers size={40} className="text-slate-400 opacity-50" />
                                    </div>
                                )}

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                {/* Content - always at bottom on hover reveal */}
                                <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="space-y-1">
                                        {(meal as any).overlapMatch && (
                                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-300">
                                                {(meal as any).overlapMatch} Shared
                                            </p>
                                        )}
                                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                            {meal.title}
                                        </h4>
                                    </div>
                                </div>
                            </a>
                        ) : (
                            // Empty slot - "Recipe not found"
                            <div
                                key={`empty-${idx}`}
                                className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center"
                            >
                                <div className="text-center">
                                    <Layers size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                        Recipe not found
                                    </p>
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
}
