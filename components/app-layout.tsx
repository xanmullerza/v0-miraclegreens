'use client';

import React, { useState, ReactNode } from 'react';
import { SplitLayout } from '@/components/split-layout';
import { ChatbotModal } from '@/components/chatbot-modal';
import { useRouter } from 'next/navigation';

interface AppLayoutProps {
    children: ReactNode; // The main app content
}

export function AppLayout({ children }: AppLayoutProps) {
    const [isChatbotVisible, setIsChatbotVisible] = useState(true);
    const router = useRouter();

    return (
        <SplitLayout
            contentArea={
                <div className="flex flex-col h-full w-full">
                    {children}
                </div>
            }
            chatbotArea={
                isChatbotVisible ? (
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
                // Optionally persist resize mode to localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('app-resize-mode', mode);
                }
            }}
        />
    );
}
