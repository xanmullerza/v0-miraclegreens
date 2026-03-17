'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Home, User, Columns, PanelRightOpen, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSplitView } from '@/lib/context/split-view-context';

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

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Columns size={18} />;
        if (resizeMode === 'content-focus') return <PanelRightOpen size={18} />;
        if (resizeMode === 'content-only') return <MessageCircle size={18} />;
        return <Columns size={18} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'equal') return 'Focus Content (67%)';
        if (resizeMode === 'content-focus') return 'Content Only (Hide Chat)';
        if (resizeMode === 'content-only') return 'Equal Split (50/50)';
        return 'Toggle View';
    };

    return (
        <div suppressHydrationWarning className={cn(
            "flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-b-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-[900px] mx-auto transition-all duration-500"
        )}>
            {/* Left - View Ratio Toggle */}
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
