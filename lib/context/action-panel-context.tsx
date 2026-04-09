'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ActionPanelView = 'guide' | 'home' | 'dashboard' | 'desktop-guide' | 'cookbook' | 'plannerMenu' | 'widgetsMenu' | 'profile' | 'messages' | 'comingSoon' | 'recipe-builder' | 'recipe-detail' | 'food-detail' | 'nutrient-detail' | 'recipe-share' | 'recipe-tags' | 'smart-match-picker' | 'ingredient-match' | 'portion-match-picker' | 'shopping' | 'pantry' | 'planner' | 'nutridex' | 'comparator' | 'lifeguard' | 'conversation-history' | 'import' | 'import-options' | 'import-bulk' | 'import-paste-text' | 'import-paste-url' | 'import-upload-photo' | 'import-voice' | 'import-video' | 'help-cookbook' | 'help-planner' | 'help-widgets' | 'export-recipes' | 'recommended-intake' | 'privacy' | 'support' | 'terms' | 'recipe-filters' | 'food-filters' | 'nutrient-filters' | 'auth-prompt';

export interface SmartMatchPickerState {
    initialSearchQuery: string;
    initialResults: any[];
    onSelect: (foodItem: any) => void;
    onSkip: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export interface SmartMatchPortionState {
    ingredients: any[];
    matchedIngredients: Record<string, any>;
    skippedIngredients: Record<string, boolean>;
    stepTwoInputs: Record<string, { multiplier: string; measure: string; isSaving?: boolean }>;
    stepTwoSaved: Record<string, boolean>;
    recipe: any;
    onInputChange: (ingId: string, field: 'multiplier' | 'measure', value: string) => void;
    onSave: (ingId: string) => Promise<void>;
    onBack: () => void;
    onFinalize?: () => Promise<void>;
    onSkipIngredients?: (ingIds: string[]) => void;
}

export interface IngredientMatchState {
    unmatchedIngredients: Array<{ id: string; item: string; base_ingredient: string; amount: string }>;
    onComplete: () => void;
    onMatched: (ingId: string, foodItem: any) => void;
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
    contextFoodId: string | null;
    setContextFoodId: (id: string | null) => void;
    contextNutrientId: string | null;
    setContextNutrientId: (id: string | null) => void;
    smartMatchPicker: SmartMatchPickerState | null;
    setSmartMatchPicker: (state: SmartMatchPickerState | null) => void;
    smartMatchPortion: SmartMatchPortionState | null;
    setSmartMatchPortion: (state: SmartMatchPortionState | null) => void;
    ingredientMatch: IngredientMatchState | null;
    setIngredientMatch: (state: IngredientMatchState | null) => void;
    expandedButton: string | null;
    setExpandedButton: (button: string | null) => void;
}

const ActionPanelContext = createContext<ActionPanelContextType | undefined>(undefined);

export function ActionPanelProvider({ children }: { children: ReactNode }) {
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [activeView, setActiveView] = useState<ActionPanelView>('guide');
    const [previousView, setPreviousView] = useState<ActionPanelView | null>(null);
    const [recipeToRemix, setRecipeToRemix] = useState<any | null>(null);
    const [recipeToShare, setRecipeToShare] = useState<any | null>(null);
    const [viewStack, setViewStack] = useState<ActionPanelView[]>([]);
    const [excludeFlavour, setExcludeFlavour] = useState(true);
    const [excludeSupplements, setExcludeSupplements] = useState(true);
    const [contextRecipeId, setContextRecipeId] = useState<string | null>(null);
    const [contextFoodId, setContextFoodId] = useState<string | null>(null);
    const [contextNutrientId, setContextNutrientId] = useState<string | null>(null);
    const [smartMatchPicker, setSmartMatchPicker] = useState<SmartMatchPickerState | null>(null);
    const [smartMatchPortion, setSmartMatchPortion] = useState<SmartMatchPortionState | null>(null);
    const [ingredientMatch, setIngredientMatch] = useState<IngredientMatchState | null>(null);
    const [expandedButton, setExpandedButton] = useState<string | null>(null);

    const navigateTo = (view: ActionPanelView) => {
        if (view !== activeView) {
            setPreviousView(activeView);
            setViewStack(prev => [...prev, activeView]);
            setActiveView(view);
            // Only force-open the panel when navigating to a real content view,
            // not when resetting to guide (which can trigger re-open during tab switches)
            if (view !== 'guide') {
                setIsActionPanelOpen(true);
            }
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
            // Default guide behavior
            setPreviousView(null);
            setViewStack([]);
            setActiveView('guide');
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
            contextFoodId,
            setContextFoodId,
            contextNutrientId,
            setContextNutrientId,
            smartMatchPicker,
            setSmartMatchPicker,
            smartMatchPortion,
            setSmartMatchPortion,
            ingredientMatch,
            setIngredientMatch,
            expandedButton,
            setExpandedButton,
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
