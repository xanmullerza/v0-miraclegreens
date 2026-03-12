'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Upload, Menu, Salad, ChevronRight, Plus, Trash2, ArrowLeft, Save, Camera, ShoppingBag, Package, Calendar, Mic, Square } from 'lucide-react';
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
import { ChatbotLifeguardFull } from '@/components/chatbot-lifeguard-full';
import { toast } from 'sonner';

interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    source_url: string;
    image_url?: string;
}

interface ChatbotModalProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
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

const CHATBOT_STORAGE_KEY = 'chatbot_state_v1';

function loadChatbotState() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(CHATBOT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to load chatbot state:', error);
        return null;
    }
}

function saveChatbotState(state: any) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save chatbot state:', error);
    }
}

function clearChatbotState() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(CHATBOT_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear chatbot state:', error);
    }
}

export function ChatbotModal({ onClose, onRecipeDetected }: ChatbotModalProps) {
    const router = useRouter();
    const { user, saveRecipe } = useDataPersistence();
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
    
    const storedState = loadChatbotState();
    const [messages, setMessages] = useState<Message[]>(
        storedState?.messages ? 
            (storedState.messages as any[]).map(m => ({ ...m, timestamp: new Date(m.timestamp) })) : 
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
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(storedState?.isCreatingRecipe || false);
    const [pastedRecipeContent, setPastedRecipeContent] = useState('');
    const [pastedRecipeURL, setpastedRecipeURL] = useState('');
    
    // Chatbot view state - controls which content is displayed (messages, recipe builder, all recipes, my recipes, recipe detail, shopping, pantry, planner, nutridex, comparator, lifeguard)
    const [chatbotView, setChatbotView] = useState<'messages' | 'recipe-builder' | 'all-recipes' | 'my-recipes' | 'recipe-detail' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard'>(storedState?.chatbotView || 'messages');
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(storedState?.selectedRecipeId || null);
    const [previousView, setPreviousView] = useState<'all-recipes' | 'my-recipes' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard'>(storedState?.previousView || 'all-recipes');
    
    // Recipe builder state
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(storedState?.showRecipeBuilder || false);
    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeType, setRecipeType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [recipePrepTime, setRecipePrepTime] = useState(30);
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

    // Persist chatbot state to localStorage whenever it changes
    useEffect(() => {
        saveChatbotState({
            messages,
            chatbotView,
            isCreatingRecipe,
            showRecipeBuilder,
            selectedRecipeId,
            previousView,
        });
    }, [messages, chatbotView, isCreatingRecipe, showRecipeBuilder, selectedRecipeId, previousView]);

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
            } else if (chatbotView !== 'messages') {
                // If there's a popstate but no state data, go back to messages
                setChatbotView('messages');
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [chatbotView]);

    const handleViewSavedRecipe = async (recipe?: ParsedRecipe) => {
        const recipeToView = recipe || successRecipe;
        if (!recipeToView) return;

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            // Find the saved recipe by source_url and user_id
            const { data: savedRecipe, error } = await supabase
                .from('recipes')
                .select('id')
                .eq('source_url', recipeToView.source_url)
                .eq('user_id', user.id)
                .eq('is_curated', false)
                .single();

            if (error || !savedRecipe) {
                console.error('Recipe not found:', error);
                // Fallback to modal if recipe not found
                if (onRecipeDetected && !recipe) {
                    onRecipeDetected(recipeToView);
                }
                return;
            }

            // Navigate directly to recipe detail page
            router.push(`/dashboard/library/my-recipes/${savedRecipe.id}`);
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

                // Parse response - expect { recipe: { title, ingredients_text, instructions_text, servings, prep_time, source_url, image_url } }
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
                        source_url: detectedUrl,
                        image_url: recipe.image_url || recipe.image || undefined,
                    };
                } else if (!data.recipe && !data.data) {
                    throw new Error('Unexpected response format from recipe parser');
                }

                if (recipeData) {
                    // Remove the "Parsing..." message and show success
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        {
                            id: (Date.now() + 1).toString(),
                            type: 'bot',
                            content: `✅ Great! "${recipeData.title}" has been saved to your library! You can now view it in your My Recipes section, edit it, adjust servings, and add more ingredients whenever you'd like.`,
                            timestamp: new Date(),
                        }
                    ]);

                    // Store the recipe as fallback and navigate directly to the saved recipe
                    setSuccessRecipe(recipeData);
                    handleViewSavedRecipe(recipeData);
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
        // Add user message showing audio was uploaded
        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: `🎤 Sent audio message (${recordingTime}s)`,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
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

            // Call n8n webhook
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract bot response - audio transcription should come back as text
            let botResponse = '';
            if (typeof data === 'string') {
                botResponse = data;
            } else if (data.responseText) {
                botResponse = data.responseText;
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
                content: botResponse || 'I heard your audio message. How can I help?',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error uploading audio:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: 'Sorry, I encountered an error processing your audio. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Reset audio input
            if (audioInputRef.current) {
                audioInputRef.current.value = '';
            }
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
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

            const data = await response.json();
            
            // Extract bot response
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
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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

    const handleRecipeClick = (recipeId: string, fromView: 'all-recipes' | 'my-recipes') => {
        setSelectedRecipeId(recipeId);
        setPreviousView(fromView);
        setChatbotView('recipe-detail');
    };

    const handleBackFromRecipeDetail = () => {
        setChatbotView(previousView);
        setSelectedRecipeId(null);
    };

    const resetChatbotState = () => {
        // Reset all state to initial values
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
        
        // Clear localStorage
        clearChatbotState();
    };

    const handleBackToMessages = () => {
        resetChatbotState();
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
                    source_url: 'pasted-content',
                    image_url: recipe.image_url || recipe.image || undefined,
                };
            } else if (!data.recipe && !data.data) {
                throw new Error('Unexpected response format from recipe parser');
            }

            if (recipeData) {
                // Remove the "Parsing..." message and show success - matching URL flow
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `✅ Great! "${recipeData.title}" has been saved to your library! You can now view it in your My Recipes section, edit it, adjust servings, and add more ingredients whenever you'd like.`,
                        timestamp: new Date(),
                    }
                ]);

                // Store the recipe and navigate/show modal - matching URL flow
                setSuccessRecipe(recipeData);
                setIsCreatingRecipe(false);
                setPastedRecipeContent('');
                if (recipeContentRef.current) {
                    recipeContentRef.current.value = '';
                }
                handleViewSavedRecipe(recipeData);
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
                    source_url: pastedRecipeURL,
                    image_url: recipe.image_url || recipe.image || undefined,
                };
            } else if (!data.recipe && !data.data) {
                throw new Error('Unexpected response format from recipe parser');
            }

            if (recipeData) {
                // Remove the "Extracting..." message and show success
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: (Date.now() + 1).toString(),
                        type: 'bot',
                        content: `✅ Perfect! "${recipeData.title}" has been imported and saved to your library! You can now view it in your My Recipes section, edit it, adjust servings, and add more ingredients.`,
                        timestamp: new Date(),
                    }
                ]);

                // Store the recipe
                setSuccessRecipe(recipeData);
                setIsCreatingRecipe(false);
                setpastedRecipeURL('');
                handleViewSavedRecipe(recipeData);
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
        <div className="fixed inset-0 z-50 flex pointer-events-none">
            {/* Backdrop - only on mobile */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden pointer-events-auto"
            />
            
            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-full md:w-1/3 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col pointer-events-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                        {(showRecipeBuilder || chatbotView !== 'messages') && (
                            <button
                                onClick={() => {
                                    if (showRecipeBuilder) {
                                        handleCloseRecipeBuilder();
                                    } else if (chatbotView === 'recipe-detail') {
                                        handleBackFromRecipeDetail();
                                    } else {
                                        handleBackToMessages();
                                    }
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                                title="Back"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h3 className="font-black uppercase tracking-wider text-slate-900 dark:text-white text-sm">
                                {showRecipeBuilder ? 'Create Recipe' : chatbotView === 'all-recipes' ? 'All Recipes' : chatbotView === 'my-recipes' ? 'My Recipes' : chatbotView === 'recipe-detail' ? 'Recipe Details' : chatbotView === 'shopping' ? 'Shopping' : chatbotView === 'pantry' ? 'Pantry' : chatbotView === 'planner' ? 'Planner' : chatbotView === 'nutridex' ? 'Nutridex' : chatbotView === 'comparator' ? 'Comparator' : chatbotView === 'lifeguard' ? 'Lifeguard' : 'Q&A Assistant'}
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
                                {showRecipeBuilder ? 'Step-by-step recipe creation' : chatbotView === 'all-recipes' ? 'Browse all recipes' : chatbotView === 'my-recipes' ? 'Your saved recipes' : chatbotView === 'shopping' ? 'Your shopping list' : chatbotView === 'pantry' ? 'Your pantry items' : chatbotView === 'planner' ? 'Your meal plan' : chatbotView === 'nutridex' ? 'Explore nutrients' : chatbotView === 'comparator' ? 'Compare nutrition' : chatbotView === 'lifeguard' ? 'Find substitutes' : 'Ask me anything'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        title="Minimize (all history and state are preserved across sessions)"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content Area - Messages, Recipe Builder, or Recipe Views */}
                {/* Recipe Builder - Full Screen */}
                {showRecipeBuilder && (
                    <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">
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
                                        Meal Type
                                    </label>
                                    <select
                                        value={recipeType}
                                        onChange={(e) => setRecipeType(e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="breakfast">Breakfast</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="dinner">Dinner</option>
                                        <option value="snack">Snack</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
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
                                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                value={step}
                                                onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                                                placeholder={`Step ${idx + 1}...`}
                                                className="flex-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px] resize-none"
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
                                        className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm transition-colors"
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
                                        className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm transition-colors"
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

                {/* Messages View - Full Screen, Only in chat mode */}
                {!showRecipeBuilder && chatbotView === 'messages' && !isCreatingRecipe && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                        : 'max-w-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                                )}
                            >
                                {message.type === 'bot' ? (
                                    <FormattedText content={message.content} />
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl rounded-bl-none">
                                <Loader2 size={16} className="text-slate-400 animate-spin" />
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
                )}

                {/* Create Recipe Options - Shown when creating recipe */}
                {!showRecipeBuilder && chatbotView === 'messages' && isCreatingRecipe && !successRecipe && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {/* Option 1: Manual Creation */}
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-500/30">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">✏️ Option 1: Manually Create</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                Step-by-step form to add all the details yourself.
                            </p>
                            <button
                                onClick={handleManualRecipeCreation}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors active:scale-95"
                            >
                                Let&apos;s Go <ChevronRight size={12} />
                            </button>
                        </div>

                        {/* Option 2: Paste Content */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">📋 Option 2: Paste Recipe Text</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                Copy-paste recipe instructions and we&apos;ll parse the ingredients automatically.
                            </p>
                            <textarea
                                ref={recipeContentRef}
                                value={pastedRecipeContent}
                                onChange={(e) => setPastedRecipeContent(e.target.value)}
                                placeholder="Paste recipe content here..."
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                                rows={4}
                            />
                            <button
                                onClick={handlePasteRecipeContent}
                                disabled={!pastedRecipeContent.trim() || isLoading}
                                className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Parsing...
                                    </>
                                ) : (
                                    <>
                                        <span>✓ Parse & Review</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Option 3: URL (existing) */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-500/30">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">🔗 Option 3: Paste Recipe URL</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                Paste a recipe link and we'll automatically extract all the details.
                            </p>
                            <input
                                type="text"
                                value={pastedRecipeURL}
                                onChange={(e) => setpastedRecipeURL(e.target.value)}
                                placeholder="Paste recipe URL here (e.g., https://www.example.com/recipe)"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && pastedRecipeURL.trim() && !isLoading) {
                                        handlePasteRecipeURL();
                                    }
                                }}
                            />
                            <button
                                onClick={handlePasteRecipeURL}
                                disabled={!pastedRecipeURL.trim() || isLoading}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Extracting...
                                    </>
                                ) : (
                                    <>
                                        <span>✓ Import Recipe</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* All Recipes View */}
                {!showRecipeBuilder && chatbotView === 'all-recipes' && (
                    <div className="flex-1 overflow-y-auto px-2">
                        <RecipesView 
                            onRecipeClick={(recipeId) => handleRecipeClick(recipeId, 'all-recipes')}
                            hideControls={true}
                        />
                    </div>
                )}

                {/* My Recipes View */}
                {!showRecipeBuilder && chatbotView === 'my-recipes' && (
                    <div className="flex-1 overflow-y-auto px-2">
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
                    <ChatbotPlanner />
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
                    <ChatbotLifeguardFull />
                )}

                {/* Input Area - Only shown in chat messages view */}
                {chatbotView === 'messages' && !showRecipeBuilder && !isCreatingRecipe && (
                    <div className="relative border-t border-slate-200 dark:border-slate-800 shrink-0">
                    {/* Quick Actions Drawer */}
                    {showQuickActions && (
                        <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-2 animate-in slide-in-from-bottom-3">
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
                            onClick={() => setShowQuickActions(!showQuickActions)}
                            className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors active:scale-95"
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
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                </div>
                )}
            </div>
        </div>
    );
}
