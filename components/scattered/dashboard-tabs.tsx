'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Library, ChefHat, LayoutGrid,
    Leaf, Package, ShoppingBag,
    Calendar, Beaker, Plus,
    Scale, Activity, Wallet,
    Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface SubTab {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    adminOnly?: boolean;
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
    adminOnly?: boolean;
}

const TAB_CONFIG: TopTab[] = [
    {
        id: 'library',
        label: 'Library',
        icon: Library,
        color: 'text-muted-foreground',
        activeColor: 'text-emerald-400',
        activeBg: 'bg-emerald-500/10 border-emerald-500/30',
        defaultHref: '/foods',
        matchPaths: ['/foods', '/dashboard/library/meals', '/users/admin/widgets'],
        subtabs: [
            { id: 'foods', label: 'Foods', href: '/foods', icon: Leaf },
            { id: 'meals', label: 'Meals', href: '/dashboard/library/meals', icon: ChefHat },
            { id: 'widgets', label: 'Widgets', href: '/users/admin/widgets', icon: LayoutGrid },
        ],
    },
    {
        id: 'mealomatic',
        label: 'Mealomatic',
        icon: Calendar,
        color: 'text-muted-foreground',
        activeColor: 'text-amber-400',
        activeBg: 'bg-amber-500/10 border-amber-500/30',
        defaultHref: '/dashboard/meal-o-matic/planner',
        matchPaths: ['/dashboard/meal-o-matic'],
        subtabs: [
            { id: 'shopping', label: 'Shopping', href: '/dashboard/meal-o-matic/shopping', icon: ShoppingBag },
            { id: 'pantry', label: 'Pantry', href: '/dashboard/meal-o-matic/pantry', icon: Package },
            { id: 'planner', label: 'Planner', href: '/dashboard/meal-o-matic/planner', icon: Calendar },
            { id: 'maker', label: 'Maker', href: '/dashboard/meal-o-matic/maker', icon: Plus, adminOnly: true },
        ],
    },
    {
        id: 'widgets',
        label: 'Widgets',
        icon: LayoutGrid,
        color: 'text-muted-foreground',
        activeColor: 'text-purple-400',
        activeBg: 'bg-purple-500/10 border-purple-500/30',
        defaultHref: '/users/admin/widgets/comparator',
        matchPaths: ['/users/admin/widgets/comparator', '/nutrients', '/users/admin/widgets/lifeguard'],
        adminOnly: true,
        subtabs: [
            { id: 'comparator', label: 'Comparator', href: '/users/admin/widgets/comparator', icon: Scale },
            { id: 'nutridex', label: 'Nutridex', href: '/nutrients', icon: Activity },
            { id: 'lifeguard', label: 'Life Guard', href: '/users/admin/widgets/lifeguard', icon: Wallet },
        ],
    },
];

export function DashboardTabs() {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            } catch { /* not logged in */ }
        };
        checkAdmin();
    }, []);

    // Determine active top tab from pathname using matchPaths
    const activeTopTab = TAB_CONFIG.find((tab) =>
        tab.matchPaths.some(p => pathname.startsWith(p))
    );

    const currentTab = activeTopTab || TAB_CONFIG[0];

    return (
        <div className="w-full animate-in fade-in duration-300">
            {/* Compact Bar with Dividers - Labels Only */}
            <div className="flex items-center justify-center px-2 py-1.5 bg-muted/30 rounded-lg border border-border overflow-x-auto scrollbar-hide">
                {TAB_CONFIG.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = currentTab.id === tab.id;
                    const isDisabled = tab.adminOnly && !isAdmin;
                    
                    if (isDisabled) return null;

                    return (
                        <div key={tab.id} className="flex items-center gap-0 flex-shrink-0">
                            {/* Main Tab - Labels with desktop icons */}
                            <Link
                                href={tab.defaultHref}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded transition-all duration-300 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
                                    isActive
                                        ? cn(tab.activeBg)
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                )}
                            >
                                <Icon
                                    size={14}
                                    className={cn(
                                        'transition-colors duration-300 hidden md:inline flex-shrink-0',
                                        isActive ? tab.activeColor : 'text-muted-foreground/60 group-hover:text-muted-foreground'
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
                                <div className="h-3 w-px bg-border mx-0.5" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sub Tabs - labels only */}
            <div className="flex items-center justify-center gap-1 mt-2 overflow-x-auto scrollbar-hide">
                {currentTab.subtabs.map((sub) => {
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                    const isSubDisabled = sub.adminOnly && !isAdmin;

                    if (isSubDisabled) return null;

                    return (
                        <Link
                            key={sub.id}
                            href={sub.href}
                            className={cn(
                                'group flex items-center px-2.5 py-1 rounded transition-all duration-300 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap flex-shrink-0',
                                isSubActive
                                    ? cn(currentTab.activeBg, 'shadow-sm')
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                            )}
                        >
                            <span>{sub.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
