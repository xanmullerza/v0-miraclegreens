'use client';

import React from 'react';
import { ArrowLeft, Activity, Layers, UtensilsCrossed, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { useRecipeDetail } from './use-recipe-detail';

type RecipeDetailCtx = ReturnType<typeof useRecipeDetail>;

const TABS = [
    { key: 'recipe' as const, label: 'Recipe', icon: Layers, color: 'text-emerald-500', activeGlow: 'text-emerald-400 border-emerald-500/40 shadow-[0_0_22px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/20' },
    { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, color: 'text-emerald-500', activeGlow: 'text-emerald-400 border-emerald-500/40 shadow-[0_0_22px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/20' },
    { key: 'related' as const, label: 'Related', icon: UtensilsCrossed, color: 'text-amber-500', activeGlow: 'text-amber-400 border-amber-500/40 shadow-[0_0_22px_rgba(251,191,36,0.35)] ring-1 ring-amber-500/20' },
    { key: 'management' as const, label: 'Management', icon: ShoppingBasket, color: 'text-blue-500', activeGlow: 'text-blue-400 border-blue-500/40 shadow-[0_0_22px_rgba(96,165,250,0.35)] ring-1 ring-blue-500/20' },
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
                        <h2 className="text-sm font-black uppercase tracking-tighter text-emerald-400 italic truncate max-w-[240px]">
                            {recipe.title}
                        </h2>
                    </div>

                    {/* Right: Section Pills — matching foods page style */}
                    <div className="flex items-center gap-1.5 bg-slate-950/40 dark:bg-slate-800/60 p-1 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
                        {TABS.map(({ key, label, activeGlow }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(prev => prev === key ? null : key)}
                                className={cn(
                                    'py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1rem] transition-all duration-300 whitespace-nowrap px-3 border',
                                    activeSection === key
                                        ? `border-current ${activeGlow}`
                                        : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-400/40'
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
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {onBack ? (
                    <button onClick={onBack} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400" title="Back">
                        <ArrowLeft size={18} />
                    </button>
                ) : <div className="w-9" />}
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex-1 text-center px-2 truncate">
                    {recipe.title}
                </h2>
                <div className="w-9" />
            </div>

            {/* Image + Action Buttons */}
            <div className="flex gap-3 p-4">
                {recipe.image && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {TABS.map(({ key, label, icon: Icon, activeGlow }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSection(prev => prev === key ? null : key)}
                            className={cn(
                                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                                activeSection === key
                                    ? `border-current ${activeGlow}`
                                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            )}
                        >
                            <Icon size={14} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
