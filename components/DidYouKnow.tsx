import React from 'react';
import { Lightbulb, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DidYouKnowProps {
    phytonutrients?: Record<string, string>;
    className?: string;
}

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm", className)}>
        {children}
    </div>
);

export function DidYouKnow({ phytonutrients, className }: DidYouKnowProps) {
    if (!phytonutrients || Object.keys(phytonutrients).length === 0) return null;

    return (
        <Card className={cn("overflow-hidden border-none bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20", className)}>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg text-white">
                        <Lightbulb size={20} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter italic text-amber-600 dark:text-amber-400">
                        Did You Know?
                    </h3>
                </div>

                <div className="space-y-4 text-left">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                        Vitamins keep your systems running, but <span className="text-amber-600 dark:text-amber-500 underline decoration-amber-200 underline-offset-4">Phytonutrients</span> are the plant-based "bodyguards" that protect your cells from stress and help you stay youthful.
                    </p>

                    <div className="grid gap-3">
                        {Object.entries(phytonutrients).map(([name, desc], i) => (
                            <div key={name} className="flex gap-3 items-start group">
                                <div className="mt-1 p-1 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <ShieldCheck size={14} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                                        {name}
                                    </p>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-500 leading-snug">
                                        {desc}
                                    </p>
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
