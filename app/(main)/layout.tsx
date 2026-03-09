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
import { ChatbotProvider, useChatbot } from '@/lib/context/chatbot-context';
import { supabase } from '@/lib/supabase';
import { HeaderLogo } from '@/components/ui/header-logo';
import { ChatbotModal } from '@/components/chatbot-modal';
import { Footer } from '@/components/footer';
import { DashboardNav } from '@/components/dashboard-nav';
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
    const { isChatbotOpen, setIsChatbotOpen } = useChatbot();
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
        <div suppressHydrationWarning className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            <div suppressHydrationWarning className="flex h-screen overflow-hidden">


                {/* Main Content */}
                <main className="dashboard-main flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#020617] custom-scrollbar flex flex-col">
                    {/* Header & Nav Container */}
                    <div suppressHydrationWarning className={cn(
                        "z-40 sticky top-0 w-full flex flex-col transition-all duration-500 ease-in-out bg-slate-50 dark:bg-[#020617]",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        {/* Main Header (Logo & Subtext) */}
                        <div className="px-2 sm:px-4 w-full flex justify-center pointer-events-none">
                            <div className="pointer-events-auto w-full max-w-[900px]">
                                <HeaderLogo 
                                    showSubtext={true}
                                    userStatus={
                                        user ? 'cloud' :
                                            (profile.name || profile.nickname) ? 'local' :
                                                'anonymous'
                                    }
                                    userAvatarUrl={user?.user_metadata?.avatar_url}
                                />
                            </div>
                        </div>

                        {/* Navigation Bar */}
                        <DashboardNav />
                    </div>

                    <div suppressHydrationWarning className={cn(
                        "px-2 sm:px-4 pt-4 pb-20 flex-1 flex justify-center transition-all duration-500 ease-in-out",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        <div className="w-full max-w-[900px]">
                            {children}
                        </div>
                    </div>

                    <div suppressHydrationWarning className={cn(
                        "w-full transition-all duration-500 ease-in-out",
                        showRDADrawer && isDesktop && "lg:translate-x-[192px]"
                    )}>
                        <Footer />
                    </div>
                </main>
            </div>


            {/* RDA Drawer */}
            <RDADrawer />

            {/* Chatbot Modal - rendered at top level outside stacking context */}
            {isChatbotOpen && <ChatbotModal onClose={() => setIsChatbotOpen(false)} />}
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ChatbotProvider>
            <SearchProvider>
                <HeaderActionsProvider>
                    <DashboardLayoutContent>{children}</DashboardLayoutContent>
                </HeaderActionsProvider>
            </SearchProvider>
        </ChatbotProvider>
    );
}
