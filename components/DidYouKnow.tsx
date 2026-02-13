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
        <Card className={cn("overflow-hidden border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20", className)}>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg text-white">
                        <Lightbulb size={20} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter italic text-amber-600 dark:text-amber-400">
                        Phytonutrients
                    </h3>
                </div>

                <div className="space-y-4 text-left">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        {isSingleFood ? (
                            <>
                                <span className="text-amber-600 dark:text-amber-400 font-black">{foodName}</span> contains powerful{' '}
                                <span className="text-amber-600 dark:text-amber-500 underline decoration-amber-200 underline-offset-4">Phytonutrients</span>
                                {' '}— plant-based &quot;bodyguards&quot; that protect your cells from stress and help you stay youthful.
                            </>
                        ) : (
                            <>
                                This meal is loaded with{' '}
                                <span className="text-amber-600 dark:text-amber-500 underline decoration-amber-200 underline-offset-4">Phytonutrients</span>
                                {' '}— plant-based &quot;bodyguards&quot; sourced from the ingredients in this recipe.
                            </>
                        )}
                    </p>

                    <div className="grid gap-3">
                        {entries.map(({ name, description, sources }) => (
                            <div key={name} className="flex gap-3 items-start group">
                                <div className="mt-1 p-1 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <ShieldCheck size={14} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                        {name}
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-500 leading-snug">
                                        {description}
                                    </p>
                                    {sources.length > 0 && !isSingleFood && (
                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                            <Leaf size={10} className="flex-shrink-0" />
                                            Found in: {sources.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-amber-500/40 uppercase tracking-widest italic">
                        <Sparkles size={12} />
                        Molecular Health Defense Active
                    </div>
                </div>
            </div>
        </Card>
    );
}
