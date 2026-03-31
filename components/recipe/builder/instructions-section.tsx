import React from 'react';
import { ListOrdered, Wand2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { parseInstructionsOnly } from '@/lib/utils/recipe-parser';

interface InstructionsSectionProps {
    instructions: string[];
    setInstructions: (i: string[]) => void;
    instructionsMode: 'none' | 'magic' | 'manual';
    setInstructionsMode: (m: 'none' | 'magic' | 'manual') => void;
    showMagicInstructions: boolean;
    setShowMagicInstructions: (s: boolean) => void;
    magicInstructionsText: string;
    setMagicInstructionsText: (t: string) => void;
    handleToDetails: () => void;
}

export function InstructionsSection({
    instructions, setInstructions, instructionsMode, setInstructionsMode,
    showMagicInstructions, setShowMagicInstructions, magicInstructionsText, setMagicInstructionsText,
    handleToDetails
}: InstructionsSectionProps) {
    
    const handleAddInstruction = () => setInstructions([...instructions, '']);
    const handleUpdateInstruction = (idx: number, val: string) => {
        const u = [...instructions];
        u[idx] = val;
        setInstructions(u);
    };
    const handleRemoveInstruction = (idx: number) => setInstructions(instructions.filter((_, i) => i !== idx));

    const handleMagicPasteInstructions = () => {
        if (!magicInstructionsText.trim()) return;
        const parsed = parseInstructionsOnly(magicInstructionsText);
        if (instructions.length === 1 && !instructions[0].trim()) setInstructions(parsed);
        else setInstructions([...instructions, ...parsed]);
        setMagicInstructionsText('');
        setShowMagicInstructions(false);
    };

    if (instructionsMode === 'none') {
        return (
            <div className="py-12 flex flex-col items-center justify-center gap-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="text-center space-y-2">
                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Define the Method</h4>
                    <p className="text-sm font-medium text-slate-500">Choose how to document the clinical preparation steps</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setInstructionsMode('magic'); setShowMagicInstructions(true); }}
                        className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Wand2 size={32} />
                        </div>
                        <div className="text-center font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200">Magic Paste</div>
                    </button>
                    <button
                        onClick={() => setInstructionsMode('manual')}
                        className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                        </div>
                        <div className="text-center font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200">Manual Build</div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-3">
                    <ListOrdered className="w-5 h-5 text-amber-500" />
                    Cooking Steps
                </h3>
                <div className="flex gap-2">
                    {instructionsMode === 'magic' ? (
                        <Button variant="outline" size="sm" onClick={() => setShowMagicInstructions(!showMagicInstructions)} className="text-[10px] uppercase font-black tracking-widest gap-2">
                            <Wand2 size={14} /> Paste Steps
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={handleAddInstruction} className="text-[10px] uppercase font-black tracking-widest gap-2">
                            <Plus size={14} /> Add Step
                        </Button>
                    )}
                </div>
            </div>

            {showMagicInstructions && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Paste Method Content Below</p>
                    <textarea
                        className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                        placeholder="Paste multiple steps here..."
                        value={magicInstructionsText}
                        onChange={(e) => setMagicInstructionsText(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" className="text-xs text-slate-400" onClick={() => setShowMagicInstructions(false)}>Cancel</Button>
                        <Button onClick={handleMagicPasteInstructions} className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-black uppercase tracking-widest px-8 shadow-lg shadow-amber-500/20">Get Steps</Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {instructions.map((stepText, index) => (
                    <div key={index} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center font-black text-sm text-slate-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                            {index + 1}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={stepText}
                                onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500/50 rounded-xl p-4 text-sm min-h-[80px] transition-all resize-none"
                                placeholder={`Explain instruction step ${index + 1}...`}
                            />
                            {instructions.length > 1 && (
                                <button
                                    onClick={() => handleRemoveInstruction(index)}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <Button
                    onClick={handleToDetails}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-amber-500/20"
                >
                    Next: Recipe Details <ArrowRight size={14} />
                </Button>
            </div>
        </div>
    );
}
