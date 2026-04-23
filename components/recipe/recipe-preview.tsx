'use client';

import React, { useState } from 'react';
import { X, ChefHat, Clock, Users, Save, ArrowLeft, Edit2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { toast } from 'sonner';

interface CookwareItem {
    name: string;
    quantity?: string;
}

interface TimerItem {
    name?: string;
    duration: string;
    unit?: string;
}

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    source_url: string;
    image_url?: string;
    image?: string;
    metadata?: Record<string, string | number | string[]>;
    cookware?: CookwareItem[];
    timers?: TimerItem[];
}

interface RecipePreviewProps {
    isOpen: boolean;
    recipe: ParsedRecipe | null;
    onClose: () => void;
    onSave?: (recipe: ParsedRecipe) => void;
}

export function RecipePreview({ isOpen, recipe, onClose, onSave }: RecipePreviewProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
    const { saveRecipe, user } = useDataPersistence();

    if (!isOpen || !recipe) {
        return null;
    }

    // Parse ingredients into array
    const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'instructions' | 'nutrition'>('details');

    const ingredientsList = recipe.ingredients_text
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, idx: number) => ({
            id: idx,
            text: line.trim()
        }));

    const instructionsList = recipe.instructions_text
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string, idx: number) => ({
            id: idx,
            text: line.trim()
        }));

    const nutritionEntries = recipe.metadata
        ? Object.entries(recipe.metadata)
            .filter(([key, value]) => ['calories', 'energy', 'protein', 'fat', 'carbs', 'carbohydrates', 'sugar', 'fiber', 'sodium'].includes(key.toLowerCase()))
            .map(([key, value]) => ({
                key,
                value: String(value)
            }))
        : [];

    const equipmentList = recipe.cookware || [];
    const timerList = recipe.timers || [];

    const metadataEntries = recipe.metadata
        ? Object.entries(recipe.metadata).filter(([key]) => !['calories', 'energy', 'protein', 'fat', 'carbs', 'carbohydrates', 'sugar', 'fiber', 'sodium'].includes(key.toLowerCase()))
        : [];

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
            const result = await saveRecipe(recipeData, ingredientsForSave, instructionsForSave);

            // Extract recipe ID from result or generate one
            const recipeId = result?.id || `recipe-${Date.now()}`;
            
            // If we got here, the recipe was saved successfully
            toast.success('The recipe is now saved to your library!');
            setSavedRecipeId(recipeId);
            
            // Call save callback if provided
            if (onSave) {
                onSave(recipe);
            }
        } catch (error: any) {
            console.error('Error saving recipe:', error);
            // Show friendly error message
            const errorMsg = error?.message || 'Failed to save recipe';
            if (errorMsg.includes('foreign key')) {
                toast.error('Recipe saved but some ingredient links need manual adjustment.');
                // Still close since recipe was saved
                onClose();
            } else if (errorMsg.includes('authenticated')) {
                toast.error('Please log in to save recipes.');
            } else {
                toast.error('Failed to save recipe. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleViewRecipe = () => {
        if (savedRecipeId) {
            onClose();
            router.push(`/?recipeId=${savedRecipeId}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl">
                
                {/* Header */}
                <div className="sticky top-0 z-40 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
                        Review Recipe
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-muted hover:bg-rose-100 dark:hover:bg-rose-900/30 flex items-center justify-center transition-all"
                        title="Close"
                    >
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Hero Image & Title */}
                    <div className="space-y-4">
                        {recipe.image_url && (
                            <div className="w-full h-64 rounded-xl overflow-hidden bg-muted">
                                <img
                                    src={recipe.image_url}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black text-foreground leading-tight">
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

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                                { id: 'details', label: 'Details' },
                                { id: 'ingredients', label: 'Ingredients' },
                                { id: 'instructions', label: 'Instructions' },
                                { id: 'nutrition', label: 'Nutrition' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={cn(
                                        'py-3 px-3 rounded-2xl text-sm font-black uppercase tracking-[0.25em] transition-all border',
                                        activeTab === tab.id
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-[2rem] border border-border bg-card p-6 space-y-6">
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Servings</p>
                                            <p className="text-3xl font-black text-foreground">{recipe.servings || 4}</p>
                                        </div>
                                        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Prep Time</p>
                                            <p className="text-3xl font-black text-foreground">{recipe.prep_time || 30}</p>
                                            <p className="text-xs uppercase tracking-widest text-muted-foreground">minutes</p>
                                        </div>
                                        <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Cook Time</p>
                                            <p className="text-3xl font-black text-foreground">{recipe.cook_time ?? '-'}</p>
                                            <p className="text-xs uppercase tracking-widest text-muted-foreground">minutes</p>
                                        </div>
                                    </div>

                                    {equipmentList.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-base font-bold uppercase tracking-[0.25em] text-foreground">Equipment</h3>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {equipmentList.map((cw, index) => (
                                                    <div key={index} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4">
                                                        <p className="font-semibold text-foreground">{cw.name}</p>
                                                        {cw.quantity && <p className="text-sm text-muted-foreground">{cw.quantity}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {timerList.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-base font-bold uppercase tracking-[0.25em] text-foreground">Timers</h3>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {timerList.map((timer, index) => (
                                                    <div key={index} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4">
                                                        <p className="font-semibold text-foreground">
                                                            {timer.name ? `${timer.name}` : 'Timer'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {timer.duration}{timer.unit ? ` ${timer.unit}` : ''}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {metadataEntries.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-base font-bold uppercase tracking-[0.25em] text-foreground">Recipe Details</h3>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {metadataEntries.map(([key, value]) => (
                                                    <div key={key} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4">
                                                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{key.replace(/_/g, ' ')}</p>
                                                        <p className="text-sm text-foreground break-words">{String(value)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'ingredients' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold uppercase tracking-[0.25em]">Ingredients</h3>
                                        <span className="text-sm text-muted-foreground">{ingredientsList.length} item{ingredientsList.length === 1 ? '' : 's'}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {ingredientsList.length > 0 ? (
                                            ingredientsList.map((ingredient) => (
                                                <div key={ingredient.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                                                    {ingredient.text}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 italic">No ingredients parsed yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'instructions' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold uppercase tracking-[0.25em]">Instructions</h3>
                                        <span className="text-sm text-muted-foreground">{instructionsList.length} step{instructionsList.length === 1 ? '' : 's'}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {instructionsList.length > 0 ? (
                                            instructionsList.map((instruction) => (
                                                <div key={instruction.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="h-8 w-8 rounded-2xl bg-emerald-600 text-white grid place-items-center font-black">{instruction.id + 1}</div>
                                                        <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">Step</p>
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-foreground">{instruction.text}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 italic">No instructions parsed yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'nutrition' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold uppercase tracking-[0.25em]">Nutrition</h3>
                                        <span className="text-sm text-muted-foreground">Metadata view</span>
                                    </div>
                                    {nutritionEntries.length > 0 ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {nutritionEntries.map((entry) => (
                                                <div key={entry.key} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950">
                                                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{entry.key.replace(/_/g, ' ')}</p>
                                                    <p className="text-xl font-black text-foreground">{entry.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 italic">No nutrition metadata found in this recipe.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex gap-3">
                    {savedRecipeId ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border-2 border-border text-foreground/70 font-bold uppercase tracking-wider text-sm hover:bg-muted transition-all active:scale-95"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleViewRecipe}
                                className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowRight size={16} />
                                View Recipe
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border-2 border-border text-foreground/70 font-bold uppercase tracking-wider text-sm hover:bg-muted transition-all active:scale-95"
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
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
}
