'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ActionPanelView = 'dashboard' | 'desktop-guide' | 'cookbook' | 'plannerMenu' | 'widgetsMenu' | 'profile' | 'messages' | 'comingSoon' | 'recipe-builder' | 'view-recipes' | 'recipe-detail' | 'recipe-share' | 'recipe-tags' | 'smart-match-picker' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history' | 'import' | 'import-options' | 'import-bulk' | 'import-paste-text' | 'import-paste-url' | 'import-upload-photo' | 'import-voice' | 'import-video' | 'help-cookbook' | 'help-planner' | 'help-widgets' | 'export-recipes' | 'recommended-intake' | 'privacy' | 'support' | 'terms' | 'recipe-filters' | 'food-filters' | 'nutrient-filters';

export interface SmartMatchPickerState {
    initialSearchQuery: string;
    initialResults: any[];
    onSelect: (foodItem: any) => void;
    onSkip: () => void;
    onDelete: () => void;
    onClose: () => void;
}

interface ActionPanelContextType {
    isActionPanelOpen: boolean;
    setIsActionPanelOpen: (open: boolean) => void;
    activeView: ActionPanelView;
    setActiveView: (view: ActionPanelView) => void;
    previousView: ActionPanelView | null;
    setPreviousView: (view: ActionPanelView | null) => void;
    viewStack: ActionPanelView[];
    navigateTo: (view: ActionPanelView) => void;
    goBack: (fallbackProvider?: () => void) => void;
    recipeToRemix: any | null;
    setRecipeToRemix: (recipe: any | null) => void;
    recipeToShare: any | null;
    setRecipeToShare: (recipe: any | null) => void;
    excludeFlavour: boolean;
    setExcludeFlavour: (value: boolean) => void;
    excludeSupplements: boolean;
    setExcludeSupplements: (value: boolean) => void;
    contextRecipeId: string | null;
    setContextRecipeId: (id: string | null) => void;
    smartMatchPicker: SmartMatchPickerState | null;
    setSmartMatchPicker: (state: SmartMatchPickerState | null) => void;
}

const ActionPanelContext = createContext<ActionPanelContextType | undefined>(undefined);

export function ActionPanelProvider({ children }: { children: ReactNode }) {
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [activeView, setActiveView] = useState<ActionPanelView>('desktop-guide');
    const [previousView, setPreviousView] = useState<ActionPanelView | null>(null);
    const [recipeToRemix, setRecipeToRemix] = useState<any | null>(null);
    const [recipeToShare, setRecipeToShare] = useState<any | null>(null);
    const [viewStack, setViewStack] = useState<ActionPanelView[]>([]);
    const [excludeFlavour, setExcludeFlavour] = useState(true);
    const [excludeSupplements, setExcludeSupplements] = useState(true);
    const [contextRecipeId, setContextRecipeId] = useState<string | null>(null);
    const [smartMatchPicker, setSmartMatchPicker] = useState<SmartMatchPickerState | null>(null);

    // Initialize correct default view based on screen size across all routes
    React.useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setActiveView('dashboard');
        }
    }, []);

    const navigateTo = (view: ActionPanelView) => {
        if (view !== activeView) {
            setPreviousView(activeView);
            setViewStack(prev => [...prev, activeView]);
            setActiveView(view);
            setIsActionPanelOpen(true);
        }
    };

    const goBack = (fallbackProvider?: () => void) => {
        if (viewStack.length > 0) {
            const newStack = [...viewStack];
            const lastView = newStack.pop()!;
            setViewStack(newStack);
            setPreviousView(newStack.length > 0 ? newStack[newStack.length - 1] : null);
            setActiveView(lastView);
        } else if (fallbackProvider) {
            fallbackProvider();
        } else {
            // Default home behavior
            setPreviousView(null);
            setViewStack([]);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setActiveView('dashboard');
            } else {
                setActiveView('desktop-guide');
            }
        }
    };

    return (
        <ActionPanelContext.Provider value={{
            isActionPanelOpen,
            setIsActionPanelOpen,
            activeView,
            setActiveView,
            previousView,
            setPreviousView,
            viewStack,
            navigateTo,
            goBack,
            recipeToRemix,
            setRecipeToRemix,
            recipeToShare,
            setRecipeToShare,
            excludeFlavour,
            setExcludeFlavour,
            excludeSupplements,
            setExcludeSupplements,
            contextRecipeId,
            setContextRecipeId,
            smartMatchPicker,
            setSmartMatchPicker,
        }}>
            {children}
        </ActionPanelContext.Provider>
    );
}

export function useActionPanel() {
    const context = useContext(ActionPanelContext);
    if (context === undefined) {
        throw new Error('useActionPanel must be used within a ActionPanelProvider');
    }
    return context;
}
