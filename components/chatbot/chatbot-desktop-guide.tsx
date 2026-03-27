import React from 'react';
import { Bot, MessageSquarePlus, Sparkles, BookOpen, ChevronRight, Zap, Settings } from 'lucide-react';
import { ChatbotViewType } from '@/lib/context/chatbot-context';

interface ChatbotDesktopGuideProps {
    setChatbotView: (view: ChatbotViewType) => void;
}

export function ChatbotDesktopGuide({ setChatbotView }: ChatbotDesktopGuideProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-900/50">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 shadow-sm border border-emerald-500/20">
                    <Bot size={32} className="text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Vitala Assistant
                    </h2>
                    <p className="text-sm text-slate-500 font-medium max-w-[250px] mx-auto mt-2 leading-relaxed">
                        I'm your nutritional guide. Use this panel to ask questions or access quick tools.
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Zap size={14} className="text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Actions</h3>
                </div>

                <button
                    onClick={() => setChatbotView('messages')}
                    className="w-full flex items-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mr-4 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                        <MessageSquarePlus size={20} className="text-cyan-600 dark:text-cyan-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ask Coach</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Start a new chat</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                    onClick={() => setChatbotView('recipe-builder')}
                    className="w-full flex items-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recipe Builder</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Create a meal</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                    onClick={() => setChatbotView('view-recipes')}
                    className="w-full flex items-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">View Library</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Browse your recipes</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                    onClick={() => setChatbotView('profile')}
                    className="w-full flex items-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-500/50 hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center mr-4 group-hover:bg-slate-500 group-hover:text-white transition-all">
                        <Settings size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Settings</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Customize preferences</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                </button>
            </div>
            
            <div className="mt-12 text-center px-4">
                <p className="text-xs text-slate-400 font-medium">
                    You can quickly toggle this panel at any time by pressing <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-500">⌘/</kbd>
                </p>
            </div>
        </div>
    );
}
