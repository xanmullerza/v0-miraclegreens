'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Beef,
    Utensils,
    Scale,
    Settings,
    ChevronRight,
    Search,
    Bell,
    User,
    ArrowLeft,
    Calendar,
    Heart,
    Library,
    ChevronDown,
    Table,
    Loader2,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { SearchProvider, useSearch } from '@/lib/context/search-context';

const sidebarGroups = [
    {
        id: 'overview',
        title: null,
        items: [
            { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        id: 'foods',
        title: 'Foods',
        items: [
            { name: 'My Foods', href: '/dashboard/my-foods', icon: Heart },
            { name: 'Browse Foods', href: '/dashboard/browse', icon: Library },
            { name: 'Compare Foods', href: '/dashboard/compare', icon: Scale },
            { name: 'Add New Foods', href: '/dashboard/food', icon: Plus },
        ]
    },
    {
        id: 'meals',
        title: 'Meals',
        items: [
            { name: 'Browse Meals', href: '/dashboard/meals', icon: Library },
            { name: 'Plan Meals', href: '/dashboard/plan', icon: Calendar },
            { name: 'Add New Recipes', href: '/dashboard/recipes', icon: Plus },
        ]
    },
    {
        id: 'admin',
        title: 'Admin',
        items: [
            { name: 'Categorization', href: '/dashboard/manage-foods', icon: Table },


        ]
    },
    {
        id: 'settings',
        title: 'Settings',
        items: [
            { name: 'Profile', href: '/dashboard/profile', icon: User },
        ]
    }
];

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [expandedGroup, setExpandedGroup] = useState<string | null>('overview');
    const { profile } = useUserPreferences();
    const { searchQuery, setSearchQuery, results, isLoading, isFocused, setIsFocused, onResultClickRef, searchInputRef, keepFocusAfterSelect } = useSearch();

    // Auto-expand the group that contains the active link
    useEffect(() => {
        const activeGroup = sidebarGroups.find(group =>
            group.items.some(item => item.href === pathname)
        );
        if (activeGroup) {
            setExpandedGroup(activeGroup.id);
        }
    }, [pathname]);

    // Reset search when changing pages
    useEffect(() => {
        setSearchQuery('');
    }, [pathname, setSearchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            <Header />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Modern Sidebar */}
                <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hidden lg:flex flex-col">
                    <div className="p-6">

                        <nav className="space-y-4">
                            {sidebarGroups.map((group) => {
                                const isExpanded = group.title === null || expandedGroup === group.id;
                                const hasActiveItem = group.items.some(item => item.href === pathname);

                                return (
                                    <div key={group.id} className="space-y-2">
                                        {group.title && (
                                            <button
                                                onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                                                className="w-full flex items-center justify-between px-4 py-1 group/header"
                                            >
                                                <h3 className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                                                    isExpanded || hasActiveItem ? "text-emerald-500" : "text-slate-400/80 group-hover/header:text-slate-600 dark:group-hover/header:text-slate-200"
                                                )}>
                                                    {group.title}
                                                </h3>
                                                {isExpanded ? (
                                                    <ChevronDown size={12} className="text-slate-400" />
                                                ) : (
                                                    <ChevronRight size={12} className="text-slate-400" />
                                                )}
                                            </button>
                                        )}

                                        <div className={cn(
                                            "space-y-1 transition-all duration-300 ease-in-out overflow-hidden",
                                            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                        )}>
                                            {group.items.map((item) => {
                                                const isActive = pathname === item.href;
                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setExpandedGroup(group.id)}
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                                            isActive
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <item.icon size={18} className={cn(
                                                                "transition-colors",
                                                                isActive ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                                                            )} />
                                                            {item.name}
                                                        </div>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>

                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#020617] custom-scrollbar">
                    {/* Top Bar for Content */}
                    <div className="sticky top-0 z-20 w-full h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                                {sidebarGroups.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block z-50">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    ref={searchInputRef}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-80 transition-all font-medium"
                                    placeholder={`Search in ${sidebarGroups.flatMap(g => g.items).find(i => i.href === pathname)?.name || 'Dashboard'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                />

                                {/* Universal Global Results Dropdown */}
                                {isFocused && (searchQuery.trim() !== '' || isLoading) && (
                                    <>
                                        {/* Backdrop overlay within the same stacking context */}
                                        <div
                                            className="fixed inset-0 z-0 bg-transparent"
                                            onMouseDown={() => setIsFocused(false)}
                                        />

                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 w-[400px] z-10 transition-all">
                                            {isLoading ? (
                                                <div className="p-12 text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                                                    <p className="mt-4 text-xs text-slate-500 font-black uppercase tracking-widest">Searching...</p>
                                                </div>
                                            ) : results.length === 0 ? (
                                                <div className="p-8 text-center text-slate-500">
                                                    <p className="font-bold text-sm">No results found for "{searchQuery}"</p>
                                                </div>
                                            ) : (
                                                <div className="max-h-[min(500px,calc(100vh-140px))] overflow-y-auto custom-scrollbar overscroll-contain">
                                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 px-3">Top Matches</p>
                                                    </div>
                                                    {results.map((result) => (
                                                        <button
                                                            key={result.id}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent blur before click
                                                                if (onResultClickRef.current) {
                                                                    onResultClickRef.current(result);
                                                                }
                                                                // Clear the query but check if we should keep focus
                                                                setSearchQuery('');
                                                                if (keepFocusAfterSelect) {
                                                                    // Keep focus for pages that need to select multiple items (like Compare)
                                                                    // Use setTimeout to ensure the query is cleared first
                                                                    setTimeout(() => {
                                                                        searchInputRef.current?.focus();
                                                                    }, 0);
                                                                } else {
                                                                    setIsFocused(false);
                                                                }
                                                            }}
                                                            className="w-full text-left p-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex justify-between items-center group border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                        >
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                <div className="font-bold text-slate-900 dark:text-white capitalize group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm">
                                                                    {result.title}
                                                                </div>
                                                                {result.subtitle && (
                                                                    <div className="text-[10px] text-slate-500 italic mt-0.5">{result.subtitle}</div>
                                                                )}
                                                                {result.badges && (
                                                                    <div className="flex gap-2 mt-2">
                                                                        {result.badges.map(badge => (
                                                                            <span key={badge} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">
                                                                                {badge}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative">
                                    <Bell size={18} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-slate-50 dark:border-[#020617] rounded-full" />
                                </button>
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold leading-none">{profile.nickname || profile.name || 'Guest Researcher'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Lab Access</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pb-20">
                        {children}
                    </div>
                </main>
            </div>


            {/* Removed the old fixed-overlay that was in the wrong stacking context */}
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SearchProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SearchProvider>
    );
}
