'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { formatEnergyValue } from '@/lib/utils/nutrition-utils';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeSectionProps {
    ctx: RecipeDetailCtx;
}

export function RecipeSection({ ctx }: RecipeSectionProps) {
    const { recipe, ingredients, instructions, calculatedNutrition, nutritionViewMode, setNutritionViewMode, setShowTagsDialog, flippedCards, setFlippedCards, energyUnit } = ctx;

    if (!recipe) return null;

    return (
        <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Ready in</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {recipe.prep_time + (recipe.cook_time || 0) > 0 
                            ? `${recipe.prep_time + (recipe.cook_time || 0)} min` 
                            : '-'}
                    </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Servings</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{recipe.servings} servings</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Difficulty</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {recipe.difficulty || 'Medium'}
                    </p>
                </div>
                <button 
                    onClick={() => setShowTagsDialog(true)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between group"
                >
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Tags</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                            {recipe.tags && recipe.tags.length > 0 ? recipe.tags.join(', ') : 'Add Tags'}
                        </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>
            </div>

            {/* Nutritional Info Summary */}
            {(calculatedNutrition.calories > 0 || calculatedNutrition.protein > 0 || calculatedNutrition.fat > 0 || calculatedNutrition.carbs > 0) && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Nutritional Info ({nutritionViewMode === 'per-serving' ? `per serving (1 of ${recipe.servings})` : `total (${recipe.servings} servings)`})
                        </p>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700 gap-0.5">
                            <button 
                                onClick={() => setNutritionViewMode('per-serving')}
                                className={cn(
                                    "px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded transition-all",
                                    nutritionViewMode === 'per-serving' 
                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                            >
                                Per Serving
                            </button>
                            <button 
                                onClick={() => setNutritionViewMode('total')}
                                className={cn(
                                    "px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest rounded transition-all",
                                    nutritionViewMode === 'total' 
                                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                            >
                                Total
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{energyUnit === 'kJ' ? 'Energy' : 'Calories'}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {formatEnergyValue(
                                    nutritionViewMode === 'per-serving' ? calculatedNutrition.calories / (recipe.servings || 1) : calculatedNutrition.calories,
                                    energyUnit,
                                    nutritionViewMode === 'per-serving' ? (calculatedNutrition.energyKj || calculatedNutrition.calories * 4.184) / (recipe.servings || 1) : (calculatedNutrition.energyKj || calculatedNutrition.calories * 4.184)
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Protein</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round((nutritionViewMode === 'per-serving' ? calculatedNutrition.protein / recipe.servings : calculatedNutrition.protein) * 10) / 10}g</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Fat</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round((nutritionViewMode === 'per-serving' ? calculatedNutrition.fat / recipe.servings : calculatedNutrition.fat) * 10) / 10}g</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Carbs</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round((nutritionViewMode === 'per-serving' ? calculatedNutrition.carbs / recipe.servings : calculatedNutrition.carbs) * 10) / 10}g</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Diet Labels */}
            {recipe.diet && recipe.diet.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {recipe.diet.map(d => (
                        <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                            {d}
                        </span>
                    ))}
                </div>
            )}

            {/* Ingredients */}
            {ingredients.length > 0 && (
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                        Ingredients ({ingredients.length})
                    </h3>
                    <div className="grid gap-2">
                        {ingredients.map((ing, idx) => {
                            const servings = recipe.servings || 1;
                            const weightScale = nutritionViewMode === 'total' ? 1 : (1 / servings);
                            const displayWeight = Math.round((ing.weight_g || 0) * weightScale * 10) / 10;
                            
                            const food = ing.food_items;
                            const weight = ing.weight_g || 0;
                            let ingCalories = 0, ingProtein = 0, ingCarbs = 0, ingFat = 0;
                            
                            if (food && weight > 0) {
                                const ratio = weight / 100;
                                ingCalories = Math.round((food.energy_kcal || 0) * ratio);
                                ingProtein = Math.round((food.protein_g || 0) * ratio * 10) / 10;
                                ingCarbs = Math.round((food.carbs_g || 0) * ratio * 10) / 10;
                                ingFat = Math.round((food.fat_g || 0) * ratio * 10) / 10;
                            }

                            const isFlipped = flippedCards[ing.id];
                            const isGenericItem = ing.amount?.toLowerCase().includes('item') || ing.amount?.toLowerCase().includes('unit');
                            const cleanAmount = isGenericItem && displayWeight > 0 
                                ? '' 
                                : (nutritionViewMode === 'total' ? ing.amount : scaleIngredient(ing.amount || '', 1 / servings));

                            return (
                                <div
                                    key={ing.id || idx}
                                    className="relative h-32 cursor-pointer group"
                                    onClick={() => setFlippedCards(prev => ({ ...prev, [ing.id]: !isFlipped }))}
                                >
                                    {/* Front of card */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between",
                                            "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800",
                                            isFlipped ? "opacity-0 pointer-events-none" : "opacity-100",
                                            "group-hover:border-emerald-400 dark:group-hover:border-emerald-600"
                                        )}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{ing.base_ingredient || ing.item}</p>
                                            {cleanAmount && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cleanAmount}</p>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            {displayWeight > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{displayWeight}g</p>}
                                            <button className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors">
                                                Macros
                                            </button>
                                        </div>
                                    </div>

                                    {/* Back of card */}
                                    <div
                                        className={cn(
                                            "absolute inset-0 p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between text-[11px]",
                                            "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700",
                                            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
                                        )}
                                    >
                                        <div>
                                            {food ? (
                                                <>
                                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] mb-2">
                                                        {food.name || food.common_name || 'Unknown'}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">{energyUnit === 'kJ' ? Math.round(ingCalories * 4.184) : ingCalories}</p>
                                                            <p className="text-emerald-700 dark:text-emerald-300 text-[9px]">{energyUnit}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">{ingProtein}g</p>
                                                            <p className="text-emerald-700 dark:text-emerald-300 text-[9px]">protein</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">{ingFat}g</p>
                                                            <p className="text-emerald-700 dark:text-emerald-300 text-[9px]">fat</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">{ingCarbs}g</p>
                                                            <p className="text-emerald-700 dark:text-emerald-300 text-[9px]">carbs</p>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-amber-600 dark:text-amber-400 font-semibold">⚠ Not matched</p>
                                            )}
                                        </div>
                                        {food && (
                                            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 border-t border-emerald-200 dark:border-emerald-700 pt-1 mt-1">
                                                <p className="opacity-70">Per 100g: {energyUnit === 'kJ' ? Math.round((food.energy_kcal || 0) * 4.184) + 'kJ' : (food.energy_kcal || '?') + 'kcal'}, {food.protein_g || '?'}g prot</p>
                                            </div>
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

            {/* Source */}
            {recipe.source && recipe.source !== 'pasted-content' && (
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Source:</span> {recipe.source}
                </div>
            )}
        </>
    );
}
