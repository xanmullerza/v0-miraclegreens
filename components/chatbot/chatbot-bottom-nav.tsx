import React from 'react';
import { Home, BookOpen, BarChart3, Settings, MessageCircle } from 'lucide-react';
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
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-4 flex items-center justify-between pointer-events-auto shrink-0 z-50 gap-2">
            <button
                onClick={() => setChatbotView('dashboard')}
                className="p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Home"
            >
                <Home size={20} />
            </button>

            <button
                onClick={() => {
                    onClose();
                    router.push('/recipes');
                }}
                className="p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Cookbook"
            >
                <BookOpen size={20} />
            </button>

            <button
                onClick={() => {
                    onClose();
                    router.push('/tracker');
                }}
                className="p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Tracker"
            >
                <BarChart3 size={20} />
            </button>

            <button
                onClick={() => {
                    onClose();
                    router.push('/profile');
                }}
                className="p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Settings"
            >
                <Settings size={20} />
            </button>

            <button
                onClick={() => setChatbotView('messages')}
                className="p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Coach"
            >
                <MessageCircle size={20} />
            </button>
        </div>
    );
}
