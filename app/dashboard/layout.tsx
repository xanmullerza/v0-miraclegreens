'use client';

import React from 'react';
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
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';

const sidebarItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Items', href: '/dashboard/food', icon: Beef },
    { name: 'Recipe Builder', href: '/dashboard/recipes', icon: Utensils },
    { name: 'Meal Planner', href: '/dashboard/plan', icon: Calendar },
    { name: 'Comparison Tool', href: '/dashboard/compare', icon: Scale },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            <Header />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* Modern Sidebar */}
                <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hidden lg:flex flex-col">
                    <div className="p-6">
                        <div className="flex items-center gap-3 px-2 py-1.5 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <LayoutDashboard size={18} />
                            </div>
                            <span className="font-bold tracking-tight text-lg">Lab Center</span>
                        </div>

                        <nav className="space-y-1">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
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
                        </nav>
                    </div>

                    <div className="mt-auto p-6 space-y-4">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Site
                        </Link>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/10">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Status</p>
                            <p className="text-sm font-medium">System Online</p>
                            <div className="mt-2 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full w-4/5 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#020617] custom-scrollbar">
                    {/* Top Bar for Content */}
                    <div className="sticky top-0 z-20 w-full h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md px-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                                {sidebarItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all"
                                    placeholder="Search your lab data..."
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative">
                                    <Bell size={18} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-slate-50 dark:border-[#020617] rounded-full" />
                                </button>
                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                    <User size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pb-20">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
