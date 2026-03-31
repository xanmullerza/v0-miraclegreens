import React from 'react';
import { Sparkles, X as CloseIcon, Loader2, Check, Plus, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PendingIngredient } from './types';

interface MagicPasteSectionProps {
    magicText: string;
    setMagicText: (t: string) => void;
    isParsing: boolean;
    handleMagicParse: () => void;
    pendingIngredients: PendingIngredient[];
    setPendingIngredients: (p: PendingIngredient[]) => void;
    setShowMagicPaste: (s: boolean) => void;
    confirmPendingIngredient: (i: number) => void;
    confirmAllIngredients: () => void;
    handleUSDASearchForPending: (i: number) => void;
    rejectPendingIngredient: (i: number) => void;
    setShowPicker: (s: boolean) => void;
    isAdmin: boolean;
}

export function MagicPasteSection({
    magicText, setMagicText, isParsing, handleMagicParse, pendingIngredients, setPendingIngredients,
    setShowMagicPaste, confirmPendingIngredient, confirmAllIngredients, handleUSDASearchForPending, 
    rejectPendingIngredient, setShowPicker, isAdmin
}: MagicPasteSectionProps) {
    return (
        <div className="p-6 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-widest text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Magic Ingredient Import
                </div>
                <button onClick={() => setShowMagicPaste(false)} className="text-slate-500 hover:text-slate-300">
                    <CloseIcon size={16} />
                </button>
            </div>

            {pendingIngredients.length === 0 ? (
                <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Paste your list of ingredients here. We'll attempt to match each one to our nutritional database automatically.
                    </p>
                    <textarea
                        value={magicText}
                        onChange={(e) => setMagicText(e.target.value)}
                        placeholder="Example:&#10;2 cups raw spinach&#10;500g chicken breast"
                        className="w-full h-32 p-4 text-sm border border-slate-800 bg-slate-950/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleMagicParse}
                            disabled={isParsing || !magicText.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-200"
                        >
                            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Analyze Ingredients
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase text-amber-800/50">{pendingIngredients.length} Items Found</span>
                            {pendingIngredients.some(item => item.status === 'matched' && item.selectedMatch) && (
                                <button
                                    onClick={confirmAllIngredients}
                                    className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1.5"
                                >
                                    <Plus size={12} /> Add All Matched
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setPendingIngredients([]);
                                setMagicText('');
                            }}
                            className="text-[10px] font-black uppercase text-amber-800 hover:text-red-600 transition"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {pendingIngredients.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                                            <span className="text-amber-600 opacity-60">#{(idx + 1).toString().padStart(2, '0')}</span>
                                            {item.raw.amount} {item.raw.item}
                                        </div>

                                        <div className="text-[10px] mt-1.5 min-h-[1.5rem] flex items-center">
                                            {item.status === 'searching' && (
                                                <span className="text-slate-400 flex items-center gap-2 italic">
                                                    <Loader2 size={12} className="animate-spin text-violet-500" /> Clinical Registry Lookup...
                                                </span>
                                            )}

                                            {item.status === 'searching-usda' && (
                                                <span className="text-violet-500 flex items-center gap-2 italic">
                                                    <Loader2 size={12} className="animate-spin" /> Querying Global Database...
                                                </span>
                                            )}

                                            {item.status === 'matched' && item.matches.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Check size={12} className="text-emerald-500" />
                                                    <select
                                                        className="bg-transparent border-none text-[10px] font-bold text-emerald-600 focus:ring-0 p-0 cursor-pointer hover:underline max-w-[200px]"
                                                        value={item.selectedMatch?.id || item.selectedMatch?.fdcId}
                                                        onChange={(e) => {
                                                            const selected = item.matches.find((m: any) => (m.id || m.fdcId) === e.target.value);
                                                            const updated = [...pendingIngredients];
                                                            updated[idx].selectedMatch = selected || null;
                                                            setPendingIngredients(updated);
                                                        }}
                                                    >
                                                        {item.matches.map((m: any) => (
                                                            <option key={m.id || m.fdcId} value={m.id || m.fdcId} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                                                {m.name} ({m.source === 'local' ? 'LOCAL' : 'USDA'})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {item.status === 'no-match-local' && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-bold uppercase tracking-tight">Registry mismatch</span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleUSDASearchForPending(idx)}
                                                            className="text-violet-600 hover:text-violet-700 font-black flex items-center gap-1.5 transition-all hover:gap-2"
                                                        >
                                                            <Sparkles size={10} /> Search Global?
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {item.status === 'matched' && (
                                            <button
                                                onClick={() => confirmPendingIngredient(idx)}
                                                className={cn(
                                                    "h-10 px-4 rounded-xl text-white shadow-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
                                                    item.selectedMatch?.source === 'local'
                                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                                                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                                                )}
                                            >
                                                <Plus size={14} /> Add
                                            </button>
                                        )}

                                        <button
                                            onClick={() => rejectPendingIngredient(idx)}
                                            className="h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-100 dark:border-slate-800"
                                        >
                                            <CloseIcon size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pendingIngredients.every(i => i.status !== 'searching') && (
                        <div className="pt-4 flex justify-between items-center">
                            <p className="text-[10px] text-amber-800/40 font-medium">Review and add individual items above</p>
                            <button
                                onClick={() => setShowMagicPaste(false)}
                                className="text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-lg hover:bg-amber-200 transition"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
