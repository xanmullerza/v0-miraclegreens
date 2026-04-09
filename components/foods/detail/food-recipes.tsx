import React from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Loader2, ChevronDown } from 'lucide-react';
import { FoodDetailContextType } from './types';

export function FoodRecipes({ ctx }: { ctx: FoodDetailContextType }) {
    const router = useRouter();
    const { foodRecipes, recipesLoading } = ctx;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                    <UtensilsCrossed size={18} />
                    Recipes
                </h3>
            </div>
            {recipesLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest">Finding recipes...</span>
                </div>
            ) : foodRecipes.length === 0 ? (
                <p className="text-sm text-slate-400 font-bold py-6 text-center">No recipes found for this ingredient.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {foodRecipes.map(recipe => (
                        <button
                            key={recipe.id}
                            onClick={() => router.push(`/?recipeId=${recipe.id}`)}
                            className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all text-left group"
                        >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                {recipe.image
                                    ? <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={16} className="text-slate-300" /></div>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{recipe.title}</p>
                                {recipe.type && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{recipe.type}</p>}
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-amber-400 -rotate-90 shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
