import React from 'react';
import { 
    Menu, 
    Mic, 
    Square, 
    Upload, 
    Send, 
    Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionPanelView } from '@/lib/context/action-panel-context';
import { QuickActions } from './quick-actions';

interface InputSectionProps {
    input: string;
    setInput: (val: string) => void;
    handleSend: () => void;
    isLoading: boolean;
    recipeLoading: boolean;
    showQuickActions: boolean;
    setShowQuickActions: (show: boolean | ((prev: boolean) => boolean)) => void;
    isRecording: boolean;
    recordingTime: number;
    startAudioRecording: () => void;
    stopAudioRecording: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    audioInputRef: React.RefObject<HTMLInputElement | null>;
    handleLoadConversationHistory: () => void;
    startNewConversation: () => void;
    isLoadingHistory: boolean;
    
    // Props for QuickActions
    expandedRecipeMenu: boolean;
    setExpandedRecipeMenu: (expanded: boolean) => void;
    expandedAppsMenu: boolean;
    setExpandedAppsMenu: (expanded: boolean) => void;
    expandedWidgetsMenu: boolean;
    setExpandedWidgetsMenu: (expanded: boolean) => void;
    activeView: ActionPanelView;
    setActiveView: (view: ActionPanelView) => void;
    previousView: ActionPanelView | null;
    setPreviousView: (view: ActionPanelView | null) => void;
    handleViewAllRecipes: () => void;
    handleViewMyRecipes: () => void;
    handleCreateNewRecipe: () => void;
}

export function InputSection({
    input,
    setInput,
    handleSend,
    isLoading,
    recipeLoading,
    showQuickActions,
    setShowQuickActions,
    isRecording,
    recordingTime,
    startAudioRecording,
    stopAudioRecording,
    handleImageUpload,
    fileInputRef,
    audioInputRef,
    handleLoadConversationHistory,
    startNewConversation,
    isLoadingHistory,
    
    expandedRecipeMenu,
    setExpandedRecipeMenu,
    expandedAppsMenu,
    setExpandedAppsMenu,
    expandedWidgetsMenu,
    setExpandedWidgetsMenu,
    activeView,
    setActiveView,
    previousView,
    setPreviousView,
    handleViewAllRecipes,
    handleViewMyRecipes,
    handleCreateNewRecipe
}: InputSectionProps) {
    return (
        <div className="relative border-t border-slate-200 dark:border-slate-800 shrink-0 pb-24">
            {/* Quick Actions Drawer */}
            <QuickActions
                showQuickActions={showQuickActions}
                setShowQuickActions={setShowQuickActions as any}
                expandedRecipeMenu={expandedRecipeMenu}
                setExpandedRecipeMenu={setExpandedRecipeMenu}
                expandedAppsMenu={expandedAppsMenu}
                setExpandedAppsMenu={setExpandedAppsMenu}
                expandedWidgetsMenu={expandedWidgetsMenu}
                setExpandedWidgetsMenu={setExpandedWidgetsMenu}
                activeView={activeView}
                setActiveView={setActiveView}
                previousView={previousView}
                setPreviousView={setPreviousView}
                handleViewAllRecipes={handleViewAllRecipes}
                handleViewMyRecipes={handleViewMyRecipes}
                handleCreateNewRecipe={handleCreateNewRecipe}
            />

            {/* Input Bar */}
            <div className="flex gap-2 p-4 pb-6">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowQuickActions(prev => !prev);
                    }}
                    className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-muted transition-colors active:scale-95 z-[60] pointer-events-auto"
                    title="Quick actions menu"
                >
                    <Menu size={16} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question or paste a recipe URL..."
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isLoading || recipeLoading}
                />
                <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                />
                <button
                    onClick={() => {
                        if (isRecording) {
                            stopAudioRecording();
                        } else {
                            startAudioRecording();
                        }
                    }}
                    type="button"
                    disabled={isLoading || recipeLoading}
                    className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                        isRecording
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    )}
                    title={isRecording ? `Recording... (${recordingTime}s)` : "Record audio"}
                >
                    {isRecording ? <Square size={16} /> : <Mic size={16} />}
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || recipeLoading}
                    className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    title="Upload image"
                >
                    <Upload size={16} />
                </button>
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || recipeLoading}
                    className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    title="Send"
                >
                    {isLoading || recipeLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>

            {/* History and New Conversation Buttons */}
            <div className="flex gap-2 px-4 pt-2">
                <button
                    type="button"
                    onClick={handleLoadConversationHistory}
                    disabled={isLoadingHistory}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="View conversation history"
                >
                    {isLoadingHistory ? <Loader2 size={12} className="animate-spin" /> : <span>📋 History</span>}
                </button>
                <button
                    type="button"
                    onClick={startNewConversation}
                    disabled={isLoading || recipeLoading}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    title="Start a new conversation"
                >
                    ➕ New
                </button>
            </div>
        </div>
    );
}
