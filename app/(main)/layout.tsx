'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Columns, PanelRightOpen, X as CloseIcon, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderLogo } from '@/components/ui/header-logo';
import { ChatbotModal } from '@/components/chatbot-modal';
import { RecipePreview } from '@/components/recipe/recipe-preview';
import { Footer } from '@/components/footer';
import { DashboardNav } from '@/components/dashboard-nav';
import { RDADrawer } from '@/components/rda-drawer';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider } from '@/lib/context/header-actions-context';
import { SearchProvider } from '@/lib/context/search-context';
import { ChatbotProvider, useChatbot } from '@/lib/context/chatbot-context';
import { SplitViewProvider, useSplitView } from '@/lib/context/split-view-context';
import { supabase } from '@/lib/supabase';

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    source_url: string;
    image_url?: string;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile, showRDADrawer } = useUserPreferences();
    const { isChatbotOpen } = useChatbot();
    const { resizeMode, toggleResize } = useSplitView();
    const [user, setUser] = useState<any>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
    const [detectedRecipe, setDetectedRecipe] = useState<ParsedRecipe | null>(null);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Hide split view on mobile, show chat FAB overlay
    const isMobile = !isDesktop;

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleRecipeDetected = (recipe: ParsedRecipe) => {
        setDetectedRecipe(recipe);
        setRecipeEditorOpen(true);
    };

    // Determine widths based on resize mode
    const getContentWidth = () => {
        if (pathname === '/home') return 'w-full';
        if (!isDesktop) return 'w-full';
        switch (resizeMode) {
            case 'equal': return 'w-1/2';
            case 'content-focus': return 'w-2/3';
            case 'content-only': return 'w-full';
            default: return 'w-1/2';
        }
    };

    const getChatWidth = () => {
        switch (resizeMode) {
            case 'equal': return 'w-1/2';
            case 'content-focus': return 'w-1/3';
            case 'content-only': return 'w-0';
            default: return 'w-1/2';
        }
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Columns size={18} />;
        if (resizeMode === 'content-focus') return <PanelRightOpen size={18} />;
        if (resizeMode === 'content-only') return <CloseIcon size={18} />;
        return <Columns size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'content-focus') return 'Equal Split (50/50)';
        if (resizeMode === 'equal') return 'Content Only (Hide Chat)';
        if (resizeMode === 'content-only') return 'Focus Content (70/30)';
        return 'Toggle View';
    };

    const getBreadcrumbs = () => {
        const segments = pathname.split('/').filter(Boolean);
        const humanize = (segment: string) => {
            if (segment === 'dashboard') return 'Dashboard';
            if (segment === 'library') return 'Library';
            if (segment === 'meal-o-matic') return 'Meal-o-Matic';
            if (segment === 'home') return 'Home';
            return segment
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        return segments.map((segment, index) => (
            <span key={`${segment}-${index}`} className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                {index > 0 && <span className="text-slate-400 dark:text-slate-500">/</span>}
                <span>{humanize(segment)}</span>
            </span>
        ));
    };

    return (
        <div suppressHydrationWarning className="h-screen w-full flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
            {/* Unified Header & Nav - Spans both panels */}
            {pathname !== '/home' && (
                <>
                    {/* Header - Centered */}
                    <div suppressHydrationWarning className="z-40 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#020617]">
                        <div className="w-full flex justify-center px-2 sm:px-4 pointer-events-none">
                            <div className="pointer-events-auto w-full">
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
                    </div>

                    {/* Dashboard Navigation - Centered */}
                    <div className="w-full flex justify-center">
                        <DashboardNav />
                    </div>
                </>
            )}

            {/* Main content flex container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Content Area */}
                <div className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
                    getContentWidth(),
                    pathname === '/home' ? 'w-full' : ''
                )}>
                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#020617] custom-scrollbar">
                        <div className={cn(
                            "px-2 sm:px-4 flex justify-center",
                            pathname !== '/home' && "py-4"
                        )}>
                            <div className="w-full max-w-[900px]">
                                {children}
                            </div>
                        </div>
                        {pathname !== '/home' && <Footer />}
                    </main>
                </div>

                {/* Divider + Resize Button */}
                {pathname !== '/home' && !isMobile && resizeMode !== 'content-only' && (
                    <>
                        <div className="w-px bg-slate-200 dark:bg-slate-800" />
                        <button
                            onClick={toggleResize}
                            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-l-lg bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            title={getResizeTooltip()}
                        >
                            {getResizeIcon()}
                        </button>
                    </>
                )}

                {/* Chat Area - Desktop only (mobile uses overlay button) */}
                {pathname !== '/home' && !isMobile && (
                    <div className={cn(
                        "flex flex-col transition-all duration-300 ease-in-out overflow-hidden border-l border-slate-200 dark:border-slate-800 relative",
                        getChatWidth()
                    )}>
                        <ChatbotModal
                            onClose={() => {}}
                            isInline={true}
                        />
                        
                        {/* Mobile Resize Button (should not appear on mobile since compartment hidden) */}
                        {resizeMode !== 'content-only' && (
                            <button
                                onClick={toggleResize}
                                className="lg:hidden absolute top-20 right-4 z-30 flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400"
                                title={getResizeTooltip()}
                            >
                                {getResizeIcon()}
                            </button>
                        )}
                    </div>
                )}

                {/* Mobile chatbot FAB */}
                {isMobile && (
                    <>
                        <button
                            onClick={() => setIsMobileChatOpen(true)}
                            className="fixed bottom-6 right-6 z-50 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-700 text-white shadow-lg transition-all active:scale-95"
                            title="Open Chat"
                            aria-label="Open Chat"
                        >
                            <MessageCircle size={24} />
                        </button>
                        {isMobileChatOpen && (
                            <ChatbotModal
                                onClose={() => setIsMobileChatOpen(false)}
                                isInline={false}
                            />
                        )}
                    </>
                )}
            </div>

            {/* RDA Drawer */}
            <RDADrawer />

            {/* Recipe Preview Modal */}
            <RecipePreview
                isOpen={recipeEditorOpen}
                recipe={detectedRecipe}
                onClose={() => {
                    setRecipeEditorOpen(false);
                    setDetectedRecipe(null);
                }}
                onSave={(recipe) => {
                    setRecipeEditorOpen(false);
                    setDetectedRecipe(null);
                }}
            />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SplitViewProvider>
            <ChatbotProvider>
                <SearchProvider>
                    <HeaderActionsProvider>
                        <DashboardLayoutContent>{children}</DashboardLayoutContent>
                    </HeaderActionsProvider>
                </SearchProvider>
            </ChatbotProvider>
        </SplitViewProvider>
    );
}
