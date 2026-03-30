'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tag, X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

const PREDEFINED_TAGS = ['#Quick', '#Budget', '#HighProtein', '#Vegan', '#Veggies', '#LowCarb', '#Bulk', '#MealPrep', '#Keto', '#GutHealth'];

interface RecipeTagsDialogProps {
    ctx: RecipeDetailCtx;
}

export function RecipeTagsDialog({ ctx }: RecipeTagsDialogProps) {
    const { recipe, setRecipe, showTagsDialog, setShowTagsDialog } = ctx;

    if (!showTagsDialog || !recipe) return null;

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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                        <Tag size={16} className="text-emerald-500" />
                        Manage Tags
                    </h3>
                    <button onClick={() => setShowTagsDialog(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Difficulty */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</p>
                        <div className="grid grid-cols-3 gap-2">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => handleDifficultyChange(d)}
                                    className={cn(
                                        "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                        recipe.difficulty === d
                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Predefined Tags */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Select Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PREDEFINED_TAGS.map(tag => {
                                const isSelected = (recipe.tags || []).includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleToggleTag(tag)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-[9px] font-bold border transition-all",
                                            isSelected
                                                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Tags */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom Tags</p>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {(recipe.tags || [])
                                    .filter(t => !PREDEFINED_TAGS.includes(t))
                                    .map(tag => (
                                        <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                            {tag}
                                            <button onClick={() => handleRemoveCustomTag(tag)} className="hover:text-rose-500 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                            <form onSubmit={handleAddCustomTag} className="flex gap-2">
                                <input
                                    name="tag"
                                    placeholder="Add custom tag (e.g. #Summer)"
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                />
                                <button className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95">
                                    <Plus size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowTagsDialog(false)}
                        className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
