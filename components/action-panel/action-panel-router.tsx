import React from 'react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { RecipesCombinedView } from '@/components/recipe/recipes-combined-view';
import { RecipeDetail } from './recipe-detail';
import { SharePanel } from './share-panel';
import { ShoppingPanel } from './shopping-panel';
import { PantryPanel } from './pantry-panel';
import { PlannerPanel } from './planner-panel';
import { NutrientsView } from '@/components/nutrients/nutrients-view';
import { ComparatorFullPanel } from './comparator-full-panel';
import { LifeguardFullIntegration } from './lifeguard-full-integration';
import { RDAContent } from '@/components/ux/rda-content';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';
import { FoodFiltersPanel } from '@/components/foods/food-filters-panel';
import { NutrientFilterPanel } from '@/components/nutrients/nutrients-view';
import { Loader2, X } from 'lucide-react';
import { PanelWrapper } from './panel-wrapper';
import { PortionMatchPanel } from '@/components/recipe/detail/portion-match-panel';
import { IngredientMatchDialog } from '@/components/recipe/detail/ingredient-match-dialog';
import { AuthPromptPanel } from './auth-prompt-panel';

// New View Components
import { AssistantView } from './views/AssistantView';
import { RecipeBuilderView } from './views/RecipeBuilderView';
import { ImportWizardView } from './views/ImportWizardView';
import { MenuExplorationView } from './views/MenuExplorationView';
import { StaticPagesView } from './views/StaticPagesView';
import { GuideView } from './guide-view';
import { ExportPanel } from './export-panel';
import { HelpSection } from './help-section';
import { RecipeTagsPanel } from '@/components/recipe/detail/recipe-tags-panel';
import FoodItemPicker from '@/components/recipe/food-item-picker';

interface ActionPanelRouterProps {
    orchestrator: any; 
    isInline?: boolean;
}

