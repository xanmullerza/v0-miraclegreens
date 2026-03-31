import React from 'react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { RecipeBuilderPanel } from './recipe-builder-panel';
import { DashboardView } from './dashboard-view';
import { DesktopGuide } from './desktop-guide';
import { ImportView } from './import-view';
import { MessagesView } from './messages-view';
import { RecipesViewPremium } from '@/components/recipe/recipes-view-premium';
import { RecipeDetail } from './recipe-detail';
import { SharePanel } from './share-panel';
import { ShoppingPanel } from './shopping-panel';
import { PantryPanel } from './pantry-panel';
import { PlannerPanel } from './planner-panel';
import { NutrientsView } from '@/components/nutrients/nutrients-view';
import { ComparatorFullPanel } from './comparator-full-panel';
import { LifeguardFullIntegration } from './lifeguard-full-integration';
import { HelpSection } from './help-section';
import { ExportPanel } from './export-panel';
import { RDAContent } from '@/components/ux/rda-content';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';
import { FoodFiltersPanel } from '@/components/foods/food-filters-panel';
import { NutrientFilterPanel } from '@/components/nutrients/nutrients-view';
import { InputSection } from './input-section';
import { PrivacyPanel, SupportPanel, TermsPanel, SettingsPanel } from './static-panels';
import { CookbookMenuPanel, PlannerMenuPanel, WidgetsMenuPanel } from './menu-panels';
import { Loader2, X } from 'lucide-react';
import { ActionPanelView } from '@/lib/context/action-panel-context';
import { PanelWrapper } from './panel-wrapper';

interface ActionPanelRouterProps {
    orchestrator: any; 
}

