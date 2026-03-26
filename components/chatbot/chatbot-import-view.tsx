'use client';

import React from 'react';
import { 
    Pencil, 
    FileText, 
    Link, 
    Camera, 
    Mic, 
    Upload, 
    Loader2,
    Square,
    ChevronRight,
    Save,
    RotateCcw,
    Database,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParsedRecipe } from '@/components/chatbot-modal';

import { ChatbotViewType } from '@/lib/context/chatbot-context';

interface ChatbotImportViewProps {
    chatbotView: ChatbotViewType;
    setChatbotView: (view: ChatbotViewType) => void;
    isLoading: boolean;
    recipeLoading: boolean;
    recipeSaving: boolean;
    successRecipe: ParsedRecipe | null;
    setSuccessRecipe: (recipe: ParsedRecipe | null) => void;
    pastedRecipeURL: string;
    setpastedRecipeURL: (url: string) => void;
    pastedRecipeContent: string;
    setPastedRecipeContent: (content: string) => void;
    handlePasteRecipeContent: () => void;
    handlePasteRecipeURL: () => void;
    handleSaveAndViewRecipe: (recipe: ParsedRecipe) => void;
    handleManualRecipeCreation: () => void;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    processRecipeImage: (file: File) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isRecording: boolean;
    recordingTime: number;
    startAudioRecording: () => void;
    stopAudioRecording: () => void;
    videoURL: string;
    setVideoURL: (url: string) => void;
}

