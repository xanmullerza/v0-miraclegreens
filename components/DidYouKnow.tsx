import React, { useState } from 'react';
import { ShieldCheck, Leaf, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhytoWithSource {
    description: string;
    sources: string[];
}

interface DidYouKnowProps {
    phytonutrients?: Record<string, string>;
    phytonutrientsWithSources?: Record<string, PhytoWithSource>;
    foodName?: string;
    className?: string;
}

export function DidYouKnow({ phytonutrients, phytonutrientsWithSources, foodName, className }: DidYouKnowProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

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
            <div className="text-[10px] text-slate-400 mb-4 border-b border-slate-800 pb-3">
                {isSingleFood ? (
                    <><span className="text-amber-400 font-bold">{foodName}</span> contains powerful plant-based &quot;bodyguards&quot; that protect your cells from stress.</>
                ) : (
                    <>This profile is loaded with plant-based &quot;bodyguards&quot; sourced from the multiple ingredients.</>
                )}
            </div>

            <div className="space-y-1">
                {entries.map(({ name, description, sources }, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div key={name} className="rounded-xl border border-slate-800 overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
                            >
                                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
                                    <ShieldCheck size={13} className="text-amber-500 shrink-0" />
                                    {name}
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={cn("text-slate-500 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
                                />
                            </button>
                            {isOpen && (
                                <div className="px-4 pb-4 pt-1 border-t border-slate-800 bg-slate-950/40">
                                    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
                                    {sources.length > 0 && !isSingleFood && (
                                        <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mt-3 pt-2 border-t border-slate-800">
                                            <Leaf size={10} className="shrink-0" />
                                            From: {sources.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
