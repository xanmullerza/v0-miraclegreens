import React from 'react';
import { Search, ShoppingBasket, Lightbulb, Globe, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { FOOD_DETAILS } from '@/lib/data/food-details';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

export function FoodFacts({ ctx }: { ctx: FoodDetailContextType }) {
    const { food } = ctx;
    
    if (!food) return null;

    const details = food.details || FOOD_DETAILS[food.id];
    if (!details) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-8 font-display">
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-purple-500 italic flex items-center gap-2">
                    <Search size={18} />
                    Know Your Food
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Producers */}
                {details.producers && (
                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            <ShoppingBasket size={14} /> Top Producers
                        </div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                            {details.producers}
                        </p>
                    </Card>
                )}

                {/* Facts */}
                {details.facts && details.facts.length > 0 && (
                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest text-[10px]">
                            <Lightbulb size={14} /> Culinary Facts & Uses
                        </div>
                        <ul className="space-y-3">
                            {details.facts.map((fact: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="text-purple-500 font-bold mt-1">✨</span>
                                    <span className="leading-snug font-medium italic">{fact}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {/* History */}
                {details.history && (
                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest text-[10px]">
                            <Globe size={14} /> Origin & History
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {details.history}
                        </p>
                    </Card>
                )}

                {/* Benefits */}
                {details.benefits && details.benefits.length > 0 && (
                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">
                            <ShieldCheck size={14} /> Key Benefits
                        </div>
                        <ul className="space-y-3">
                            {details.benefits.map((benefit: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="text-blue-500 font-bold mt-1">•</span>
                                    <span className="leading-snug font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}
