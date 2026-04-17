import React from 'react';
import { Beef, BookOpen, Activity, ShoppingCart, Salad } from 'lucide-react';
import { cn, formatFoodName } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { FOOD_DETAILS } from '@/lib/data/food-details';

const TABS = [
    { key: 'facts' as const, label: 'About', icon: BookOpen, muted: 'text-cyan-400/50 border-cyan-500/30', activeGlow: 'text-cyan-400 border-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.35)] ring-1 ring-cyan-500/20' },
    { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, muted: 'text-violet-400/50 border-violet-500/30', activeGlow: 'text-violet-400 border-violet-400 shadow-[0_0_22px_rgba(167,139,250,0.35)] ring-1 ring-violet-500/20' },
] as const;

const ACTION_BUTTONS = [
    { key: 'recipes' as const, label: 'Recipes', icon: Salad, muted: 'text-emerald-400/50 border-emerald-500/30', activeGlow: 'text-emerald-400 border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/20' },
    { key: 'management' as const, label: 'Management', icon: ShoppingCart, muted: 'text-sky-400/50 border-sky-500/30', activeGlow: 'text-sky-400 border-sky-400 shadow-[0_0_22px_rgba(56,189,248,0.35)] ring-1 ring-sky-500/20' },
] as const;

interface FoodHeaderProps {
    ctx: FoodDetailContextType;
}

export function FoodHeader({ ctx }: FoodHeaderProps) {
    const { food, activeSection, setActiveSection, setQuickAddQty, setQuickAddWeight } = ctx;

    if (!food) return null;

    return (
        <>
            {/* Sticky title bar */}
            <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white text-left px-2 line-clamp-2 whitespace-normal break-words leading-tight">
                        {formatFoodName(food.common_name || food.name)}
                    </h2>
                </div>
            </div>

            {/* Image Section */}
            <div className="flex gap-3 p-4">
                {food.image && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                    </div>
                )}
                
                {/* Navigation Pills 2x2 Grid */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {[
                        ...TABS.filter(tab => !(tab.key === 'facts' && !food.details && !FOOD_DETAILS[food.id])),
                        ...ACTION_BUTTONS,
                    ].map(({ key, label, icon: Icon, muted, activeGlow }) => {
                        const isActive = activeSection === key;

                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === 'management') { setQuickAddQty('1'); setQuickAddWeight(''); }
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
