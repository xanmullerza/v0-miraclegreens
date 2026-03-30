import React from 'react';
import { Beef } from 'lucide-react';
import { cn, formatFoodName } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { FOOD_DETAILS } from '@/lib/data/food-details';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

interface FoodHeaderProps {
    ctx: FoodDetailContextType;
}

export function FoodHeader({ ctx }: FoodHeaderProps) {
    const { food, activeSection, setActiveSection, setQuickAddQty, setQuickAddWeight } = ctx;

    if (!food) return null;

    return (
        <div className="bg-slate-100/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 py-1.5">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Title and Image */}
                <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="w-10 h-10 shrink-0">
                        <Card className="w-full h-full relative p-1 bg-white dark:bg-slate-900 border-none group overflow-hidden rounded-xl">
                            <div className="w-full h-full rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                {food.image ? (
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <Beef size={20} className="opacity-10" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                    
                    {/* Title */}
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-tighter text-emerald-400 italic">
                            {formatFoodName(food.common_name || food.name)}
                        </h2>
                    </div>
                </div>

                {/* Right: Section Pills */}
                <div className="flex items-center gap-1.5 bg-slate-950/40 dark:bg-slate-800/60 p-1 rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar">
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
                                'py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1rem] transition-all duration-300 whitespace-nowrap px-3',
                                activeSection === key
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
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
