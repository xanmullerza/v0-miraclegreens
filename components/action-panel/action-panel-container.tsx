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
        console.log('🔴 [ActionPanelContainer] Close button clicked, activeView:', activeView);
        
        // On guide view, closing the entire panel makes sense
        if (activeView === 'guide') {
            console.log('📕 [ActionPanelContainer] On guide view, closing panel');
            onClose();
        }
        // On recipe-builder, reset builder and go to guide
        else if (activeView === 'recipe-builder') {
            console.log('📘 [ActionPanelContainer] Calling handleCloseRecipeBuilder');
            orchestrator.handleCloseRecipeBuilder();
        }
        // On import, reset importer and go to guide
        else if (activeView === 'import') {
            console.log('📗 [ActionPanelContainer] Calling handleCloseImporter');
            orchestrator.handleCloseImporter();
        }
        // On export-recipes, reset exporter state and go to guide
        else if (activeView === 'export-recipes') {
            console.log('📙 [ActionPanelContainer] Calling handleCloseExporter');
            orchestrator.handleCloseExporter();
        }
        // On ANY other view, navigate to guide instead of closing panel
        else {
            console.log('🟢 [ActionPanelContainer] Other view, navigating to guide instead of closing');
            orchestrator.handleGoHome('guide');
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
