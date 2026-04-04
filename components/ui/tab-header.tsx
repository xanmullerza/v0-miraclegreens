'use client';

import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface TabHeaderProps {
    tabs?: Array<{
        id: string;
        label: string;
        activeColor?: string;
        dropdownOptions?: Array<{
            id: string;
            label: string;
            onClick: () => void;
            icon?: React.ReactNode;
        }>;
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
    return (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4">
            <div className="flex items-center justify-center max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] shadow-2xl overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const hasDropdown = tab.dropdownOptions && tab.dropdownOptions.length > 0;

                    const TabButton = (
                        <button
                            onClick={() => !hasDropdown ? onTabChange?.(tab.id) : (isActive ? undefined : onTabChange?.(tab.id))}
                            className={cn(
                                "flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4 flex items-center justify-center gap-2",
                                isActive
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                            {isActive && hasDropdown && <ChevronDown size={10} className="text-emerald-500/50" />}
                        </button>
                    );

                    if (isActive && hasDropdown) {
                        return (
                            <DropdownMenu key={tab.id}>
                                <DropdownMenuTrigger asChild>
                                    {TabButton}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-48 bg-slate-900 border-slate-800 p-2 rounded-2xl shadow-2xl mt-4">
                                    {tab.dropdownOptions?.map((opt) => (
                                        <DropdownMenuItem
                                            key={opt.id}
                                            onClick={opt.onClick}
                                            className="gap-3 py-2.5 cursor-pointer focus:bg-slate-800 focus:text-white text-slate-300 font-bold tracking-widest uppercase text-[10px] rounded-xl mb-1 last:mb-0"
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
                            className={cn(
                                "flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4 flex items-center justify-center gap-2",
                                isActive
                                    ? "bg-slate-800/80 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}

                {rightButtons?.map((btn, idx) => (
                    <button
                        key={`btn-${idx}`}
                        onClick={btn.onClick}
                        className="flex-1 min-w-[100px] py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all duration-300 whitespace-nowrap px-4 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

