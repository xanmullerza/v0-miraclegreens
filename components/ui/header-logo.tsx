'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, Home, User, Smartphone, TabletSmartphone, Monitor as Computer, Globe, LayoutGrid, Sun, Moon, ChefHat, Beaker, Info, Shield, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';
import { useChatbot } from '@/lib/context/chatbot-context';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

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
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { resizeMode, toggleResize, setResizeMode } = useSplitView();
    const { isChatbotOpen, setIsChatbotOpen } = useChatbot();
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        <div suppressHydrationWarning className={cn(
            "grid grid-cols-3 items-center bg-background border-b border-border w-full transition-all duration-500 overflow-hidden h-12"
        )}>
            {/* Left - Logo Area */}
            <div className="flex h-full w-full items-center px-4 overflow-hidden">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-all active:scale-[0.98]">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400/30 flex-shrink-0 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
                        <Leaf size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col hidden sm:flex">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-tight">
                            Miracle Greens
                        </div>
                        {showSubtext && (
                            <div className="text-[7.5px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-500/80">
                                Nutritional Intelligence
                            </div>
                        )}
                    </div>
                </Link>

                {/* Main App Navigation (Next to Logo) */}
                <div className="hidden lg:flex items-center ml-8 gap-1">
                    {[
                        { label: 'Home', path: '/', icon: Home, color: 'text-emerald-500' },
                        { label: 'Recipes', path: '/recipes', icon: ChefHat, color: 'text-emerald-500' },
                        { label: 'Foods', path: '/foods', icon: Leaf, color: 'text-emerald-500' },
                        { label: 'Nutrients', path: '/dashboard/widgets/nutridex', icon: Beaker, color: 'text-emerald-500' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isHomeRedirect = item.path === '/' && (pathname === '/about-us' || pathname === '/');
                        const isActive = isHomeRedirect || pathname === item.path || (pathname.startsWith(`${item.path}/`) && item.path !== '/');
                        
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => {
                                    if (item.label === 'Home') setResizeMode('content-focus');
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest",
                                    isActive
                                        ? "bg-slate-800/5 dark:bg-slate-800 text-foreground"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-emerald-500 active:scale-95"
                                )}
                                title={item.label}
                            >
                                <Icon size={14} className={isActive ? item.color : 'opacity-70'} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Empty Center Column */}
            <div className="hidden xl:flex justify-center w-full h-full" />

            {/* Right Group - Theme Toggle, View Ratio, Profile */}
            <div className="flex justify-end items-center h-full">
                {/* Navigation Items */}
                <div className="flex items-center h-full divide-x divide-border mr-1 border-l border-border">
                    {[
                        { label: 'Mission', path: '/about-us', icon: Info, color: 'text-purple-500' },
                        { label: 'Privacy', path: '/privacy', icon: Shield, color: 'text-slate-500' },
                        { label: 'Support', path: '/support', icon: HelpCircle, color: 'text-slate-500' },
                        { label: 'Terms', path: '/terms', icon: BookOpen, color: 'text-slate-500' },
                    ].map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                        
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={cn(
                                    "flex items-center gap-2 px-3 sm:px-6 h-full transition-all text-[9.5px] font-black uppercase tracking-widest",
                                    isActive
                                        ? "bg-slate-900 dark:bg-slate-800 text-white"
                                        : "text-muted-foreground hover:bg-muted dark:hover:bg-slate-800/50 hover:text-emerald-500 active:scale-95"
                                )}
                                title={item.label}
                            >
                                <Icon size={14} className={isActive ? item.color : ''} />
                                <span className="hidden md:inline">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Theme Toggle (Desktop Only) */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="hidden lg:flex h-12 w-12 border-l border-border items-center justify-center transition-all focus:outline-none text-muted-foreground hover:text-emerald-500 hover:bg-muted dark:hover:bg-slate-800/50 active:scale-95"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    <div className="relative w-[18px] h-[18px] flex items-center justify-center">
                        {mounted ? (
                            <>
                                <Sun 
                                    size={18} 
                                    className={cn(
                                        "absolute transition-all duration-500 transform",
                                        theme === 'dark' ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                                    )} 
                                />
                                <Moon 
                                    size={18} 
                                    className={cn(
                                        "absolute transition-all duration-500 transform",
                                        theme === 'dark' ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                                    )} 
                                />
                            </>
                        ) : (
                            <div className="w-[18px] h-[18px]" />
                        )}
                    </div>
                </button>



                {/* Profile Button */}
                <div className="flex flex-shrink-0 border-l border-border h-full overflow-hidden">
                    {pathname === '/profile' ? (
                        <Link
                            href="/dashboard"
                            className="h-12 w-12 flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-emerald-500 active:scale-95"
                            title="Go Home"
                        >
                            <Home size={18} />
                        </Link>
                    ) : (
                        <Link
                            href="/profile"
                            className="h-12 w-12 flex items-center justify-center hover:bg-muted dark:hover:bg-slate-800 transition-colors active:scale-95"
                            title="Profile"
                        >
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-white overflow-hidden transition-all shadow-sm flex-shrink-0 hover:ring-2 hover:ring-emerald-500/20",
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
        </div>
    );
}
