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
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-rose-600 border-rose-500 text-white animate-in zoom-in-95 duration-200 text-center gap-3 shadow-xl shadow-rose-600/20">
                <p className="font-black text-[9px] uppercase tracking-widest leading-tight">Delete?</p>
                <div className="flex gap-2 w-full">
                    <button onClick={handleDelete} disabled={deleting}
                        className="flex-1 py-1.5 bg-white text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors flex items-center justify-center">
                        {deleting ? <Loader2 size={10} className="animate-spin" /> : 'Yes'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                        className="flex-1 py-1.5 bg-rose-700/50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-colors">
                        No
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button onClick={handleDelete}
            className="w-full flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-rose-500/30 hover:text-rose-600 transition-all active:scale-95 text-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-rose-500 transition-all">
                <Trash2 size={18} />
            </div>
            <p className="font-black text-[9px] uppercase tracking-widest leading-none">Delete</p>
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
            <div className="pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500 italic flex items-center gap-2">
                    <ShoppingBasket size={16} />
                    Recipe Management
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Favourite */}
                <button
                    onClick={toggleFavorite}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 text-center gap-3 group",
                        recipe.is_favorite
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                    )}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                        recipe.is_favorite ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                    )}>
                        <Heart size={18} className={recipe.is_favorite ? "fill-current" : ""} />
                    </div>
                    <p className="font-black text-[9px] uppercase tracking-widest leading-none">
                        {recipe.is_favorite ? 'Favourited' : 'Favourite'}
                    </p>
                </button>

                {/* Share */}
                <button
                    onClick={() => {
                        if (recipe) {
                            if (onShare) { onShare(recipe); }
                            else { setRecipeToShare(recipe); navigateTo('recipe-share'); }
                        }
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-cyan-500/30 hover:text-cyan-600 transition-all active:scale-95 text-center gap-3 group"
                >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:text-cyan-500 transition-all">
                        <Share2 size={18} />
                    </div>
                    <p className="font-black text-[9px] uppercase tracking-widest leading-none">Share</p>
                </button>

                {/* Edit / Remix */}
                <button
                    onClick={handleEditClick}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 text-center gap-3 group",
                        isOwner
                            ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-600"
                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
                    )}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full border flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                        isOwner
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 group-hover:text-emerald-500"
                            : "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    )}>
                        {isOwner ? <Pencil size={18} /> : <Wand2 size={18} />}
                    </div>
                    <p className="font-black text-[9px] uppercase tracking-widest leading-none">
                        {isOwner ? 'Edit' : 'Remix & Save'}
                    </p>
                </button>

                {/* Delete */}
                {isOwner && (
                    <div className="relative">
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
