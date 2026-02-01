'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Search,
    ChevronRight,
    Bell,
    User,
    ArrowLeft,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { SearchProvider, useSearch } from '@/lib/context/search-context';
import { supabase } from '@/lib/supabase';



import { Footer } from '@/components/footer';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { profile } = useUserPreferences();
    const { searchQuery, setSearchQuery, results, isLoading, isFocused, setIsFocused, onResultClickRef, searchInputRef, keepFocusAfterSelect } = useSearch();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    // Reset search when changing pages
    useEffect(() => {
        setSearchQuery('');
    }, [pathname, setSearchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            <div className="flex h-screen overflow-hidden">


                {/* Main Content */}
                <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#020617] custom-scrollbar">
                    {/* Top Bar for Content */}
                    <div className="sticky top-0 z-20 w-full h-16 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md px-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {pathname.split('/').filter(Boolean).map((segment, index, array) => {
                                const path = '/' + array.slice(0, index + 1).join('/');
                                const isLast = index === array.length - 1;
                                const isFirst = index === 0; // dashboard

                                return (
                                    <React.Fragment key={path}>
                                        {!isFirst && <ChevronRight size={10} className="text-slate-400" />}
                                        {isLast ? (
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                {decodeURIComponent(segment).replace(/-/g, ' ')}
                                            </span>
                                        ) : (
                                            <Link
                                                href={path}
                                                className="text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                                            >
                                                {decodeURIComponent(segment).replace(/-/g, ' ')}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative hidden md:block z-50">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    ref={searchInputRef}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-80 transition-all font-medium"
                                    placeholder="Search dashboard..."
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
                                        <p className="text-xs font-bold leading-none">{user?.user_metadata?.full_name || profile.nickname || profile.name || 'Guest Researcher'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Lab Access</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors overflow-hidden">
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pb-20">
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
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </SearchProvider>
    );
}