export function ActionPanelRouter({ orchestrator, isInline = false }: ActionPanelRouterProps) {
    const { 
        activeView, previousView, navigateTo, excludeFlavour, 
        setExcludeFlavour, excludeSupplements, setExcludeSupplements,
        contextRecipeId, smartMatchPicker, setSmartMatchPicker, smartMatchPortion, ingredientMatch
    } = useActionPanel();
    
    const { filters } = useRecipeFilter();
    
    // Check if useFoodFilter is available
    let foodFilter: any = {};
    try {
        foodFilter = useFoodFilter();
    } catch (e) {}

    const {
        showRecipeBuilder, recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
        recipeServings, setRecipeServings, recipePrepTime, setRecipePrepTime,
        recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
        recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
        handleCloseImporter, recipeSaving, handleAddInstruction,
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
        handleGoHome, handleCloseModal
    } = orchestrator;

    const effectiveRecipeId = contextRecipeId || (selectedRecipeId as string | null);

    // Consolidated Router Logic
    switch (activeView) {
        // 0. Guide (Default Landing View)
        case 'guide':
            console.log('🟢 [ActionPanelRouter] Switching to Guide view');
            return <GuideView />;

        // 1. Recipe Builder
        case 'recipe-builder':
            return (
                <RecipeBuilderView
                    {...{
                        recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
                        recipeServings, setRecipeServings, recipePrepTime, setRecipePrepTime,
                        recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
                        recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
                        recipeSaving, handleAddInstruction,
                        handleUpdateInstruction, handleRemoveInstruction, builderRef,
                        recipeUploading, handleRecipeImageUpload, handleSaveRecipe
                    }}
                />
            );

        // 2. Recipes List (Cookbook)
        case 'cookbook':
            return (
                <RecipesCombinedView
                    onRecipeClick={(id) => handleRecipeClick(id, 'cookbook')}
                />
            );

        // 3. Menu Exploration (Home, Dashboard, etc.)
        case 'home':
        case 'dashboard':
        case 'desktop-guide':
        case 'plannerMenu':
        case 'widgetsMenu':
            return (
                <MenuExplorationView
                    {...{
                        activeView, previousView, navigateTo, onBack: handleBack,
                        handleGoHome, isAdmin, setShowOnlyMyRecipes
                    }}
                />
            );

        // 4. Static Pages (Profile, Privacy, etc.)
        case 'profile':
        case 'privacy':
        case 'support':
        case 'terms':
            return <StaticPagesView activeView={activeView} onBack={handleBack} />;

        // 4. Imports (Special Handling)
        case 'import':
        case 'import-options':
        case 'import-bulk':
        case 'import-paste-text':
        case 'import-paste-url':
        case 'import-upload-photo':
        case 'import-voice':
        case 'import-video':
            return (
                <ImportWizardView
                    {...{
                        onBack: handleCloseImporter, navigateTo, isLoading, recipeLoading,
                        recipeSaving, successRecipe, setSuccessRecipe,
                        pastedRecipeURL, setPastedRecipeURL,
                        pastedRecipeContent, setPastedRecipeContent,
                        handlePasteRecipeContent, handlePasteRecipeURL,
                        handleSaveAndViewRecipe, handleManualRecipeCreation,
                        isDragging, setIsDragging, processRecipeImage,
                        fileInputRef, isRecording, recordingTime,
                        startAudioRecording, stopAudioRecording,
                        videoURL, setVideoURL
                    }}
                />
            );

        // 5. Assistant (AI Chat)
        case 'messages':
            // Special case: if we are in messages but specifically asked to import
            if (isCreatingRecipe && !successRecipe) {
                return (
                    <ImportWizardView
                        {...{
                            onBack: handleBack, navigateTo, isLoading, recipeLoading,
                            recipeSaving, successRecipe, setSuccessRecipe,
                            pastedRecipeURL, setPastedRecipeURL,
                            pastedRecipeContent, setPastedRecipeContent,
                            handlePasteRecipeContent, handlePasteRecipeURL,
                            handleSaveAndViewRecipe, handleManualRecipeCreation,
                            isDragging, setIsDragging, processRecipeImage,
                            fileInputRef, isRecording, recordingTime,
                            startAudioRecording, stopAudioRecording,
                            videoURL, setVideoURL
                        }}
                    />
                );
            }
            return (
                <AssistantView
                    {...{
                        messages, messagesEndRef, isLoading, recipeSaving,
                        handleSaveAndViewRecipe, onBack: handleBack, input, setInput,
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
                    }}
                />
            );

        // 6. Integrated Components

        case 'recipe-detail':
            if (!effectiveRecipeId) {
                return null;
            }
            return (
                <RecipeDetail 
                    recipeId={effectiveRecipeId} 
                    onBack={handleBackFromRecipeDetail} 
                    onRemix={handleRemixRecipe}
                />
            );
        case 'recipe-tags':
            if (!effectiveRecipeId) {
                return null;
            }
            return (
                <RecipeTagsPanel 
                    recipeId={effectiveRecipeId} 
                    onBack={handleBack} 
                />
            );
        case 'recipe-share':
            return recipeToShare ? <SharePanel recipe={recipeToShare} onClose={handleBack} isInline={true} /> : null;
        case 'smart-match-picker':
            if (!smartMatchPicker) return null;
            return (
                <PanelWrapper title={`Matching: ${smartMatchPicker.initialSearchQuery}`} noPadding>
                    <FoodItemPicker
                        onSelect={smartMatchPicker.onSelect}
                        onSkip={smartMatchPicker.onSkip}
                        onDelete={smartMatchPicker.onDelete}
                        onClose={() => { smartMatchPicker.onClose(); handleBack(); }}
                        mode="all"
                        isAdmin={false}
                        inline={true}
                        initialSearchQuery={smartMatchPicker.initialSearchQuery}
                        initialResults={smartMatchPicker.initialResults}
                    />
                </PanelWrapper>
            );
        case 'portion-match-picker':
            if (!smartMatchPortion) return null;
            return (
                <PortionMatchPanel
                    state={smartMatchPortion}
                    onBack={() => { smartMatchPortion.onBack(); handleBack(); }}
                    onFinalize={smartMatchPortion.onFinalize}
                />
            );
        case 'ingredient-match':
            if (!ingredientMatch) return null;
            return (
                <IngredientMatchDialog
                    unmatchedIngredients={ingredientMatch.unmatchedIngredients}
                    onComplete={ingredientMatch.onComplete}
                    onMatched={ingredientMatch.onMatched}
                    isOpen={activeView === 'ingredient-match'}
                />
            );
        case 'shopping': return <ShoppingPanel />;
        case 'pantry': return <PantryPanel />;
        case 'planner': return <PlannerPanel onRecipeClick={(id) => handleRecipeClick(id, 'planner')} />;
        case 'nutridex': return <NutrientsView compact={true} />;
        case 'comparator': return <ComparatorFullPanel />;
        case 'lifeguard': return <LifeguardFullIntegration />;
        case 'recommended-intake':
            return (
                <div className="flex-1 overflow-hidden">
                    <RDAContent compact={false} showCloseButton={true} onClose={handleBack} />
                </div>
            );
        case 'export-recipes':
            return <ExportPanel onBack={() => navigateTo('cookbook')} />;
        case 'recipe-filters':
            return (
                <PanelWrapper title="Filter Recipes" noPadding>
                    <RecipeFilterContent onClose={isInline ? () => handleGoHome(previousView) : handleCloseModal} />
                </PanelWrapper>
            );
        case 'food-filters':
            return (
                <PanelWrapper title="Filter Foods" noPadding headerVariant="none">
                    <FoodFiltersPanel
                        showFavoritesOnly={foodFilter.showFavoritesOnly}
                        setShowFavoritesOnly={foodFilter.setShowFavoritesOnly}
                        selectedCategories={foodFilter.selectedCategories}
                        setSelectedCategories={foodFilter.setSelectedCategories}
                        onClose={isInline ? undefined : handleCloseModal}
                    />
                </PanelWrapper>
            );
        case 'nutrient-filters':
            return (
                <PanelWrapper title="Filter Nutrients" noPadding>
                    <NutrientFilterPanel
                        excludeFlavour={excludeFlavour}
                        setExcludeFlavour={setExcludeFlavour}
                        excludeSupplements={excludeSupplements}
                        setExcludeSupplements={setExcludeSupplements}
                        onClose={isInline ? undefined : handleCloseModal}
                    />
                </PanelWrapper>
            );
        case 'conversation-history':
            return (
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
            );
        case 'auth-prompt':
            return <AuthPromptPanel />;
        default:
            if (activeView && typeof activeView === 'string' && activeView.startsWith('help-')) return <HelpSection type={activeView as any} />;
            return null;
    }
}
