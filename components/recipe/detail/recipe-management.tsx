'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Share2, Wand2, Pencil, Trash2, ShoppingBasket, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

// ── DeleteButton (private) ────────────────────────────────────
function DeleteButton({ recipeId, onDeleted }: { recipeId: string; onDeleted: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirming) { setConfirming(true); return; }

        setDeleting(true);
        try {
            if (String(recipeId).startsWith('local-')) {
                const localData = localStorage.getItem('local_recipes');
                if (localData) {
                    const recipes = JSON.parse(localData);
                    const filtered = recipes.filter((r: any) => r.id !== recipeId);
                    localStorage.setItem('local_recipes', JSON.stringify(filtered));
                }
            } else {
                const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
                if (error) throw error;
            }
            onDeleted();
        } catch (error: any) {
            toast.error(`Delete failed: ${error.message}`);
            setConfirming(false);
        } finally {
            setDeleting(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex flex-col items-start justify-between p-4 rounded-2xl border bg-rose-600 border-rose-500 text-white animate-in zoom-in-95 duration-200 h-full gap-2 shadow-xl shadow-rose-600/20 relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-20">
                    <Trash2 size={32} />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-rose-200">Permanence</p>
                    <p className="text-sm font-bold">Confirm Delete?</p>
                </div>
                <div className="flex gap-2 w-full relative z-10">
                    <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors flex items-center justify-center">
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                        className="flex-1 py-2 bg-rose-700/50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button onClick={handleDelete}
            className="w-full flex flex-col items-start justify-between p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 transition-all active:scale-95 text-left h-full group relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trash2 size={32} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Permanence</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Delete Recipe</p>
            </div>
            <Trash2 size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
        </button>
    );
}

// ── RecipeManagement ──────────────────────────────────────────
interface RecipeManagementProps {
    ctx: RecipeDetailCtx;
}

export function RecipeManagement({ ctx }: RecipeManagementProps) {
    const { recipe, isOwner, toggleFavorite, handleEditClick, onBack, onShare, setRecipeToShare, navigateTo } = ctx;

    if (!recipe) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
                {/* Favourite */}
                <button
                    onClick={toggleFavorite}
                    className={cn(
                        "p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between h-24 group relative overflow-hidden",
                        recipe.is_favorite
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                            : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500"
                    )}
                >
                    <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Heart size={32} className={recipe.is_favorite ? "fill-current" : ""} />
                    </div>
                    <div>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                            recipe.is_favorite ? "text-rose-500" : "text-slate-500"
                        )}>Collection</p>
                        <p className={cn(
                            "text-sm font-bold truncate",
                            recipe.is_favorite ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                        )}>
                            {recipe.is_favorite ? 'Favourited' : 'Add to Favourites'}
                        </p>
                    </div>
                    <Heart size={16} className={cn("transition-transform group-hover:scale-110", recipe.is_favorite ? "fill-current" : "")} />
                </button>

                {/* Share */}
                <button
                    onClick={() => {
                        if (recipe) {
                            if (onShare) { onShare(recipe); }
                            else { setRecipeToShare(recipe); navigateTo('recipe-share'); }
                        }
                    }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all active:scale-95 flex flex-col justify-between h-24 group relative overflow-hidden"
                >
                    <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Share2 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Distribution</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Share Recipe</p>
                    </div>
                    <Share2 size={16} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </button>

                {/* Edit / Remix */}
                <button
                    onClick={handleEditClick}
                    className={cn(
                        "p-4 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between h-24 group relative overflow-hidden",
                        isOwner
                            ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 shadow-sm"
                    )}
                >
                    <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        {isOwner ? <Pencil size={32} /> : <Wand2 size={32} />}
                    </div>
                    <div>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                            isOwner ? "text-slate-500" : "text-indigo-500"
                        )}>Modification</p>
                        <p className={cn(
                            "text-sm font-bold",
                            isOwner ? "text-slate-900 dark:text-white" : "text-indigo-600 dark:text-indigo-400"
                        )}>
                            {isOwner ? 'Edit Content' : 'Remix & Save'}
                        </p>
                    </div>
                    {isOwner ? <Pencil size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" /> : <Wand2 size={16} className="text-indigo-500" />}
                </button>

                {/* Delete */}
                {isOwner && (
                    <div className="relative h-24">
                        <DeleteButton
                            recipeId={recipe.id}
                            onDeleted={() => { toast.success('Recipe deleted successfully'); if (onBack) onBack(); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
