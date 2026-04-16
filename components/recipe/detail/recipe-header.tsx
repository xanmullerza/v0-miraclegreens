'use client';

import React from 'react';
import { ArrowLeft, Activity, Layers, UtensilsCrossed, ShoppingBasket, Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

const TABS = [
    { key: 'recipe' as const, label: 'Recipe', icon: Layers, muted: 'text-emerald-400/50 border-emerald-500/30', activeGlow: 'text-emerald-400 border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/20' },
    { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, muted: 'text-violet-400/50 border-violet-500/30', activeGlow: 'text-violet-400 border-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.35)] ring-1 ring-violet-500/20' },
] as const;

const ACTION_BUTTONS = [
    { key: 'favorite' as const, label: 'Favorite', icon: Heart, muted: 'text-rose-400/50 border-rose-500/30', activeGlow: 'text-rose-400 border-rose-400 shadow-[0_0_22px_rgba(251,113,133,0.35)] ring-1 ring-rose-500/20' },
    { key: 'share' as const, label: 'Share', icon: Share2, muted: 'text-sky-400/50 border-sky-500/30', activeGlow: 'text-sky-400 border-sky-400 shadow-[0_0_22px_rgba(56,189,248,0.35)] ring-1 ring-sky-500/20' },
] as const;

interface RecipeHeaderProps {
    ctx: RecipeDetailCtx;
    /** When true, renders the compact card-shell header (foods-page style). When false, renders the sticky chatbot header. */
    standalone?: boolean;
}

export function RecipeHeader({ ctx, standalone = false }: RecipeHeaderProps) {
    const { recipe, activeSection, setActiveSection, onBack } = ctx;

    if (!recipe) return null;

    // ── Standalone header (foods-page card style) ─────────────
    if (standalone) {
        return (
            <div className="bg-slate-100/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 py-1.5">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Back + Image + Title */}
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                                title="Back"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        )}

                        {/* Image — same card-within-card as foods page */}
                        <div className="w-10 h-10 shrink-0">
                            <div className="w-full h-full relative p-1 bg-white dark:bg-slate-900 overflow-hidden rounded-xl shadow-xl border border-slate-100 dark:border-slate-800">
                                <div className="w-full h-full rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                    {recipe.image ? (
                                        <img
                                            src={recipe.image}
                                            alt={recipe.title}
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <UtensilsCrossed size={16} className="opacity-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-sm font-black uppercase tracking-tighter text-emerald-400 italic line-clamp-2 whitespace-normal break-words max-w-[240px] leading-tight">
                            {recipe.title}
                        </h2>
                    </div>

                    {/* Right: Section Pills — matching foods page style */}
                    <div className="flex items-center gap-1.5 bg-slate-950/40 dark:bg-slate-800/60 p-1 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
                        {TABS.map(({ key, label, muted, activeGlow }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(prev => prev === key ? null : key)}
                                className={cn(
                                    'py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1rem] transition-all duration-300 whitespace-nowrap px-3 border-2',
                                    activeSection === key ? activeGlow : muted
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Chatbot header (sticky title bar + image grid) ─────────
    return (
        <>
            {/* Sticky title bar */}
            <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white text-left px-2 line-clamp-2 whitespace-normal break-words leading-tight">
                        {recipe.title}
                    </h2>
                </div>
            </div>

            {/* Image + Action Buttons */}
            <div className="flex gap-3 p-4">
                {recipe.image && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {[
                        ...TABS,
                        ...ACTION_BUTTONS,
                    ].map(({ key, label, icon: Icon, muted, activeGlow }) => {
                        const isFavoriteButton = key === 'favorite';
                        const isShareButton = key === 'share';
                        const isActive = isFavoriteButton ? recipe.is_favorite : activeSection === key;

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    if (isFavoriteButton) {
                                        ctx.toggleFavorite();
                                        return;
                                    }
                                    if (isShareButton) {
                                        if (ctx.onShare) { ctx.onShare(recipe); }
                                        else { ctx.setRecipeToShare(recipe); ctx.navigateTo('recipe-share'); }
                                        return;
                                    }
                                    setActiveSection(prev => prev === key ? null : key);
                                }}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all',
                                    isActive ? activeGlow : muted
                                )}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
