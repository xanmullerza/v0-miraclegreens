'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, ChefHat, Leaf, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';

export function ContentNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setResizeMode } = useSplitView();
    const activeTab = searchParams.get('tab') || 'recipes';

    const navItems = [
        { id: 'recipes', label: 'Home', path: '/', icon: Home, color: 'text-emerald-500' },
        { id: 'recipes', label: 'Cookbook', path: '/?tab=recipes', icon: ChefHat, color: 'text-emerald-500' },
        { id: 'foods', label: 'Library', path: '/?tab=foods', icon: Leaf, color: 'text-emerald-500' },
        { id: 'planner', label: 'Tracker', path: '/?tab=planner', icon: Calendar, color: 'text-emerald-500' },
    ];

    return (
        <div className="flex w-full items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-2 sm:px-4 py-2 flex-shrink-0 z-30 min-h-[48px]">
            <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar">
                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    // Home is active if strictly at root with no tab or recipes tab
                    const isHome = item.label === 'Home';
                    const isActive = isHome 
                        ? (pathname === '/' && (!searchParams.get('tab') || searchParams.get('tab') === 'recipes'))
                        : (searchParams.get('tab') === item.id && pathname === '/');

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => {
                                if (item.label === 'Home') setResizeMode('content-focus');
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                isActive
                                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                                    : "text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:text-foreground active:scale-95"
                            )}
                        >
                            <Icon size={14} className={isActive ? item.color : 'opacity-70'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
