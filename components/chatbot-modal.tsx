'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

interface ChatbotModalProps {
    onClose: () => void;
}

export function ChatbotModal({ onClose }: ChatbotModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'bot',
            content: 'Hello! I\'m the Miracle Greens Q&A Assistant. How can I help you today?',
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

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

        // Simulate bot response (replace with actual API call later)
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                content: generateBotResponse(input),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
            setIsLoading(false);
        }, 1000);
    };

    const generateBotResponse = (userInput: string): string => {
        const responses: Record<string, string> = {
            nutrition: 'I can help you with nutrition information! Ask me about specific nutrients, foods, or meal recommendations.',
            'recipe': 'I\'d be happy to help with recipes! You can ask about meal ideas, ingredients, or cooking instructions.',
            'meal plan': 'I can assist with meal planning. Tell me your dietary preferences and goals, and I\'ll suggest suitable meals.',
            'health': 'For health-related questions, I can provide nutritional information, but always consult a healthcare professional for medical advice.',
            'default': 'That\'s a great question! I\'m still learning to answer all types of questions. Can you provide more details?'
        };

        const lowerInput = userInput.toLowerCase();
        
        for (const [key, response] of Object.entries(responses)) {
            if (key !== 'default' && lowerInput.includes(key)) {
                return response;
            }
        }

        return responses['default'];
    };

    return (
        <>
            {/* Backdrop - only on mobile */}
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <div className="fixed inset-0 z-50 pointer-events-none">
                <div className="absolute inset-y-0 right-0 pointer-events-auto w-full md:w-1/3 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    
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
                                'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                                message.type === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            <div
                                className={cn(
                                    'max-w-xs px-4 py-2.5 rounded-xl text-sm font-medium leading-relaxed',
                                    message.type === 'user'
                                        ? 'bg-emerald-500 text-white rounded-br-none'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                                )}
                            >
                                {message.content}
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
                <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        title="Send"
                    >
                        <Send size={16} />
                    </button>
                </div>
                    </div>
                </div>
        </>
    );
}
