'use client';

import React, { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Columns, PanelRightOpen, X as CloseIcon } from 'lucide-react';

type ResizeMode = 'equal' | 'content-focus' | 'content-only';

interface SplitLayoutProps {
    contentArea: ReactNode;
    chatbotArea: ReactNode;
    onResizeModeChange?: (mode: ResizeMode) => void;
}

export function SplitLayout({ contentArea, chatbotArea, onResizeModeChange }: SplitLayoutProps) {
    const [resizeMode, setResizeMode] = useState<ResizeMode>('equal');

    const handleToggleResize = () => {
        let nextMode: ResizeMode;
        if (resizeMode === 'equal') nextMode = 'content-focus';
        else if (resizeMode === 'content-focus') nextMode = 'content-only';
        else nextMode = 'equal';

        setResizeMode(nextMode);
        onResizeModeChange?.(nextMode);
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Columns size={18} />;
        if (resizeMode === 'content-focus') return <PanelRightOpen size={18} />;
        if (resizeMode === 'content-only') return <CloseIcon size={18} />;
        return <Columns size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'equal') return 'Focus Content (67%)';
        if (resizeMode === 'content-focus') return 'Content Only (Hide Chat)';
        if (resizeMode === 'content-only') return 'Equal Split (50/50)';
        return 'Toggle View';
    };

    // Determine widths based on resize mode
    const contentWidth = 
        resizeMode === 'equal' ? 'w-1/2' :
        resizeMode === 'content-focus' ? 'w-2/3' :
        'w-full';
    
    const chatWidth = 
        resizeMode === 'equal' ? 'w-1/2' :
        resizeMode === 'content-focus' ? 'w-1/3' :
        'w-0';

    return (
        <div className="flex h-screen w-full bg-white dark:bg-slate-900">
            {/* Content Area */}
            <div className={cn(
                "flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
                contentWidth
            )}>
                {contentArea}
            </div>

            {/* Divider with Resize Button */}
            {resizeMode !== 'content-only' && (
                <>
                    <div className="w-px bg-slate-200 dark:bg-slate-800" />
                    <button
                        onClick={handleToggleResize}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center w-10 h-10 rounded-l-lg bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title={getResizeTooltip()}
                    >
                        {getResizeIcon()}
                    </button>
                </>
            )}

            {/* Chat Area */}
            <div className={cn(
                "flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative",
                chatWidth
            )}>
                {chatbotArea}
                
                {/* Mobile/Tablet Resize Button */}
                {resizeMode !== 'content-only' && (
                    <button
                        onClick={handleToggleResize}
                        className="lg:hidden absolute top-4 right-4 z-30 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title={getResizeTooltip()}
                    >
                        {getResizeIcon()}
                    </button>
                )}
            </div>

            {/* Mobile Toggle - Show when content-only mode */}
            {resizeMode === 'content-only' && (
                <button
                    onClick={handleToggleResize}
                    className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all active:scale-95"
                    title="Show Chat"
                >
                    <Columns size={24} />
                </button>
            )}
        </div>
    );
}
