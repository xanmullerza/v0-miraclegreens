'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Smartphone, TabletSmartphone, Monitor as Computer, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderLogo } from '@/components/ui/header-logo';
import { ChatbotModal } from '@/components/chatbot-modal';
import { RecipePreview } from '@/components/recipe/recipe-preview';
import { Footer } from '@/components/footer';
import { RDADrawer } from '@/components/rda-drawer';
import { ContentNav } from '@/components/ui/content-nav';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider } from '@/lib/context/header-actions-context';
import { SearchProvider } from '@/lib/context/search-context';
import { ChatbotProvider, useChatbot } from '@/lib/context/chatbot-context';
import { SplitViewProvider, useSplitView } from '@/lib/context/split-view-context';
import { RecipeFilterProvider } from '@/lib/context/recipe-filter-context';
import { supabase } from '@/lib/supabase';

interface ParsedRecipe {
    title: string;
    ingredients_text: string;
    instructions_text: string;
    servings?: number;
    prep_time?: number;
    cook_time?: number;
    difficulty?: string;
    tags?: string[];
    source_url: string;
    image_url?: string;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, showRDADrawer } = useUserPreferences();
    const { isChatbotOpen, setIsChatbotOpen } = useChatbot();
    const { resizeMode, toggleResize } = useSplitView();
    const [user, setUser] = useState<any>(null);
    const [isDesktop, setIsDesktop] = useState(false);
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
        if (pathname === '/dashboard') return 'w-full';
        if (!isDesktop) return 'w-full';
        switch (resizeMode) {
            case 'equal': return 'w-1/2';
            case 'content-focus': return 'w-2/3';
            case 'dashboard-only': return 'w-0';
            default: return 'w-1/2';
        }
    };

    const getChatWidth = () => {
        switch (resizeMode) {
            case 'equal': return 'w-1/2';
            case 'content-focus': return 'w-1/3';
            case 'dashboard-only': return 'w-full';
            default: return 'w-1/2';
        }
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Computer size={18} />;
        if (resizeMode === 'content-focus') return <TabletSmartphone size={18} />;
        if (resizeMode === 'dashboard-only') return <Smartphone size={18} />;
        return <Computer size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'content-focus') return 'Equal Split (50/50)';
        if (resizeMode === 'equal') return 'Full Dashboard View';
        if (resizeMode === 'dashboard-only') return 'Focus Content (70/30)';
        return 'Toggle View';
    };


    return (
        <div suppressHydrationWarning className="h-screen w-full flex flex-col bg-background text-foreground font-sans">
            {/* Unified Header & Nav - Spans both panels */}
            {pathname !== '/dashboard' && (
                <>
                    {/* Header - Centered */}
                    <div suppressHydrationWarning className="z-40 bg-background">
                        <div className="w-full flex pointer-events-none">
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

                </>
            )}

            {/* Main content flex container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Content Area */}
                <div className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-20 relative",
                    getContentWidth(),
                    pathname === '/dashboard' ? 'w-full' : ''
                )}>
                    {/* Secondary Nav for Content Panel */}
                    {pathname !== '/dashboard' && <ContentNav />}

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto bg-background custom-scrollbar">
                        <div className={cn(
                            "px-2 sm:px-4 flex justify-center",
                            pathname !== '/dashboard' && "py-4"
                        )}>
                            <div className="w-full max-w-[900px]">
                                {children}
                            </div>
                        </div>
                        {pathname !== '/dashboard' && <Footer />}
                    </main>
                </div>

                {/* Divider + Resize Button */}
                {pathname !== '/dashboard' && !isMobile && resizeMode !== 'dashboard-only' && (
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
                {pathname !== '/dashboard' && !isMobile && (
                    <div className={cn(
                        "flex flex-col transition-all duration-300 ease-in-out overflow-hidden border-l border-slate-200 dark:border-slate-800 relative",
                        getChatWidth()
                    )}>
                        <ChatbotModal
                            onClose={() => {}}
                            isInline={true}
                        />
                        
                        {/* Mobile Resize Button (should not appear on mobile since compartment hidden) */}
                        {resizeMode !== 'dashboard-only' && (
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

                {/* Mobile chatbot Modal */}
                {isMobile && isChatbotOpen && (
                    <ChatbotModal
                        onClose={() => setIsChatbotOpen(false)}
                        isInline={false}
                    />
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
                        <RecipeFilterProvider>
                            <DashboardLayoutContent>{children}</DashboardLayoutContent>
                        </RecipeFilterProvider>
                    </HeaderActionsProvider>
                </SearchProvider>
            </ChatbotProvider>
        </SplitViewProvider>
    );
}
