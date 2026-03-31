import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Sparkles } from 'lucide-react';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    autoImportText: string;
    setAutoImportText: (t: string) => void;
    isImporting: boolean;
    handleAutoImport: () => void;
}

export function ImportDialog({
    open, onOpenChange, autoImportText, setAutoImportText, isImporting, handleAutoImport
}: ImportDialogProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-0">
                <div className="h-full flex flex-col">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                        <SheetHeader className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 mb-2">
                                <Database size={24} />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase tracking-tighter">Smart Protocol Import</SheetTitle>
                                <SheetDescription className="text-slate-500 font-medium">
                                    Paste a full recipe (Title, Ingredients, Instructions) below. Our clinical parser will attempt to isolate each component for rapid workspace population.
                                </SheetDescription>
                            </div>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Content Source</label>
                                <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 bg-violet-500/5 px-2 py-1 rounded-md">
                                    <Sparkles size={10} /> Clinical Parsing Active
                                </div>
                            </div>
                            <textarea
                                value={autoImportText}
                                onChange={(e) => setAutoImportText(e.target.value)}
                                className="w-full h-[400px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all resize-none"
                                placeholder="Paste the entire recipe here..."
                            />
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                        <Button
                            onClick={handleAutoImport}
                            disabled={isImporting || !autoImportText.trim()}
                            className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-4 shadow-xl shadow-violet-500/20 disabled:opacity-50"
                        >
                            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database size={18} />}
                            <span>Initiate Clinical Analysis</span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
