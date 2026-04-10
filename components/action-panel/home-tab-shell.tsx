'use client';

import React from 'react';
import { MessageSquare, Settings, Globe, LogIn, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionPanelView } from '@/lib/context/action-panel-context';

interface HomeTabShellProps {
    isAdmin: boolean;
    isLoggedIn: boolean;
    activeTab: 'browse' | 'chat' | 'settings' | 'login';
    onTabChange: (tab: 'browse' | 'chat' | 'settings' | 'login') => void;
}

export function HomeTabShell({
    isAdmin,
    isLoggedIn,
    activeTab,
    onTabChange
}: HomeTabShellProps) {
    return (
        <div className="shrink-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center px-4 py-4 md:px-6 md:py-5 min-h-[76px] w-full">
                <div className="flex bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-lg ring-1 ring-white/10 w-full max-w-[500px]">
                    <button
                        onClick={() => onTabChange('browse')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                            activeTab === 'browse'
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
                                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                        )}
                    >
                        <Globe size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Browse</span>
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => onTabChange('chat')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                                activeTab === 'chat'
                                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 active:scale-95"
                                    : "text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                            )}
                        >
                            <MessageSquare size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Coach</span>
                        </button>
                    )}

                    <button
                        onClick={() => onTabChange('settings')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                            activeTab === 'settings'
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
                                : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                        )}
                    >
                        <Settings size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Settings</span>
                    </button>

                    {!isLoggedIn && (
                        <button
                            onClick={() => onTabChange('login')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                                activeTab === 'login'
                                    ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-95"
                                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10"
                            )}
                        >
                            <LogIn size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Login</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
