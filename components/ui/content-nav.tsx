'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, ChefHat, Leaf, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRouter } from 'next/navigation';

export function ContentNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { setResizeMode } = useSplitView();
    const { activeMainTab, setActiveMainTab } = useActionPanel();

    const navItems = [
        { id: 'recipes', label: 'Home', icon: Home, color: 'text-emerald-500' },
        { id: 'recipes', label: 'Cookbook', icon: ChefHat, color: 'text-emerald-500' },
        { id: 'foods', label: 'Library', icon: Leaf, color: 'text-emerald-500' },
        { id: 'planner', label: 'Tracker', icon: Calendar, color: 'text-emerald-500' },
    ] as const;

    return (
        <div className="flex w-full items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-2 sm:px-4 py-2 flex-shrink-0 z-30 min-h-[48px]">
            <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar">
                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isHome = item.label === 'Home';
                    const isActive = activeMainTab === item.id;

                    // If it's the specific Home button, only active if we are on recipes
                    if (isHome && activeMainTab !== 'recipes') return null;
                    if (!isHome && item.id === 'recipes' && activeMainTab === 'recipes' && false) {
                        // Just an example condition, we can keep the duplicate.
                    }

                    return (
                        <button
                            key={item.label}
                            onClick={() => {
                                setActiveMainTab(item.id);
                                if (item.label === 'Home') setResizeMode('content-focus');
                                // clear any detail overlays from URL to stay clean at root
                                router.push('/');
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                (isActive && (isHome || item.label !== 'Home')) // Visual hack since we have two recipe buttons
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                                    : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-foreground active:scale-95"
                            )}
                        >
                            <Icon size={14} className={isActive ? item.color : 'opacity-70'} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
