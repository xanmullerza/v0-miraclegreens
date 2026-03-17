'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Smartphone, TabletSmartphone, Monitor as Computer } from 'lucide-react';

type ResizeMode = 'equal' | 'content-focus' | 'content-only';

interface SplitLayoutProps {
    contentArea: ReactNode;
    chatbotArea: ReactNode;
    onResizeModeChange?: (mode: ResizeMode) => void;
}

export function SplitLayout({ contentArea, chatbotArea, onResizeModeChange }: SplitLayoutProps) {
    const [resizeMode, setResizeMode] = useState<ResizeMode>('content-focus');

    const handleToggleResize = () => {
        let nextMode: ResizeMode;
        if (resizeMode === 'content-focus') nextMode = 'equal';
        else if (resizeMode === 'equal') nextMode = 'content-only';
        else nextMode = 'content-focus';

        setResizeMode(nextMode);
        onResizeModeChange?.(nextMode);
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Computer size={18} />;
        if (resizeMode === 'content-focus') return <TabletSmartphone size={18} />;
        if (resizeMode === 'content-only') return <Smartphone size={18} />;
        return <Computer size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'content-focus') return 'Equal split (50/50)';
        if (resizeMode === 'equal') return 'Content only (hide chat)';
        if (resizeMode === 'content-only') return 'Content focus (70/30)';
        return 'Toggle view';
    };

    // Determine widths based on desktop resize mode
    const contentWidthClass =
        resizeMode === 'equal' ? 'lg:w-1/2' :
        resizeMode === 'content-focus' ? 'lg:w-2/3' :
        'lg:w-full';

    const chatWidthClass =
        resizeMode === 'equal' ? 'lg:w-1/2' :
        resizeMode === 'content-focus' ? 'lg:w-1/3' :
        'lg:w-0';

    // Mobile hides chatbot and shows content full-screen;
    // desktop uses split resize mode.
    const contentDisplay = 'block';

    const chatDisplay = resizeMode === 'content-only'
        ? 'hidden'
        : 'hidden lg:flex';

    return (
        <div className="flex h-screen w-full bg-white dark:bg-slate-900">
            {/* Content Area */}
            <div className={cn(
                "flex flex-col transition-all duration-300 ease-in-out overflow-hidden w-full",
                contentWidthClass,
                contentDisplay
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
                "flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative w-full",
                chatWidthClass,
                chatDisplay
            )}>
                {chatbotArea}
                
                {/* Mobile/Tablet Resize Button (legacy 50/50 toggle) */}
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

        </div>
    );
}
