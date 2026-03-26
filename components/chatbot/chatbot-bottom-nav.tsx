import React from 'react';
import { Home, Grid2x2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { ChatbotViewType } from '@/lib/context/chatbot-context';

interface ChatbotBottomNavProps {
    chatbotView: ChatbotViewType;
    setChatbotView: (view: ChatbotViewType) => void;
    onClose: () => void;
}

export function ChatbotBottomNav({
    chatbotView,
    setChatbotView,
    onClose
}: ChatbotBottomNavProps) {
    const router = useRouter();

    return (
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between pointer-events-auto shrink-0 z-50">
            {/* Home Button - Navigates to homepage and closes chatbot */}
            <button
                onClick={() => {
                    onClose();
                    router.push('/about-us');
                }}
                className={cn(
                    "p-3 rounded-2xl transition-all active:scale-95 group",
                    "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Home"
            >
                <Home size={24} />
            </button>
            
            <button
                onClick={() => setChatbotView('dashboard')}
                className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all active:scale-95 group",
                    chatbotView === 'dashboard'
                        ? "bg-emerald-500 text-white shadow-emerald-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 shadow-xl shadow-black/5"
                )}
                title="Grid"
            >
                <Grid2x2 size={24} className="group-hover:scale-110 transition-transform" />
            </button>

            <button
                onClick={() => setChatbotView('messages')}
                className={cn(
                    "p-3 rounded-2xl transition-all active:scale-90 group",
                    chatbotView === 'messages'
                        ? "text-emerald-500 bg-slate-100 dark:bg-slate-800"
                        : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Open Chat"
            >
                <MessageCircle size={24} />
            </button>
        </div>
    );
}
