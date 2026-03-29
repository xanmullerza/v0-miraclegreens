'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Send, Loader2, Upload, Menu, Salad, ChevronRight, ChevronLeft, Grid2x2, Plus, Trash2, ArrowLeft, Save, Camera, ShoppingBag, Package, Calendar, Mic, Square, Link, FileText, Pencil, Video, Database, Lock, Filter, MessageCircle, Wand2, Beaker, ArrowDownUp, CircleHelp, Share2, Clock, ChefHat, Home, Smartphone, TabletSmartphone, Monitor as Computer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { RecipesViewPremium } from '@/components/recipe/recipes-view-premium';
import { ChatbotImportView } from '@/components/chatbot/chatbot-import-view';
import { MyRecipesView } from '@/components/recipe/my-recipes-view';
import { ChatbotDashboardView } from '@/components/chatbot/chatbot-dashboard-view';
import { ChatbotDesktopGuide } from '@/components/chatbot/chatbot-desktop-guide';
import { ChatbotMessagesView } from '@/components/chatbot/chatbot-messages-view';
import { ChatbotBottomNav } from '@/components/chatbot/chatbot-bottom-nav';
import { ChatbotInputSection } from '@/components/chatbot/chatbot-input-section';
import { ChatbotRecipeBuilderView } from '@/components/chatbot/chatbot-recipe-builder-view';
import { ChatbotRecipeDetail } from '@/components/chatbot/chatbot-recipe-detail';
import { ChatbotShopping } from '@/components/chatbot/chatbot-shopping';
import { ChatbotPantry } from '@/components/chatbot/chatbot-pantry';
import { ChatbotPlanner } from '@/components/chatbot/chatbot-planner';
import { NutrientsView } from '@/components/nutrients/nutrients-view';
import { ChatbotComparatorFull } from '@/components/chatbot/chatbot-comparator-full';
import { ChatbotLifeguardFullIntegration } from '@/components/chatbot/chatbot-lifeguard-full-integration';
import { ChatbotHelpSection } from '@/components/chatbot/chatbot-help-section';
import { ChatbotExport } from '@/components/chatbot/chatbot-export';
import { ChatbotShare } from '@/components/chatbot/chatbot-share';
import { RDAContent } from '@/components/ux/rda-content';
import ProfilePage from '@/app/users/profile/page';
import PrivacyPolicyPage from '@/app/static/privacy/page';
import SupportPage from '@/app/static/support/page';
import TermsPage from '@/app/static/terms/page';
import { toast } from 'sonner';
import { HeaderLogo } from '@/components/ui/header-logo';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useChatbot, ChatbotViewType } from '@/lib/context/chatbot-context';
import { useSplitView } from '@/lib/context/split-view-context';
import { useZumAssistant, Message } from '@/lib/hooks/use-zum-assistant';
import { structureRecipeForSaving } from '@/lib/utils/recipe-parser';
import { ParsedRecipe } from '@/types/recipe';
import { RecipeFilterContent } from '@/components/recipe/recipe-filter-dialog';

interface ChatbotModalProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
    isInline?: boolean;
}

const CHATBOT_MESSAGES_KEY = 'chatbot_messages_v1';

