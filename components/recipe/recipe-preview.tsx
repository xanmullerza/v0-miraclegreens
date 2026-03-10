'use client';

import React, { useState } from 'react';
import { X, ChefHat, Clock, Users, Save, ArrowLeft, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { toast } from 'sonner';

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    source_url: string;
    image_url?: string;
}

interface RecipePreviewProps {
    isOpen: boolean;
    recipe: ParsedRecipe | null;
    onClose: () => void;
    onSave?: (recipe: ParsedRecipe) => void;
}

export function RecipePreview({ isOpen, recipe, onClose, onSave }: RecipePreviewProps) {
    const [saving, setSaving] = useState(false);
    const { saveRecipe, user } = useDataPersistence();

    if (!isOpen || !recipe) {
        return null;
    }

    // Parse ingredients into array
    const ingredientsList = recipe.ingredients_text
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, idx: number) => ({
            id: idx,
            text: line.trim()
        }));

    // Parse instructions into array
    const instructionsList = recipe.instructions_text
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, idx: number) => ({
            id: idx,
            text: line.trim()
        }));

    const handleSave = async () => {
        setSaving(true);
        try {
            // Create recipe data object for saving
            const recipeData = {
                title: recipe.title,
                type: 'dinner', // Default type - can be enhanced later
                servings: recipe.servings || 4,
                prep_time: recipe.prep_time || 30,
                image: recipe.image_url,
                is_favorite: true,
                is_mix: false,
                diet: [],
                calories: 0, // Will calculate from ingredients later
                protein: 0,
                fat: 0,
                carbs: 0,
                source: recipe.source_url
            };

            // Create ingredients with basic structure
            const ingredientsForSave = ingredientsList.map(ing => ({
                food_item_name: ing.text,
                food_item_id: `raw-${ing.id}`,
                quantity: 1,
                measure_label: 'item',
                weight_g: 0,
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
            }));

            // Create instructions with basic structure
            const instructionsForSave = instructionsList.map(ins => ({
                step_text: ins.text,
                step_order: ins.id + 1
            }));

            // Save the recipe
            await saveRecipe(recipeData, ingredientsForSave, instructionsForSave);

            toast.success(`Recipe "${recipe.title}" saved to your library!`);
            
            // Call save callback if provided
            if (onSave) {
                onSave(recipe);
            }
            
            onClose();
        } catch (error) {
            console.error('Error saving recipe:', error);
            toast.error('Failed to save recipe. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
                
                {/* Header */}
                <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Review Recipe
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 flex items-center justify-center transition-all"
                        title="Close"
                    >
                        <X size={18} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Hero Image & Title */}
                    <div className="space-y-4">
                        {recipe.image_url && (
                            <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <img
                                    src={recipe.image_url}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {recipe.title}
                            </h1>
                            <a
                                href={recipe.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2 inline-block"
                            >
                                View original source →
                            </a>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                Servings
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {recipe.servings || 4}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                Prep Time
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {recipe.prep_time || 30}
                                <span className="text-sm"> min</span>
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <ChefHat size={20} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                                Status
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                ✓ Ready
                            </p>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">📝</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                Ingredients
                            </h3>
                            <span className="ml-auto text-sm font-bold text-slate-400">
                                {ingredientsList.length} items
                            </span>
                        </div>
                        <div className="space-y-2 pl-4 border-l-2 border-emerald-200 dark:border-emerald-900/30">
                            {ingredientsList.length > 0 ? (
                                ingredientsList.map((ingredient) => (
                                    <div
                                        key={ingredient.id}
                                        className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {ingredient.text}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">No ingredients parsed yet</p>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <span className="text-sm font-black text-amber-700 dark:text-amber-400">👨‍🍳</span>
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                Instructions
                            </h3>
                            <span className="ml-auto text-sm font-bold text-slate-400">
                                {instructionsList.length} steps
                            </span>
                        </div>
                        <div className="space-y-3 pl-4 border-l-2 border-amber-200 dark:border-amber-900/30">
                            {instructionsList.length > 0 ? (
                                instructionsList.map((instruction) => (
                                    <div
                                        key={instruction.id}
                                        className="flex gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                                                {instruction.id + 1}
                                            </span>
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 pt-1">
                                            {instruction.text}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 italic">No instructions parsed yet</p>
                            )}
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-start gap-2">
                            <span>ℹ️</span>
                            <span>
                                You can adjust servings, add more ingredients, and modify instructions after saving to your library.
                            </span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save to Library
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
