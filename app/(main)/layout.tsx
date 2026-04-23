'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Smartphone, TabletSmartphone, Monitor as Computer, MessageCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderLogo } from '@/components/ui/header-logo';
import { ActionPanelContainer } from '@/components/action-panel/action-panel-container';
import { ActionPanelBottomNav } from '@/components/action-panel/bottom-nav';
import { RecipePreview } from '@/components/recipe/recipe-preview';
import { RDADrawer } from '@/components/ux/rda-drawer';
import { DraggableFab } from '@/components/ux/draggable-fab';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderActionsProvider, useHeaderActions } from '@/lib/context/header-actions-context';
import { SearchProvider } from '@/lib/context/search-context';
import { ActionPanelProvider, useActionPanel } from '@/lib/context/action-panel-context';
import { SplitViewProvider, useSplitView } from '@/lib/context/split-view-context';
import { RecipeFilterProvider } from '@/lib/context/recipe-filter-context';
import { FoodFilterProvider } from '@/lib/context/food-filter-context';
import { supabase } from '@/lib/supabase';
import type { ParsedRecipe } from '@/types/recipe';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, showRDADrawer } = useUserPreferences();
    const { isActionPanelOpen, setIsActionPanelOpen, activeView } = useActionPanel();
    const { resizeMode, toggleResize } = useSplitView();
    const { hideAppChrome } = useHeaderActions();
    const [user, setUser] = useState<any>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isMobileLandscape, setIsMobileLandscape] = useState(false);
    const [recipeEditorOpen, setRecipeEditorOpen] = useState(false);
    const [detectedRecipe, setDetectedRecipe] = useState<ParsedRecipe | null>(null);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        const checkLandscape = () => setIsMobileLandscape(window.innerWidth < 1024 && window.innerWidth > window.innerHeight);
        checkDesktop();
        checkLandscape();
        window.addEventListener('resize', checkDesktop);
        window.addEventListener('resize', checkLandscape);
        return () => {
            window.removeEventListener('resize', checkDesktop);
            window.removeEventListener('resize', checkLandscape);
        };
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
            {!hideAppChrome && (
                <React.Suspense fallback={<div className="h-12 border-b bg-background" />}>
                    <HeaderLogo />
                </React.Suspense>
            )}
            
            {/* Main content flex container */}
            <div className="flex flex-1 overflow-hidden">
                {/* Content Area */}
                <div className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-20 relative",
                    getContentWidth(),
                    pathname === '/dashboard' ? 'w-full' : ''
                )}>
                    {/* Main Content */}
                    <main className={cn(
                        "flex-1 overflow-y-auto bg-background custom-scrollbar",
                        isMobileLandscape && 'pl-20 pr-20'
                    )}>
                        <div className={cn(
                            "px-0 sm:px-4 flex justify-center pb-32 sm:pb-0",
                            pathname !== '/dashboard' && "py-0 sm:py-4"
                        )}>
                            <div className="w-full max-w-[900px]">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>


                {/* Chat Area - Desktop only (mobile uses overlay button) */}
                {pathname !== '/dashboard' && !isMobile && (
                    <div className={cn(
                        "flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative",
                        getChatWidth()
                    )}>
                        <React.Suspense fallback={<div className="flex-1 bg-slate-50 animate-pulse" />}>
                            <ActionPanelContainer
                                onClose={() => {}}
                                isInline={true}
                                onRecipeDetected={handleRecipeDetected}
                            />
                        </React.Suspense>
                        
                    </div>
                )}

                {/* Mobile chatbot Modal */}
                {isMobile && isActionPanelOpen && (
                    <React.Suspense fallback={null}>
                        <ActionPanelContainer
                            onClose={() => setIsActionPanelOpen(false)}
                            isInline={false}
                            onRecipeDetected={handleRecipeDetected}
                        />
                    </React.Suspense>
                )}
            </div>

            {/* Global Bottom Navigation (Mobile Only) */}
            {isMobile && pathname !== '/dashboard' && !hideAppChrome && (
                <React.Suspense fallback={null}>
                    <ActionPanelBottomNav 
                        activeView={activeView}
                        onClose={() => setIsActionPanelOpen(false)}
                        orientation={isMobileLandscape ? 'right' : 'bottom'}
                    />
                </React.Suspense>
            )}

            {/* RDA Drawer */}
            <RDADrawer />

            {/* Floating Action Button (Split View) */}
            <DraggableFab />

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

import { URLOrchestrator } from '@/components/layout/url-orchestrator';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SplitViewProvider>
            <ActionPanelProvider>
                <React.Suspense fallback={null}>
                    <URLOrchestrator />
                </React.Suspense>
                <SearchProvider>
                    <HeaderActionsProvider>
                        <RecipeFilterProvider>
                            <FoodFilterProvider>
                                <DashboardLayoutContent>{children}</DashboardLayoutContent>
                            </FoodFilterProvider>
                        </RecipeFilterProvider>
                    </HeaderActionsProvider>
                </SearchProvider>
            </ActionPanelProvider>
        </SplitViewProvider>
    );
}
