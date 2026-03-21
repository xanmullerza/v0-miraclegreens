'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Upload, Menu, Salad, ChevronRight, ChevronLeft, Home, Plus, Trash2, ArrowLeft, Save, Camera, ShoppingBag, Package, Calendar, Mic, Square, Link, FileText, Pencil, Video, Database, Lock, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { RecipesView } from '@/components/ingredients/recipes-view';
import { MyRecipesView } from '@/components/ingredients/my-recipes-view';
import { ChatbotRecipeDetail } from '@/components/chatbot-recipe-detail';
import { ChatbotShopping } from '@/components/chatbot-shopping';
import { ChatbotPantry } from '@/components/chatbot-pantry';
import { ChatbotPlanner } from '@/components/chatbot-planner';
import { ChatbotNutridexFull } from '@/components/chatbot-nutridex-full';
import { ChatbotComparatorFull } from '@/components/chatbot-comparator-full';
import { ChatbotLifeguardFullIntegration } from '@/components/chatbot-lifeguard-full-integration';
import { RecipeFilterDialog } from '@/components/recipe/recipe-filter-dialog';
import ProfilePage from '@/app/(main)/profile/page';
import { toast } from 'sonner';
import { HeaderLogo } from '@/components/ui/header-logo';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
    recipeData?: ParsedRecipe;
}

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    source_url: string;
    image_url?: string;
}

interface ChatbotModalProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
    isInline?: boolean;
}

// Simple formatter component for markdown-like text
function FormattedText({ content }: { content: string }) {
    const lines = content.split('\n');
    
    // Helper to render bold text
    const renderBoldText = (text: string) => {
        const parts = text.split(/\*\*(.+?)\*\*/);
        if (parts.length === 1) return text;
        
        return parts.map((part, i) => 
            i % 2 === 1 ? (
                <strong key={i} className="font-bold text-emerald-600 dark:text-emerald-400">
                    {part}
                </strong>
            ) : (
                <span key={i}>{part}</span>
            )
        );
    };
    
    return (
        <div className="space-y-2">
            {lines.map((line, idx) => {
                // Handle numbered lists
                if (/^\d+\.\s/.test(line)) {
                    const match = line.match(/^\d+\.\s(.+?):\s(.+)$/);
                    if (match) {
                        const number = line.match(/^\d+\./)?.[0];
                        const heading = match[1];
                        const rest = match[2];
                        const capitalizedRest = rest.charAt(0).toUpperCase() + rest.slice(1);
                        
                        return (
                            <div key={idx} className="flex gap-2 ml-2">
                                <span className="flex-shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                    {number}
                                </span>
                                <span>
                                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {renderBoldText(heading)}
                                    </strong>
                                    <strong className="font-bold text-emerald-600 dark:text-emerald-400">:</strong>
                                    {' '}{renderBoldText(capitalizedRest)}
                                </span>
                            </div>
                        );
                    } else {
                        const text = line.replace(/^\d+\.\s/, '');
                        return (
                            <div key={idx} className="flex gap-2 ml-2">
                                <span className="flex-shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                                    {line.match(/^\d+\./)?.[0]}
                                </span>
                                <span>{renderBoldText(text)}</span>
                            </div>
                        );
                    }
                }
                
                // Handle bullet points
                if (/^[\*\-]\s/.test(line)) {
                    const text = line.replace(/^[\*\-]\s/, '');
                    return (
                        <div key={idx} className="flex gap-2 ml-2">
                            <span className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{renderBoldText(text)}</span>
                        </div>
                    );
                }
                
                // Regular text with bold formatting
                return line.trim() ? (
                    <p key={idx} className="leading-relaxed">
                        {renderBoldText(line)}
                    </p>
                ) : (
                    <div key={idx} className="h-1" />
                );
            })}
        </div>
    );
}

// URL detection helper
function detectURL(text: string): string | null {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
}

// Extract domain from URL
function getDomainFromURL(url: string): string {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch {
        return url;
    }
}

const CHATBOT_MESSAGES_KEY = 'chatbot_messages_v1';

function loadChatbotMessages() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(CHATBOT_MESSAGES_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load chatbot messages:', error);
        return null;
    }
}

function saveChatbotMessages(messages: Message[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CHATBOT_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('Failed to save chatbot messages:', error);
    }
}

function clearChatbotMessages() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(CHATBOT_MESSAGES_KEY);
    } catch (error) {
        console.error('Failed to clear chatbot messages:', error);
    }
}

// Save conversation to database
async function saveConversationToDatabase(userId: string, messages: Message[]) {
    try {
        const conversationContent = messages.map(m => ({
            type: m.type,
            content: m.content,
            timestamp: m.timestamp
        }));
        
        // Note: DO NOT explicitly pass user_id with RLS enabled
        // The column has a DEFAULT value of auth.uid() which Supabase will use
        const { error } = await supabase
            .from('chatbot_conversations')
            .insert({
                title: `Conversation - ${new Date().toLocaleDateString()}`,
                messages: conversationContent,
                created_at: new Date().toISOString(),
            });
        
        if (error) throw error;
    } catch (error) {
        console.error('Failed to save conversation to database:', error);
    }
}

// Load conversation history from database
async function loadConversationHistory(userId: string) {
    try {
        const { data, error } = await supabase
            .from('chatbot_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to load conversation history:', error);
        return [];
    }
}

