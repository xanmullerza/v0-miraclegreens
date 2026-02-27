'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    ChevronRight,
    ChevronLeft,
    User,
    ArrowLeft,
    LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/header';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider, useHeaderActions } from '@/lib/context/header-actions-context';
import { SearchProvider } from '@/lib/context/search-context';
import { supabase } from '@/lib/supabase';
import { HeaderLogo } from '@/components/ui/header-logo';



import { Footer } from '@/components/footer';
import { RDADrawer } from '@/components/rda-drawer';

function DashboardLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, showRDADrawer } = useUserPreferences();
    const { actions } = useHeaderActions();
    const [user, setUser] = useState<any>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

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
                    {/* Main Header (Logo & Subtext) */}
                    <div className={cn(
                        "z-40 px-2 sm:px-4 w-full flex justify-center pointer-events-none transition-all duration-500 ease-in-out",
                        "sticky top-0",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        <div className="pointer-events-auto w-full max-w-[900px]">
                            <HeaderLogo showSubtext={true} />
                        </div>
                    </div>

                    <div className={cn(
                        "px-2 sm:px-4 pt-4 pb-20 flex-1 flex justify-center transition-all duration-500 ease-in-out",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        <div className="w-full max-w-[900px]">
                            {children}
                        </div>
                    </div>

                    <div className={cn(
                        "w-full transition-all duration-500 ease-in-out",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        <Footer />
                    </div>
                </main>
            </div>


            {/* Removed the old fixed-overlay that was in the wrong stacking context */}
            <RDADrawer />
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
