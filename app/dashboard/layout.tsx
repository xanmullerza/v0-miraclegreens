'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    ChevronRight,
    ChevronLeft,
    User,
    ArrowLeft,
    LogIn,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider, useHeaderActions } from '@/lib/context/header-actions-context';
import { SearchProvider, useSearch } from '@/lib/context/search-context';
import { supabase } from '@/lib/supabase';
import { BreadcrumbPillbox } from '@/components/ui/breadcrumb-pillbox';



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
    const { searchQuery, setSearchQuery } = useSearch();
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
                    {/* Main Header (BreadcrumbPillbox) */}
                    <div className={cn(
                        "z-40 px-2 sm:px-4 w-full flex justify-center pointer-events-none transition-all duration-500",
                        pathname === '/dashboard/library/comparefoods' ? "relative pt-0" : "sticky top-0"
                    )}>
                        <div className="pointer-events-auto w-full max-w-[800px]">
                            <BreadcrumbPillbox
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                actions={
                                    <Link href="/dashboard/settings" className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                                        <Settings size={18} />
                                    </Link>
                                }
                                userProfile={
                                    <div className="flex items-center gap-2">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs font-bold leading-none">{user?.user_metadata?.full_name || profile.nickname || profile.name || 'Anonymous'}</p>
                                        </div>
                                        <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={10} />
                                            )}
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    <div className="px-2 sm:px-4 pt-4 pb-20 flex-1">
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