export function ChatbotModal({ onClose, onRecipeDetected, isInline = false }: ChatbotModalProps) {
    const router = useRouter();
    const { user, saveRecipe } = useDataPersistence();
    const { profile } = useUserPreferences();
    const { filters } = useRecipeFilter();
    const { isChatbotOpen, setIsChatbotOpen, chatbotView, setChatbotView, previousView, setPreviousView, navigateTo, goBack, recipeToRemix, setRecipeToRemix, recipeToShare, setRecipeToShare } = useChatbot();
    const { resizeMode, toggleResize, setResizeMode } = useSplitView();
    const builderRef = useRef<IngredientBuilderHandle>(null);
    
    const { 
        messages, setMessages, isLoading, setIsLoading, input, setInput, 
        handleSend, isRecording, recordingTime, startAudioRecording, 
        stopAudioRecording, processRecipeImage,
        handlePasteRecipeContent: handlePasteRecipeContentHook,
        handlePasteRecipeURL: handlePasteRecipeURLHook,
        successRecipe, setSuccessRecipe, recipeLoading, setRecipeLoading,
        conversationHistory, isLoadingHistory, loadHistory, startNewConversation,
        saveCurrentConversation
    } = useZumAssistant();

    const [isAdmin, setIsAdmin] = useState(false);
    const [detectedURL, setDetectedURL] = useState<string | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [expandedRecipeMenu, setExpandedRecipeMenu] = useState(false);
    const [expandedAppsMenu, setExpandedAppsMenu] = useState(false);
    const [expandedWidgetsMenu, setExpandedWidgetsMenu] = useState(false);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false); // Always reset on refresh
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setpastedRecipeURL] = useState('');
    const [videoURL, setVideoURL] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null); // Always reset on refresh
    const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

    const handleGoHome = (fallback?: ChatbotViewType | null) => {
        // Clear history stack when explicitly resetting to home
        // We do this via the context's setters to ensure everything stays in sync
        setPreviousView(null);
        // Note: Resetting the stack itself is better done by calling a context-level reset if needed,
        // but for now setting the view directly without pushing works.
        
        if (fallback && fallback !== chatbotView) {
            setChatbotView(fallback);
        } else {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setChatbotView('dashboard');
            } else {
                setChatbotView('desktop-guide');
            }
        }
    };

    const handleBack = () => {
        goBack(handleGoHome);
    };

    // Recipe builder state
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(false); // Always reset on refresh
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

    // Check if user is admin
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

    // Persist messages to localStorage whenever they change (conversation is saved locally)
    useEffect(() => {
        // This is now handled by useZumAssistant's saveCurrentConversation
        // saveChatbotMessages(messages);
    }, [messages]);

    // Handle browser history for OS back button
    useEffect(() => {
        // Push state to history when view changes (skip on initial mount)
        if (typeof window !== 'undefined') {
            if (!isInitialMount.current) {
                window.history.pushState(
                    { chatbotView, previousView },
                    '',
                    window.location.href
                );
            }
            isInitialMount.current = false;
        }
    }, [chatbotView]);

    // Automatically trigger manual recipe creation when view is set to recipe-builder
    useEffect(() => {
        if (chatbotView === 'recipe-builder' && !showRecipeBuilder) {
            handleManualRecipeCreation();
        }
    }, [chatbotView, showRecipeBuilder]);

    // Handle popstate event (OS back button)
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state?.chatbotView) {
                setChatbotView(e.state.chatbotView);
                if (e.state.previousView) {
                    setPreviousView(e.state.previousView);
                }
            } else if (chatbotView !== 'dashboard' && chatbotView !== 'desktop-guide') {
                // Go back after success
                handleBack();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [setChatbotView, setPreviousView]);


    const handleSaveAndViewRecipe = async (recipe: ParsedRecipe) => {
        setRecipeSaving(true);
        try {
            const structured = structureRecipeForSaving(recipe);
            if (!structured) throw new Error('Failed to structure recipe data for saving');
            const { recipeDataToSave, ingredientsList, instructionsList } = structured;

            // DEBUG: Log what we're about to save
            console.log('📋 Recipe data to save:', {
                title: recipeDataToSave.title,
                prep_time: recipeDataToSave.prep_time,
                cook_time: recipeDataToSave.cook_time,
                difficulty: recipeDataToSave.difficulty,
                tags: recipeDataToSave.tags,
                sourceUrl: recipe.source_url
            });

            // Save the recipe
            const result = await saveRecipe(recipeDataToSave as any, ingredientsList, instructionsList);
            const recipeId = result?.id || `recipe-${Date.now()}`;
            
            toast.success('Successfully saved to your library!');
            
            // Navigate to the recipe within the modal
            setSelectedRecipeId(recipeId);
            setPreviousView('view-recipes');
            setChatbotView('recipe-detail');
            
            // Reset recipe creation states so user can import another recipe
            setSuccessRecipe(null);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
            setpastedRecipeURL('');
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            // Find the recipe - either user's own recipe OR a curated system recipe
            const { data: savedRecipe, error } = await supabase
                .from('recipes')
                .select('id')
                .eq('source_url', recipeToView.source_url)
                .or(`user_id.eq.${user.id},and(is_curated.eq.true,user_id.is.null)`)
                .single();

            if (error || !savedRecipe) {
                console.error('Recipe not found:', error);
                // Fallback to modal if recipe not found
                if (onRecipeDetected && !recipe) {
                    onRecipeDetected(recipeToView);
                }
                return;
            }

            // Navigate directly to recipe detail page within the modal
            setSelectedRecipeId(savedRecipe.id);
            setPreviousView('view-recipes');
            setChatbotView('recipe-detail');
        } catch (error) {
            console.error('Error navigating to recipe:', error);
            // Fallback to modal on error
            if (onRecipeDetected && !recipe) {
                onRecipeDetected(recipeToView);
            }
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
        // Use either passed ingredients or joined ingredients from recipe
        const sourceIngredients = ingredientsList || recipe.ingredients || [];
        const sourceInstructions = instructionsList || recipe.instructions || [];
        const servings = recipe.servings || 4;

        // Pre-fill states for builder
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
        
        // Map ingredients for the builder - Scale "per serving" to "total"
        if (sourceIngredients && Array.isArray(sourceIngredients)) {
            const mapped: RecipeIngredient[] = sourceIngredients.map((ing: any) => {
                // Handle various join aliases: food_item, food_items, or nested
                const food = ing.food_item || ing.food_items || {};
                
                // DB stores per-serving, Builder needs TOTAL for all servings
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
                    // Calculate absolute values for the total batch
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

        // Map instructions
        if (sourceInstructions && Array.isArray(sourceInstructions)) {
            const sortedInstructions = [...sourceInstructions].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
            setRecipeInstructions(sortedInstructions.map((ins: any) => typeof ins === 'string' ? ins : (ins.step_text || ins.text)));
        } else {
            setRecipeInstructions(['']);
        }

        // Switch to builder view
        setIsCreatingRecipe(false);
        setShowRecipeBuilder(true);
        setRecipeStep(1); 
    };

    // Auto-trigger remix when data is passed via context
    useEffect(() => {
        if (recipeToRemix) {
            const { recipe, ingredients, instructions, isEdit } = recipeToRemix;
            handleRemixRecipe(recipe, ingredients, instructions, isEdit);
            // Clear it so it doesn't re-trigger
            setRecipeToRemix(null);
        }
    }, [recipeToRemix, handleRemixRecipe, setRecipeToRemix]);

    const handleRecipeClick = (recipeId: string, fromView: 'view-recipes' | 'planner') => {
        setSelectedRecipeId(recipeId);
        setPreviousView(fromView);
        setChatbotView('recipe-detail');
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

    // Recipe builder helper functions
    const handleAddInstruction = () => {
        setRecipeInstructions([...recipeInstructions, '']);
    };

    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...recipeInstructions];
        updated[index] = value;
        setRecipeInstructions(updated);
    };

    const handleRemoveInstruction = (index: number) => {
        setRecipeInstructions(recipeInstructions.filter((_, i) => i !== index));
    };

    const handleRecipeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setRecipeUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = fileName;

            const { data, error: uploadError } = await supabase.storage
                .from('recipes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // Fallback to data URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setRecipeImage(reader.result as string);
                    setRecipeUploading(false);
                };
                reader.readAsDataURL(file);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('recipes')
                .getPublicUrl(filePath);

            setRecipeImage(publicUrl);
            setRecipeUploading(false);
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setRecipeImage(reader.result as string);
                setRecipeUploading(false);
            };
            reader.readAsDataURL(file);
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
            
            // If in pantry-only mode, show helpful message
            if (filters.pantryMode === 'pantry-only') {
                toast.info('💡 Your recipe is saved but hidden in Pantry-Only mode. Add ingredients to your pantry to see it!', {
                    duration: 5000
                });
            }
            
            // Redirect to appropriate tap in cookbook
            setCookbookTab(finalIsMix ? 'mixes' : finalIsRemix ? 'remixes' : 'recipes');
            setChatbotView('view-recipes');
            setShowRecipeBuilder(false);
            setIsCreatingRecipe(false);
            setEditingRecipeId(null);
            
            // Re-trigger a refresh of the recipe library
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

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `📝 Pasted recipe content`,
            timestamp: new Date(),
        }]);

        setIsLoading(true);

        try {
            // Call the hook's handlePasteRecipeContent
            await handlePasteRecipeContentHook(pastedRecipeContent);
            setIsCreatingRecipe(false);
            setPastedRecipeContent('');
            if (recipeContentRef.current) {
                recipeContentRef.current.value = '';
            }
        } catch (error) {
            console.error('Error parsing recipe content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `❌ Sorry, I encountered an error: ${errorMessage}\n\nPlease try pasting a recipe URL instead, or use the manual recipe creation option.`,
                    timestamp: new Date(),
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasteRecipeURL = async () => {
        if (!pastedRecipeURL.trim()) return;

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'user',
            content: `🔗 Pasted recipe URL`,
            timestamp: new Date(),
        }]);

        setIsLoading(true);

        try {
            // Call the hook's handlePasteRecipeURL
            await handlePasteRecipeURLHook(pastedRecipeURL);
            setIsCreatingRecipe(false);
            setpastedRecipeURL('');
        } catch (error) {
            console.error('Error parsing recipe URL:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `❌ Sorry, I encountered an error: ${errorMessage}\n\nPlease try a different recipe URL or use one of the other methods.`,
                    timestamp: new Date(),
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadConversationFromHistory = async (conversation: any) => {
        setIsLoading(true);
        try {
            // If the hook has a dedicated loadConversation, use it.
            // For now, we'll just set messages directly if they exist in the history object
            if (conversation.messages) {
                setMessages(conversation.messages);
                setChatbotView('messages');
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            toast.error('Failed to load conversation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadConversationHistory = () => {
        loadHistory();
        setChatbotView('conversation-history');
    };

    return (
        <div className={cn(
            "z-50",
            isInline 
                ? "relative w-full h-full flex flex-col" 
                : "fixed inset-0 flex pointer-events-none"
        )}>
            {/* Backdrop - only when NOT inline */}
            {!isInline && (
                <div
                    onClick={handleCloseModal}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden pointer-events-auto"
                />
            )}
            
            {/* Drawer/Container */}
            <div className={cn(
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto overflow-hidden",
                isInline 
                    ? "relative w-full h-full flex-1" 
                    : "absolute inset-y-0 right-0 w-full md:w-1/3 border-l shadow-2xl"
            )}>
                
                {/* Top components removed - using bottom navigation as requested */}

                {/* Content Area - Messages */}
                {/* Recipe Builder - Full Screen */}
                {showRecipeBuilder && (
                    <ChatbotRecipeBuilderView
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
                {/* Dashboard Menu - Flattened into sections */}
                {!showRecipeBuilder && chatbotView === 'dashboard' && (
                    <ChatbotDashboardView
                        setChatbotView={navigateTo}
                        setShowOnlyMyRecipes={setShowOnlyMyRecipes}
                        isAdmin={isAdmin}
                    />
                )}

                {/* Desktop Guide Menu - Simplified default state for desktop mode */}
                {!showRecipeBuilder && chatbotView === 'desktop-guide' && (
                    <ChatbotDesktopGuide setChatbotView={navigateTo} />
                )}

                {/* Coming Soon Page */}
                {!showRecipeBuilder && chatbotView === 'comingSoon' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                            <h3 className="text-lg font-bold text-foreground">Coming Soon</h3>
                            <p className="mt-2 text-sm text-muted-foreground">This feature is on the way! Stay tuned for updates.</p>
                            <button
                                onClick={handleBack}
                                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            >
                                Back to Previous View
                            </button>
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView.startsWith('import') && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Recipe Import</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="-mt-4">
                            <ChatbotImportView
                                setChatbotView={setChatbotView}
                                isLoading={isLoading}
                                recipeLoading={recipeLoading}
                                recipeSaving={recipeSaving}
                                successRecipe={successRecipe}
                                setSuccessRecipe={setSuccessRecipe}
                                pastedRecipeURL={pastedRecipeURL}
                                setpastedRecipeURL={setpastedRecipeURL}
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
                                toast={toast}
                                recipeContentRef={recipeContentRef}
                            />
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'cookbook' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={() => handleGoHome(previousView)}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-widest"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigateTo('view-recipes')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">📖</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">View Recipes</span>
                            </button>

                            <button
                                onClick={() => navigateTo('import-options')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">✍️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Add Recipes</span>
                            </button>

                            <button
                                onClick={() => toast('Export is coming soon 👀')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🤝</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">Share Recipes</span>
                            </button>
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'profile' && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Settings</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="-mt-8 pb-10">
                            <ProfilePage />
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'plannerMenu' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={handleBack}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigateTo('planner')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🗂️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Meal Planner</span>
                            </button>

                            <button
                                onClick={() => navigateTo('pantry')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🧺</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">Pantry</span>
                            </button>

                            <button
                                onClick={() => navigateTo('shopping')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🛒</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">Shopping List</span>
                            </button>

                            <div className="flex flex-col items-center justify-center gap-2 p-2 text-center opacity-40">
                                <span className="text-3xl">⏳</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'widgetsMenu' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={handleBack}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigateTo('nutridex')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🧪</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-fuchsia-500 transition-colors">Nutridex</span>
                            </button>

                            <button
                                onClick={() => navigateTo('comparator')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">⚖️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Comparator</span>
                            </button>

                            <button
                                onClick={() => navigateTo('lifeguard')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🛡️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">Lifeguard</span>
                            </button>

                            <button
                                onClick={() => navigateTo('recommended-intake')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">📊</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">RDA</span>
                            </button>
                        </div>
                    </div>
                )}



                {/* Messages View - Full Screen, Only in chat mode */}
                {!showRecipeBuilder && chatbotView === 'messages' && !isCreatingRecipe && (
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
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <ChatbotMessagesView 
                            messages={messages} 
                            isLoading={isLoading} 
                            recipeSaving={recipeSaving} 
                            messagesEndRef={messagesEndRef} 
                            handleSaveAndViewRecipe={handleSaveAndViewRecipe} 
                        />
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'messages' && isCreatingRecipe && !successRecipe && (
                    <ChatbotImportView
                        setChatbotView={setChatbotView}
                        handleManualRecipeCreation={handleManualRecipeCreation}
                        isLoading={isLoading}
                        recipeLoading={recipeLoading}
                        recipeSaving={recipeSaving}
                        successRecipe={successRecipe}
                        setSuccessRecipe={setSuccessRecipe}
                        pastedRecipeURL={pastedRecipeURL}
                        setpastedRecipeURL={setpastedRecipeURL}
                        handlePasteRecipeURL={handlePasteRecipeURL}
                        handleSaveAndViewRecipe={handleSaveAndViewRecipe}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        processRecipeImage={processRecipeImage}
                        fileInputRef={fileInputRef}
                    />
                )}

                {!showRecipeBuilder && chatbotView === 'view-recipes' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Recipes</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-2 pb-20">
                            <RecipesViewPremium 
                                onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'view-recipes')}
                            />
                        </div>
                    </div>
                )}

                {/* Recipe Detail View */}
                {!showRecipeBuilder && chatbotView === 'recipe-detail' && selectedRecipeId && (
                    <ChatbotRecipeDetail 
                        recipeId={selectedRecipeId} 
                        onBack={handleBackFromRecipeDetail} 
                        onRemix={handleRemixRecipe}
                    />
                )}
                
                {/* Recipe Share View */}
                {!showRecipeBuilder && chatbotView === 'recipe-share' && recipeToShare && (
                    <ChatbotShare 
                        recipe={recipeToShare} 
                        onClose={handleBack}
                        isInline={true}
                    />
                )}

                {/* Shopping View */}
                {!showRecipeBuilder && chatbotView === 'shopping' && (
                    <ChatbotShopping />
                )}

                {/* Pantry View */}
                {!showRecipeBuilder && chatbotView === 'pantry' && (
                    <ChatbotPantry />
                )}

                {/* Planner View */}
                {!showRecipeBuilder && chatbotView === 'planner' && (
                    <ChatbotPlanner onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'planner')} />
                )}

                {/* Nutrients View */}
                {!showRecipeBuilder && chatbotView === 'nutridex' && (
                    <NutrientsView compact={true} />
                )}

                {/* Comparator View */}
                {!showRecipeBuilder && chatbotView === 'comparator' && (
                    <ChatbotComparatorFull />
                )}

                {/* Lifeguard View */}
                {!showRecipeBuilder && chatbotView === 'lifeguard' && (
                    <ChatbotLifeguardFullIntegration />
                )}

                {chatbotView === 'conversation-history' && !showRecipeBuilder && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-emerald-500" />
                            </div>
                        ) : conversationHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-slate-400 text-sm mb-2">No conversations yet</p>
                                <p className="text-slate-500 text-xs">Your conversations will appear here</p>
                            </div>
                        ) : (
                            conversationHistory.map((conversation, idx) => (
                                <button
                                    key={conversation.id}
                                    onClick={() => loadConversationFromHistory(conversation)}
                                    className="w-full text-left p-3 rounded-lg bg-card hover:bg-muted transition-colors border border-border"
                                >
                                    <p className="font-bold text-sm text-foreground mb-1 uppercase tracking-tight">
                                        {conversation.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {conversation.messages?.length || 0} messages
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {new Date(conversation.created_at).toLocaleDateString()} {new Date(conversation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Recommended Intake View */}
                {!showRecipeBuilder && chatbotView === 'recommended-intake' && (
                    <div className="flex-1 overflow-hidden">
                        <RDAContent 
                            compact={false} 
                            showCloseButton={true}
                            onClose={handleBack}
                        />
                    </div>
                )}

                {/* Input Area - Only shown in chat messages view */}
                {chatbotView === 'messages' && !showRecipeBuilder && !isCreatingRecipe && (
                    <ChatbotInputSection
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
                        handleImageUpload={handleImageUpload}
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
                        chatbotView={chatbotView}
                        setChatbotView={navigateTo}
                        previousView={previousView}
                        setPreviousView={setPreviousView}
                        handleViewAllRecipes={handleViewAllRecipes}
                        handleViewMyRecipes={handleViewMyRecipes}
                        handleCreateNewRecipe={handleCreateNewRecipe}
                    />
                )}

                {/* Export View */}
                {!showRecipeBuilder && chatbotView === 'export-recipes' && (
                    <ChatbotExport onBack={() => setChatbotView('cookbook')} />
                )}

                {/* Help Pages */}
                {!showRecipeBuilder && (chatbotView === 'help-cookbook' || chatbotView === 'help-planner' || chatbotView === 'help-widgets') && (
                    <ChatbotHelpSection type={chatbotView} />
                )}

                {/* Privacy View */}
                {!showRecipeBuilder && chatbotView === 'privacy' && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Privacy</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="-mt-8 pb-10">
                            <PrivacyPolicyPage />
                        </div>
                    </div>
                )}

                {/* Support View */}
                {!showRecipeBuilder && chatbotView === 'support' && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Support</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="-mt-8 pb-10">
                            <SupportPage />
                        </div>
                    </div>
                )}

                {/* Terms View */}
                {!showRecipeBuilder && chatbotView === 'terms' && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Terms</h2>
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="-mt-8 pb-10">
                            <TermsPage />
                        </div>
                    </div>
                )}

                {/* Recipe Filters View */}
                {!showRecipeBuilder && chatbotView === 'recipe-filters' && (
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pb-20 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center p-4 pb-0 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-black italic uppercase tracking-wider text-slate-900 dark:text-white">Filter Recipes</h2>
                            <button
                                onClick={() => handleGoHome(previousView)}
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <RecipeFilterContent onClose={() => handleGoHome(previousView)} />
                        </div>
                    </div>
                )}

                {/* Bottom Navigation Footer (Mobile Optimized) */}
                <ChatbotBottomNav
                    chatbotView={chatbotView}
                    onClose={onClose}
                />
            </div>




        </div>
    );
}

