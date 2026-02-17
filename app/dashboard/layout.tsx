'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    ChevronRight,
    ChevronLeft,
    User,
    ArrowLeft,
    LogOut,
    Trash2,
    LogIn,
    ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider, useHeaderActions } from '@/lib/context/header-actions-context';
import { SearchProvider } from '@/lib/context/search-context';
import { supabase } from '@/lib/supabase';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



import { Footer } from '@/components/footer';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useUserPreferences();
    const { actions } = useHeaderActions();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            <div className="flex h-screen overflow-hidden">


                {/* Main Content */}
                <main className="dashboard-main flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#020617] custom-scrollbar flex flex-col">
                    {/* Top Bar for Content */}
                    <div className="sticky top-0 z-20 w-full h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md px-8 flex items-center justify-end">
                        <div className="flex items-center gap-6">

                            <div className="flex items-center gap-3">

                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold leading-none">{user?.user_metadata?.full_name || profile.nickname || profile.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {(user?.email || user?.user_metadata?.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase()
                                                ? 'Administrator'
                                                : (user || profile.name || profile.nickname) ? 'Member' : 'Guest'}
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors overflow-hidden">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                </Link>
                                {(user?.email || user?.user_metadata?.email || '').toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase() && (
                                    <Link
                                        href="/admin"
                                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors ml-1 outline-none"
                                        title="Admin Dashboard"
                                    >
                                        <ShieldCheck size={18} />
                                    </Link>
                                )}
                                {user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors ml-1 outline-none"
                                                title="Account Options"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={async () => {
                                                    await supabase.auth.signOut();
                                                    window.location.href = '/';
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Sign Out</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={async () => {
                                                    await supabase.auth.signOut();
                                                    localStorage.clear();
                                                    sessionStorage.clear();
                                                    window.location.href = '/';
                                                }}
                                                className="cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-950/20"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Sign Out & Clear Data</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="p-2 text-slate-400 hover:text-emerald-500 transition-colors ml-1 outline-none flex items-center gap-2"
                                        title="Sign In"
                                    >
                                        <LogIn size={18} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumb Subheader - Hidden on nutrient pages */}
                    {!pathname.match(/\/library\/nutrients(\/[^/]+)?$/) && (
                        <div className="sticky top-16 z-10 w-full border-b border-slate-200/30 dark:border-slate-800/30 bg-white/5 dark:bg-slate-900/5 backdrop-blur-sm px-8 py-1 flex items-center gap-4">
                            {/* Back Button */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => router.back()}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                                    title="Go Back"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            </div>

                            {/* Breadcrumbs - Centered */}
                            <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
                                {pathname.split('/').filter(Boolean).map((segment, index, array) => {
                                    const path = '/' + array.slice(0, index + 1).join('/');
                                    const isLast = index === array.length - 1;
                                    const isFirst = index === 0;

                                    return (
                                        <React.Fragment key={path}>
                                            {!isFirst && <ChevronRight size={12} className="text-slate-400 shrink-0" />}
                                            {isLast ? (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest truncate">
                                                    {decodeURIComponent(segment).replace(/-/g, ' ')}
                                                </span>
                                            ) : (
                                                <Link
                                                    href={path}
                                                    className="text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors shrink-0"
                                                >
                                                    {decodeURIComponent(segment).replace(/-/g, ' ')}
                                                </Link>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Actions & Forward Button */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {actions && (
                                    <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                        {actions}
                                    </div>
                                )}
                                <button
                                    onClick={() => router.forward()}
                                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                                    title="Go Forward"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="px-8 pt-4 pb-20 flex-1">
                        {children}
                    </div>

                    <Footer />
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
            <HeaderActionsProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </HeaderActionsProvider>
        </SearchProvider>
    );
}
