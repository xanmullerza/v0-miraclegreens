'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    return (
        <div suppressHydrationWarning className={cn(
            "flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-b-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl w-full md:max-w-[900px] mx-auto xl:mx-0 transition-all duration-500"
        )}>
            {/* Left - Home Button */}
            <Link
                href="/home"
                className={cn(
                    "flex h-12 w-12 border-r border-slate-200 dark:border-slate-800 items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none flex-shrink-0"
                )}
                title="Home"
            >
                <Home size={18} />
            </Link>

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
