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
