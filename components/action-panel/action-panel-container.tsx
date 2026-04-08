'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useActionPanelOrchestrator } from '@/hooks/use-action-panel-orchestrator';
import { ActionPanelRouter } from './action-panel-router';
import { ActionPanelBottomNav } from './bottom-nav';
import { ParsedRecipe } from '@/types/recipe';
import { useActionPanel } from '@/lib/context/action-panel-context';

interface ActionPanelContainerProps {
    onClose: () => void;
    onRecipeDetected?: (recipe: ParsedRecipe) => void;
    isInline?: boolean;
}

export function ActionPanelContainer({ onClose, onRecipeDetected, isInline = false }: ActionPanelContainerProps) {
    const orchestrator = useActionPanelOrchestrator({ onClose, onRecipeDetected });
    const { activeView } = useActionPanel();

    // Determine the appropriate close handler based on current view
    const handleContextualClose = () => {
        if (activeView === 'recipe-builder') {
            orchestrator.handleCloseRecipeBuilder();
        } else if (activeView === 'import') {
            orchestrator.handleCloseImporter();
        } else {
            // Fallback for other views
            onClose();
        }
    };

    return (
        <div className={cn(
            "z-50",
            isInline 
                ? "relative w-full h-full flex flex-col" 
                : "fixed inset-0 flex pointer-events-none"
        )}>
            {!isInline && (
                <div
                    onClick={orchestrator.handleCloseModal}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden pointer-events-auto"
                />
            )}
            
            <div className={cn(
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col pointer-events-auto overflow-hidden",
                isInline 
                    ? "relative w-full h-full flex-1" 
                    : "absolute inset-y-0 right-0 w-full md:w-1/3 border-l shadow-2xl"
            )}>
                <ActionPanelRouter orchestrator={orchestrator} isInline={isInline} />
                <ActionPanelBottomNav
                    activeView={activeView}
                    onClose={handleContextualClose}
                />
            </div>
        </div>
    );
}
