'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Home, User, Smartphone, TabletSmartphone, Monitor as Computer, Globe, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';
import { useChatbot } from '@/lib/context/chatbot-context';
import { useState, useEffect } from 'react';

interface HeaderLogoProps {
    showSubtext?: boolean;
    userStatus?: 'cloud' | 'local' | 'anonymous';
    userAvatarUrl?: string;
}

export function HeaderLogo({ 
    showSubtext = true,
    userStatus = 'anonymous',
    userAvatarUrl,
}: HeaderLogoProps) {
    const pathname = usePathname();
    const { resizeMode, toggleResize } = useSplitView();
    const { isChatbotOpen, setIsChatbotOpen } = useChatbot();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Computer size={18} />;
        if (resizeMode === 'content-focus') return <TabletSmartphone size={18} />;
        if (resizeMode === 'content-only') return <Smartphone size={18} />;
        return <Computer size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'content-focus') return 'Equal Split (50/50)';
        if (resizeMode === 'equal') return 'Content Only (Hide Chat)';
        if (resizeMode === 'content-only') return 'Focus Content (70/30)';
        return 'Toggle View';
    };

    return (
        <div suppressHydrationWarning className={cn(
            "flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 w-full transition-all duration-500"
        )}>
            {/* Left - View Ratio / Mobile Toggle */}
            {isMobile ? (
                <div className="flex border-r border-slate-200 dark:border-slate-800 items-center flex-shrink-0">
                    <button
                        onClick={() => setIsChatbotOpen(false)}
                        className={cn(
                            "flex h-12 w-10 items-center justify-center transition-all focus:outline-none active:scale-95",
                            !isChatbotOpen ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                        title="Show Content Pane"
                    >
                        <Globe size={18} />
                    </button>
                    <button
                        onClick={() => setIsChatbotOpen(true)}
                        className={cn(
                            "flex h-12 w-10 items-center justify-center transition-all focus:outline-none active:scale-95",
                            isChatbotOpen ? "text-emerald-500 bg-emerald-500/5" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                        title="Show Chatbot Pane"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={toggleResize}
                    className={cn(
                        "flex h-12 w-12 border-r border-slate-200 dark:border-slate-800 items-center justify-center transition-all focus:outline-none flex-shrink-0 active:scale-95",
                        resizeMode === 'equal' && "text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800",
                        resizeMode === 'content-focus' && "text-cyan-500 hover:bg-cyan-500/5",
                        resizeMode === 'content-only' && "text-emerald-500 hover:bg-emerald-500/5"
                    )}
                    title={getResizeTooltip()}
                >
                    {getResizeIcon()}
                </button>
            )}

            {/* Center - Logo Area */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 justify-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex-shrink-0">
                    <Leaf size={22} className="text-emerald-500" />
                </div>
                <div className="flex flex-col hidden sm:flex">
                    <div className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        Miracle Greens
                    </div>
                    {showSubtext && (
                        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Nutritional Intelligence
                        </div>
                    )}
                </div>
            </Link>

            {/* Right - Profile Button */}
            <div className="flex flex-shrink-0 ml-2 border-l border-slate-200 dark:border-slate-800">
                {pathname === '/profile' ? (
                    <Link
                        href="/dashboard"
                        className="h-12 w-12 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-emerald-500"
                        title="Go Home"
                    >
                        <Home size={18} />
                    </Link>
                ) : (
                    <Link
                        href="/profile"
                        className="h-12 w-12 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Profile"
                    >
                        <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-white overflow-hidden transition-colors shadow-sm flex-shrink-0",
                            userStatus === 'cloud' ? "bg-emerald-500" :
                                userStatus === 'local' ? "bg-blue-500" :
                                    "bg-orange-500"
                        )}>
                            {userAvatarUrl ? (
                                <img
                                    src={userAvatarUrl}
                                    alt="P"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={14} />
                            )}
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
