'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader2, Activity, UtensilsCrossed, ShoppingBasket, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recipe {
    id: string;
    title: string;
    image: string | null;
    type: string;
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    servings: number;
    diet: string[];
    is_favorite: boolean;
    source?: string;
}

interface Ingredient {
    id: string;
    item: string;
    amount: string;
    base_ingredient: string;
    weight_g: number;
}

interface Instruction {
    step_text: string;
    step_order: number;
}

interface ChatbotRecipeDetailProps {
    recipeId: string;
    onBack: () => void;
}

export function ChatbotRecipeDetail({ recipeId, onBack }: ChatbotRecipeDetailProps) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'recipe' | 'nutrition' | 'related' | 'management' | null>('recipe');

    useEffect(() => {
        fetchRecipeDetails();
    }, [recipeId]);

    const fetchRecipeDetails = async () => {
        try {
            setLoading(true);

            // Fetch recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single();

            if (recipeError) throw recipeError;
            setRecipe(recipeData);

            // Fetch ingredients
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('id', { ascending: true });

            if (ingredientsError) throw ingredientsError;
            setIngredients(ingredientsData || []);

            // Fetch instructions
            const { data: instructionsData, error: instructionsError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('step_order', { ascending: true });

            if (instructionsError) throw instructionsError;
            setInstructions(instructionsData || []);
        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load recipe details');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!recipe) return;
        const newStatus = !recipe.is_favorite;
        try {
            if (!String(recipe.id).startsWith('local-')) {
                const { error } = await supabase
                    .from('recipes')
                    .update({ is_favorite: newStatus })
                    .eq('id', recipe.id);
                if (error) throw error;
            }
            setRecipe({ ...recipe, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to favourites' : 'Removed from favourites');
        } catch (error: any) {
            toast.error('Failed to update favourite status');
        }
    };

    const totalWeight = ingredients.reduce((sum, ing) => sum + (ing.weight_g || 0), 0);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-500">Loading recipe...</p>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
                <p className="text-slate-500 text-center">Recipe not found</p>
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
            {/* Header with back button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                    title="Back"
                >
                    <ArrowLeft size={18} />
                </button>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex-1 text-center px-2 truncate">
                    {recipe.title}
                </h2>
                <button
                    onClick={toggleFavorite}
                    className="p-1.5 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-rose-500"
                >
                    <Heart
                        size={18}
                        className={recipe.is_favorite ? 'fill-rose-500 text-rose-500' : ''}
                    />
                </button>
            </div>

            {/* Recipe Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Image and Action Buttons */}
                <div className="flex gap-3">
                    {/* Square Image */}
                    {recipe.image && (
                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Action Buttons Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        {[
                            { key: 'recipe' as const, label: 'Recipe', icon: Layers, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'related' as const, label: 'Related', icon: UtensilsCrossed, color: 'text-amber-500', activeBg: 'bg-amber-500/10 border-amber-500/30' },
                            { key: 'management' as const, label: 'Management', icon: ShoppingBasket, color: 'text-blue-500', activeBg: 'bg-blue-500/10 border-blue-500/30' },
                        ].map(({ key, label, icon: Icon, color, activeBg }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(prev => prev === key ? null : key)}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                                    activeSection === key
                                        ? `${activeBg} ${color}`
                                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                )}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Calories</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.calories)} kcal</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Prep Time</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{recipe.prep_time} min</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Servings</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{recipe.servings} servings</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Weight</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(totalWeight)} g</p>
                    </div>
                </div>

                {/* Content Sections */}
                {activeSection === 'recipe' && (
                    <>
                        {/* Type */}
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold capitalize">
                            {recipe.type}
                        </div>

                        {/* Macros */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                                Nutritional Info (per serving)
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Protein</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.protein * 10) / 10}g</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Fat</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.fat * 10) / 10}g</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Carbs</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.carbs * 10) / 10}g</p>
                                </div>
                            </div>
                        </div>

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
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
                                    Ingredients ({ingredients.length})
                                </h3>
                                <ul className="space-y-2">
                                    {ingredients.map((ing, idx) => (
                                        <li key={ing.id || idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">•</span>
                                            <span>
                                                <span className="font-medium">{ing.base_ingredient || ing.item}</span> - {ing.amount}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Instructions */}
                        {instructions.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
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
                )}

                {activeSection === 'nutrition' && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Nutrition section</p>
                    </div>
                )}

                {activeSection === 'related' && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Related recipes</p>
                    </div>
                )}

                {activeSection === 'management' && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Management options</p>
                    </div>
                )}
            </div>
        </div>
    );
}
