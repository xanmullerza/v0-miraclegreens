import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/action-panel/formatted-text';
import { ParsedRecipe } from '@/types/recipe';
import { Message } from '@/lib/hooks/use-zum-assistant';

interface MessagesViewProps {
    messages: Message[];
    isLoading: boolean;
    recipeSaving: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    handleSaveAndViewRecipe: (recipeData: ParsedRecipe) => void;
}

export function MessagesView({
    messages,
    isLoading,
    recipeSaving,
    messagesEndRef,
    handleSaveAndViewRecipe
}: MessagesViewProps) {
    return (
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
    );
}
