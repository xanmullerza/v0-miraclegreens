import React from 'react';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { RecipesViewPremium } from '@/components/recipe/recipes-view-premium';
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

// New View Components
import { AssistantView } from './views/AssistantView';
import { RecipeBuilderView } from './views/RecipeBuilderView';
import { ImportWizardView } from './views/ImportWizardView';
import { MenuExplorationView } from './views/MenuExplorationView';
import { StaticPagesView } from './views/StaticPagesView';
import { ExportPanel } from './export-panel';
import { HelpSection } from './help-section';
import { RecipeTagsPanel } from '@/components/recipe/detail/recipe-tags-panel';

interface ActionPanelRouterProps {
    orchestrator: any; 
}

export function ActionPanelRouter({ orchestrator }: ActionPanelRouterProps) {
    const { 
        activeView, previousView, navigateTo, excludeFlavour, 
        setExcludeFlavour, excludeSupplements, setExcludeSupplements 
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

    // 1. Recipe Builder (Full Overlay Mode)
    if (showRecipeBuilder) {
        return (
            <RecipeBuilderView
                {...{
                    recipeStep, setRecipeStep, recipeTitle, setRecipeTitle,
                    recipeServings, setRecipeServings, recipePrepTime, setRecipePrepTime,
                    recipeCookTime, setRecipeCookTime, recipeIngredients, setRecipeIngredients,
                    recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
                    handleCloseRecipeBuilder, recipeSaving, handleAddInstruction,
                    handleUpdateInstruction, handleRemoveInstruction, builderRef,
                    recipeUploading, handleRecipeImageUpload, handleSaveRecipe
                }}
            />
        );
    }

    // 2. Menu Exploration (Dashboard, Cookbook, etc.)
    const explorerViews = ['dashboard', 'desktop-guide', 'cookbook', 'plannerMenu', 'widgetsMenu'];
    if (explorerViews.includes(activeView)) {
        return (
            <MenuExplorationView
                {...{
                    activeView, previousView, navigateTo, onBack: handleBack,
                    handleGoHome, isAdmin, setShowOnlyMyRecipes
                }}
            />
        );
    }

    // 3. Static Pages (Profile, Privacy, etc.)
    const staticViews = ['profile', 'privacy', 'support', 'terms'];
    if (staticViews.includes(activeView)) {
        return <StaticPagesView activeView={activeView} onBack={handleBack} />;
    }

    // 4. Imports (Special Handling)
    if (activeView === 'import' || (activeView === 'messages' && isCreatingRecipe && !successRecipe)) {
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

    // 5. Assistant (AI Chat)
    if (activeView === 'messages') {
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
    }

    // 6. Integrated Components
    switch (activeView) {
        case 'view-recipes':
            return (
                <PanelWrapper title="Recipes" onClose={handleBack}>
                    <div className="px-2 pb-20 mt-8">
                        <RecipesViewPremium onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'view-recipes')} />
                    </div>
                </PanelWrapper>
            );
            return selectedRecipeId ? (
                <RecipeDetail 
                    recipeId={selectedRecipeId} 
                    onBack={handleBackFromRecipeDetail} 
                    onRemix={handleRemixRecipe}
                />
            ) : null;
        case 'recipe-tags':
            return selectedRecipeId ? (
                <RecipeTagsPanel 
                    recipeId={selectedRecipeId} 
                    onBack={handleBack} 
                />
            ) : null;
        case 'recipe-share':
            return recipeToShare ? <SharePanel recipe={recipeToShare} onClose={handleBack} isInline={true} /> : null;
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
                <PanelWrapper title="Filter Recipes" onClose={() => handleGoHome(previousView)} noPadding>
                    <RecipeFilterContent onClose={() => handleGoHome(previousView)} />
                </PanelWrapper>
            );
        case 'food-filters':
            return (
                <PanelWrapper title="Filter Foods" onClose={() => handleGoHome(previousView)} noPadding>
                    <FoodFiltersPanel
                        showFavoritesOnly={foodFilter.showFavoritesOnly}
                        setShowFavoritesOnly={foodFilter.setShowFavoritesOnly}
                        selectedCategories={foodFilter.selectedCategories}
                        setSelectedCategories={foodFilter.setSelectedCategories}
                    />
                </PanelWrapper>
            );
        case 'nutrient-filters':
            return (
                <PanelWrapper title="Filter Nutrients" onClose={() => handleGoHome(previousView)} noPadding>
                    <NutrientFilterPanel
                        excludeFlavour={excludeFlavour}
                        setExcludeFlavour={setExcludeFlavour}
                        excludeSupplements={excludeSupplements}
                        setExcludeSupplements={setExcludeSupplements}
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
        default:
            if (activeView.startsWith('help-')) return <HelpSection type={activeView as any} />;
            return null;
    }
}