export function ChatbotImportView({
    chatbotView,
    setChatbotView,
    isLoading,
    recipeLoading,
    recipeSaving,
    successRecipe,
    setSuccessRecipe,
    pastedRecipeURL,
    setpastedRecipeURL,
    pastedRecipeContent,
    setPastedRecipeContent,
    handlePasteRecipeContent,
    handlePasteRecipeURL,
    handleSaveAndViewRecipe,
    handleManualRecipeCreation,
    isDragging,
    setIsDragging,
    processRecipeImage,
    fileInputRef,
    isRecording,
    recordingTime,
    startAudioRecording,
    stopAudioRecording,
    videoURL,
    setVideoURL,
}: ChatbotImportViewProps) {

    // Common Back Button
    const renderBackButton = (backTo: string = 'import') => (
        <button
            onClick={() => setChatbotView(backTo)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest border border-slate-200 dark:border-slate-700"
        >
            ← Back
        </button>
    );

    // Render 1: The Import Menu (Methods Grid)
    if (chatbotView === 'import' || chatbotView === 'import-options') {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="w-full flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Import Methods</h3>
                    {renderBackButton('cookbook')}
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                    {/* Method 1: Photo */}
                    <div 
                        className={cn(
                            "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col h-full relative overflow-hidden group transition-all duration-300 cursor-pointer",
                            isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                                setChatbotView('import-upload-photo');
                                processRecipeImage(file);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Camera size={40} className="text-rose-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                <Camera size={16} className="text-rose-500" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 1</h4>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Upload Photo</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">Extract from any image.</p>
                        <div className="text-center py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-rose-600 transition-colors">
                            UPLOAD
                        </div>
                    </div>

                    {/* Method 2: Link */}
                    <div 
                        onClick={() => setChatbotView('import-paste-url')}
                        className="bg-purple-500/10 dark:bg-purple-500/5 rounded-2xl p-4 border border-purple-500/20 flex flex-col h-full relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Link size={40} className="text-purple-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Link size={16} className="text-purple-500" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 2</h4>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Paste a Link</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">Auto-import from any URL.</p>
                        <div className="text-center py-2 rounded-xl bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-purple-600 transition-colors">
                            IMPORT
                        </div>
                    </div>

                    {/* Method 3: Text */}
                    <div 
                        onClick={() => setChatbotView('import-paste-text')}
                        className="bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20 flex flex-col h-full relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText size={40} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FileText size={16} className="text-blue-500" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 3</h4>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Paste Text</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">Paste ingredients/notes.</p>
                        <div className="text-center py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-600 transition-colors">
                            PARSE
                        </div>
                    </div>

                    {/* Method 4: Voice */}
                    <div 
                        onClick={() => setChatbotView('import-voice')}
                        className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 flex flex-col h-full relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Mic size={40} className="text-amber-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Mic size={16} className="text-amber-500" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 4</h4>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Voice Import</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">Describe it to us.</p>
                        <div className="text-center py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-amber-600 transition-colors">
                            SPEAK
                        </div>
                    </div>
                </div>

                {/* Bulk Import Database Button */}
                <button
                    onClick={() => setChatbotView('import-bulk')}
                    className="w-full mt-4 p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 shadow-xl overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center">
                            <Database size={20} className="text-emerald-500" />
                        </div>
                        <div className="text-left">
                            <h4 className="font-black text-[10px] uppercase tracking-widest opacity-60">Professional</h4>
                            <h3 className="font-black text-xs uppercase tracking-tight">Bulk Database Import</h3>
                        </div>
                    </div>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-emerald-500" />
                </button>
                
                {/* Manual Entry Callout */}
                <button 
                   onClick={handleManualRecipeCreation}
                   className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-500 transition-colors"
                >
                    Create Manually Instead →
                </button>
            </div>
        );
    }

    // Render 2: Paste Text
    if (chatbotView === 'import-paste-text') {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paste Recipe Text</h3>
                    {renderBackButton()}
                </div>

                {!successRecipe ? (
                    <>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Paste the recipe ingredients and instructions here:</p>
                        <textarea
                            value={pastedRecipeContent}
                            onChange={(e) => setPastedRecipeContent(e.target.value)}
                            placeholder="Paste your recipe text here..."
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <button
                            onClick={handlePasteRecipeContent}
                            disabled={!pastedRecipeContent.trim() || recipeLoading}
                            className="mt-3 w-full px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {recipeLoading ? <><Loader2 size={14} className="animate-spin" /> Parsing...</> : 'Parse Recipe'}
                        </button>
                    </>
                ) : (
                    <SuccessDisplay 
                        recipe={successRecipe} 
                        recipeSaving={recipeSaving} 
                        handleSave={() => handleSaveAndViewRecipe(successRecipe)} 
                        handleReset={() => { setSuccessRecipe(null); setPastedRecipeContent(''); }}
                    />
                )}
            </div>
        );
    }

    // Render 3: Paste URL
    if (chatbotView === 'import-paste-url') {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paste Recipe URL</h3>
                    {renderBackButton()}
                </div>

                {!successRecipe ? (
                    <>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Paste a recipe URL from any cooking website:</p>
                        <Input
                            type="url"
                            value={pastedRecipeURL}
                            onChange={(e) => setpastedRecipeURL(e.target.value)}
                            placeholder="https://example.com/recipe/..."
                            className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-12 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            onClick={handlePasteRecipeURL}
                            disabled={!pastedRecipeURL.trim() || recipeLoading}
                            className="mt-4 w-full px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                            {recipeLoading ? <><Loader2 size={14} className="animate-spin" /> Extracting...</> : 'Import Recipe'}
                        </button>
                    </>
                ) : (
                    <SuccessDisplay 
                        recipe={successRecipe} 
                        recipeSaving={recipeSaving} 
                        handleSave={() => handleSaveAndViewRecipe(successRecipe)} 
                        handleReset={() => { setSuccessRecipe(null); setpastedRecipeURL(''); }}
                    />
                )}
            </div>
        );
    }

    // Render 4: Upload Photo
    if (chatbotView === 'import-upload-photo') {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recipe Photo</h3>
                    {renderBackButton()}
                </div>

                {!successRecipe ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                            <Camera size={40} className="text-rose-500" />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Extracting...</h4>
                        <p className="text-xs text-slate-500 max-w-[200px]">We&apos;re using AI to read the recipe from your image. This takes about 10 seconds.</p>
                        <Loader2 size={24} className="animate-spin text-rose-500 mt-6" />
                    </div>
                ) : (
                    <SuccessDisplay 
                        recipe={successRecipe} 
                        recipeSaving={recipeSaving} 
                        handleSave={() => handleSaveAndViewRecipe(successRecipe)} 
                        handleReset={() => { setSuccessRecipe(null); }}
                    />
                )}
            </div>
        );
    }

    // Render 5: Voice assisted
    if (chatbotView === 'import-voice') {
        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="w-full flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Voice Import</h3>
                    {renderBackButton()}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
                    <div className={cn(
                        "w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 relative",
                        isRecording ? "bg-red-500/20 scale-110" : "bg-amber-500/10"
                    )}>
                        {isRecording && (
                            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />
                        )}
                        <Mic size={48} className={isRecording ? "text-red-500" : "text-amber-500"} />
                    </div>
                    
                    <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        {isRecording ? `Recording... ${recordingTime}s` : 'Describe Your Recipe'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-[240px] mb-8">
                        {isRecording ? 'Speak clearly and include ingredients and steps.' : 'Tap the button and start speaking. We’ll build the recipe based on your voice.'}
                    </p>

                    <button
                        onClick={isRecording ? stopAudioRecording : startAudioRecording}
                        className={cn(
                            "w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3",
                            isRecording ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                        )}
                    >
                        {isRecording ? <><Square size={20} fill="currentColor" /> Finish Recording</> : <><Mic size={20} /> Start Speaking</>}
                    </button>
                    
                    {isLoading && (
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <Loader2 size={20} className="animate-spin text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI is building your recipe...</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Placeholder for other states
    return (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 italic">
            This import method is coming soon!
        </div>
    );
}

// Sub-component for success UI
function SuccessDisplay({ recipe, recipeSaving, handleSave, handleReset }: { 
    recipe: ParsedRecipe; 
    recipeSaving: boolean; 
    handleSave: () => void; 
    handleReset: () => void;
}) {
    return (
        <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl p-6 border border-emerald-500/20 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Pencil size={80} className="text-emerald-500" />
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white mb-1 uppercase tracking-tight leading-none">{recipe.title}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Recipe extracted successfully!</p>
                <div className="flex gap-4">
                    <div className="text-center bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Yield</span>
                        <span className="text-xs font-black text-emerald-600">{recipe.servings} Servings</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mt-auto">
                <button
                    onClick={handleSave}
                    disabled={recipeSaving}
                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                    {recipeSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save to Cookbook</>}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-rose-500 transition-colors"
                >
                    <RotateCcw size={12} className="inline mr-2" />
                    Try Another Method
                </button>
            </div>
        </div>
    );
}
