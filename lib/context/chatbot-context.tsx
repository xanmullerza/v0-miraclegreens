'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChatbotViewType = 'dashboard' | 'cookbook' | 'plannerMenu' | 'widgetsMenu' | 'profile' | 'messages' | 'comingSoon' | 'recipe-builder' | 'view-recipes' | 'recipe-detail' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history' | 'import' | 'import-options' | 'import-bulk' | 'import-paste-text' | 'import-paste-url' | 'import-upload-photo' | 'import-voice' | 'import-video' | 'help-cookbook' | 'help-planner' | 'help-widgets' | 'export-recipes';

interface ChatbotContextType {
    isChatbotOpen: boolean;
    setIsChatbotOpen: (open: boolean) => void;
    chatbotView: ChatbotViewType;
    setChatbotView: (view: ChatbotViewType) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatbotView, setChatbotView] = useState<ChatbotViewType>('dashboard');

    return (
        <ChatbotContext.Provider value={{
            isChatbotOpen,
            setIsChatbotOpen,
            chatbotView,
            setChatbotView,
        }}>
            {children}
        </ChatbotContext.Provider>
    );
}

export function useChatbot() {
    const context = useContext(ChatbotContext);
    if (context === undefined) {
        throw new Error('useChatbot must be used within a ChatbotProvider');
    }
    return context;
}
