'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { SplitLayout } from '@/components/ux/split-layout';
import { ActionPanelContainer } from '@/components/action-panel/action-panel-container';
import { ActionPanelBottomNav } from '@/components/action-panel/bottom-nav';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';

interface AppLayoutProps {
    children: ReactNode; // The main app content
}

export function AppLayout({ children }: AppLayoutProps) {
    const { isActionPanelOpen, setIsActionPanelOpen, activeView } = useActionPanel();
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(max-width: 1023px)');
        const updateMobile = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(event.matches);
        };

        updateMobile(mediaQuery);
        mediaQuery.addEventListener('change', updateMobile);

        return () => mediaQuery.removeEventListener('change', updateMobile);
    }, []);

    const handleClosePanel = () => {
        setIsActionPanelOpen(false);
    };

    return (
        <>
            <SplitLayout
                contentArea={
                    <div className="flex flex-col h-full w-full">
                        {children}
                    </div>
                }
                chatbotArea={
                    isMobile
                        ? <div className="hidden" />
                        : isActionPanelOpen ? (
                            <ActionPanelContainer
                                onClose={handleClosePanel}
                                isInline={true}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                                Chat is minimized
                            </div>
                        )
                }
                onResizeModeChange={(mode) => {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('app-resize-mode', mode);
                    }
                }}
            />

            {isMobile && (
                <>
                    {/* Floating Chat Button - Only show if panel is closed */}
                    {!isActionPanelOpen && (
                        <button
                            onClick={() => setIsActionPanelOpen(true)}
                            className="fixed bottom-24 right-6 z-50 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all active:scale-95"
                            title="Open Chat"
                            aria-label="Open Chat"
                        >
                            <MessageCircle size={24} />
                        </button>
                    )}

                    {isActionPanelOpen && (
                        <ActionPanelContainer
                            onClose={handleClosePanel}
                            isInline={false}
                        />
                    )}

                    {/* Always show Bottom Nav on mobile for global navigation - Rendered last to be on top */}
                    <ActionPanelBottomNav
                        activeView={activeView}
                        onClose={handleClosePanel}
                    />
                </>
            )}
        </>
    );
}
