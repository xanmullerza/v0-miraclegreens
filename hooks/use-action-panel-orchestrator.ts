import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';
import { useZumAssistant } from '@/lib/hooks/use-zum-assistant';
import { structureRecipeForSaving } from '@/lib/utils/recipe-parser';
import { ParsedRecipe } from '@/types/recipe';
import { toast } from 'sonner';
import { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';

interface ActionPanelOrchestratorProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
}

export function useActionPanelOrchestrator({ onClose, onRecipeDetected }: ActionPanelOrchestratorProps) {
    const { user, saveRecipe } = useDataPersistence();
    const { filters } = useRecipeFilter();
    const { activeView, setActiveView, previousView, setPreviousView, navigateTo, goBack, recipeToRemix, setRecipeToRemix, recipeToShare, setRecipeToShare } = useActionPanel();
    const builderRef = useRef<IngredientBuilderHandle>(null);
    
    // Abstracted Zum Assistant Props
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

    // Local Orchestrator State
    const [isAdmin, setIsAdmin] = useState(false);
    const [detectedURL, setDetectedURL] = useState<string | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [expandedRecipeMenu, setExpandedRecipeMenu] = useState(false);
    const [expandedAppsMenu, setExpandedAppsMenu] = useState(false);
    const [expandedWidgetsMenu, setExpandedWidgetsMenu] = useState(false);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setPastedRecipeURL] = useState('');
    const [videoURL, setVideoURL] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

    // Navigation Sub-Handlers
    const handleGoHome = (fallback?: ActionPanelView | null) => {
        setPreviousView(null);
        if (fallback && fallback !== activeView) {
            setActiveView(fallback);
        } else {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setActiveView('dashboard');
            } else {
                setActiveView('desktop-guide');
            }
        }
    };

    const handleBack = () => {
        goBack(handleGoHome);
    };

    // Recipe Builder Internal State
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeType, setRecipeType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [recipePrepTime, setRecipePrepTime] = useState(30);
    const [recipeCookTime, setRecipeCookTime] = useState(0);
    const [recipeServings, setRecipeServings] = useState(4);
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
    const [recipeInstructions, setRecipeInstructions] = useState<string[]>(['']);
    const [recipeImage, setRecipeImage] = useState('');
    const [recipeSaving, setRecipeSaving] = useState(false);
    const [recipeUploading, setRecipeUploading] = useState(false);
    const [recipeStep, setRecipeStep] = useState(1);
    const [isMix, setIsMix] = useState(false);
    const [isRemix, setIsRemix] = useState(false);
    const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
    const [cookbookTab, setCookbookTab] = useState<'recipes' | 'remixes' | 'mixes'>('recipes');

    // DOM Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const recipeContentRef = useRef<HTMLTextAreaElement>(null);
    const recipeImageInputRef = useRef<HTMLInputElement>(null);
    const isInitialMount = useRef(true);

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
            if (!isInitialMount.current) {
                window.history.pushState(
                    { activeView, previousView },
                    '',
                    window.location.href
                );
            }
            isInitialMount.current = false;
        }
    }, [activeView]);

    useEffect(() => {
        if (activeView === 'recipe-builder' && !showRecipeBuilder) {
            handleManualRecipeCreation();
        }
    }, [activeView, showRecipeBuilder]);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state?.activeView) {
                setActiveView(e.state.activeView);
                if (e.state.previousView) {
                    setPreviousView(e.state.previousView);
                }
            } else if (activeView !== 'dashboard' && activeView !== 'desktop-guide') {
                handleBack();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setActiveView, setPreviousView]);

    // Complex Handlers
    const handleSaveAndViewRecipe = async (recipe: ParsedRecipe) => {
        setRecipeSaving(true);
        try {
            const structured = structureRecipeForSaving(recipe);
            if (!structured) throw new Error('Failed to structure recipe data for saving');
            const { recipeDataToSave, ingredientsList, instructionsList } = structured;

            const result = await saveRecipe(recipeDataToSave as any, ingredientsList, instructionsList);
            const recipeId = result?.id || `recipe-${Date.now()}`;
            
            toast.success('Successfully saved to your library!');
            setSelectedRecipeId(recipeId);
            setPreviousView('view-recipes');
            setActiveView('recipe-detail');
            setSuccessRecipe(null);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
            setPastedRecipeURL('');
        } catch (error: any) {
            console.error('Error saving recipe:', error);
            toast.error('Failed to save recipe. Please try again.');
        } finally {
            setRecipeSaving(false);
        }
    };

    const handleViewSavedRecipe = async (recipe?: ParsedRecipe) => {
        const recipeToView = recipe || successRecipe;
        if (!recipeToView) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { data: savedRecipe, error } = await supabase
                .from('recipes')
                .select('id')
                .eq('source_url', recipeToView.source_url)
                .or(`user_id.eq.${user.id},and(is_curated.eq.true,user_id.is.null)`)
                .single();

            if (error || !savedRecipe) {
                if (onRecipeDetected && !recipe) onRecipeDetected(recipeToView);
                return;
            }

            setSelectedRecipeId(savedRecipe.id);
            setPreviousView('view-recipes');
            setActiveView('recipe-detail');
        } catch (error) {
            if (onRecipeDetected && !recipe) onRecipeDetected(recipeToView);
        }
    };

    const handleCloseModal = async () => {
        await saveCurrentConversation();
        onClose();
    };

    const handleCreateNewRecipe = () => {
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
        setIsCreatingRecipe(true);
    };

    const handleManualRecipeCreation = () => {
        setShowRecipeBuilder(true);
        setRecipeStep(1);
        setRecipeTitle('');
        setRecipeType('dinner');
        setRecipePrepTime(30);
        setRecipeCookTime(0);
        setRecipeServings(4);
        setRecipeIngredients([]);
        setRecipeInstructions(['']);
        setRecipeImage('');
        setIsMix(false);
        setIsRemix(false);
        setEditingRecipeId(null);
    };

    const handleRemixRecipe = (recipe: any, ingredientsList?: any[], instructionsList?: any[], isEdit: boolean = false) => {
        setIsRemix(!isEdit);
        setEditingRecipeId(isEdit ? recipe.id : null);
        setIsMix(recipe.is_mix || false);
        setIsCreatingRecipe(true);
        setShowRecipeBuilder(true);
        setRecipeTitle(isEdit ? recipe.title : `${recipe.title} (Remix)`);
        setRecipeStep(1);
        
        const sourceIngredients = ingredientsList || recipe.ingredients || [];
        const sourceInstructions = instructionsList || recipe.instructions || [];
        const servings = recipe.servings || 4;

        if (!isEdit) {
            setRecipeTitle(`${recipe.title || 'Remix'} 🌈`);
        } else {
            setRecipeTitle(recipe.title);
        }
        setRecipeType(recipe.meal_type || recipe.type || 'dinner');
        setRecipePrepTime(recipe.prep_time || 30);
        setRecipeCookTime(recipe.cook_time || 0);
        setRecipeServings(servings);
        setRecipeImage(recipe.image || '');
        
        if (sourceIngredients && Array.isArray(sourceIngredients)) {
            const mapped: RecipeIngredient[] = sourceIngredients.map((ing: any) => {
                const food = ing.food_item || ing.food_items || {};
                const weight_g = (ing.weight_g || 0) * servings;
                const quantity = (ing.quantity || (ing.amount ? parseFloat(ing.amount) : 1)) * servings;
                const multiplier = weight_g / 100;
                
                return {
                    food_item_id: ing.food_item_id || 'temp-id',
                    food_item_name: food.common_name || food.name || ing.item || ing.base_ingredient || 'Unknown',
                    weight_g,
                    quantity,
                    measure_label: ing.measure_label || ing.unit || 'g',
                    image: food.image,
                    calories: (food.energy_kcal || 0) * multiplier,
                    energy_kj: (food.energy_kj || (food.energy_kcal || 0) * 4.184) * multiplier,
                    protein: (food.protein_g || 0) * multiplier,
                    fat: (food.fat_g || 0) * multiplier,
                    carbs: (food.carbs_g || 0) * multiplier,
                    micronutrients: Object.entries(food.micronutrients || {}).reduce((acc, [k, v]) => {
                        acc[k] = (Number(v) || 0) * multiplier;
                        return acc;
                    }, {} as Record<string, number>),
                    base_nutrition: {
                        calories: food.energy_kcal || 0,
                        energy_kj: food.energy_kj || (food.energy_kcal || 0) * 4.184,
                        protein: food.protein_g || 0,
                        fat: food.fat_g || 0,
                        carbs: food.carbs_g || 0,
                        micronutrients: food.micronutrients || {}
                    },
                    available_measures: food.portions || food.available_measures || [],
                    modifier: ing.modifier || null
                };
            });
            setRecipeIngredients(mapped);
        } else {
            setRecipeIngredients([]);
        }

        if (sourceInstructions && Array.isArray(sourceInstructions)) {
            const sortedInstructions = [...sourceInstructions].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
            setRecipeInstructions(sortedInstructions.map((ins: any) => typeof ins === 'string' ? ins : (ins.step_text || ins.text)));
        } else {
            setRecipeInstructions(['']);
        }

        setIsCreatingRecipe(false);
        setShowRecipeBuilder(true);
        setRecipeStep(1); 
    };

    useEffect(() => {
        if (recipeToRemix) {
            const { recipe, ingredients, instructions, isEdit } = recipeToRemix;
            handleRemixRecipe(recipe, ingredients, instructions, isEdit);
            setRecipeToRemix(null);
        }
    }, [recipeToRemix, handleRemixRecipe, setRecipeToRemix]);

    const handleRecipeClick = (recipeId: string, fromView: 'view-recipes' | 'planner') => {
        setSelectedRecipeId(recipeId);
        setPreviousView(fromView);
        setActiveView('recipe-detail');
    };

    const handleBackFromRecipeDetail = () => {
        handleBack();
        setSelectedRecipeId(null);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await processRecipeImage(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleViewAllRecipes = () => {
        navigateTo('view-recipes');
        setShowOnlyMyRecipes(false);
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const handleViewMyRecipes = () => {
        navigateTo('view-recipes');
        setShowOnlyMyRecipes(true);
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const handleAddInstruction = () => setRecipeInstructions([...recipeInstructions, '']);
    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...recipeInstructions];
        updated[index] = value;
        setRecipeInstructions(updated);
    };
    const handleRemoveInstruction = (index: number) => setRecipeInstructions(recipeInstructions.filter((_, i) => i !== index));

    const handleRecipeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setRecipeUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `user-uploads/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('recipes')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw new Error("Upload Failed");

            const { data: { publicUrl } } = supabase.storage
                .from('recipes')
                .getPublicUrl(filePath);

            setRecipeImage(publicUrl);
        } catch (err: any) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRecipeImage(reader.result as string);
                setRecipeUploading(false);
            };
            reader.readAsDataURL(file);
        } finally {
            setRecipeUploading(false);
        }
    };

    const handleSaveRecipe = async (forceIsMix?: boolean, forceIsRemix?: boolean) => {
        const finalIsMix = forceIsMix !== undefined ? forceIsMix : isMix;
        const finalIsRemix = forceIsRemix !== undefined ? forceIsRemix : isRemix;

        if (!recipeTitle || recipeIngredients.length === 0 || recipeInstructions.filter(i => i.trim()).length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        setRecipeSaving(true);
        try {
            const totals = recipeIngredients.reduce((acc, ing) => ({
                calories: acc.calories + (ing.calories || 0),
                protein: acc.protein + (ing.protein || 0),
                fat: acc.fat + (ing.fat || 0),
                carbs: acc.carbs + (ing.carbs || 0),
            }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

            const recipeData = {
                title: recipeTitle,
                type: recipeType,
                calories: Math.round(totals.calories / (recipeServings || 1)),
                protein: Math.round((totals.protein / (recipeServings || 1)) * 10) / 10,
                carbs: Math.round((totals.carbs / (recipeServings || 1)) * 10) / 10,
                fat: Math.round((totals.fat / (recipeServings || 1)) * 10) / 10,
                prep_time: recipePrepTime,
                cook_time: recipeCookTime,
                servings: recipeServings,
                image: recipeImage,
                source: 'manual',
                is_favorite: true,
                is_mix: finalIsMix,
                is_remix: finalIsRemix,
                id: editingRecipeId || undefined
            };

            await saveRecipe(recipeData, recipeIngredients, recipeInstructions);
            toast.success(`"${recipeTitle}" saved to ${finalIsMix ? 'Mixes' : finalIsRemix ? 'Remixes' : 'Recipes'}`);
            
            if (filters.pantryMode === 'pantry-only') {
                toast.info('💡 Your recipe is saved but hidden in Pantry-Only mode. Add ingredients to your pantry to see it!', { duration: 5000 });
            }
            
            setCookbookTab(finalIsMix ? 'mixes' : finalIsRemix ? 'remixes' : 'recipes');
            setActiveView('view-recipes');
            setShowRecipeBuilder(false);
            setIsCreatingRecipe(false);
            setEditingRecipeId(null);
            
            if ((window as any).refreshRecipeLibrary) {
                (window as any).refreshRecipeLibrary();
            }
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setRecipeSaving(false);
        }
    };

    const handleCloseRecipeBuilder = () => {
        handleBack();
        setShowRecipeBuilder(false);
        setRecipeTitle('');
        setRecipeIngredients([]);
        setRecipeInstructions(['']);
        setRecipeImage('');
        setRecipeStep(1);
        setRecipeCookTime(0);
        setIsMix(false);
        setIsRemix(false);
    };

    const handlePasteRecipeContent = async () => {
        if (!pastedRecipeContent.trim()) return;

        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: `📝 Pasted recipe content`, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            await handlePasteRecipeContentHook(pastedRecipeContent);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
            if (recipeContentRef.current) recipeContentRef.current.value = '';
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [...prev.slice(0, -1), { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteRecipeURL = async () => {
        if (!pastedRecipeURL.trim()) return;

        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: `🔗 Pasted recipe URL`, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            await handlePasteRecipeURLHook(pastedRecipeURL);
            setIsCreatingRecipe(false);
            setPastedRecipeURL('');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [...prev.slice(0, -1), { id: (Date.now() + 1).toString(), type: 'bot', content: `❌ Sorry, I encountered an error: ${errorMessage}`, timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversationFromHistory = async (conversation: any) => {
        setIsLoading(true);
        try {
            if (conversation.messages) {
                setMessages(conversation.messages);
                setActiveView('messages');
            }
        } catch (error) {
            toast.error('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadConversationHistory = () => {
        loadHistory();
        setActiveView('conversation-history');
    };

    return {
        // Expose underlying ZumAssistant logic
        zumAssistant,
        messages, isLoading, isRecording, recordingTime, input, setInput,
        handleSend, startAudioRecording, stopAudioRecording, successRecipe,
        recipeLoading, conversationHistory, isLoadingHistory, startNewConversation,
        
        // Expose Refs
        messagesEndRef, fileInputRef, audioInputRef, recipeContentRef, builderRef,
        
        // Expose Local State
        isAdmin, showQuickActions, setShowQuickActions, expandedRecipeMenu, setExpandedRecipeMenu,
        expandedAppsMenu, setExpandedAppsMenu, expandedWidgetsMenu, setExpandedWidgetsMenu,
        isCreatingRecipe, setIsCreatingRecipe, pastedRecipeContent, setPastedRecipeContent,
        pastedRecipeURL, setPastedRecipeURL, videoURL, setVideoURL, isDragging, setIsDragging,
        showOnlyMyRecipes, setShowOnlyMyRecipes, selectedRecipeId,
        
        // Recipe Builder Data Properties
        showRecipeBuilder, recipeTitle, setRecipeTitle, recipeType, setRecipeType,
        recipePrepTime, setRecipePrepTime, recipeCookTime, setRecipeCookTime,
        recipeServings, setRecipeServings, recipeIngredients, setRecipeIngredients,
        recipeInstructions, setRecipeInstructions, recipeImage, setRecipeImage,
        recipeSaving, recipeUploading, recipeStep, setRecipeStep,
        
        // Expose Handlers
        handleGoHome, handleBack, handleSaveAndViewRecipe, handleViewSavedRecipe,
        handleCloseModal, handleCreateNewRecipe, handleManualRecipeCreation,
        handleRemixRecipe, handleRecipeClick, handleBackFromRecipeDetail,
        handleImageUpload, handleViewAllRecipes, handleViewMyRecipes,
        handleAddInstruction, handleUpdateInstruction, handleRemoveInstruction,
        handleRecipeImageUpload, handleSaveRecipe, handleCloseRecipeBuilder,
        handlePasteRecipeContent, handlePasteRecipeURL, loadConversationFromHistory,
        handleLoadConversationHistory, processRecipeImage, setSuccessRecipe
    };
}
