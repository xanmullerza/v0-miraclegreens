'use client';

import { cn } from '@/lib/utils';

interface TabHeaderProps {
    tabs?: Array<{
        id: string;
        label: string;
        activeColor?: string;
    }>;
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    rightButtons?: Array<{
        label: string;
        onClick: () => void;
    }>;
}

export function TabHeader({
    tabs = [],
    activeTab,
    onTabChange,
    rightButtons,
}: TabHeaderProps) {
    // Combine tabs and buttons for display
    const displayItems = [
        ...tabs.map(tab => ({
            type: 'tab' as const,
            id: tab.id,
            label: tab.label,
            onClick: () => onTabChange?.(tab.id),
            isActive: activeTab === tab.id,
        })),
        ...(rightButtons?.map((btn, idx) => ({
            type: 'button' as const,
            id: `btn-${idx}`,
            label: btn.label,
            onClick: btn.onClick,
            isActive: false,
        })) || []),
    ];

    return (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4">

            <div className="flex items-center justify-center max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] shadow-2xl overflow-x-auto no-scrollbar">

                {displayItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                            "flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4",
                            item.isActive
                                ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"

                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
