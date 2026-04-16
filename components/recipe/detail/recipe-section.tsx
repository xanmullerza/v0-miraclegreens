'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Plus, Minus, Clock, Users, SignalLow, SignalMedium, Signal, Database, Globe, Search, X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import { searchFoodItem } from '@/lib/services/nutrition';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

interface RecipeSectionProps {
    ctx: RecipeDetailCtx;
}

export function RecipeSection({ ctx }: RecipeSectionProps) {
    const { recipe, ingredients, instructions, calculatedNutrition, selectedServings, setSelectedServings, setShowTagsDialog, flippedCards, setFlippedCards, energyUnit } = ctx;

    // State for ingredient search and replacement
    const [editingIngredient, setEditingIngredient] = useState<any>(null);
    const [showSearchDialog, setShowSearchDialog] = useState(false);

    // State for delete confirmation
    const [deleteConfirming, setDeleteConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Delete recipe handler
    const handleDeleteRecipe = async () => {
        if (!recipe) return;

        if (!deleteConfirming) {
            setDeleteConfirming(true);
            return;
        }

        setDeleting(true);
        try {
            if (String(recipe.id).startsWith('local-')) {
                const localData = localStorage.getItem('local_recipes');
                if (localData) {
                    const recipes = JSON.parse(localData);
                    const filtered = recipes.filter((r: any) => r.id !== recipe.id);
                    localStorage.setItem('local_recipes', JSON.stringify(filtered));
                }
            } else {
                const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
                if (error) throw error;
            }
            toast.success('Recipe deleted successfully');
            if (ctx.onBack) ctx.onBack();
        } catch (error: any) {
            toast.error(`Delete failed: ${error.message}`);
            setDeleteConfirming(false);
        } finally {
            setDeleting(false);
        }
    };

    if (!recipe) return null;

    return (
        <>
            {/* Recipe Metadata */}
            <div className="flex flex-wrap items-center justify-center gap-1 p-2 rounded-3xl bg-transparent">
                {([{
                        label: <Clock size={17} />,
                        value: ((recipe.prep_time || 0) + (recipe.cook_time || 0)) || '-',
                        color: 'text-sky-400'
                    },
                    {
                        label: <Users size={17} />,
                        value: selectedServings || recipe.servings || 1,
                        color: 'text-violet-400',
                    },
                    {
                        label: (() => {
                            const d = recipe.difficulty || 'Medium';
                            if (d === 'Easy') return <SignalLow size={20} />;
                            if (d === 'Hard') return <Signal size={20} />;
                            return <SignalMedium size={20} />;
                        })(),
                        value: '',
                        color: (() => {
                            const d = recipe.difficulty || 'Medium';
                            if (d === 'Easy') return 'text-emerald-400';
                            if (d === 'Hard') return 'text-rose-400';
                            return 'text-amber-400';
                        })()
                    },
                ] as { label: React.ReactNode; value: string | number; color: string; isInteractive?: boolean }[]).map((tab, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'py-3 px-1 rounded-2xl transition-all duration-300 whitespace-nowrap flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 bg-transparent relative',
                            tab.color,
                        )}
                    >
                        <span className="opacity-85 leading-none shrink-0">
                            {tab.label}
                        </span>
                        {tab.value !== '' && (
                            <span className="leading-none font-black text-white/70 text-[10px] tracking-widest">{tab.value}</span>
                        )}
                    </div>
                ))}
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
                                        "absolute inset-0 px-3 flex items-center gap-3 rounded-2xl border-2 transition-all duration-300",
                                        "border-emerald-500/30",
                                        isFlipped ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100",
                                        "hover:border-emerald-400 hover:shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:ring-1 hover:ring-emerald-500/20"
                                    )}>
                                        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest min-w-[60px] text-center">
                                            {cleanAmount || (displayWeight > 0 ? `${displayWeight}g` : '-')}
                                        </div>
                                        <p className="flex-1 font-bold text-slate-900 dark:text-slate-100 text-[13px] truncate flex items-center gap-2">
                                            <span>
                                                {(ing.food_items?.common_name || ing.food_items?.name || ing.base_ingredient || ing.item || '').toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </span>
                                            {ing.food_items?.source === 'usda' ? (
                                                <Globe size={10} className="shrink-0 text-blue-500" title="From USDA API" />
                                            ) : ing.food_items?.source === 'local' ? (
                                                <Database size={10} className="shrink-0 text-green-500" title="From Local Database" />
                                            ) : null}
                                        </p>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingIngredient(ing);
                                                    setShowSearchDialog(true);
                                                }}
                                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 transition-colors"
                                                title="Search for different ingredient"
                                            >
                                                <Search size={12} />
                                            </button>
                                            <div className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                                Macros
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back Side - Macro Breakdown */}
                                    <div className={cn(
                                        "absolute inset-0 px-4 flex items-center justify-between rounded-2xl border-2 transition-all duration-300",
                                        "bg-transparent border-emerald-400 text-emerald-900 dark:text-emerald-100",
                                        "shadow-[0_0_22px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/20",
                                        isFlipped ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                                    )}>
                                        {food ? (
                                            <>
                                                <div className="flex-1 flex justify-around items-center">
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-black text-violet-300 dark:text-violet-200">{energyUnit === 'kJ' ? Math.round(ingCalories * 4.184) : ingCalories}</p>
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-violet-300 dark:text-violet-200">{energyUnit}</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black text-amber-300 dark:text-amber-200">{ingCarbs}g</p>
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-amber-300 dark:text-amber-200">Carbs</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black text-rose-300 dark:text-rose-200">{ingProtein}g</p>
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-rose-300 dark:text-rose-200">Protein</p>
                                                    </div>
                                                    <div className="text-center border-l border-white/20 pl-4">
                                                        <p className="text-[10px] font-black text-sky-300 dark:text-sky-200">{ingFat}g</p>
                                                        <p className="text-[7px] font-bold uppercase tracking-widest text-sky-300 dark:text-sky-200">Fat</p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 ml-4 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
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
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-600 rounded-full" />
                        Instructions
                    </h3>
                    <ol className="space-y-3">
                        {instructions.map((inst, idx) => (
                            <li key={idx} className="flex gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                className="w-full p-4 rounded-2xl border-2 border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/30 hover:border-emerald-400/60 transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.14)] group"
            >
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tags & Categories</p>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                        #{recipe.difficulty || 'Medium'}
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

            {/* Edit and Delete Buttons */}
            {ctx.isOwner && (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={ctx.handleEditClick}
                        className="p-4 rounded-2xl border text-left flex flex-col justify-between h-24 group relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.14)]"
                    >
                        <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Pencil size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-500">Modification</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Edit Content</p>
                        </div>
                        <Pencil size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </button>

                    <button
                        onClick={handleDeleteRecipe}
                        className={cn(
                            "p-4 rounded-2xl border text-left flex flex-col justify-between h-24 group relative overflow-hidden transition-all duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(16,185,129,0.14)]",
                            deleteConfirming
                                ? "bg-rose-600 border-rose-500 text-white"
                                : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600"
                        )}
                    >
                        {deleteConfirming ? (
                            <>
                                <div className="absolute top-2 right-2 opacity-20">
                                    <Trash2 size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-rose-200">Permanence</p>
                                    <p className="text-sm font-bold">Confirm Delete?</p>
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={handleDeleteRecipe}
                                        disabled={deleting}
                                        className="flex-1 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors flex items-center justify-center"
                                    >
                                        {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirming(false); }}
                                        className="flex-1 py-2 bg-rose-700/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trash2 size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-500">Permanence</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Delete Recipe</p>
                                </div>
                                <Trash2 size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Ingredient Search Dialog */}
            <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Replace Ingredient</DialogTitle>
                    </DialogHeader>
                        <FoodItemPicker
                            onSelect={async (foodItem) => {
                                if (!foodItem) return;

                                try {
                                    // Update the ingredient in the database
                                    const { error } = await supabase
                                        .from('recipe_ingredients')
                                        .update({ food_item_id: foodItem.id })
                                        .eq('id', editingIngredient.id);

                                    if (error) throw error;

                                    // Update local state
                                    ctx.updateIngredient(editingIngredient.id, {
                                        ...editingIngredient,
                                        food_item_id: foodItem.id,
                                        food_items: foodItem
                                    });

                                    toast.success('Ingredient replaced successfully');
                                    setShowSearchDialog(false);
                                    setEditingIngredient(null);
                                } catch (error) {
                                    console.error('Error replacing ingredient:', error);
                                    toast.error('Failed to replace ingredient');
                                }
                            }}
                            onClose={() => {
                                setShowSearchDialog(false);
                                setEditingIngredient(null);
                            }}
                            initialSearchQuery={editingIngredient?.food_items?.common_name || editingIngredient?.food_items?.name || editingIngredient?.base_ingredient || editingIngredient?.item || ''}
                        />
                </DialogContent>
            </Dialog>

            {/* Source */}
            {recipe.source && recipe.source !== 'pasted-content' && (
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-medium">Source:</span> {recipe.source}
                </div>
            )}
        </>
    );
}
