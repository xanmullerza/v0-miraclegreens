'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChatbotViewType = 'dashboard' | 'desktop-guide' | 'cookbook' | 'plannerMenu' | 'widgetsMenu' | 'profile' | 'messages' | 'comingSoon' | 'recipe-builder' | 'view-recipes' | 'recipe-detail' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history' | 'import' | 'import-options' | 'import-bulk' | 'import-paste-text' | 'import-paste-url' | 'import-upload-photo' | 'import-voice' | 'import-video' | 'help-cookbook' | 'help-planner' | 'help-widgets' | 'export-recipes' | 'recommended-intake' | 'privacy' | 'support' | 'terms' | 'recipe-filters';

interface ChatbotContextType {
    isChatbotOpen: boolean;
    setIsChatbotOpen: (open: boolean) => void;
    chatbotView: ChatbotViewType;
    setChatbotView: (view: ChatbotViewType) => void;
    previousView: ChatbotViewType | null;
    setPreviousView: (view: ChatbotViewType | null) => void;
    viewStack: ChatbotViewType[];
    navigateTo: (view: ChatbotViewType) => void;
    goBack: (fallbackProvider?: () => void) => void;
    recipeToRemix: any | null;
    setRecipeToRemix: (recipe: any | null) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [chatbotView, setChatbotView] = useState<ChatbotViewType>('desktop-guide');
    const [previousView, setPreviousView] = useState<ChatbotViewType | null>(null);
    const [recipeToRemix, setRecipeToRemix] = useState<any | null>(null);
    const [viewStack, setViewStack] = useState<ChatbotViewType[]>([]);

    // Initialize correct default view based on screen size across all routes
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setChatbotView('dashboard');
        }
    }, []);

    const navigateTo = (view: ChatbotViewType) => {
        if (view !== chatbotView) {
            setPreviousView(chatbotView);
            setViewStack(prev => [...prev, chatbotView]);
            setChatbotView(view);
        }
    };

    const goBack = (fallbackProvider?: () => void) => {
        if (viewStack.length > 0) {
            const newStack = [...viewStack];
            const lastView = newStack.pop()!;
            setViewStack(newStack);
            setPreviousView(newStack.length > 0 ? newStack[newStack.length - 1] : null);
            setChatbotView(lastView);
        } else if (fallbackProvider) {
            fallbackProvider();
        } else {
            // Default home behavior
            setPreviousView(null);
            setViewStack([]);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setChatbotView('dashboard');
            } else {
                setChatbotView('desktop-guide');
            }
        }
    };

    return (
        <ChatbotContext.Provider value={{
            isChatbotOpen,
            setIsChatbotOpen,
            chatbotView,
            setChatbotView,
            previousView,
            setPreviousView,
            viewStack,
            navigateTo,
            goBack,
            recipeToRemix,
            setRecipeToRemix,
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
