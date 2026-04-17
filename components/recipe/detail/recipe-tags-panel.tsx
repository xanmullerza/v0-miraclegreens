'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tag, X, Plus, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRecipeDetail } from './use-recipe-detail';
import { PanelWrapper } from '@/components/action-panel/panel-wrapper';

const PREDEFINED_TAGS = ['#Quick', '#Budget', '#HighProtein', '#Vegan', '#Veggies', '#LowCarb', '#Bulk', '#MealPrep', '#Keto', '#GutHealth'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIET_TYPES = ['Balanced', 'Pescatarian', 'Vegetarian', 'Vegan'];

interface RecipeTagsPanelProps {
    recipeId: string;
    onBack: () => void;
}

export function RecipeTagsPanel({ recipeId, onBack }: RecipeTagsPanelProps) {
    const ctx = useRecipeDetail({ recipeId });
    const { recipe, setRecipe, loading } = ctx;

    if (loading) {
        return (
            <PanelWrapper title="Manage Tags">
                <div className="flex items-center justify-center h-64">
                    <p className="text-slate-500 animate-pulse font-black uppercase tracking-widest text-[10px]">Loading...</p>
                </div>
            </PanelWrapper>
        );
    }

    if (!recipe) return null;

    const updateTagsLocally = (newTags: string[]) => {
        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            const localData = localStorage.getItem('local_recipes');
            if (localData) {
                const recipes = JSON.parse(localData);
                const updated = recipes.map((r: any) => r.id === recipe.id ? { ...r, tags: newTags } : r);
                localStorage.setItem('local_recipes', JSON.stringify(updated));
            }
        }
    };

    const handleToggleTag = async (tag: string) => {
        const curTags = recipe.tags || [];
        const isSelected = curTags.includes(tag);
        const newTags = isSelected ? curTags.filter(t => t !== tag) : [...curTags, tag];

        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            updateTagsLocally(newTags);
            setRecipe({ ...recipe, tags: newTags });
        } else {
            const { error } = await supabase.from('recipes').update({ tags: newTags }).eq('id', recipe.id);
            if (!error) setRecipe({ ...recipe, tags: newTags });
            else toast.error('Failed to update tags');
        }
    };

    const handleRemoveCustomTag = async (tag: string) => {
        const newTags = (recipe.tags || []).filter(t => t !== tag);
        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            updateTagsLocally(newTags);
            setRecipe({ ...recipe, tags: newTags });
        } else {
            const { error } = await supabase.from('recipes').update({ tags: newTags }).eq('id', recipe.id);
            if (!error) setRecipe({ ...recipe, tags: newTags });
        }
    };

    const handleAddCustomTag = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.elements.namedItem('tag') as HTMLInputElement;
        const tag = input.value.trim();
        if (tag && !(recipe.tags || []).includes(tag)) {
            const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
            const newTags = [...(recipe.tags || []), formattedTag];

            const isLocal = String(recipe.id).startsWith('local-');
            if (isLocal) {
                updateTagsLocally(newTags);
                setRecipe({ ...recipe, tags: newTags });
                input.value = '';
            } else {
                const { error } = await supabase.from('recipes').update({ tags: newTags }).eq('id', recipe.id);
                if (!error) {
                    setRecipe({ ...recipe, tags: newTags });
                    input.value = '';
                }
            }
        }
    };

    const handleDifficultyChange = async (d: string) => {
        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            const localData = localStorage.getItem('local_recipes');
            if (localData) {
                const recipes = JSON.parse(localData);
                const updated = recipes.map((r: any) => r.id === recipe.id ? { ...r, difficulty: d } : r);
                localStorage.setItem('local_recipes', JSON.stringify(updated));
            }
            setRecipe({ ...recipe, difficulty: d });
            toast.success(`Difficulty set to ${d}`);
        } else {
            const { error } = await supabase.from('recipes').update({ difficulty: d }).eq('id', recipe.id);
            if (!error) {
                setRecipe({ ...recipe, difficulty: d });
                toast.success(`Difficulty set to ${d}`);
            } else {
                toast.error('Failed to update difficulty');
            }
        }
    };

    const handleTypeChange = async (t: string) => {
        const dbValue = t.toLowerCase();
        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            const localData = localStorage.getItem('local_recipes');
            if (localData) {
                const recipes = JSON.parse(localData);
                const updated = recipes.map((r: any) => r.id === recipe.id ? { ...r, type: dbValue } : r);
                localStorage.setItem('local_recipes', JSON.stringify(updated));
            }
            setRecipe({ ...recipe, type: dbValue });
            toast.success(`Meal type set to ${t}`);
        } else {
            const { error } = await supabase.from('recipes').update({ type: dbValue }).eq('id', recipe.id);
            if (!error) {
                setRecipe({ ...recipe, type: dbValue });
                toast.success(`Meal type set to ${t}`);
            } else {
                toast.error('Failed to update meal type');
            }
        }
    };

    const handleDietToggle = async (d: string) => {
        const curDiet = recipe.diet || [];
        const isSelected = curDiet.includes(d);
        const newDiet = isSelected ? curDiet.filter(item => item !== d) : [...curDiet, d];

        const isLocal = String(recipe.id).startsWith('local-');
        if (isLocal) {
            const localData = localStorage.getItem('local_recipes');
            if (localData) {
                const recipes = JSON.parse(localData);
                const updated = recipes.map((r: any) => r.id === recipe.id ? { ...r, diet: newDiet } : r);
                localStorage.setItem('local_recipes', JSON.stringify(updated));
            }
            setRecipe({ ...recipe, diet: newDiet });
        } else {
            const { error } = await supabase.from('recipes').update({ diet: newDiet }).eq('id', recipe.id);
            if (!error) setRecipe({ ...recipe, diet: newDiet });
            else toast.error('Failed to update diet types');
        }
    };

    return (
        <PanelWrapper 
            title="Manage Tags" 
            noPadding
            headerVariant="none"
        >
            <div className="relative flex flex-col h-full bg-white dark:bg-slate-900">
                <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
                    {/* Meal Type */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Meal Type</p>
                        <div className="grid grid-cols-2 gap-2">
                            {MEAL_TYPES.map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleTypeChange(t)}
                                    className={cn(
                                        "py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300",
                                        (recipe.type || '').toLowerCase() === t.toLowerCase()
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-500"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Diet Type */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Diet Type</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DIET_TYPES.map(d => {
                                const isSelected = (recipe.diet || []).includes(d);
                                return (
                                    <button
                                        key={d}
                                        onClick={() => handleDietToggle(d)}
                                        className={cn(
                                            "py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300",
                                            isSelected
                                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-500"
                                        )}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Difficulty Level</p>
                        <div className="grid grid-cols-3 gap-2">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => handleDifficultyChange(d)}
                                    className={cn(
                                        "py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-300",
                                        recipe.difficulty === d
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-500"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Predefined Tags */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Select Tags</p>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map(tag => {
                                const isSelected = (recipe.tags || []).includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleToggleTag(tag)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all duration-300 uppercase tracking-wider",
                                            isSelected
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-300"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Tags */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Custom Tags</p>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {(recipe.tags || [])
                                    .filter(t => !PREDEFINED_TAGS.includes(t))
                                    .map(tag => (
                                        <div key={tag} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-500 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shadow-sm">
                                            {tag}
                                            <button onClick={() => handleRemoveCustomTag(tag)} className="text-emerald-500 hover:text-rose-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                            <form onSubmit={handleAddCustomTag} className="flex gap-2">
                                <input
                                    name="tag"
                                    placeholder="Add custom tag (e.g. #Summer)"
                                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
                                />
                                <button className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                                    <Plus size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Footer Fix - Persistent Cancel/Save buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                    >
                        Save
                    </button>
                </div>
            </div>
        </PanelWrapper>
    );
}
