'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Plus, Minus, ChefHat, UtensilsCrossed, Gauge } from 'lucide-react';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeSectionProps {
    ctx: RecipeDetailCtx;
}

export function RecipeSection({ ctx }: RecipeSectionProps) {
    const { recipe, ingredients, instructions, calculatedNutrition, selectedServings, setSelectedServings, setShowTagsDialog, flippedCards, setFlippedCards, energyUnit } = ctx;

    if (!recipe) return null;

    const totalCookTime = ((recipe.prep_time || 0) + (recipe.cook_time || 0)) || null;
    const displayServings = selectedServings || recipe.servings || 1;
    const difficultyLabel = recipe.difficulty || 'Medium';

    return (
        <>
            {/* Recipe Summary */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-6">
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-emerald-500" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cook Time</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{totalCookTime ? `${totalCookTime} min` : '—'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Servings</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{displayServings}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-emerald-500" />
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Difficulty</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{difficultyLabel}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ingredients */}
            {ingredients.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                        Ingredients ({ingredients.length})
                    </h3>
                    <div className="grid gap-2">
                        {ingredients.map((ing, idx) => {
                            const originalServings = recipe.servings || 1;
                            // Normalize to 1 serving, then scale by selectedServings
                            const weightScale = (1 / originalServings) * selectedServings;
                            const displayWeight = Math.round((ing.weight_g || 0) * weightScale * 10) / 10;
                            
                            const food = ing.food_items;
                            const currentWeight = (ing.weight_g || 0) * weightScale;
                            let ingCalories = 0, ingProtein = 0, ingCarbs = 0, ingFat = 0;
                            
                            if (food && currentWeight > 0) {
                                const ratio = currentWeight / 100;
                                ingCalories = Math.round((food.energy_kcal || 0) * ratio);
                                ingProtein = Math.round((food.protein_g || 0) * ratio * 10) / 10;
                                ingCarbs = Math.round((food.carbs_g || 0) * ratio * 10) / 10;
                                ingFat = Math.round((food.fat_g || 0) * ratio * 10) / 10;
                            }

                            const isFlipped = flippedCards[ing.id];
                            const isGenericItem = ing.amount?.toLowerCase().includes('item') || ing.amount?.toLowerCase().includes('unit');
                            const cleanAmount = isGenericItem && displayWeight > 0 
                                ? `${displayWeight}g` 
                                : scaleIngredient(ing.amount || '', weightScale);

                            return (
                                <div
                                    key={ing.id || idx}
                                    className="relative h-14 group"
                                    onClick={() => setFlippedCards(prev => ({ ...prev, [ing.id]: !isFlipped }))}
                                >
                                    {/* Front Side - Slim Card */}
                                    <div className={cn(
                                        "absolute inset-0 px-3 flex items-center gap-3 rounded-2xl border transition-all duration-300",
                                        "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800",
                                        isFlipped ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100",
                                        "group-hover:border-emerald-400 dark:group-hover:border-emerald-600"
                                    )}>
                                        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest min-w-[60px] text-center">
                                            {cleanAmount || (displayWeight > 0 ? `${displayWeight}g` : '-')}
                                        </div>
                                        <p className="flex-1 font-bold text-slate-900 dark:text-slate-100 text-[13px] truncate">
                                            {(ing.base_ingredient || ing.item || '').toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </p>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                                Macros
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back Side - Macro Breakdown */}
                                    <div className={cn(
                                        "absolute inset-0 px-4 flex items-center justify-between rounded-2xl border transition-all duration-300",
                                        "bg-emerald-600 dark:bg-emerald-600 border-emerald-500 text-white",
                                        isFlipped ? "opacity-100 scale-100 shadow-lg shadow-emerald-600/20" : "opacity-0 scale-95 pointer-events-none"
                                    )}>
                                        {food ? (
                                            <>
                                                <div className="flex-1 flex justify-around items-center">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black">{energyUnit === 'kJ' ? Math.round(ingCalories * 4.184) : ingCalories}</p>
                                                        <p className="text-[7px] font-bold opacity-70 uppercase tracking-widest">{energyUnit}</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black">{ingProtein}g</p>
                                                        <p className="text-[7px] font-bold opacity-70 uppercase tracking-widest">Prot</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black">{ingFat}g</p>
                                                        <p className="text-[7px] font-bold opacity-70 uppercase tracking-widest">Fat</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black">{ingCarbs}g</p>
                                                        <p className="text-[7px] font-bold opacity-70 uppercase tracking-widest">Carbs</p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 ml-4 px-2.5 py-1 rounded-lg bg-white text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                                                    Close
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm font-bold flex items-center gap-2">
                                                <span className="opacity-70">⚠</span> Metadata Missing
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                        Instructions
                    </h3>
                    <ol className="space-y-3">
                        {instructions.map((inst, idx) => (
                            <li key={idx} className="flex gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {inst.step_order || idx + 1}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 pt-0.5">
                                    {inst.step_text}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Tags & Categories */}
            <button
                onClick={() => ctx.navigateTo('recipe-tags')}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors group"
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tags & Categories</p>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                        #{difficultyLabel}
                    </span>
                    {recipe.type && (
                        <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            #{recipe.type}
                        </span>
                    )}
                    {recipe.diet && recipe.diet.map(d => (
                        <span key={d} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            #{d}
                        </span>
                    ))}
                    {recipe.tags && recipe.tags.map(t => (
                        <span key={t} className="px-3 py-1.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            {t.startsWith('#') ? t : `#${t}`}
                        </span>
                    ))}
                    {(!recipe.tags || recipe.tags.length === 0) && !recipe.type && (!recipe.diet || recipe.diet.length === 0) && (
                        <span className="text-sm font-bold text-slate-400 italic">Add Tags</span>
                    )}
                </div>
            </button>

            {/* Source */}
            {recipe.source && recipe.source !== 'pasted-content' && (
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Source:</span> {recipe.source}
                </div>
            )}
        </>
    );
}
