import React from 'react';
import Link from 'next/link';
import { Leaf, MessageSquarePlus, Sparkles, ChevronRight, Zap, Settings, Shield, HelpCircle, BookOpen } from 'lucide-react';
import { ChatbotViewType } from '@/lib/context/chatbot-context';

interface ChatbotDesktopGuideProps {
    setChatbotView: (view: ChatbotViewType) => void;
}

export function ChatbotDesktopGuide({ setChatbotView }: ChatbotDesktopGuideProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-900/50">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
                    <Leaf size={28} className="text-white" />
                </div>
                <div>
                    <h2 className="text-base font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-tight">
                        Miracle Greens
                    </h2>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500/80 mt-1">
                        Nutritional Intelligence
                    </p>
                </div>
            </div>

            {/* Info Links */}
            <div className="flex items-center justify-center gap-2 mb-6 max-w-sm mx-auto">
                {[
                    { label: 'Privacy', path: '/privacy', icon: Shield },
                    { label: 'Support', path: '/support', icon: HelpCircle },
                    { label: 'Terms', path: '/terms', icon: BookOpen },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <Icon size={12} />
                            {item.label}
                        </Link>
                    );
                })}
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
