'use client';

import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabHeaderProps {
    title: string;
    tabs?: Array<{
        id: string;
        label: string;
        activeColor?: string;
    }>;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    onBack?: () => void;
    rightButtons?: Array<{
        label: string;
        onClick: () => void;
    }>;
}

export function TabHeader({
    title,
    tabs = [],
    activeTab,
    onTabChange,
    onBack,
    rightButtons,
}: TabHeaderProps) {
    return (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4 border-b border-border/50">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Left side: Back button and title */}
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-300">{title}</span>
                    </div>
                </div>

                {/* Right side: Tabs or buttons in styled shell */}
                {tabs.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange?.(tab.id)}
                                className={cn(
                                    "py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-3",
                                    activeTab === tab.id
                                        ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Alternative: Show right buttons in styled shell */}
                {rightButtons && rightButtons.length > 0 && tabs.length === 0 && (
                    <div className="flex items-center gap-2 bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl">
                        {rightButtons.map((button, idx) => (
                            <button
                                key={idx}
                                onClick={button.onClick}
                                className="py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-3 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            >
                                {button.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
