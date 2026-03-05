'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavigationTab<T extends string> {
    id: T;
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    color: string;
    bg: string;
}

interface NavigationPillboxProps<T extends string> {
    tabs: NavigationTab<T>[];
    activeTab: T;
    onTabChange: (tab: T) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sectionLabel?: string;
    sectionColor?: string;
    showHomeButton?: boolean;
    isAdmin?: boolean;
    adminOnlyTabs?: T[];
}

export function NavigationPillbox<T extends string>({
    tabs,
    activeTab,
    onTabChange,
    searchQuery,
    setSearchQuery,
    sectionLabel,
    sectionColor = 'text-emerald-500',
    showHomeButton = true,
    isAdmin = false,
    adminOnlyTabs = []
}: NavigationPillboxProps<T>) {
    const router = useRouter();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Close search on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSearchExpanded(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="space-y-3 w-full">
            {sectionLabel && (
                <p className={cn("text-[9px] font-black uppercase tracking-widest px-4 md:px-0", sectionColor)}>
                    {sectionLabel}
                </p>
            )}
            <div className={cn(
                "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0 transition-all duration-500",
                isSearchExpanded ? "ring-2 ring-emerald-500/20" : ""
            )}>
                {/* Left side - Home Button area */}
                <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0 opacity-0" : "w-12 opacity-100")}>
                    {showHomeButton && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                </div>

                {/* Center - Tabs area */}
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500", isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")}>
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1 px-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            const isDisabled = !isAdmin && adminOnlyTabs.includes(tab.id);

                            if (isDisabled) return null;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-500 whitespace-nowrap group flex-shrink-0 px-4 md:px-5",
                                        isActive
                                            ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    <Icon size={15} className={cn(
                                        "transition-transform duration-500 group-hover:scale-110",
                                        isActive ? tab.color : "text-slate-400"
                                    )} />
                                    <span className="hidden md:block">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right side - Search area */}
                <div className={cn(
                    "flex items-center justify-end transition-all duration-500",
                    isSearchExpanded ? "flex-1 pl-2" : "w-12"
                )}>
                    <div className={cn(
                        "flex items-center transition-all duration-500 overflow-hidden",
                        isSearchExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                    )}>
                        <input
                            type="text"
                            autoFocus
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-12 rounded-[1.5rem] px-6 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (isSearchExpanded) setSearchQuery('');
                            setIsSearchExpanded(!isSearchExpanded);
                        }}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all flex-shrink-0",
                            isSearchExpanded
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                        )}
                        title="Search"
                    >
                        {isSearchExpanded ? <X size={18} /> : <Search size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