export function ChatbotModal({ onClose, onRecipeDetected, isInline = false }: ChatbotModalProps) {
    const router = useRouter();
    const { user, saveRecipe } = useDataPersistence();
    const { profile } = useUserPreferences();
    const builderRef = useRef<IngredientBuilderHandle>(null);
    
    const INITIAL_MESSAGES: Message[] = [
        {
            id: '1',
            type: 'bot',
            content: 'Hello! I\'m Zum, your child-friendly AI assistant. I can help with nutrition questions, recipes, meal planning, and more. I can also add recipes from URLs! Just share a recipe link.',
            timestamp: new Date(),
        },
        {
            id: '2',
            type: 'bot',
            content: "🎉 Let's get you started with adding more recipes to your growing library! Here are a few ways you can do it:",
            timestamp: new Date(),
        }
    ];
    
    // Load messages from localStorage (conversation is persisted across refreshes)
    const storedMessages = loadChatbotMessages();
    const [messages, setMessages] = useState<Message[]>(
        storedMessages ? 
            (storedMessages as any[]).map(m => ({ ...m, timestamp: new Date(m.timestamp) })) : 
            INITIAL_MESSAGES
    );
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recipeLoading, setRecipeLoading] = useState(false);
    const [detectedURL, setDetectedURL] = useState<string | null>(null);
    const [successRecipe, setSuccessRecipe] = useState<ParsedRecipe | null>(null);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [expandedRecipeMenu, setExpandedRecipeMenu] = useState(false);
    const [expandedAppsMenu, setExpandedAppsMenu] = useState(false);
    const [expandedWidgetsMenu, setExpandedWidgetsMenu] = useState(false);
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false); // Always reset on refresh
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setpastedRecipeURL] = useState('');
    const [videoURL, setVideoURL] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    
    // Chatbot view state - ALWAYS reset to 'dashboard' on refresh (new session)
    const [chatbotView, setChatbotView] = useState<'dashboard' | 'cookbook' | 'plannerMenu' | 'widgetsMenu' | 'profile' | 'messages' | 'comingSoon' | 'recipe-builder' | 'all-recipes' | 'my-recipes' | 'recipe-detail' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history' | 'import' | 'import-options' | 'import-paste-text' | 'import-paste-url' | 'import-upload-photo' | 'import-voice' | 'import-video'>('dashboard');
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null); // Always reset on refresh

    const getChatbotViewTitle = () => {
        switch (chatbotView) {
            case 'dashboard': return 'Dashboard';
            case 'cookbook': return 'Cookbook';
            case 'plannerMenu': return 'Planner';
            case 'widgetsMenu': return 'Widgets';
            case 'profile': return 'Profile';
            case 'messages': return 'Messages';
            case 'recipe-builder': return 'Create Recipe';
            case 'all-recipes': return 'All Recipes';
            case 'my-recipes': return 'My Recipes';
            case 'recipe-detail': return 'Recipe Details';
            case 'shopping': return 'Shopping';
            case 'pantry': return 'Pantry';
            case 'planner': return 'Planner';
            case 'nutridex': return 'Nutridex';
            case 'comparator': return 'Comparator';
            case 'lifeguard': return 'Lifeguard';
            case 'conversation-history': return 'Conversation History';
            case 'import': return 'Import Recipes';
            case 'import-options': return 'Import Options';
            case 'import-paste-text': return 'Paste Text';
            case 'import-paste-url': return 'Paste a Link';
            case 'import-upload-photo': return 'Upload a Photo';
            case 'import-voice': return 'Voice Recipe';
            case 'import-video': return 'Video Import';
            case 'comingSoon': return 'Coming Soon';
            default: return 'Navigation';
        }
    };

    const getBreadcrumbTrail = () => {
        const mapToTrail: Record<string, Array<{ label: string; view: typeof chatbotView }>> = {
            dashboard: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Dashboard', view: 'dashboard' },
            ],
            cookbook: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Cookbook', view: 'cookbook' },
            ],
            plannerMenu: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Planner', view: 'plannerMenu' },
            ],
            widgetsMenu: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Widgets', view: 'widgetsMenu' },
            ],
            profile: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Profile', view: 'profile' },
            ],
            messages: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Messages', view: 'messages' },
            ],
            'recipe-builder': [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Create Recipe', view: 'recipe-builder' },
            ],
            'all-recipes': [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Cookbook', view: 'cookbook' },
                { label: 'All Recipes', view: 'all-recipes' },
            ],
            'my-recipes': [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Cookbook', view: 'cookbook' },
                { label: 'My Recipes', view: 'my-recipes' },
            ],
            'recipe-detail': [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Cookbook', view: 'cookbook' },
                { label: 'Recipe Details', view: 'recipe-detail' },
            ],
            shopping: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Planner', view: 'plannerMenu' },
                { label: 'Shopping', view: 'shopping' },
            ],
            pantry: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Planner', view: 'plannerMenu' },
                { label: 'Pantry', view: 'pantry' },
            ],
            planner: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Planner', view: 'plannerMenu' },
                { label: 'Meal Planner', view: 'planner' },
            ],
            nutridex: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Widgets', view: 'widgetsMenu' },
                { label: 'Nutridex', view: 'nutridex' },
            ],
            comparator: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Widgets', view: 'widgetsMenu' },
                { label: 'Comparator', view: 'comparator' },
            ],
            lifeguard: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Widgets', view: 'widgetsMenu' },
                { label: 'Lifeguard', view: 'lifeguard' },
            ],
            'conversation-history': [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Messages', view: 'messages' },
                { label: 'Conversations', view: 'conversation-history' },
            ],
            comingSoon: [
                { label: 'Chatbot', view: 'dashboard' },
                { label: 'Coming Soon', view: 'comingSoon' },
            ],
        };

        return mapToTrail[chatbotView] || mapToTrail.dashboard;
    };

    const breadcrumbTrail = getBreadcrumbTrail();

    const navigateToView = (view: typeof chatbotView) => {
        setShowRecipeBuilder(false);
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
        setExpandedAppsMenu(false);
        setExpandedWidgetsMenu(false);
        setChatbotView(view);
    };

    const [previousView, setPreviousView] = useState<'all-recipes' | 'my-recipes' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history'>('all-recipes'); // Always reset on refresh
    
    // Conversation history state
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
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
    
    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showFilterDialog, setShowFilterDialog] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
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
        saveChatbotMessages(messages);
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

    // Handle popstate event (OS back button)
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state?.chatbotView) {
                setChatbotView(e.state.chatbotView);
                if (e.state.previousView) {
                    setPreviousView(e.state.previousView);
                }
            } else if (chatbotView !== 'dashboard') {
                // If there's a popstate but no state data, go back to dashboard
                setChatbotView('dashboard');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [chatbotView]);

    const handleSaveAndViewRecipe = async (recipe: ParsedRecipe) => {
        setRecipeSaving(true);
        try {
            // Helper function to parse ingredient amounts
            const parseIngredientAmount = (ingredientLine: string) => {
                let line = ingredientLine.trim();
                
                // Step 1: Remove common trailing descriptors that create separate entries
                line = line.replace(/\s*\(to taste\)\s*$/i, '').trim();
                line = line.replace(/\s*\(optional\)\s*$/i, '').trim();
                line = line.replace(/\s+(to taste|optional)\s*$/i, '').trim();
                
                // Step 2: Extract amount at the START of the line
                // Matches: "30g", "4", "½ - 1 tsp", "2-3 cups", etc.
                const amountRegex = /^([\d¼½¾⅛⅜⅝⅞]+(?:\s*[-\/]\s*[\d¼½¾⅛⅜⅝⅞]+)?)\s*([a-z]*)/i;
                const match = line.match(amountRegex);
                
                let quantity = 1;
                let measure = 'item';
                let foodName = line;
                
                if (match) {
                    const amountStr = match[1].trim();
                    const possibleUnit = match[2].trim().toLowerCase();
                    
                    // Defined units we recognize
                    const unitMap: Record<string, string> = {
                        'g': 'g', 'gram': 'g', 'grams': 'g', 'kg': 'g', 'kilogram': 'g', 'kilograms': 'g',
                        'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'l': 'ml', 'liter': 'ml', 'liters': 'ml',
                        'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
                        'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
                        'cup': 'cup', 'cups': 'cup', 'c': 'cup',
                        'tbsp': 'tbsp', 'tbs': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
                        'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
                        'clove': 'clove', 'cloves': 'clove',
                        'sprig': 'sprig', 'sprigs': 'sprig',
                        'leaf': 'leaf', 'leaves': 'leaf',
                        'stalk': 'stalk', 'stalks': 'stalk',
                        'breast': 'breast', 'breasts': 'breast',
                    };
                    
                    // Check if possibleUnit is an actual unit
                    if (possibleUnit && unitMap[possibleUnit]) {
                        measure = unitMap[possibleUnit];
                        
                        // Parse quantity - take first number from range if present
                        let qtyStr = amountStr;
                        if (amountStr.includes('-') || amountStr.includes('/')) {
                            qtyStr = amountStr.split(/[-\/]/)[0].trim();
                        }
                        
                        try {
                            quantity = parseFloat(qtyStr) || 1;
                        } catch (e) {
                            quantity = 1;
                        }
                        
                        // Remove the matched amount + unit from the line for food name
                        foodName = line.replace(new RegExp(`^${escapeRegex(amountStr)}\\s*${escapeRegex(possibleUnit)}\\s*`), '').trim();
                    } else {
                        // No recognized unit, just extract quantity and keep rest
                        try {
                            quantity = parseFloat(amountStr) || 1;
                        } catch (e) {
                            quantity = 1;
                        }
                        foodName = line.replace(new RegExp(`^${escapeRegex(amountStr)}\\s*`), '').trim();
                    }
                }
                
                // Clean up food name - remove prep descriptions
                foodName = foodName.replace(/\s+(crushed or finely grated|drained and roughly chopped|finely chopped|roughly chopped|torn to serve|torn, to serve).*$/i, '').trim();
                
                return { quantity, measure, foodName: foodName || line };
            };
            
            const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Parse ingredients into array
            const ingredientsList = recipe.ingredients_text
                .split('\n')
                .filter(line => line.trim())
                .map((line, idx) => {
                    const { quantity, measure, foodName } = parseIngredientAmount(line);
                    return {
                        food_item_name: foodName || line.trim(),
                        food_item_id: `raw-${idx}`,
                        quantity: quantity,
                        measure_label: measure,
                        weight_g: 0,
                        calories: 0,
                        protein: 0,
                        fat: 0,
                        carbs: 0,
                    };
                });

            // Parse instructions into array
            const instructionsList = recipe.instructions_text
                .split('\n')
                .filter(line => line.trim());

            // Create recipe data object for saving
            const recipeDataToSave = {
                title: recipe.title,
                type: 'dinner',
                servings: recipe.servings || 4,
                prep_time: recipe.prep_time || 30,
                cook_time: recipe.cook_time || 0,
                image: recipe.image_url,
                is_favorite: true,
                is_mix: false,
                diet: [],
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0,
                source: recipe.source_url
            };

            // Save the recipe
            const result = await saveRecipe(recipeDataToSave, ingredientsList, instructionsList);
            const recipeId = result?.id || `recipe-${Date.now()}`;
            
            toast.success('Successfully saved to your library!');
            
            // Navigate to the recipe within the modal
            setSelectedRecipeId(recipeId);
            setPreviousView('my-recipes');
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
            setPreviousView('my-recipes');
            setChatbotView('recipe-detail');
        } catch (error) {
            console.error('Error navigating to recipe:', error);
            // Fallback to modal on error
            if (onRecipeDetected && !recipe) {
                onRecipeDetected(recipeToView);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        // Check if input contains a URL
        const detectedUrl = detectURL(input);
        
        if (detectedUrl) {
            // Handle recipe URL
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'user',
                content: `📎 Recipe URL: ${getDomainFromURL(detectedUrl)}`,
                timestamp: new Date(),
            }]);
            setInput('');
            setDetectedURL(detectedUrl);
            setRecipeLoading(true);

            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user?.id || 'anonymous';

                // Show parsing message
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: `🔍 Parsing recipe from ${getDomainFromURL(detectedUrl)}...`,
                    timestamp: new Date(),
                }]);

                // Call n8n webhook with recipe-url content type
                const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: detectedUrl,
                        userId: userId,
                        contentType: 'recipe-url'
                    })
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                // Handle empty responses
                const responseText = await response.text();
                if (!responseText) {
                    throw new Error('Empty response from recipe parser');
                }

                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error. Response was:', responseText);
                    throw new Error('Invalid response format from recipe parser');
                }

                // Parse response - expect { recipe: { title, ... } }
                let recipeData: ParsedRecipe | null = null;

                // Check if n8n returned an error
                if (data.error) {
                    throw new Error(`Recipe parsing failed: ${data.error}`);
                }

                if (data.recipe || data.data) {
                    const recipe = data.recipe || data.data;
                    
                    // Validate we have at least a title
                    if (!recipe.title) {
                        throw new Error('Recipe parsing returned incomplete data (missing title)');
                    }
                    
                    recipeData = {
                        title: recipe.title || 'Untitled Recipe',
                        ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
                        instructions_text: recipe.instructions_text || recipe.instructions || '',
                        servings: recipe.servings || 4,
                        prep_time: recipe.prep_time || recipe.prepTime || 30,
                        cook_time: recipe.cook_time || recipe.cookTime || 0,
                        source_url: detectedUrl,
                        image_url: recipe.image_url || recipe.image || undefined,
                    };
                } else if (!data.recipe && !data.data) {
                    throw new Error('Unexpected response format from recipe parser');
                }

                if (recipeData) {
                    // Store the recipe data and show the success message with a button
                    setSuccessRecipe(recipeData);
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        {
                            id: (Date.now() + 1).toString(),
                            type: 'bot',
                            content: `✅ Great! I've parsed "${recipeData.title}"! Would you like to save it to your library and view it?`,
                            timestamp: new Date(),
                            recipeData: recipeData
                        }
                    ]);
                    // Don't auto-redirect, let user click the button they remember
                } else {
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        {
                            id: (Date.now() + 1).toString(),
                            type: 'bot',
                            content: '⚠️ Could not parse recipe from that URL. Try copying and pasting the recipe text directly, or check that the URL points to a recipe page.',
                            timestamp: new Date(),
                        }
                    ]);
                }
            } catch (error) {
                console.error('Error parsing recipe URL:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `❌ Sorry, I encountered an error parsing that recipe URL: ${errorMessage}\n\nPlease try again or paste the recipe text directly.`,
                        timestamp: new Date(),
                    }
                ]);
            } finally {
                setRecipeLoading(false);
                setDetectedURL(null);
            }
            return;
        }

        // Regular text message handling
        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Call n8n webhook
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    userId: userId,
                    contentType: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract bot response - handle different response formats
            let botResponse = '';
            if (typeof data === 'string') {
                botResponse = data;
            } else if (data.output) {
                botResponse = data.output;
            } else if (data.response) {
                botResponse = data.response;
            } else if (data.content) {
                botResponse = data.content;
            } else if (data.message) {
                botResponse = data.message;
            } else {
                botResponse = JSON.stringify(data);
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: botResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error calling n8n webhook:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                // Audio will be sent when user stops recording
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Track recording time
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I cannot access your microphone. Please check your browser permissions and try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const stopAudioRecording = async () => {
        if (!mediaRecorderRef.current) return;
        
        setIsRecording(false);
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        
        mediaRecorderRef.current.stop();
        
        // Wait a moment for the onstop event to fire and chunks to be collected
        setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleAudioUpload(audioBlob);
            }
        }, 100);
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        // Add loading indicator
        const loadingMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: `🎤 Sent audio message (${recordingTime}s)`,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, loadingMessage]);
        setIsLoading(true);
        setRecordingTime(0);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Create FormData with file
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('userId', userId);
            formData.append('contentType', 'audio');

            // Call n8n webhook to transcribe audio
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract transcribed text - this is the user's actual message
            let transcribedText = '';
            if (typeof data === 'string') {
                transcribedText = data;
            } else if (data.responseText) {
                transcribedText = data.responseText;
            } else if (data.output) {
                transcribedText = data.output;
            } else if (data.response) {
                transcribedText = data.response;
            } else if (data.content) {
                transcribedText = data.content;
            } else if (data.message) {
                transcribedText = data.message;
            }

            if (!transcribedText) {
                throw new Error('No transcription received');
            }

            // Replace the loading message with the actual transcribed text as user message
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: Date.now().toString(),
                    type: 'user',
                    content: transcribedText,
                    timestamp: new Date(),
                }
            ]);

            // Now send the transcribed text to get a bot response
            try {
                const chatResponse = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: transcribedText,
                        userId: userId,
                        contentType: 'text'
                    })
                });

                if (!chatResponse.ok) {
                    throw new Error(`API error: ${chatResponse.status}`);
                }

                const chatData = await chatResponse.json();
                
                // Extract bot response
                let botResponse = '';
                if (typeof chatData === 'string') {
                    botResponse = chatData;
                } else if (chatData.output) {
                    botResponse = chatData.output;
                } else if (chatData.response) {
                    botResponse = chatData.response;
                } else if (chatData.content) {
                    botResponse = chatData.content;
                } else if (chatData.message) {
                    botResponse = chatData.message;
                } else {
                    botResponse = JSON.stringify(chatData);
                }

                const botMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: botResponse,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, botMessage]);
            } catch (chatError) {
                console.error('Error getting chat response:', chatError);
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: 'Sorry, I encountered an error responding to your message. Please try again.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error processing audio:', error);
            // Remove loading message and show error
            setMessages(prev => [...prev.slice(0, -1), {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error transcribing your audio. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            // Reset audio input
            if (audioInputRef.current) {
                audioInputRef.current.value = '';
            }
        }
    };

    const processRecipeImage = async (file: File) => {
        if (!file) return;

        // Add user message showing file was uploaded
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: `📷 Uploaded image: ${file.name}`,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Create FormData with file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('message', `Analyze this image: ${file.name}`);
            formData.append('userId', userId);
            formData.append('contentType', 'image');

            // Call n8n webhook
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Raw image response:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Response is not JSON:', responseText);
                // If response isn't JSON, it's likely image analysis text - reject it
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: "❌ Please upload only recipe images (cookbook pages, recipe cards, handwritten recipes, or recipe screenshots). I can only extract recipes from image uploads.",
                    timestamp: new Date(),
                }]);
                setIsLoading(false);
                return;
            }

            console.log('Parsed response object:', data, 'Type:', typeof data, 'Is array:', Array.isArray(data));

            // Unwrap array responses from N8N
            if (Array.isArray(data) && data.length > 0) {
                data = data[0];
                console.log('✓ Unwrapped array response:', data);
            }

            // Handle content-wrapped JSON (parse if needed)
            if (data && typeof data.content === 'string') {
                try {
                    const escapedContent = data.content
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t');
                    
                    const parsedContent = JSON.parse(escapedContent);
                    data = parsedContent;
                } catch (parseErr) {
                    console.error('✗ Failed to parse content as JSON:', parseErr);
                }
            }

            // Check if response indicates recipe detection
            if (typeof data === 'object' && data.isRecipe !== undefined) {
                if (data.isRecipe === false) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: data.message || "This doesn't look like a recipe. Please share a recipe image (cookbook page, recipe card, or handwritten recipe).",
                        timestamp: new Date(),
                    }]);
                } else if (data.isRecipe === true) {
                    const recipeData: ParsedRecipe = {
                        title: data.title || 'Untitled Recipe',
                        ingredients_text: data.ingredients_text || '',
                        instructions_text: data.instructions_text || '',
                        servings: data.servings || 4,
                        prep_time: data.prep_time || 30,
                        cook_time: data.cook_time || 0,
                        source_url: 'image-upload',
                        image_url: undefined,
                    };
                    setSuccessRecipe(recipeData);
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `✅ Great! I've extracted "${recipeData.title}" from your image. Would you like to save it to your library?`,
                        timestamp: new Date(),
                        recipeData: recipeData,
                    }]);
                }
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    type: 'bot',
                    content: "❌ Please upload only recipe images. I couldn't detect a recipe in this image.",
                    timestamp: new Date(),
                }]);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error analyzing the image. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await processRecipeImage(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleViewAllRecipes = () => {
        setChatbotView('all-recipes');
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const handleViewMyRecipes = () => {
        setChatbotView('my-recipes');
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
    };

    const handleRecipeClick = (recipeId: string, fromView: 'all-recipes' | 'my-recipes' | 'planner') => {
        setSelectedRecipeId(recipeId);
        setPreviousView(fromView);
        setChatbotView('recipe-detail');
    };

    const handleBackFromRecipeDetail = () => {
        setChatbotView(previousView);
        setSelectedRecipeId(null);
    };

    const loadConversationFromHistory = (conversation: any) => {
        // Load a conversation from history
        const messages = conversation.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
        }));
        setMessages(messages);
        setChatbotView('messages');
        saveChatbotMessages(messages);
    };

    const handleLoadConversationHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        
        setIsLoadingHistory(true);
        try {
            const history = await loadConversationHistory(user.id);
            setConversationHistory(history);
            setChatbotView('conversation-history');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const startNewConversation = async () => {
        // Save current conversation to database before starting new one
        const { data: { user } } = await supabase.auth.getUser();
        // Only save if there are messages beyond the initial ones
        if (user?.id && messages.length > INITIAL_MESSAGES.length) {
            await saveConversationToDatabase(user.id, messages);
        }
        
        // Reset to initial state
        clearChatbotMessages();
        setMessages(INITIAL_MESSAGES);
        setInput('');
        setIsLoading(false);
        setDetectedURL(null);
        setSuccessRecipe(null);
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
        setExpandedAppsMenu(false);
        setExpandedWidgetsMenu(false);
        setIsCreatingRecipe(false);
        setPastedRecipeContent('');
        setpastedRecipeURL('');
        setChatbotView('messages');
        setSelectedRecipeId(null);
        setPreviousView('all-recipes');
        setShowRecipeBuilder(false);
    };

    const handleCloseModal = async () => {
        // Save conversation to database before closing
        try {
            if (messages.length > INITIAL_MESSAGES.length) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                    await saveConversationToDatabase(user.id, messages);
                }
            }
        } catch (error) {
            console.error('Error saving conversation:', error);
        } finally {
            // Call original onClose callback
            onClose();
        }
    };

    const resetChatbotState = () => {
        // Reset all state to initial values (same as start new conversation, but without saving)
        clearChatbotMessages();
        setMessages(INITIAL_MESSAGES);
        setInput('');
        setIsLoading(false);
        setDetectedURL(null);
        setSuccessRecipe(null);
        setShowQuickActions(false);
        setExpandedRecipeMenu(false);
        setExpandedAppsMenu(false);
        setExpandedWidgetsMenu(false);
        setIsCreatingRecipe(false);
        setPastedRecipeContent('');
        setpastedRecipeURL('');
        setChatbotView('messages');
        setSelectedRecipeId(null);
        setPreviousView('all-recipes');
        setShowRecipeBuilder(false);
        setRecipeCookTime(0);
    };

    const handleBackToMessages = () => {
        if (chatbotView === 'conversation-history') {
            setChatbotView('messages');
        } else {
            setChatbotView('dashboard');
            setShowQuickActions(false);
            setExpandedRecipeMenu(false);
            setExpandedAppsMenu(false);
            setExpandedWidgetsMenu(false);
            setShowRecipeBuilder(false);
            setIsCreatingRecipe(false);
        }
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

    const handleSaveRecipe = async () => {
        if (!recipeTitle || recipeIngredients.length === 0 || recipeInstructions.filter(i => i.trim()).length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        setRecipeSaving(true);
        try {
            const totals = recipeIngredients.reduce((acc, ing) => ({
                calories: acc.calories + ing.calories,
                protein: acc.protein + ing.protein,
                fat: acc.fat + ing.fat,
                carbs: acc.carbs + ing.carbs,
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
            };

            await saveRecipe(recipeData, recipeIngredients, recipeInstructions);
            
            toast.success('Recipe saved successfully!');
            
            // Reset form and return to chat
            setShowRecipeBuilder(false);
            setIsCreatingRecipe(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'bot',
                content: `✅ Perfect! I've saved "${recipeTitle}" to your recipe library. You can view it anytime in your My Recipes section!`,
                timestamp: new Date(),
            }]);
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setRecipeSaving(false);
        }
    };

    const handleCloseRecipeBuilder = () => {
        setShowRecipeBuilder(false);
        setRecipeTitle('');
        setRecipeIngredients([]);
        setRecipeInstructions(['']);
        setRecipeImage('');
        setRecipeStep(1);
        setRecipeCookTime(0);
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Show parsing message
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: `🔍 Parsing your recipe...`,
                timestamp: new Date(),
            }]);

            // Call n8n webhook to parse the recipe content
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: pastedRecipeContent,
                    userId: userId,
                    contentType: 'recipe-content'
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Recipe content response:', responseText);
            
            if (!responseText) {
                throw new Error('The recipe parser service is not responding. This feature may not be configured yet. Please try pasting a recipe URL instead, or contact support.');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error. Response was:', responseText);
                throw new Error('Invalid response format from recipe parser. Please ensure the recipe content is properly formatted with ingredients and instructions.');
            }

            let recipeData: ParsedRecipe | null = null;

            if (data.error) {
                throw new Error(`Recipe parsing failed: ${data.error}`);
            }

            if (data.recipe || data.data) {
                const recipe = data.recipe || data.data;
                
                if (!recipe.title) {
                    throw new Error('Recipe parsing returned incomplete data (missing title)');
                }
                
                recipeData = {
                    title: recipe.title || 'Untitled Recipe',
                    ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
                    instructions_text: recipe.instructions_text || recipe.instructions || '',
                    servings: recipe.servings || 4,
                    prep_time: recipe.prep_time || recipe.prepTime || 30,
                    cook_time: recipe.cook_time || recipe.cookTime || 0,
                    source_url: 'pasted-content',
                    image_url: recipe.image_url || recipe.image || undefined,
                };
            } else if (!data.recipe && !data.data) {
                throw new Error('Unexpected response format from recipe parser');
            }

            if (recipeData) {
                setSuccessRecipe(recipeData);
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `✅ Successfully parsed "${recipeData.title}"! You can now save it to your library.`,
                        timestamp: new Date(),
                        recipeData: recipeData
                    }
                ]);
                setIsCreatingRecipe(false);
                setPastedRecipeContent('');
                if (recipeContentRef.current) {
                    recipeContentRef.current.value = '';
                }
            } else {
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: '⚠️ Could not parse recipe from that content. Try copying and pasting the recipe text more clearly with ingredients and instructions, or use one of the other methods.',
                        timestamp: new Date(),
                    }
                ]);
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
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Show parsing message
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: `🔍 Extracting recipe from URL...`,
                timestamp: new Date(),
            }]);

            // Call n8n webhook to parse the recipe URL
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: pastedRecipeURL,
                    userId: userId,
                    contentType: 'recipe-url'
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            console.log('Recipe URL response:', responseText);
            
            if (!responseText) {
                throw new Error('The recipe parser service is not responding. Please try again later.');
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error. Response was:', responseText);
                throw new Error('Invalid response format from recipe parser.');
            }

            let recipeData: ParsedRecipe | null = null;

            if (data.error) {
                throw new Error(`Recipe parsing failed: ${data.error}`);
            }

            if (data.recipe || data.data) {
                const recipe = data.recipe || data.data;
                
                if (!recipe.title) {
                    throw new Error('Recipe parsing returned incomplete data (missing title)');
                }
                
                recipeData = {
                    title: recipe.title || 'Untitled Recipe',
                    ingredients_text: recipe.ingredients_text || recipe.ingredients || '',
                    instructions_text: recipe.instructions_text || recipe.instructions || '',
                    servings: recipe.servings || 4,
                    prep_time: recipe.prep_time || recipe.prepTime || 30,
                    cook_time: recipe.cook_time || recipe.cookTime || 0,
                    source_url: pastedRecipeURL,
                    image_url: recipe.image_url || recipe.image || undefined,
                };
            } else if (!data.recipe && !data.data) {
                throw new Error('Unexpected response format from recipe parser');
            }

            if (recipeData) {
                setSuccessRecipe(recipeData);
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `✅ Perfect! I've imported "${recipeData.title}"! Use the button below to save it.`,
                        timestamp: new Date(),
                        recipeData: recipeData
                    }
                ]);
                setIsCreatingRecipe(false);
                setpastedRecipeURL('');
            } else {
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: '⚠️ Could not extract recipe from that URL. Please make sure the URL is a valid recipe website and try again.',
                        timestamp: new Date(),
                    }
                ]);
            }
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

                {/* Content Area - Messages, Recipe Builder, or Recipe Views */}
                {/* Recipe Builder - Full Screen */}
                {showRecipeBuilder && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4">
                        {/* Close Button */}
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                {recipeStep === 1 ? 'Step 1: Recipe Details' : recipeStep === 2 ? 'Step 2: Ingredients' : 'Step 3: Instructions'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRecipeBuilder(false);
                                    setRecipeStep(1);
                                    setRecipeTitle('');
                                    setRecipeServings(4);
                                    setRecipePrepTime(30);
                                    setRecipeCookTime(0);
                                    setRecipeIngredients([]);
                                    setRecipeInstructions(['']);
                                    setRecipeImage('');
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {recipeStep === 1 && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Recipe Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={recipeTitle}
                                        onChange={(e) => setRecipeTitle(e.target.value)}
                                        placeholder="e.g., Chicken Stir Fry"
                                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Servings
                                    </label>
                                    <input
                                        type="number"
                                        value={recipeServings}
                                        onChange={(e) => setRecipeServings(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        min="1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Prep Time (min)
                                        </label>
                                        <input
                                            type="number"
                                            value={recipePrepTime}
                                            onChange={(e) => setRecipePrepTime(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                            Cook Time (min)
                                        </label>
                                        <input
                                            type="number"
                                            value={recipeCookTime}
                                            onChange={(e) => setRecipeCookTime(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setRecipeStep(2)}
                                    disabled={!recipeTitle.trim()}
                                    className="w-full px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                >
                                    Next: Add Ingredients →
                                </button>
                            </>
                        )}

                        {recipeStep === 2 && (
                            <>
                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Ingredients *
                                </div>
                                <IngredientBuilder
                                    ref={builderRef}
                                    ingredients={recipeIngredients}
                                    onChange={setRecipeIngredients}
                                    initialShowPicker={true}
                                />

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setRecipeStep(1)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={() => setRecipeStep(3)}
                                        disabled={recipeIngredients.length === 0}
                                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next: Instructions →
                                    </button>
                                </div>
                            </>
                        )}

                        {recipeStep === 3 && (
                            <>
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                                        Cooking Steps *
                                    </label>
                                    <button
                                        onClick={handleAddInstruction}
                                        className="text-xs font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-600 flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {recipeInstructions.map((step, idx) => (
                                        <div key={idx} className="flex gap-2 group">
                                            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground shrink-0 border border-border">
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                value={step}
                                                onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                                                placeholder={`Step ${idx + 1}...`}
                                                className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px] resize-none"
                                            />
                                            {recipeInstructions.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveInstruction(idx)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0 mt-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setRecipeStep(2)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted font-bold text-sm uppercase tracking-widest transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={() => setRecipeStep(4)}
                                        disabled={recipeInstructions.filter(i => i.trim()).length === 0}
                                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next: Save →
                                    </button>
                                </div>
                            </>
                        )}

                        {recipeStep === 4 && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        Recipe Photo (Optional)
                                    </label>
                                    <div className="relative aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden group hover:border-emerald-500/50 transition-all">
                                        {recipeImage ? (
                                            <div className="w-full h-full relative">
                                                <img src={recipeImage} alt="Recipe" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        className="gap-2 px-3 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                                                        onClick={() => setRecipeImage('')}
                                                    >
                                                        <Trash2 size={12} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-3">
                                                <div className="text-center">
                                                    {recipeUploading ? (
                                                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500 mx-auto" />
                                                    ) : (
                                                        <>
                                                            <Camera size={18} className="text-slate-400 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Photo</p>
                                                        </>
                                                    )}
                                                </div>
                                                {!recipeUploading && (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleRecipeImageUpload}
                                                    />
                                                )}
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setRecipeStep(3)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted font-bold text-sm uppercase tracking-widest transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={handleSaveRecipe}
                                        disabled={recipeSaving || !recipeTitle || recipeIngredients.length === 0 || !recipeInstructions.some(i => i.trim())}
                                        className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {recipeSaving ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={14} />
                                                Save Recipe
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Dashboard Menu - Flattened into sections */}
                {!showRecipeBuilder && chatbotView === 'dashboard' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        {/* Cookbook Section */}
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-3xl p-6 border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Salad size={120} className="text-emerald-500 -rotate-12" />
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cookbook</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => setChatbotView('all-recipes')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all">📖</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Public Recipes</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('my-recipes')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] transition-all">👩‍🍳</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">My Recipes</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('import')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all">📥</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Import Recipes</span>
                                </button>
                                <button
                                    onClick={() => toast('Export is coming soon 👀')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] transition-all">📤</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">Export Recipes</span>
                                </button>
                            </div>
                        </div>

                        {/* Planner Section */}
                        <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-3xl p-6 border border-blue-500/20 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-blue-500/40" onClick={() => toast('🚀 Meal planning features coming soon! We\'re polishing the details to make it perfect for you.')}>
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Calendar size={120} className="text-blue-500 -rotate-12" />
                            </div>
                            {/* Lock Icon */}
                            {!isAdmin && (
                                <div className="absolute top-3 right-3 z-10 bg-blue-500 rounded-full p-1.5 shadow-lg">
                                    <Lock size={14} className="text-white" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Planner</h3>
                            </div>
                            <div className={cn("grid grid-cols-2 gap-6", !isAdmin && "opacity-50 pointer-events-none")}>
                                <button
                                    onClick={() => setChatbotView('planner')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all">🗂️</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Meal Planner</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('pantry')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all">🧺</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">Pantry</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('shopping')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-all">🛒</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">Shopping</span>
                                </button>
                            </div>
                        </div>

                        {/* Widgets Section */}
                        <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-3xl p-6 border border-purple-500/20 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-purple-500/40" onClick={() => toast('✨ Advanced widgets coming soon! We\'re polishing the details to make it perfect for you.')}>
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                <Package size={120} className="text-purple-500 -rotate-12" />
                            </div>
                            {/* Lock Icon */}
                            {!isAdmin && (
                                <div className="absolute top-3 right-3 z-10 bg-purple-500 rounded-full p-1.5 shadow-lg">
                                    <Lock size={14} className="text-white" />
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Widgets</h3>
                            </div>
                            <div className={cn("grid grid-cols-2 gap-6", !isAdmin && "opacity-50 pointer-events-none")}>
                                <button
                                    onClick={() => setChatbotView('nutridex')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.3)] transition-all">🧪</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-fuchsia-500 transition-colors">Nutridex</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('comparator')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all">⚖️</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Comparator</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('lifeguard')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(20,184,166,0.3)] transition-all">🛡️</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">Lifeguard</span>
                                </button>
                                <button
                                    onClick={() => setChatbotView('messages')}
                                    className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all">💬</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">AI Chat</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coming Soon Page */}
                {!showRecipeBuilder && chatbotView === 'comingSoon' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                            <h3 className="text-lg font-bold text-foreground">Coming Soon</h3>
                            <p className="mt-2 text-sm text-muted-foreground">This feature is on the way! Stay tuned for updates.</p>
                            <button
                                onClick={() => setChatbotView('dashboard')}
                                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {/* Cookbook Menu */}
                {/* Import Options View */}
                {!showRecipeBuilder && chatbotView === 'import' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="w-full flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Import Recipes</h3>
                            <button
                                onClick={() => setChatbotView('cookbook')}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                            >
                                📚 Back
                            </button>
                        </div>

                        {/* Photo Upload Section */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Upload a Photo</h4>
                            <div 
                                className={cn(
                                    "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col h-32 relative overflow-hidden group transition-all duration-300 cursor-pointer",
                                    isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        setChatbotView('import-upload-photo');
                                        processRecipeImage(file);
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Camera size={40} className="text-rose-500" />
                                </div>
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Camera size={24} className="text-rose-500 mx-auto mb-2" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Drag & drop or click to upload</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* URL Input Section */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Paste a Link</h4>
                            {!successRecipe ? (
                                <>
                                    <input
                                        type="url"
                                        value={pastedRecipeURL}
                                        onChange={(e) => setpastedRecipeURL(e.target.value)}
                                        placeholder="https://example.com/recipe/..."
                                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                                    />
                                    <button
                                        onClick={handlePasteRecipeURL}
                                        disabled={!pastedRecipeURL.trim() || recipeLoading}
                                        className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {recipeLoading ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                Parsing...
                                            </>
                                        ) : (
                                            'Import'
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-xl p-3 border border-purple-500/20 mb-3">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Recipe parsed successfully! Ready to save?</p>
                                    </div>
                                    <button
                                        onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                        disabled={recipeSaving}
                                        className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                                    >
                                        {recipeSaving ? (
                                            <>
                                                <Loader2 size={12} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={12} />
                                                Save to Library
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSuccessRecipe(null);
                                            setpastedRecipeURL('');
                                        }}
                                        className="w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                                    >
                                        Try Another
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Manual Entry Option */}
                        <button
                            onClick={handleManualRecipeCreation}
                            className="w-full px-4 py-3 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-xs transition-all hover:bg-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <Pencil size={14} />
                            Create Recipe Manually
                        </button>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'import-options' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center animate-in fade-in duration-200">
                        <div className="w-full flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Import Methods</h3>
                            <button
                                onClick={() => setChatbotView('cookbook')}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                            >
                                📚 Back
                            </button>
                        </div>
                        
                        <div className="space-y-3 w-full">
                            {/* Option 1: Photo Upload - FULL WIDTH */}
                            <div 
                                className={cn(
                                    "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col h-full relative overflow-hidden group transition-all duration-300 cursor-pointer w-full",
                                    isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        setChatbotView('import-upload-photo');
                                        processRecipeImage(file);
                                    }
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
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 1</h4>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Upload a Photo</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                                    Extract recipe from any image.
                                </p>
                                <div className="text-center py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-rose-500/80 transition-colors">
                                    UPLOAD
                                </div>
                            </div>

                            {/* Option 2: Paste URL - FULL WIDTH - Direct to form */}
                            <div 
                                onClick={() => setChatbotView('import-paste-url')}
                                className="bg-purple-500/10 dark:bg-purple-500/5 rounded-2xl p-4 border border-purple-500/20 flex flex-col h-full relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 cursor-pointer w-full"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Link size={40} className="text-purple-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Link size={16} className="text-purple-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 2</h4>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Paste a Link</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                                    Import automatically from any link.
                                </p>
                                <div className="text-center py-2 rounded-xl bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-purple-600 transition-colors">
                                    IMPORT
                                </div>
                            </div>

                            {/* Option 3: Manual Entry - FULL WIDTH */}
                            <div 
                                onClick={handleManualRecipeCreation}
                                className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20 flex flex-col h-full relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 cursor-pointer w-full"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Pencil size={40} className="text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <Pencil size={16} className="text-emerald-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">Method 3</h4>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white text-xs mb-1">Create Recipe Manually</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 flex-1">
                                    Add all details yourself using our form.
                                </p>
                                <div className="text-center py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-600 transition-colors">
                                    LET&apos;S GO
                                </div>
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
                                    <Database size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-[10px] uppercase tracking-widest opacity-60">Bulk Import</h4>
                                    <h3 className="font-black text-xs uppercase tracking-tight">Import Recipe Database</h3>
                                </div>
                            </div>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-emerald-500" />
                        </button>
                    </div>
                )}

                {/* Import - Paste Text View */}
                {!showRecipeBuilder && chatbotView === 'import-paste-text' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paste Recipe Text</h3>
                            <button
                                onClick={() => setChatbotView('import')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors uppercase tracking-widest"
                            >
                                ← Back
                            </button>
                        </div>

                        {!successRecipe ? (
                            <>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Paste the recipe ingredients and instructions here:</p>
                                <textarea
                                    value={pastedRecipeContent}
                                    onChange={(e) => setPastedRecipeContent(e.target.value)}
                                    placeholder="Paste your recipe text here (ingredients and instructions)..."
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <button
                                    onClick={handlePasteRecipeContent}
                                    disabled={!pastedRecipeContent.trim() || recipeLoading}
                                    className="mt-3 w-full px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeLoading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Parsing...
                                        </>
                                    ) : (
                                        'Parse Recipe'
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-xl p-4 border border-blue-500/20 mb-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Recipe parsed successfully! Ready to save?</p>
                                </div>
                                <button
                                    onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                    disabled={recipeSaving}
                                    className="w-full px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Library
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSuccessRecipe(null);
                                        setPastedRecipeContent('');
                                    }}
                                    className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                                >
                                    Try Another
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Import - Paste URL View */}
                {!showRecipeBuilder && chatbotView === 'import-paste-url' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paste Recipe URL</h3>
                            <button
                                onClick={() => setChatbotView('import')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-500 transition-colors uppercase tracking-widest"
                            >
                                ← Back
                            </button>
                        </div>

                        {!successRecipe ? (
                            <>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Paste a recipe URL from any cooking website:</p>
                                <input
                                    type="url"
                                    value={pastedRecipeURL}
                                    onChange={(e) => setpastedRecipeURL(e.target.value)}
                                    placeholder="https://example.com/recipe/..."
                                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={handlePasteRecipeURL}
                                    disabled={!pastedRecipeURL.trim() || recipeLoading}
                                    className="mt-3 w-full px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeLoading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Parsing...
                                        </>
                                    ) : (
                                        'Parse Recipe'
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-xl p-4 border border-purple-500/20 mb-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Recipe parsed successfully! Ready to save?</p>
                                </div>
                                <button
                                    onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                    disabled={recipeSaving}
                                    className="w-full px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Library
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setSuccessRecipe(null);
                                        setpastedRecipeURL('');
                                    }}
                                    className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                                >
                                    Try Another
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Import - Upload Photo View */}
                {!showRecipeBuilder && chatbotView === 'import-upload-photo' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Upload Recipe Photo</h3>
                            <button
                                onClick={() => setChatbotView('import')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors uppercase tracking-widest"
                            >
                                ← Back
                            </button>
                        </div>

                        {!successRecipe ? (
                            <>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Upload a photo of a recipe (from a book, magazine, or printed page):</p>
                                <div className="flex-1 flex items-center justify-center mb-3">
                                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-rose-500/30 hover:border-rose-500 transition cursor-pointer bg-rose-500/5">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Camera className="w-8 h-8 text-rose-500 mb-2" />
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Click to upload or drag and drop</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processRecipeImage(e.target.files[0])} />
                                    </label>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full px-4 py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={14} />
                                    Upload Photo
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-rose-500/10 dark:bg-rose-500/20 rounded-xl p-4 border border-rose-500/20 mb-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Recipe extracted successfully! Ready to save?</p>
                                </div>
                                <button
                                    onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                    disabled={recipeSaving}
                                    className="w-full px-4 py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Library
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSuccessRecipe(null)}
                                    className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                                >
                                    Upload Another
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Import - Voice View */}
                {!showRecipeBuilder && chatbotView === 'import-voice' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Voice Recipe</h3>
                            <button
                                onClick={() => setChatbotView('import')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-widest"
                            >
                                ← Back
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Describe your recipe by talking:</p>
                        <button
                            onClick={() => {
                                if (isRecording) stopAudioRecording();
                                else startAudioRecording();
                            }}
                            className={cn(
                                "w-full px-4 py-3 rounded-lg font-black uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2 flex-1 mb-3",
                                isRecording
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-amber-500 hover:bg-amber-600 text-white"
                            )}
                        >
                            {isRecording ? (
                                <>
                                    <Square size={14} />
                                    Stop Recording ({recordingTime}s)
                                </>
                            ) : (
                                <>
                                    <Mic size={14} />
                                    Start Recording
                                </>
                            )}
                        </button>

                        {successRecipe && (
                            <div className="flex-1 flex flex-col">
                                <div className="bg-amber-500/10 dark:bg-amber-500/20 rounded-xl p-4 border border-amber-500/20 mb-4">
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Recipe created successfully! Ready to save?</p>
                                </div>
                                <button
                                    onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                    disabled={recipeSaving}
                                    className="w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {recipeSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Library
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Import - Video View */}
                {!showRecipeBuilder && chatbotView === 'import-video' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Video Import</h3>
                            <button
                                onClick={() => setChatbotView('import')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-500 transition-colors uppercase tracking-widest"
                            >
                                ← Back
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Paste a YouTube or TikTok video link:</p>
                        <input
                            type="url"
                            value={videoURL}
                            onChange={(e) => setVideoURL(e.target.value)}
                            placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@..."
                            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
                        />
                        <button
                            onClick={() => toast('Video recipe import is coming soon!')}
                            disabled={!videoURL.trim()}
                            className="w-full px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Video size={14} />
                            Extract Recipe
                        </button>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'cookbook' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={() => setChatbotView('dashboard')}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-secondary text-secondary-foreground hover:bg-muted transition-colors uppercase tracking-widest"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setChatbotView('all-recipes')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">📖</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Public Recipes</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('my-recipes')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">👩‍🍳</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">My Recipes</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('import-options')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">📥</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Import Recipes</span>
                            </button>

                            <button
                                onClick={() => toast('Export is coming soon 👀')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">📤</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">Export Recipes</span>
                            </button>
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'plannerMenu' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={() => setChatbotView('dashboard')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setChatbotView('planner')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🗂️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Meal Planner</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('pantry')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🧺</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">Pantry</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('shopping')}
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
                                onClick={() => setChatbotView('dashboard')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setChatbotView('nutridex')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🧪</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-fuchsia-500 transition-colors">Nutridex</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('comparator')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">⚖️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Comparator</span>
                            </button>

                            <button
                                onClick={() => setChatbotView('lifeguard')}
                                className="flex flex-col items-center justify-center gap-2 p-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                            >
                                <span className="text-3xl transition-all">🛡️</span>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">Lifeguard</span>
                            </button>

                            <div className="flex flex-col items-center justify-center gap-2 p-2 text-center opacity-40">
                                <span className="text-3xl">⏳</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'profile' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in fade-in duration-200">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={() => setChatbotView('dashboard')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-secondary transition-colors"
                            >
                                🏠 Back to Dashboard
                            </button>
                        </div>
                        <ProfilePage />
                    </div>
                )}

                {/* Messages View - Full Screen, Only in chat mode */}
                {!showRecipeBuilder && chatbotView === 'messages' && !isCreatingRecipe && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                'flex gap-3',
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'px-4 py-2.5 rounded-xl text-sm leading-relaxed',
                                    message.type === 'user'
                                        ? 'max-w-xs bg-emerald-500 text-white rounded-br-none font-medium'
                                        : 'max-w-sm bg-muted text-foreground rounded-bl-none border border-border/50'
                                )}
                            >
                                {message.type === 'bot' ? (
                                    <div className="space-y-3">
                                        <FormattedText content={message.content} />
                                        {message.recipeData && (
                                            <button
                                                onClick={() => handleSaveAndViewRecipe(message.recipeData!)}
                                                disabled={recipeSaving}
                                                className="w-full mt-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {recipeSaving ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <Save size={12} />
                                                )}
                                                SAVE AND VIEW RECIPE
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="bg-muted px-4 py-2.5 rounded-xl rounded-bl-none border border-border/50">
                                <Loader2 size={16} className="text-muted-foreground animate-spin" />
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
                )}

                {!showRecipeBuilder && chatbotView === 'messages' && isCreatingRecipe && !successRecipe && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center">
                        <div className="grid grid-cols-2 gap-3 w-full">
                            {/* Option 1: Manual Creation */}
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

                            {/* Option 2: Paste Content */}
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

                            {/* Option 3: URL */}
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

                            {/* Option 4: Photo Upload / Dropzone */}
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

                            {/* Option 5: Voice Assisted */}
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
                                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 animate-pulse" 
                                            : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                    )}
                                >
                                    {isRecording ? <Square size={12} /> : <Mic size={12} />}
                                    {isRecording ? "STOP RECORDING" : "START RECORDING"}
                                </button>
                            </div>

                            {/* Option 6: Video Import */}
                            <div className="bg-cyan-500/10 dark:bg-cyan-500/5 rounded-2xl p-4 border border-cyan-500/20 flex flex-col h-full relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Video size={40} className="text-cyan-500" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                        <Video size={16} className="text-cyan-500" />
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
                                    <Database size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-[10px] uppercase tracking-widest opacity-60">Bulk Import</h4>
                                    <h3 className="font-black text-xs uppercase tracking-tight">Import Recipe Database</h3>
                                </div>
                            </div>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform text-emerald-500" />
                        </button>
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'all-recipes' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                        <RecipesView 
                            onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'all-recipes')}
                            hideControls={true}
                        />
                    </div>
                )}

                {!showRecipeBuilder && chatbotView === 'my-recipes' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                        <MyRecipesView 
                            onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'my-recipes')}
                            hideControls={true}
                        />
                    </div>
                )}

                {/* Recipe Detail View */}
                {!showRecipeBuilder && chatbotView === 'recipe-detail' && selectedRecipeId && (
                    <ChatbotRecipeDetail recipeId={selectedRecipeId} onBack={handleBackFromRecipeDetail} />
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

                {/* Nutridex View */}
                {!showRecipeBuilder && chatbotView === 'nutridex' && (
                    <ChatbotNutridexFull />
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

                {/* Input Area - Only shown in chat messages view */}
                {chatbotView === 'messages' && !showRecipeBuilder && !isCreatingRecipe && (
                    <div className="relative border-t border-slate-200 dark:border-slate-800 shrink-0">
                    {/* Quick Actions Drawer */}
                    {showQuickActions && (
                        <div className="absolute bottom-full left-0 right-0 z-50 bg-card border-t border-border p-4 space-y-2 animate-in slide-in-from-bottom-3">
                            {/* Recipe Button */}
                            <div>
                                <button
                                    onClick={() => {
                                        setExpandedWidgetsMenu(false);
                                        setExpandedAppsMenu(false);
                                        setExpandedRecipeMenu(!expandedRecipeMenu);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Salad size={18} className="text-emerald-500" />
                                        <span className="font-medium text-sm">Recipes</span>
                                    </div>
                                    <ChevronRight 
                                        size={16} 
                                        className={cn(
                                            "transition-transform",
                                            expandedRecipeMenu ? "rotate-90" : ""
                                        )}
                                    />
                                </button>

                                {/* Recipe Sub-menu */}
                                {expandedRecipeMenu && (
                                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-emerald-500">
                                        <button
                                            onClick={() => {
                                                handleViewAllRecipes();
                                                setExpandedRecipeMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                                        >
                                            📚 View All Recipes
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleViewMyRecipes();
                                                setExpandedRecipeMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                                        >
                                            ❤️ View My Recipes
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleCreateNewRecipe();
                                                setExpandedRecipeMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors"
                                        >
                                            ➕ Create New Recipe
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Apps Button */}
                            <div>
                                <button
                                    onClick={() => {
                                        setExpandedRecipeMenu(false);
                                        setExpandedWidgetsMenu(false);
                                        setExpandedAppsMenu(!expandedAppsMenu);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Package size={18} className="text-purple-500" />
                                        <span className="font-medium text-sm">Apps</span>
                                    </div>
                                    <ChevronRight 
                                        size={16} 
                                        className={cn(
                                            "transition-transform",
                                            expandedAppsMenu ? "rotate-90" : ""
                                        )}
                                    />
                                </button>

                                {/* Apps Sub-menu */}
                                {expandedAppsMenu && (
                                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-purple-500">
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('shopping');
                                                setShowQuickActions(false);
                                                setExpandedAppsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <ShoppingBag size={14} className="text-blue-500" />
                                            Shopping
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('pantry');
                                                setShowQuickActions(false);
                                                setExpandedAppsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Package size={14} className="text-orange-500" />
                                            Pantry
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('planner');
                                                setShowQuickActions(false);
                                                setExpandedAppsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Calendar size={14} className="text-pink-500" />
                                            Planner
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Widgets Button */}
                            <div>
                                <button
                                    onClick={() => {
                                        setExpandedRecipeMenu(false);
                                        setExpandedAppsMenu(false);
                                        setExpandedWidgetsMenu(!expandedWidgetsMenu);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Salad size={18} className="text-cyan-500" />
                                        <span className="font-medium text-sm">Widgets</span>
                                    </div>
                                    <ChevronRight 
                                        size={16} 
                                        className={cn(
                                            "transition-transform",
                                            expandedWidgetsMenu ? "rotate-90" : ""
                                        )}
                                    />
                                </button>

                                {/* Widgets Sub-menu */}
                                {expandedWidgetsMenu && (
                                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-cyan-500">
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('nutridex');
                                                setShowQuickActions(false);
                                                setExpandedWidgetsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-lg">📊</span>
                                            Nutridex
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('comparator');
                                                setShowQuickActions(false);
                                                setExpandedWidgetsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-lg">⚡</span>
                                            Comparator
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPreviousView(previousView);
                                                setChatbotView('lifeguard');
                                                setShowQuickActions(false);
                                                setExpandedWidgetsMenu(false);
                                            }}
                                            className="w-full text-left px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-lg">🛡️</span>
                                            Lifeguard
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || recipeLoading}
                            className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            title="Upload image"
                        >
                            <Upload size={16} />
                        </button>
                        <button
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
                            onClick={handleLoadConversationHistory}
                            disabled={isLoadingHistory}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            title="View conversation history"
                        >
                            {isLoadingHistory ? <Loader2 size={12} className="animate-spin" /> : <span>📋 History</span>}
                        </button>
                        <button
                            onClick={startNewConversation}
                            disabled={isLoading || recipeLoading}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-xs uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            title="Start a new conversation"
                        >
                            ➕ New
                        </button>
                    </div>
                </div>
                )}

                {/* Bottom Navigation Footer (Mobile Optimized) */}
                <div className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between pointer-events-auto shrink-0 z-50">
                    <button
                        onClick={() => {
                            if (showRecipeBuilder) {
                                setShowRecipeBuilder(false);
                                setRecipeStep(1);
                                setRecipeTitle('');
                                setRecipeServings(4);
                                setRecipePrepTime(30);
                                setRecipeCookTime(0);
                                setRecipeIngredients([]);
                                setRecipeInstructions(['']);
                                setRecipeImage('');
                            } else {
                                window.history.back();
                            }
                        }}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-emerald-500"
                        title="Go Back"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    
                    <button
                        onClick={() => {
                            if (chatbotView === 'all-recipes' || chatbotView === 'my-recipes') {
                                setShowFilterDialog(true);
                            } else {
                                setChatbotView('dashboard');
                            }
                        }}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 group",
                            (chatbotView === 'all-recipes' || chatbotView === 'my-recipes')
                                ? "bg-blue-500 text-white shadow-blue-500/40 hover:bg-blue-600"
                                : chatbotView === 'dashboard'
                                    ? "bg-emerald-500 text-white shadow-emerald-500/40"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 shadow-xl shadow-black/5"
                        )}
                        title={chatbotView === 'all-recipes' || chatbotView === 'my-recipes' ? "Filter Recipes" : "Home"}
                    >
                        {chatbotView === 'all-recipes' || chatbotView === 'my-recipes' ? (
                            <Filter size={24} className={cn(chatbotView === 'all-recipes' || chatbotView === 'my-recipes' ? "" : "group-hover:scale-110 transition-transform")} />
                        ) : (
                            <Home size={24} className={cn(chatbotView === 'dashboard' ? "" : "group-hover:scale-110 transition-transform")} />
                        )}
                    </button>

                    <button
                        onClick={() => window.history.forward()}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-emerald-500"
                        title="Go Forward"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Recipe Filter Dialog */}
            <RecipeFilterDialog 
                isOpen={showFilterDialog} 
                onClose={() => setShowFilterDialog(false)} 
            />
        </div>
    );
}
