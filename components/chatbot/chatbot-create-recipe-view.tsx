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
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatbotCreateRecipeViewProps {
    handleManualRecipeCreation: () => void;
    recipeContentRef: React.RefObject<HTMLTextAreaElement | null>;
    pastedRecipeContent: string;
    setPastedRecipeContent: (val: string) => void;
    handlePasteRecipeContent: () => void;
    isLoading: boolean;
    pastedRecipeURL: string;
    setpastedRecipeURL: (val: string) => void;
    handlePasteRecipeURL: () => void;
    isDragging: boolean;
    setIsDragging: (val: boolean) => void;
    processRecipeImage: (file: File) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isRecording: boolean;
    recordingTime: number;
    startAudioRecording: () => void;
    stopAudioRecording: () => void;
    videoURL: string;
    setVideoURL: (val: string) => void;
    toast: (msg: string) => void;
}

export function ChatbotCreateRecipeView({
    handleManualRecipeCreation,
    recipeContentRef,
    pastedRecipeContent,
    setPastedRecipeContent,
    handlePasteRecipeContent,
    isLoading,
    pastedRecipeURL,
    setpastedRecipeURL,
    handlePasteRecipeURL,
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
    toast
}: ChatbotCreateRecipeViewProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center">
            <div className="grid grid-cols-2 gap-3 w-full">
                {/* Option 1 to 5 ... */}
                {/* (I'll keep the existing ones and just append 6) */}
                
                {/* Copied from previous thought for context, I will write the full return block */}
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20 flex flex-col h-full relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Pencil size={40} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Pencil size={16} className="text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 1</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Manually Create</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                        Step-by-step form to add all the details yourself.
                    </p>
                    <button
                        onClick={handleManualRecipeCreation}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                    >
                        LET&apos;S GO
                    </button>
                </div>

                <div className="bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl p-4 border border-blue-500/20 flex flex-col h-full relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={40} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <FileText size={16} className="text-blue-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 2</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Paste Recipe Text</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        We&apos;ll parse ingredients automatically.
                    </p>
                    <textarea
                        ref={recipeContentRef}
                        value={pastedRecipeContent}
                        onChange={(e) => setPastedRecipeContent(e.target.value)}
                        placeholder="Paste content here..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none mb-3 min-h-[60px] flex-1"
                    />
                    <button
                        onClick={handlePasteRecipeContent}
                        disabled={!pastedRecipeContent.trim() || isLoading}
                        className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <span>✓ Parse & Review</span>}
                    </button>
                </div>

                <div className="bg-purple-500/10 dark:bg-purple-500/5 rounded-2xl p-4 border border-purple-500/20 flex flex-col h-full relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Link size={40} className="text-purple-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Link size={16} className="text-purple-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 3</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Paste Recipe URL</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        We&apos;ll extract all details.
                    </p>
                    <input
                        type="text"
                        value={pastedRecipeURL}
                        onChange={(e) => setpastedRecipeURL(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-[10px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-3 flex-1"
                    />
                    <button
                        onClick={handlePasteRecipeURL}
                        disabled={!pastedRecipeURL.trim() || isLoading}
                        className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <span>✓ Import Recipe</span>}
                    </button>
                </div>

                <div 
                    className={cn(
                        "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col h-full relative overflow-hidden group transition-all duration-300 cursor-pointer",
                        isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processRecipeImage(file);
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
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 4</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Upload Photo</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                        Snap a photo of any recipe to extract.
                    </p>
                    <div className="flex flex-col items-center justify-center py-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-rose-500/10 transition-colors group-hover:bg-rose-500/10">
                        <Upload size={20} className="text-rose-500 mb-2 animate-bounce" />
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-rose-500">Drop image here or click</span>
                    </div>
                </div>

                <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 flex flex-col h-full relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Mic size={40} className="text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Mic size={16} className="text-amber-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 5</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Voice Assisted</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                        Describe your recipe and we&apos;ll build it.
                    </p>
                    <button
                        onClick={() => {
                            if (isRecording) stopAudioRecording();
                            else startAudioRecording();
                        }}
                        className={cn(
                            "w-full py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2",
                            isRecording 
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                                : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                        )}
                    >
                        {isRecording ? (
                            <>
                                <Square size={12} />
                                STOP RECORDING ({recordingTime}s)
                            </>
                        ) : (
                            <>
                                <Mic size={12} />
                                START SPEAKING
                            </>
                        )}
                    </button>
                </div>

                {/* Option 6: Video Import */}
                <div className="bg-cyan-500/10 dark:bg-cyan-500/5 rounded-2xl p-4 border border-cyan-500/20 flex flex-col h-full relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FileText size={40} className="text-cyan-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <FileText size={16} className="text-cyan-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Option 6</h4>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Video Import</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                        Extract from YouTube or TikTok.
                    </p>
                    <input
                        type="text"
                        value={videoURL}
                        onChange={(e) => setVideoURL(e.target.value)}
                        placeholder="Paste video URL..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder-slate-400 text-[10px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-3 flex-1"
                    />
                    <button
                        onClick={() => toast('Video import is coming soon!')}
                        disabled={!videoURL.trim() || isLoading}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <span>✓ Import Video</span>}
                    </button>
                </div>
            </div>

            {/* Full-width Import Database Button */}
            <button
                onClick={() => toast('Database import is coming soon!')}
                className="w-full mt-4 p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 shadow-xl overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center">
                        <FileText size={20} className="text-emerald-500" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-black text-[10px] uppercase tracking-widest opacity-60">Bulk Import</h4>
                        <h3 className="font-black text-xs uppercase tracking-tight">Import Recipe Database</h3>
                    </div>
                </div>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-emerald-500" />
            </button>
        </div>
    );
}
