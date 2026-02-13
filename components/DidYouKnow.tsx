import React from 'react';
import { Lightbulb, ShieldCheck, Sparkles, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhytoWithSource {
    description: string;
    sources: string[]; // food names that contribute this phytonutrient
}

interface DidYouKnowProps {
    /** For a single food item: just pass the phytonutrients map */
    phytonutrients?: Record<string, string>;
    /** For recipes/meals: pass phytonutrients with their contributing food sources */
    phytonutrientsWithSources?: Record<string, PhytoWithSource>;
    /** Name of the food item (used for single-food context) */
    foodName?: string;
    className?: string;
}

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export function DidYouKnow({ phytonutrients, phytonutrientsWithSources, foodName, className }: DidYouKnowProps) {
    // Build a unified list of entries
    const entries: { name: string; description: string; sources: string[] }[] = [];

    if (phytonutrientsWithSources) {
        Object.entries(phytonutrientsWithSources).forEach(([name, { description, sources }]) => {
            entries.push({ name, description, sources });
        });
    } else if (phytonutrients) {
        Object.entries(phytonutrients).forEach(([name, desc]) => {
            entries.push({ name, description: desc, sources: foodName ? [foodName] : [] });
        });
    }

    if (entries.length === 0) return null;

    const isSingleFood = !!foodName && !phytonutrientsWithSources;

    return (
        <div className={cn("p-6 pt-5 rounded-3xl border bg-slate-900 border-slate-800 mb-6", className)}>
            <h4 className="font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px] text-amber-400">
                <Leaf className="h-4 w-4" /> PHYTONUTRIENTS
            </h4>

            <div className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2 transition-colors">
                {isSingleFood ? (
                    <>
                        <span className="text-amber-400 font-bold">{foodName}</span> contains powerful plant-based &quot;bodyguards&quot; that protect your cells from stress.
                    </>
                ) : (
                    <>
                        This profile is loaded with plant-based &quot;bodyguards&quot; sourced from the multiple ingredients.
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {entries.map(({ name, description, sources }) => (
                    <div
                        key={name}
                        className="p-4 rounded-2xl border border-amber-900/50 bg-white dark:bg-slate-950 hover:shadow-md transition-all relative group"
                    >
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-amber-500" />
                            {name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                            {description}
                        </p>
                        {sources.length > 0 && !isSingleFood && (
                            <p className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                                <Leaf size={9} className="flex-shrink-0" />
                                From: {sources.join(', ')}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-amber-500/30 uppercase tracking-widest italic pt-2">
                <Sparkles size={11} />
                Molecular Health Defense Active
            </div>
        </div>
    );
}
