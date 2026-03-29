'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { SplitLayout } from '@/components/scattered/split-layout';
import { ChatbotModal } from '@/components/chatbot/chatbot-modal';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode; // The main app content
}

export function AppLayout({ children }: AppLayoutProps) {
    const [isChatbotVisible, setIsChatbotVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const router = useRouter();

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
                        : isChatbotVisible ? (
                            <ChatbotModal
                                onClose={() => setIsChatbotVisible(false)}
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
                <button
                    onClick={() => setIsMobileChatOpen(true)}
                    className="fixed bottom-6 right-6 z-50 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-all active:scale-95"
                    title="Open Chat"
                    aria-label="Open Chat"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {isMobile && isMobileChatOpen && (
                <ChatbotModal
                    onClose={() => setIsMobileChatOpen(false)}
                    isInline={false}
                />
            )}
        </>
    );
}
