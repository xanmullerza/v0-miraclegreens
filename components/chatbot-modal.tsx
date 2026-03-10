'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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

export function ChatbotModal({ onClose, onRecipeDetected }: ChatbotModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'bot',
            content: 'Hello! I\'m Zum, your child-friendly AI assistant. I can help with nutrition questions, recipes, meal planning, and more. I can also add recipes from URLs! Just share a recipe link.',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recipeLoading, setRecipeLoading] = useState(false);
    const [detectedURL, setDetectedURL] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                            content: `✅ Recipe "${recipeData.title}" parsed successfully! Click below to add it to your library.`,
                            timestamp: new Date(),
                        }
                    ]);

                    // Trigger callback to open recipe editor
                    if (onRecipeDetected) {
                        onRecipeDetected(recipeData);
                    }
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
                    <div>
                        <h3 className="font-black uppercase tracking-wider text-slate-900 dark:text-white text-sm">Q&A Assistant</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Ask me anything</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Messages */}
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

                {/* Input */}
                <div className="flex gap-2 p-4 pb-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
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
        </div>
    );
}
