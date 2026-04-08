import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useFoodFilter } from '@/lib/context/food-filter-context';
import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';
import { useZumAssistant } from '@/lib/hooks/use-zum-assistant';
import { structureRecipeForSaving } from '@/lib/utils/recipe-parser';
import { ParsedRecipe } from '@/types/recipe';
import { toast } from 'sonner';
import { RecipeIngredient } from '@/components/recipe/builder/types';
import { useRecipeBuilderLogic } from '@/components/action-panel/hooks/use-recipe-builder-logic';
import { useImportLogic } from '@/components/action-panel/hooks/use-import-logic';

interface ActionPanelOrchestratorProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
}

export function useActionPanelOrchestrator({ onClose, onRecipeDetected }: ActionPanelOrchestratorProps) {
    const router = useRouter();
    const { user, saveRecipe } = useDataPersistence();
    const { filters } = useRecipeFilter();
    const { 
        activeView, setActiveView, previousView, setPreviousView, 
        navigateTo, goBack, recipeToRemix, setRecipeToRemix, 
        recipeToShare, setRecipeToShare, setIsActionPanelOpen 
    } = useActionPanel();
    
    // Abstracted Zum Assistant Props (Directly from hook for primary conversation)
    const zumAssistant = useZumAssistant();
    const { 
        messages, setMessages, isLoading, setIsLoading, input, setInput, 
        handleSend, isRecording, recordingTime, startAudioRecording, 
        stopAudioRecording, processRecipeImage,
        handlePasteRecipeContent: handlePasteRecipeContentHook,
        handlePasteRecipeURL: handlePasteRecipeURLHook,
        successRecipe, setSuccessRecipe, recipeLoading, setRecipeLoading,
        conversationHistory, isLoadingHistory, loadHistory, startNewConversation,
        saveCurrentConversation
    } = zumAssistant;

    // Navigation Sub-Handlers
    const handleGoHome = (fallback?: ActionPanelView | null) => {
        setPreviousView(null);
        if (fallback && fallback !== activeView) {
            setActiveView(fallback);
        } else {
            setActiveView('guide');
        }
    };

    const handleBack = () => {
        goBack(handleGoHome);
    };

    // --- Modular Logic Hooks ---

    // 1. Recipe Builder Logic
    const builder = useRecipeBuilderLogic({
        onSaveSuccess: async (recipeData, ingredients, instructions) => {
            await saveRecipe(recipeData, ingredients, instructions);
            toast.success(`"${recipeData.title}" saved!`);
        }
    });

    // 2. Import Logic
    const importer = useImportLogic({
        onImportSuccess: async (recipe) => {
            // handle auto-view if needed
        }
    });

    // --- Local Orchestrator State ---
    const [isAdmin, setIsAdmin] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [expandedRecipeMenu, setExpandedRecipeMenu] = useState(false);
    const [expandedAppsMenu, setExpandedAppsMenu] = useState(false);
    const [expandedWidgetsMenu, setExpandedWidgetsMenu] = useState(false);
    const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

    // DOM Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const isInitialMount = useRef(true);
    const currentActiveViewRef = useRef(activeView);

    // Sync ref with state
    useEffect(() => {
        currentActiveViewRef.current = activeView;
    }, [activeView]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Admin Verification
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                    const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
                    setIsAdmin(userEmail === adminEmail && !!adminEmail);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            }
        };
        checkAdminStatus();
    }, []);

    // OS Browser History Injection
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isStandalonePage = window.location.pathname.includes('/cookbook/') || window.location.pathname.includes('/library/');
            
            if (!isInitialMount.current && !isStandalonePage) {
                window.history.pushState(
                    { activeView, previousView },
                    '',
                    window.location.href
                );
            }
            isInitialMount.current = false;
        }
    }, [activeView, previousView]);

    useEffect(() => {
        if (activeView === 'recipe-builder' && !builder.showRecipeBuilder) {
            builder.handleManualRecipeCreation();
        }
    }, [activeView, builder.showRecipeBuilder]);

    // Popstate handler - wrapped in useCallback to prevent re-creation on every render
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const currentView = currentActiveViewRef.current;
            if (e.state?.activeView) {
                setActiveView(e.state.activeView);
                if (e.state.previousView) {
                    setPreviousView(e.state.previousView);
                }
            } else if (currentView !== 'dashboard' && currentView !== 'desktop-guide') {
                handleBack();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleBack]);

    // View Cleanup Sync
    useEffect(() => {
        // Keep recipe builder state persistent - only cleared when user clicks close button
        if (activeView !== 'import' && importer.isCreatingRecipe && activeView !== 'messages') {
            importer.setIsCreatingRecipe(false);
        }
    }, [activeView, importer]);

    // Complex Handlers
    const handleSaveAndViewRecipe = async (recipe: ParsedRecipe) => {
        importer.setIsLoading(true);
        try {
            const structured = structureRecipeForSaving(recipe);
            if (!structured) throw new Error('Failed to structure recipe data for saving');
            const { recipeDataToSave, ingredientsList, instructionsList } = structured;

            const result = await saveRecipe(recipeDataToSave as any, ingredientsList, instructionsList);
            const recipeId = result?.id || `recipe-${Date.now()}`;
            
            toast.success('Successfully saved to your library!');
            setSelectedRecipeId(recipeId);
            setPreviousView(null);
            setActiveView('recipe-detail');
            importer.setSuccessRecipe(null);
            importer.setIsCreatingRecipe(false);
            importer.setPastedRecipeContent('');
            importer.setPastedRecipeURL('');
        } catch (error: any) {
            console.error('Error saving recipe:', error);
            toast.error('Failed to save recipe. Please try again.');
        } finally {
            importer.setIsLoading(false);
        }
    };

    const handleCloseModal = async () => {
        await saveCurrentConversation();
        onClose();
    };

    const handleCreateNewRecipe = () => {
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
        navigateTo('import');
        importer.setIsCreatingRecipe(true);
    };

    const handleRemixRecipe = useCallback((recipe: any, ingredientsList?: any[], instructionsList?: any[], isEdit: boolean = false) => {
        builder.setIsRemix(!isEdit);
        builder.setEditingRecipeId(isEdit ? recipe.id : null);
        builder.setIsMix(recipe.is_mix || false);
        importer.setIsCreatingRecipe(false);
        builder.setShowRecipeBuilder(true);
        builder.setRecipeTitle(isEdit ? recipe.title : `${recipe.title} (Remix)`);
        builder.setRecipeStep(1);
        
        const sourceIngredients = ingredientsList || recipe.ingredients || [];
        const sourceInstructions = instructionsList || recipe.instructions || [];
        const servings = recipe.servings || 4;

        if (!isEdit) {
            builder.setRecipeTitle(`${recipe.title || 'Remix'} 🌈`);
        } else {
            builder.setRecipeTitle(recipe.title);
        }
        builder.setRecipeType(recipe.meal_type || recipe.type || 'dinner');
        builder.setRecipePrepTime(recipe.prep_time || 30);
        builder.setRecipeCookTime(recipe.cook_time || 0);
        builder.setRecipeServings(servings);
        builder.setRecipeImage(recipe.image || '');
        
        if (sourceIngredients && Array.isArray(sourceIngredients)) {
            const mapped: RecipeIngredient[] = sourceIngredients.map((ing: any) => {
                const food = ing.food_item || ing.food_items || {};
                // Use the weight as stored in the DB (Total Weight)
                // Do NOT multiply by servings here as it causes double-scaling.
                const weight_g = ing.weight_g || 0;
                const quantity = ing.quantity || (ing.amount ? parseFloat(ing.amount) : 1);
                
                return {
                    food_item_id: ing.food_item_id || 'temp-id',
                    food_item_name: food.common_name || food.name || ing.item || ing.base_ingredient || 'Unknown',
                    weight_g,
                    quantity,
                    measure_label: ing.measure_label || ing.unit || 'g',
                    image: food.image,
                    // Store BASE (per 100g) values.
                    // The builder workspace will apply the weight multiplier (weight/100) for summary display.
                    calories: food.energy_kcal || 0,
                    energy_kj: food.energy_kj || (food.energy_kcal || 0) * 4.184,
                    protein: food.protein_g || 0,
                    fat: food.fat_g || 0,
                    carbs: food.carbs_g || 0,
                    micronutrients: food.micronutrients || {},
                    available_measures: food.portions || [],
                    base_nutrition: {
                        calories: food.energy_kcal || 0,
                        energy_kj: food.energy_kj || (food.energy_kcal || 0) * 4.184,
                        protein: food.protein_g || 0,
                        fat: food.fat_g || 0,
                        carbs: food.carbs_g || 0,
                        micronutrients: food.micronutrients || {}
                    }
                };
            });
            builder.setRecipeIngredients(mapped);
        } else {
            builder.setRecipeIngredients([]);
        }

        if (sourceInstructions && Array.isArray(sourceInstructions)) {
            const sortedInstructions = [...sourceInstructions].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
            builder.setRecipeInstructions(sortedInstructions.map((ins: any) => typeof ins === 'string' ? ins : (ins.step_text || ins.text)));
        } else {
            builder.setRecipeInstructions(['']);
        }

        builder.setShowRecipeBuilder(true);
        builder.setRecipeStep(1); 
        navigateTo('recipe-builder');
    }, [builder, importer, navigateTo]);

    useEffect(() => {
        if (recipeToRemix) {
            const { recipe, ingredients, instructions, isEdit } = recipeToRemix;
            handleRemixRecipe(recipe, ingredients, instructions, isEdit);
            setRecipeToRemix(null);
        }
    }, [recipeToRemix, handleRemixRecipe, setRecipeToRemix]);

    const handleRecipeClick = (recipeId: string, fromView: ActionPanelView) => {
        setSelectedRecipeId(recipeId);
        setPreviousView(fromView);
        setActiveView('recipe-detail');
    };

    const handleBackFromRecipeDetail = () => {
        handleBack();
        setSelectedRecipeId(null);
    };

    const handleViewAllRecipes = () => {
        setIsActionPanelOpen(false);
        router.push('/cookbook');
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const handleViewMyRecipes = () => {
        setIsActionPanelOpen(false);
        router.push('/cookbook?mine=true');
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const loadConversationFromHistory = async (conversation: any) => {
        importer.setIsLoading(true);
        try {
            if (conversation.messages) {
                setMessages(conversation.messages);
                setActiveView('messages');
            }
        } catch (error) {
            toast.error('Failed to load conversation');
        } finally {
            importer.setIsLoading(false);
        }
    };

    const handleLoadConversationHistory = () => {
        loadHistory();
        setActiveView('conversation-history');
    };

    const handleCloseRecipeBuilderWithReset = () => {
        builder.resetBuilder();
        navigateTo('guide');
    };

    const handleCloseImporterWithReset = () => {
        importer.resetImporter();
        navigateTo('guide');
    };

    const handleCloseExporter = () => {
        navigateTo('guide');
    };

    return {
        // Hooks
        builder,
        importer,
        zumAssistant,

        // State directly
        messages, isLoading: importer.isLoading, isRecording: importer.isRecording, 
        recordingTime: importer.recordingTime, input, setInput,
        handleSend, startAudioRecording: importer.startAudioRecording, 
        stopAudioRecording: importer.stopAudioRecording, successRecipe: importer.successRecipe,
        recipeLoading: importer.recipeLoading, conversationHistory, isLoadingHistory, startNewConversation,
        
        // Expose Refs
        messagesEndRef, fileInputRef: importer.fileInputRef, audioInputRef, builderRef: builder.builderRef,
        
        // Expose Local State
        isAdmin, showQuickActions, setShowQuickActions, expandedRecipeMenu, setExpandedRecipeMenu,
        expandedAppsMenu, setExpandedAppsMenu, expandedWidgetsMenu, setExpandedWidgetsMenu,
        isCreatingRecipe: importer.isCreatingRecipe, setIsCreatingRecipe: importer.setIsCreatingRecipe,
        pastedRecipeContent: importer.pastedRecipeContent, setPastedRecipeContent: importer.setPastedRecipeContent,
        pastedRecipeURL: importer.pastedRecipeURL, setPastedRecipeURL: importer.setPastedRecipeURL, 
        videoURL: importer.videoURL, setVideoURL: importer.setVideoURL, isDragging: importer.isDragging, 
        setIsDragging: importer.setIsDragging, showOnlyMyRecipes, setShowOnlyMyRecipes, selectedRecipeId,
        
        // Recipe Builder Data Properties (Pass-through from builder hook)
        showRecipeBuilder: builder.showRecipeBuilder, recipeTitle: builder.recipeTitle, setRecipeTitle: builder.setRecipeTitle,
        recipeType: builder.recipeType, setRecipeType: builder.setRecipeType,
        recipePrepTime: builder.recipePrepTime, setRecipePrepTime: builder.setRecipePrepTime,
        recipeCookTime: builder.recipeCookTime, setRecipeCookTime: builder.setRecipeCookTime,
        recipeServings: builder.recipeServings, setRecipeServings: builder.setRecipeServings,
        recipeIngredients: builder.recipeIngredients, setRecipeIngredients: builder.setRecipeIngredients,
        recipeInstructions: builder.recipeInstructions, setRecipeInstructions: builder.setRecipeInstructions,
        recipeImage: builder.recipeImage, setRecipeImage: builder.setRecipeImage,
        recipeSaving: builder.recipeSaving, recipeUploading: builder.recipeUploading, recipeStep: builder.recipeStep, setRecipeStep: builder.setRecipeStep,
        
        // Expose Handlers
        handleGoHome, handleBack, handleSaveAndViewRecipe, 
        handleCloseModal, handleCreateNewRecipe, handleManualRecipeCreation: builder.handleManualRecipeCreation,
        handleRemixRecipe, handleRecipeClick, handleBackFromRecipeDetail,
        handleViewAllRecipes, handleViewMyRecipes,
        handleAddInstruction: builder.handleAddInstruction, 
        handleUpdateInstruction: builder.handleUpdateInstruction, 
        handleRemoveInstruction: builder.handleRemoveInstruction,
        handleRecipeImageUpload: builder.handleRecipeImageUpload, 
        handleSaveRecipe: (m?: boolean, r?: boolean) => builder.handleSaveRecipe(m, r), 
        handleCloseRecipeBuilder: handleCloseRecipeBuilderWithReset,
        handleCloseImporter: handleCloseImporterWithReset,
        handleCloseExporter,
        handlePasteRecipeContent: () => importer.handlePasteRecipeContent(setMessages), 
        handlePasteRecipeURL: () => importer.handlePasteRecipeURL(setMessages), 
        loadConversationFromHistory,
        handleLoadConversationHistory, processRecipeImage: importer.processRecipeImage, setSuccessRecipe: importer.setSuccessRecipe,
        
        // Share and Remix state
        recipeToShare, setRecipeToShare, recipeToRemix, setRecipeToRemix
    };
}
