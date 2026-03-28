import React from 'react';
import { Home, BookOpen, BarChart3, Wand2 } from 'lucide-react';
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
        <div className="md:hidden mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-2 py-4 flex items-center justify-center pointer-events-auto shrink-0 z-50 gap-1">
            <button
                onClick={() => setChatbotView('dashboard')}
                className="flex-1 flex justify-center p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Home"
            >
                <Home size={20} />
            </button>

            <button
                onClick={() => setChatbotView('view-recipes')}
                className="flex-1 flex justify-center p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Cookbook"
            >
                <BookOpen size={20} />
            </button>

            <button
                onClick={() => setChatbotView('shopping')}
                className="flex-1 flex justify-center p-2 rounded-2xl transition-all active:scale-95 group text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Tracker"
            >
                <BarChart3 size={20} />
            </button>

            <button
                onClick={() => setChatbotView('dashboard')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 group",
                    chatbotView === 'dashboard' ? "text-blue-500" : "text-slate-400"
                )}
                title="Assistant Hub"
            >
                <div className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                    chatbotView === 'dashboard' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-transparent"
                )}>
                    <Wand2 size={20} className={cn("transition-transform group-hover:scale-110", chatbotView === 'dashboard' && "animate-pulse")} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest scale-[0.7] origin-top opacity-60">Assistant</span>
            </button>

        </div>
    );
}
