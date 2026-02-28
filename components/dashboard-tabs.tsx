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
}

const TAB_CONFIG: TopTab[] = [
    {
        id: 'ingredients',
        label: 'Ingredients',
        icon: Library,
        color: 'text-slate-400',
        activeColor: 'text-emerald-400',
        activeBg: 'bg-emerald-500/10 border-emerald-500/30',
        defaultHref: '/dashboard/ingredients/foods',
        subtabs: [
            { id: 'foods', label: 'Foods', href: '/dashboard/ingredients/foods', icon: Leaf },
            { id: 'pantry', label: 'Pantry', href: '/dashboard/ingredients/pantry', icon: Package },
            { id: 'groceries', label: 'Groceries', href: '/dashboard/ingredients/groceries', icon: ShoppingCart },
        ],
    },
    {
        id: 'recipes',
        label: 'Recipes',
        icon: ChefHat,
        color: 'text-slate-400',
        activeColor: 'text-amber-400',
        activeBg: 'bg-amber-500/10 border-amber-500/30',
        defaultHref: '/dashboard/recipes/meals',
        subtabs: [
            { id: 'meals', label: 'Meals', href: '/dashboard/recipes/meals', icon: ChefHat },
            { id: 'mixes', label: 'Mixes', href: '/dashboard/recipes/mixes', icon: Beaker },
            { id: 'meal-o-matic', label: 'Mealomatic', href: '/dashboard/recipes/meal-o-matic', icon: Calendar },
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
        subtabs: [
            { id: 'comparator', label: 'Comparator', href: '/dashboard/widgets/comparator', icon: Scale },
            { id: 'nutridex', label: 'Nutridex', href: '/dashboard/widgets/nutridex', icon: Activity },
            { id: 'lifeguard', label: 'Life Guard', href: '/dashboard/widgets/lifeguard', icon: Wallet },
        ],
    },
];

export function DashboardTabs() {
    const pathname = usePathname();

    // Determine active top tab from pathname
    const activeTopTab = TAB_CONFIG.find((tab) =>
        pathname.startsWith(`/dashboard/${tab.id}`)
    );

    // If we're on a detail page (more than 3 segments after /dashboard/section/subsection),
    // don't render tabs to keep detail pages clean
    const segments = pathname.replace('/dashboard/', '').split('/').filter(Boolean);
    if (segments.length > 2) return null;

    const currentTab = activeTopTab || TAB_CONFIG[0];

    return (
        <div className="w-full animate-in fade-in duration-300">
            {/* Top Tabs */}
            <div className="flex items-center justify-center gap-1 mb-3">
                {TAB_CONFIG.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab.id === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.defaultHref}
                            className={cn(
                                'group flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-300 text-sm font-black uppercase tracking-wider',
                                isActive
                                    ? cn(tab.activeBg, 'shadow-lg')
                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                            )}
                        >
                            <Icon
                                size={16}
                                className={cn(
                                    'transition-colors duration-300',
                                    isActive ? tab.activeColor : 'text-slate-500 group-hover:text-slate-400'
                                )}
                            />
                            <span className={cn(
                                'transition-colors duration-300',
                                isActive ? tab.activeColor : ''
                            )}>
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center justify-center gap-1">
                {currentTab.subtabs.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                    return (
                        <Link
                            key={sub.id}
                            href={sub.href}
                            className={cn(
                                'group flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 text-xs font-bold uppercase tracking-widest',
                                isSubActive
                                    ? cn(currentTab.activeBg, 'shadow-sm')
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
                            )}
                        >
                            <SubIcon
                                size={13}
                                className={cn(
                                    'transition-all duration-300',
                                    isSubActive ? currentTab.activeColor : 'text-slate-600 group-hover:text-slate-400'
                                )}
                            />
                            {sub.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
