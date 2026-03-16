'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Columns, PanelRightOpen, X as CloseIcon, MessageCircle } from 'lucide-react';

type ResizeMode = 'equal' | 'content-focus' | 'content-only';

interface SplitLayoutProps {
    contentArea: ReactNode;
    chatbotArea: ReactNode;
    onResizeModeChange?: (mode: ResizeMode) => void;
}

export function SplitLayout({ contentArea, chatbotArea, onResizeModeChange }: SplitLayoutProps) {
    const [resizeMode, setResizeMode] = useState<ResizeMode>('equal');
    const [mobileView, setMobileView] = useState<'content' | 'chat'>('content');

    // Keep mobile split view logic separate from desktop resize modes
    const handleToggleResize = () => {
        let nextMode: ResizeMode;
        if (resizeMode === 'equal') nextMode = 'content-focus';
        else if (resizeMode === 'content-focus') nextMode = 'content-only';
        else nextMode = 'equal';

        setResizeMode(nextMode);
        onResizeModeChange?.(nextMode);
    };

    const handleToggleMobileView = () => {
        setMobileView(prev => (prev === 'content' ? 'chat' : 'content'));
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Columns size={18} />;
        if (resizeMode === 'content-focus') return <PanelRightOpen size={18} />;
        if (resizeMode === 'content-only') return <CloseIcon size={18} />;
        return <Columns size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'equal') return 'Equal split (50/50)';
        if (resizeMode === 'content-focus') return 'Content focus (70/30)';
        if (resizeMode === 'content-only') return 'Content only (hide chat)';
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

    // Mobile display should show exactly one panel at a time
    const contentDisplay = mobileView === 'content' ? 'block lg:flex' : 'hidden lg:flex';

    const chatDisplay = mobileView === 'chat'
        ? `block ${resizeMode === 'content-only' ? 'lg:hidden' : 'lg:flex'}`
        : `hidden ${resizeMode === 'content-only' ? 'lg:hidden' : 'lg:flex'}`;

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

            {/* Mobile view toggle for one-panel UI */}
            <button
                onClick={handleToggleMobileView}
                className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all active:scale-95"
                title={mobileView === 'content' ? 'Switch to Chat' : 'Switch to Content'}
                aria-label={mobileView === 'content' ? 'Switch to Chat panel' : 'Switch to Content panel'}
            >
                {mobileView === 'content' ? <MessageCircle size={24} /> : <Columns size={24} />}
            </button>
        </div>
    );
}
