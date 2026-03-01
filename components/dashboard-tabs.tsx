'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Library, ChefHat, LayoutGrid,
    Leaf, Package, ShoppingCart,
    Calendar, Beaker,
    Scale, Activity, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubTab {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface TopTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    activeColor: string;
    activeBg: string;
    defaultHref: string;
    subtabs: SubTab[];
    matchPaths: string[];
}

const TAB_CONFIG: TopTab[] = [
    {
        id: 'library',
        label: 'Library',
        icon: Library,
        color: 'text-slate-400',
        activeColor: 'text-emerald-400',
        activeBg: 'bg-emerald-500/10 border-emerald-500/30',
        defaultHref: '/dashboard/ingredients/foods',
        matchPaths: ['/dashboard/ingredients/foods', '/dashboard/recipes/meals', '/dashboard/recipes/mixes'],
        subtabs: [
            { id: 'foods', label: 'Foods', href: '/dashboard/ingredients/foods', icon: Leaf },
            { id: 'meals', label: 'Meals', href: '/dashboard/recipes/meals', icon: ChefHat },
            { id: 'mixes', label: 'Mixes', href: '/dashboard/recipes/mixes', icon: Beaker },
        ],
    },
    {
        id: 'mealomatic',
        label: 'Mealomatic',
        icon: Calendar,
        color: 'text-slate-400',
        activeColor: 'text-amber-400',
        activeBg: 'bg-amber-500/10 border-amber-500/30',
        defaultHref: '/dashboard/recipes/planner',
        matchPaths: ['/dashboard/recipes/planner', '/dashboard/ingredients/pantry', '/dashboard/ingredients/groceries'],
        subtabs: [
            { id: 'planner', label: 'Planner', href: '/dashboard/recipes/planner', icon: Calendar },
            { id: 'pantry', label: 'Pantry', href: '/dashboard/ingredients/pantry', icon: Package },
            { id: 'groceries', label: 'Groceries', href: '/dashboard/ingredients/groceries', icon: ShoppingCart },
        ],
    },
    {
        id: 'widgets',
        label: 'Widgets',
        icon: LayoutGrid,
        color: 'text-slate-400',
        activeColor: 'text-purple-400',
        activeBg: 'bg-purple-500/10 border-purple-500/30',
        defaultHref: '/dashboard/widgets/comparator',
        matchPaths: ['/dashboard/widgets'],
        subtabs: [
            { id: 'comparator', label: 'Comparator', href: '/dashboard/widgets/comparator', icon: Scale },
            { id: 'nutridex', label: 'Nutridex', href: '/dashboard/widgets/nutridex', icon: Activity },
            { id: 'lifeguard', label: 'Life Guard', href: '/dashboard/widgets/lifeguard', icon: Wallet },
        ],
    },
];

export function DashboardTabs() {
    const pathname = usePathname();

    // Determine active top tab from pathname using matchPaths
    const activeTopTab = TAB_CONFIG.find((tab) =>
        tab.matchPaths.some(p => pathname.startsWith(p))
    );

    // If we're on a detail page (more than 3 segments after /dashboard/section/subsection),
    // don't render tabs to keep detail pages clean
    const segments = pathname.replace('/dashboard/', '').split('/').filter(Boolean);
    if (segments.length > 2) return null;

    const currentTab = activeTopTab || TAB_CONFIG[0];

    return (
        <div className="w-full animate-in fade-in duration-300">
            {/* Compact Bar with Dividers - Labels Only */}
            <div className="flex items-center justify-center px-2 py-1.5 bg-slate-900/30 rounded-lg border border-slate-800/50 overflow-x-auto scrollbar-hide">
                {TAB_CONFIG.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = currentTab.id === tab.id;
                    
                    return (
                        <div key={tab.id} className="flex items-center gap-0 flex-shrink-0">
                            {/* Main Tab - Labels with desktop icons */}
                            <Link
                                href={tab.defaultHref}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded transition-all duration-300 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
                                    isActive
                                        ? cn(tab.activeBg)
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                )}
                            >
                                <Icon
                                    size={14}
                                    className={cn(
                                        'transition-colors duration-300 hidden md:inline flex-shrink-0',
                                        isActive ? tab.activeColor : 'text-slate-600 group-hover:text-slate-400'
                                    )}
                                />
                                <span className={cn(
                                    'transition-colors duration-300',
                                    isActive ? tab.activeColor : ''
                                )}>
                                    {tab.label}
                                </span>
                            </Link>

                            {/* Divider - except after last item */}
                            {idx < TAB_CONFIG.length - 1 && (
                                <div className="h-3 w-px bg-slate-700/50 mx-0.5" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sub Tabs - appear below main bar with icons and labels */}
            <div className="flex items-center justify-center gap-1 mt-2 overflow-x-auto scrollbar-hide">
                {currentTab.subtabs.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                    return (
                        <Link
                            key={sub.id}
                            href={sub.href}
                            className={cn(
                                'group flex items-center gap-1 px-2.5 py-1 rounded transition-all duration-300 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap flex-shrink-0',
                                isSubActive
                                    ? cn(currentTab.activeBg, 'shadow-sm')
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
                            )}
                        >
                            <SubIcon
                                size={12}
                                className={cn(
                                    'transition-all duration-300 flex-shrink-0',
                                    isSubActive ? currentTab.activeColor : 'text-slate-600 group-hover:text-slate-400'
                                )}
                            />
                            <span>{sub.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
