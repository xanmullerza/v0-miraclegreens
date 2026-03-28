import React from 'react';
import { Home, BookOpen, BarChart3, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { useChatbot, ChatbotViewType } from '@/lib/context/chatbot-context';

interface ChatbotBottomNavProps {
    chatbotView: ChatbotViewType;
    onClose: () => void;
}

export function ChatbotBottomNav({
    chatbotView,
    onClose
}: ChatbotBottomNavProps) {
    const { navigateTo } = useChatbot();

    return (
        <div className="md:hidden mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-2 py-4 flex items-center justify-center pointer-events-auto shrink-0 z-50 gap-1">
            {/* Recipes - Left Side */}
            <button
                onClick={() => navigateTo('view-recipes')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
                    chatbotView === 'view-recipes' ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Recipes"
            >
                <BookOpen size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Recipes</span>
            </button>

            {/* Desktop Guide - Center (Assistant) */}
            <button
                onClick={() => navigateTo('desktop-guide')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 group mx-4",
                    chatbotView === 'desktop-guide' ? "text-blue-500" : "text-slate-400"
                )}
                title="Sidebar Assistant"
            >
                <div className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-2xl transition-all",
                    chatbotView === 'desktop-guide' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800"
                )}>
                    <Wand2 size={24} className={cn("transition-transform group-hover:scale-110", chatbotView === 'desktop-guide' && "animate-pulse")} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest scale-[0.7] origin-top opacity-60 mt-1">Assistant</span>
            </button>

            {/* Tracker - Right Side */}
            <button
                onClick={() => navigateTo('shopping')}
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-95 group",
                    chatbotView === 'shopping' ? "text-amber-500 bg-amber-500/5" : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Tracker"
            >
                <BarChart3 size={20} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
            </button>
        </div>
    );
}
