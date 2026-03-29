import React from 'react';
import { Camera, Loader2, Save, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedRecipe } from '@/types/recipe';

interface RecipeImportViewProps {
    isLoading: boolean;
    recipeLoading: boolean;
    recipeSaving: boolean;
    successRecipe: ParsedRecipe | null;
    pastedRecipeURL: string;
    setpastedRecipeURL: (url: string) => void;
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;
    onProcessRecipeImage: (file: File) => void;
    onPasteRecipeURL: () => void;
    onSaveAndViewRecipe: (recipe: ParsedRecipe) => void;
    onClearSuccessRecipe: () => void;
    onManualCreate: () => void;
}

export function RecipeImportView({
    isLoading,
    recipeLoading,
    recipeSaving,
    successRecipe,
    pastedRecipeURL,
    setpastedRecipeURL,
    isDragging,
    setIsDragging,
    onProcessRecipeImage,
    onPasteRecipeURL,
    onSaveAndViewRecipe,
    onClearSuccessRecipe,
    onManualCreate
}: RecipeImportViewProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
            {/* Vertical Stack Layout */}
            <div className="flex flex-col gap-4 flex-1">
                {/* Photo Upload Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-teal-500/20 dark:bg-teal-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Upload a Photo</h4>
                    {isLoading ? (
                        <div className="bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border border-rose-500/20 flex flex-col flex-1 items-center justify-center">
                            <Loader2 size={24} className="text-rose-500 animate-spin mb-2" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Extracting recipe...</p>
                        </div>
                    ) : !successRecipe ? (
                        <>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onProcessRecipeImage(file);
                                    }
                                }}
                                className="hidden"
                            />
                            <label 
                                htmlFor="photo-upload"
                                className={cn(
                                    "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col flex-1 relative overflow-hidden group transition-all duration-300 cursor-pointer block",
                                    isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        onProcessRecipeImage(file);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Camera size={24} className="text-rose-500 mx-auto mb-2" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Drag & drop or click</p>
                                    </div>
                                </div>
                            </label>
                        </>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="bg-rose-500/10 dark:bg-rose-500/20 rounded-xl p-3 border border-rose-500/20 mb-3 flex-1">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Recipe extracted successfully!</p>
                            </div>
                            <button
                                onClick={() => onSaveAndViewRecipe(successRecipe)}
                                disabled={recipeSaving}
                                className="w-full px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                            >
                                {recipeSaving ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={12} />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClearSuccessRecipe}
                                className="w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                Try Another
                            </button>
                        </div>
                    )}
                </div>

                {/* URL Input Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-blue-500/20 dark:bg-blue-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Paste a Link</h4>
                    {!successRecipe ? (
                        <>
                            <input
                                type="url"
                                value={pastedRecipeURL}
                                onChange={(e) => setpastedRecipeURL(e.target.value)}
                                placeholder="https://example.com..."
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                            />
                            <button
                                onClick={onPasteRecipeURL}
                                disabled={!pastedRecipeURL.trim() || recipeLoading}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                            >
                                {recipeLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Parsing...
                                    </>
                                ) : (
                                    'Import'
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-xl p-3 border border-purple-500/20 mb-3 flex-1">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Recipe parsed successfully!</p>
                            </div>
                            <button
                                onClick={() => onSaveAndViewRecipe(successRecipe)}
                                disabled={recipeSaving}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                            >
                                {recipeSaving ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={12} />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClearSuccessRecipe}
                                className="w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                Try Another
                            </button>
                        </div>
                    )}
                </div>

                {/* Manual Entry Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-purple-500/20 dark:bg-purple-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Create Manually</h4>
                    <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20 flex flex-col flex-1 items-center justify-center group hover:border-emerald-500/40 transition-all duration-300 cursor-pointer"
                        onClick={onManualCreate}>
                        <Pencil size={28} className="text-emerald-500 mb-2" />
                        <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Add recipe details manually</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
