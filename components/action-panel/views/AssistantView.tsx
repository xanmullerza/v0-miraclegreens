import React from 'react';
import { X } from 'lucide-react';
import { MessagesView } from '../messages-view';
import { InputSection } from '../input-section';

export function AssistantView({
    messages, messagesEndRef, isLoading, recipeSaving,
    handleSaveAndViewRecipe, onBack, input, setInput,
    handleSend, recipeLoading, showQuickActions,
    setShowQuickActions, isRecording, recordingTime,
    startAudioRecording, stopAudioRecording,
    handleRecipeImageUpload, fileInputRef, audioInputRef,
    handleLoadConversationHistory, startNewConversation,
    isLoadingHistory, expandedRecipeMenu, setExpandedRecipeMenu,
    expandedAppsMenu, setExpandedAppsMenu, expandedWidgetsMenu,
    setExpandedWidgetsMenu, activeView, navigateTo,
    previousView, handleViewAllRecipes, handleViewMyRecipes,
    handleCreateNewRecipe
}: any) {
    return (
        <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <span className="text-emerald-500 text-sm">🤖</span>
                    </div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Coach</h2>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Vitala Assistant</p>
                    </div>
                </div>
                <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <MessagesView 
                messages={messages} 
                isLoading={isLoading} 
                recipeSaving={recipeSaving} 
                messagesEndRef={messagesEndRef} 
                handleSaveAndViewRecipe={handleSaveAndViewRecipe} 
            />

            {/* Input */}
            <InputSection
                input={input}
                setInput={setInput}
                handleSend={handleSend}
                isLoading={isLoading}
                recipeLoading={recipeLoading}
                showQuickActions={showQuickActions}
                setShowQuickActions={setShowQuickActions}
                isRecording={isRecording}
                recordingTime={recordingTime}
                startAudioRecording={startAudioRecording}
                stopAudioRecording={stopAudioRecording}
                handleImageUpload={handleRecipeImageUpload}
                fileInputRef={fileInputRef}
                audioInputRef={audioInputRef}
                handleLoadConversationHistory={handleLoadConversationHistory}
                startNewConversation={startNewConversation}
                isLoadingHistory={isLoadingHistory}
                expandedRecipeMenu={expandedRecipeMenu}
                setExpandedRecipeMenu={setExpandedRecipeMenu}
                expandedAppsMenu={expandedAppsMenu}
                setExpandedAppsMenu={setExpandedAppsMenu}
                expandedWidgetsMenu={expandedWidgetsMenu}
                setExpandedWidgetsMenu={setExpandedWidgetsMenu}
                activeView={activeView}
                setActiveView={navigateTo}
                previousView={previousView}
                setPreviousView={onBack}
                handleViewAllRecipes={handleViewAllRecipes}
                handleViewMyRecipes={handleViewMyRecipes}
                handleCreateNewRecipe={handleCreateNewRecipe}
            />
        </div>
    );
}
