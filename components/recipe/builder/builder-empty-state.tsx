import React from 'react';
import { Wand2, Plus } from 'lucide-react';

interface BuilderEmptyStateProps {
    setShowMagicPaste: (s: boolean) => void;
    setShowPicker: (s: boolean) => void;
}

export function BuilderEmptyState({ setShowMagicPaste, setShowPicker }: BuilderEmptyStateProps) {
    return (
        <div className="py-12 flex flex-col items-center justify-center gap-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Ingredient Protocol</h4>
                <p className="text-sm font-medium text-slate-500">Choose how to document the clinical building blocks</p>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setShowMagicPaste(true)}
                    className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                >
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                        <Wand2 size={32} />
                    </div>
                    <div className="text-center">
                        <div className="font-black text-xs uppercase tracking-widest mb-1 text-slate-800 dark:text-slate-200">Magic Paste</div>
                        <div className="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-widest">Paste list for parsing</div>
                    </div>
                </button>
                <button
                    onClick={() => setShowPicker(true)}
                    className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <div className="text-center">
                        <div className="font-black text-xs uppercase tracking-widest mb-1 text-slate-800 dark:text-slate-200">Manual Build</div>
                        <div className="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-widest">Add items precisely</div>
                    </div>
                </button>
            </div>
        </div>
    );
}