export function ActionPanelRouter({ orchestrator }: ActionPanelRouterProps) {
    const { activeView, previousView, navigateTo, excludeFlavour, setExcludeFlavour, excludeSupplements, setExcludeSupplements } = useActionPanel();
    const { filters } = useRecipeFilter();
    const { showFavoritesOnly, setShowFavoritesOnly, selectedCategories, setSelectedCategories } = useFoodFilter();

    const {
        showRecipeBuilder, recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
        recipeServings, setRecipeServings, recipePrepTime, setRecipePrepTime,
        recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
        recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
        handleCloseRecipeBuilder, recipeSaving, handleAddInstruction,
        handleUpdateInstruction, handleRemoveInstruction, builderRef,
        recipeUploading, handleRecipeImageUpload, handleSaveRecipe,
        isAdmin, showOnlyMyRecipes, setShowOnlyMyRecipes, handleBack,
        isLoading, recipeLoading, successRecipe, setSuccessRecipe,
        pastedRecipeURL, setPastedRecipeURL, pastedRecipeContent, setPastedRecipeContent,
        handlePasteRecipeContent, handlePasteRecipeURL, handleSaveAndViewRecipe,
        handleManualRecipeCreation, isDragging, setIsDragging, processRecipeImage,
        fileInputRef, isRecording, recordingTime, startAudioRecording, stopAudioRecording,
        videoURL, setVideoURL, messages, messagesEndRef,
        handleRecipeClick, handleBackFromRecipeDetail, handleRemixRecipe,
        selectedRecipeId, recipeToShare, isLoadingHistory, conversationHistory,
        loadConversationFromHistory, input, setInput, handleSend,
        showQuickActions, setShowQuickActions, audioInputRef, handleLoadConversationHistory,
        startNewConversation, expandedRecipeMenu, setExpandedRecipeMenu,
        expandedAppsMenu, setExpandedAppsMenu, expandedWidgetsMenu, setExpandedWidgetsMenu,
        handleViewAllRecipes, handleViewMyRecipes, handleCreateNewRecipe, isCreatingRecipe,
        handleGoHome
    } = orchestrator;

    return (
        <>
            {showRecipeBuilder && (
                <RecipeBuilderPanel
                    recipeStep={recipeStep}
                    setRecipeStep={setRecipeStep}
                    recipeTitle={recipeTitle}
                    setRecipeTitle={setRecipeTitle}
                    recipeServings={recipeServings}
                    setRecipeServings={setRecipeServings}
                    recipePrepTime={recipePrepTime}
                    setRecipePrepTime={setRecipePrepTime}
                    recipeCookTime={recipeCookTime}
                    setRecipeCookTime={setRecipeCookTime}
                    recipeIngredients={recipeIngredients}
                    setRecipeIngredients={setRecipeIngredients}
                    recipeInstructions={recipeInstructions}
                    setRecipeInstructions={setRecipeInstructions}
                    recipeImage={recipeImage}
                    setRecipeImage={setRecipeImage}
                    handleCloseRecipeBuilder={handleCloseRecipeBuilder}
                    recipeSaving={recipeSaving}
                    handleAddInstruction={handleAddInstruction}
                    handleUpdateInstruction={handleUpdateInstruction}
                    handleRemoveInstruction={handleRemoveInstruction}
                    builderRef={builderRef}
                    recipeUploading={recipeUploading}
                    handleRecipeImageUpload={handleRecipeImageUpload}
                    handleSaveRecipe={handleSaveRecipe}
                />
            )}

            {!showRecipeBuilder && activeView === 'dashboard' && (
                <DashboardView
                    setActiveView={navigateTo}
                    setShowOnlyMyRecipes={setShowOnlyMyRecipes}
                    isAdmin={isAdmin}
                />
            )}

            {!showRecipeBuilder && activeView === 'desktop-guide' && (
                <DesktopGuide setActiveView={navigateTo} />
            )}

            {!showRecipeBuilder && activeView === 'comingSoon' && (
                <PanelWrapper title="Coming Soon" onClose={handleBack}>
                    <div className="p-6 m-4 rounded-xl border border-dashed border-border bg-muted/30 text-center mt-12">
                        <h3 className="text-lg font-bold text-foreground">Coming Soon</h3>
                        <p className="mt-2 text-sm text-muted-foreground">This feature is on the way! Stay tuned for updates.</p>
                        <button
                            onClick={handleBack}
                            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        >
                            Back to Previous View
                        </button>
                    </div>
                </PanelWrapper>
            )}

            {!showRecipeBuilder && activeView.startsWith('import') && (
                <PanelWrapper title="Recipe Import" onClose={handleBack} noPadding>
                    <ImportView
                        setActiveView={navigateTo}
                        isLoading={isLoading}
                        recipeLoading={recipeLoading}
                        recipeSaving={recipeSaving}
                        successRecipe={successRecipe}
                        setSuccessRecipe={setSuccessRecipe}
                        pastedRecipeURL={pastedRecipeURL}
                        setpastedRecipeURL={setPastedRecipeURL}
                        pastedRecipeContent={pastedRecipeContent}
                        setPastedRecipeContent={setPastedRecipeContent}
                        handlePasteRecipeContent={handlePasteRecipeContent}
                        handlePasteRecipeURL={handlePasteRecipeURL}
                        handleSaveAndViewRecipe={handleSaveAndViewRecipe}
                        handleManualRecipeCreation={handleManualRecipeCreation}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        processRecipeImage={processRecipeImage}
                        fileInputRef={fileInputRef}
                        isRecording={isRecording}
                        recordingTime={recordingTime}
                        startAudioRecording={startAudioRecording}
                        stopAudioRecording={stopAudioRecording}
                        videoURL={videoURL}
                        setVideoURL={setVideoURL}
                    />
                </PanelWrapper>
            )}

            {!showRecipeBuilder && activeView === 'cookbook' && (
                <CookbookMenuPanel onBack={() => handleGoHome(previousView)} navigateTo={navigateTo} />
            )}

            {!showRecipeBuilder && activeView === 'plannerMenu' && (
                <PlannerMenuPanel onBack={handleBack} navigateTo={navigateTo} />
            )}

            {!showRecipeBuilder && activeView === 'widgetsMenu' && (
                <WidgetsMenuPanel onBack={handleBack} navigateTo={navigateTo} />
            )}

            {!showRecipeBuilder && activeView === 'profile' && <SettingsPanel onClose={handleBack} />}

            {!showRecipeBuilder && activeView === 'privacy' && <PrivacyPanel onClose={handleBack} />}
            {!showRecipeBuilder && activeView === 'support' && <SupportPanel onClose={handleBack} />}
            {!showRecipeBuilder && activeView === 'terms' && <TermsPanel onClose={handleBack} />}

            {!showRecipeBuilder && activeView === 'messages' && !isCreatingRecipe && (
                <div className="flex-1 flex flex-col min-h-0 relative animate-in fade-in duration-200">
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
                        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                            <X size={20} />
                        </button>
                    </div>
                    <MessagesView 
                        messages={messages} 
                        isLoading={isLoading} 
                        recipeSaving={recipeSaving} 
                        messagesEndRef={messagesEndRef} 
                        handleSaveAndViewRecipe={handleSaveAndViewRecipe} 
                    />
                </div>
            )}

            {!showRecipeBuilder && activeView === 'messages' && isCreatingRecipe && !successRecipe && (
                <ImportView
                    setActiveView={navigateTo}
                    handleManualRecipeCreation={handleManualRecipeCreation}
                    isLoading={isLoading}
                    recipeLoading={recipeLoading}
                    recipeSaving={recipeSaving}
                    successRecipe={successRecipe}
                    setSuccessRecipe={setSuccessRecipe}
                    pastedRecipeURL={pastedRecipeURL}
                    setpastedRecipeURL={setPastedRecipeURL}
                    handlePasteRecipeURL={handlePasteRecipeURL}
                    handleSaveAndViewRecipe={handleSaveAndViewRecipe}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    processRecipeImage={processRecipeImage}
                    fileInputRef={fileInputRef}
                />
            )}

            {!showRecipeBuilder && activeView === 'view-recipes' && (
                <PanelWrapper title="Recipes" onClose={handleBack}>
                    <div className="px-2 pb-20 mt-8">
                        <RecipesViewPremium onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'view-recipes')} />
                    </div>
                </PanelWrapper>
            )}

            {!showRecipeBuilder && activeView === 'recipe-detail' && selectedRecipeId && (
                <RecipeDetail 
                    recipeId={selectedRecipeId} 
                    onBack={handleBackFromRecipeDetail} 
                    onRemix={handleRemixRecipe}
                />
            )}
            
            {!showRecipeBuilder && activeView === 'recipe-share' && recipeToShare && (
                <SharePanel recipe={recipeToShare} onClose={handleBack} isInline={true} />
            )}

            {!showRecipeBuilder && activeView === 'shopping' && <ShoppingPanel />}
            {!showRecipeBuilder && activeView === 'pantry' && <PantryPanel />}
            {!showRecipeBuilder && activeView === 'planner' && <PlannerPanel onRecipeClick={(id) => handleRecipeClick(id, 'planner')} />}
            {!showRecipeBuilder && activeView === 'nutridex' && <NutrientsView compact={true} />}
            {!showRecipeBuilder && activeView === 'comparator' && <ComparatorFullPanel />}
            {!showRecipeBuilder && activeView === 'lifeguard' && <LifeguardFullIntegration />}

            {activeView === 'conversation-history' && !showRecipeBuilder && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-emerald-500" />
                        </div>
                    ) : conversationHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-slate-400 text-sm mb-2">No conversations yet</p>
                        </div>
                    ) : (
                        conversationHistory.map((conversation: any) => (
                            <button
                                key={conversation.id}
                                onClick={() => loadConversationFromHistory(conversation)}
                                className="w-full text-left p-3 rounded-lg bg-card hover:bg-muted transition-colors border border-border"
                            >
                                <p className="font-bold text-sm text-foreground mb-1 uppercase tracking-tight">{conversation.title}</p>
                            </button>
                        ))
                    )}
                </div>
            )}

            {!showRecipeBuilder && activeView === 'recommended-intake' && (
                <div className="flex-1 overflow-hidden">
                    <RDAContent compact={false} showCloseButton={true} onClose={handleBack} />
                </div>
            )}

            {activeView === 'messages' && !showRecipeBuilder && !isCreatingRecipe && (
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
                    setPreviousView={handleBack} // This prop exists in InputSection
                    handleViewAllRecipes={handleViewAllRecipes}
                    handleViewMyRecipes={handleViewMyRecipes}
                    handleCreateNewRecipe={handleCreateNewRecipe}
                />
            )}

            {!showRecipeBuilder && activeView === 'export-recipes' && (
                <ExportPanel onBack={() => navigateTo('cookbook')} />
            )}

            {!showRecipeBuilder && (activeView === 'help-cookbook' || activeView === 'help-planner' || activeView === 'help-widgets') && (
                <HelpSection type={activeView} />
            )}

            {!showRecipeBuilder && activeView === 'recipe-filters' && (
                <PanelWrapper title="Filter Recipes" onClose={() => handleGoHome(previousView)} noPadding>
                    <RecipeFilterContent onClose={() => handleGoHome(previousView)} />
                </PanelWrapper>
            )}

            {!showRecipeBuilder && activeView === 'food-filters' && (
                <PanelWrapper title="Filter Foods" onClose={() => handleGoHome(previousView)} noPadding>
                    <FoodFiltersPanel
                        showFavoritesOnly={showFavoritesOnly}
                        setShowFavoritesOnly={setShowFavoritesOnly}
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                    />
                </PanelWrapper>
            )}

            {!showRecipeBuilder && activeView === 'nutrient-filters' && (
                <PanelWrapper title="Filter Nutrients" onClose={() => handleGoHome(previousView)} noPadding>
                    <NutrientFilterPanel
                        excludeFlavour={excludeFlavour}
                        setExcludeFlavour={setExcludeFlavour}
                        excludeSupplements={excludeSupplements}
                        setExcludeSupplements={setExcludeSupplements}
                    />
                </PanelWrapper>
            )}
        </>
    );
}
