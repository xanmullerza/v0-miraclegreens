import React from 'react';
import { Beef } from 'lucide-react';
import { cn, formatFoodName } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { FOOD_DETAILS } from '@/lib/data/food-details';

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
                
                {/* Navigation Pills */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                    {[
                        { key: 'facts' as const, label: 'About', hidden: !(food.details || FOOD_DETAILS[food.id]) },
                        { key: 'nutrition' as const, label: 'Nutrition' },
                        { key: 'recipes' as const, label: 'Recipes' },
                        { key: 'management' as const, label: 'Management' },
                    ].filter(b => !b.hidden).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setActiveSection(prev => prev === key ? null : key);
                                if (key === 'management') { setQuickAddQty('1'); setQuickAddWeight(''); }
                            }}
                            className={cn(
                                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 text-[9px] font-black uppercase tracking-widest transition-all',
                                activeSection === key
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10 border-emerald-400"
                                    : "text-slate-500 hover:text-slate-300 border-slate-600"
                            )}
                        >
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
