'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Search, X, LayoutGrid, ChevronRight, Filter, Home, Zap, Activity,
    LayoutDashboard, Library, Apple, FlaskConical, ChefHat, BookOpen, Utensils, User, Settings, FileText, Globe
} from 'lucide-react';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { cn } from '@/lib/utils';

const segmentIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    dashboard: Home,
    library: Library,
    foods: Apple,
    nutrients: FlaskConical,
    kitchen: ChefHat,
    recipes: BookOpen,
    meals: Utensils,
    profile: User,
    settings: Settings,
    browse: Globe,
};

interface BreadcrumbPillboxProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sectionLabel?: string;
    sectionColor?: string;
    showHomeButton?: boolean;
    customLastSegment?: string;
    filterContent?: React.ReactNode;
    isFilterActive?: boolean;
    isFilterExpanded?: boolean;
    onFilterToggle?: (expanded: boolean) => void;
    actions?: React.ReactNode;
    userProfile?: React.ReactNode;
    userStatus?: 'cloud' | 'local' | 'anonymous';
    userAvatarUrl?: string;
    isAdmin?: boolean;
}

export function BreadcrumbPillbox({
    searchQuery,
    setSearchQuery,
    sectionLabel,
    sectionColor = 'text-emerald-500',
    showHomeButton = true,
    actions,
    userProfile,
    userStatus = 'anonymous',
    userAvatarUrl,
    isAdmin = false
}: BreadcrumbPillboxProps) {
    const router = useRouter();
    const pathname = usePathname();
    const {
        customSegmentLabel,
        filterContent,
        isFilterExpanded: contextIsFilterExpanded,
        setIsFilterExpanded: setContextIsFilterExpanded,
        isFilterActive: contextIsFilterActive
    } = useHeaderActions();

    // Local state for search
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    // Local state for filter if not controlled by context (though we prefer context now)
    const [internalIsFilterExpanded, setInternalIsFilterExpanded] = useState(false);
    // Track mobile for icon-only mode
    const [isMobile, setIsMobile] = useState(false);
    const { headerStyle } = useUserPreferences();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const useIcons = isMobile || headerStyle === 'icons';

    // If context provides filter content, use context state. Otherwise use internal state (legacy support)
    const isFilterExpanded = filterContent ? contextIsFilterExpanded : internalIsFilterExpanded;
    const isFilterActive = filterContent ? (contextIsFilterActive || false) : false;

    const setIsFilterExpanded = (val: boolean) => {
        if (filterContent) {
            setContextIsFilterExpanded(val);
        } else {
            setInternalIsFilterExpanded(val);
        }
    };

    // Close search on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsSearchExpanded(false);
                setIsFilterExpanded(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const segments = pathname.split('/').filter(Boolean);

    return (
        <div className="w-full">
            {sectionLabel && (
                <p className={cn("text-[9px] font-black uppercase tracking-widest px-2 md:px-0 mb-0", sectionColor)}>
                    {sectionLabel}
                </p>
            )}
            <div className={cn(
                "sticky top-0 z-50 flex items-center p-2 pt-0 bg-white dark:bg-slate-900 rounded-b-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[900px] mx-auto xl:mx-0 transition-all duration-500",
                isSearchExpanded ? "ring-2 ring-emerald-500/20" : ""
            )}>
                {/* Left side - Toggle Button (Browse <-> Home) */}
                <Link
                    href={pathname.includes('/browse') ? '/dashboard' : '/browse'}
                    className={cn(
                        "flex transition-all duration-500 h-12 w-12 border-r border-slate-200 dark:border-slate-800 mr-2 items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none",
                        isSearchExpanded ? "w-0 opacity-0 overflow-hidden" : "flex-shrink-0"
                    )}
                    title={pathname.includes('/browse') ? 'Home' : 'Browse'}
                >
                    {pathname.includes('/browse') ? <Home size={18} /> : <Globe size={18} />}
                </Link>

                {/* Center - Breadcrumb or Search Input */}
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500 h-12", isSearchExpanded ? "flex-1" : "flex-1")}>
                    {isSearchExpanded ? (
                        <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search library..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Escape' && setIsSearchExpanded(false)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl pl-9 pr-4 text-slate-900 dark:text-white"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchExpanded(false);
                                    setSearchQuery('');
                                }}
                                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            {pathname === '/dashboard' ? (
                                <div className="flex items-center justify-center py-1 gap-3">
                                    <div className="flex items-center justify-center text-emerald-500 animate-in fade-in slide-in-from-left-4 duration-1000">
                                        <Activity size={24} strokeWidth={3} />
                                    </div>
                                    <span className="text-3xl font-black italic uppercase bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tighter animate-in fade-in zoom-in-95 duration-1000 drop-shadow-md leading-none font-sans">
                                        VITALA
                                    </span>
                                    <div className="flex flex-col text-[10px] font-black uppercase tracking-[0.15em] leading-tight border-l border-slate-200 dark:border-slate-800 pl-3 animate-in fade-in slide-in-from-right-4 duration-1000 font-sans">
                                        <span className="whitespace-nowrap text-blue-400">Simple</span>
                                        <span className="whitespace-nowrap text-emerald-500">Nutrition</span>
                                    </div>
                                </div>
                            ) : isFilterExpanded && filterContent ? (
                                <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 w-full justify-center px-4">
                                    {filterContent}
                                </div>
                            ) : (
                                <div className={cn("flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-4", isFilterExpanded ? "hidden" : "flex")}>
                                    {segments.map((segment, index) => {
                                        const path = '/' + segments.slice(0, index + 1).join('/');
                                        const isLast = index === segments.length - 1;

                                        const label = isLast && customSegmentLabel
                                            ? customSegmentLabel
                                            : decodeURIComponent(segment).replace(/-/g, ' ');

                                        const SegmentIcon = segmentIconMap[segment.toLowerCase()] || FileText;

                                        return (
                                            <React.Fragment key={path}>
                                                {index > 0 && (
                                                    <ChevronRight size={12} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                                                )}
                                                {isLast ? (
                                                    useIcons ? (
                                                        <span className={cn("flex items-center justify-center", sectionColor)} title={label}>
                                                            <SegmentIcon size={16} />
                                                        </span>
                                                    ) : (
                                                        <span className={cn("text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap", sectionColor)}>
                                                            {label}
                                                        </span>
                                                    )
                                                ) : (
                                                    useIcons ? (
                                                        <Link
                                                            href={path}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                            title={label}
                                                        >
                                                            <SegmentIcon size={16} />
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            href={path}
                                                            className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors whitespace-nowrap"
                                                        >
                                                            {label}
                                                        </Link>
                                                    )
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Right side - Unified Profile/Dashboard Button */}
                <div className={cn(
                    "flex transition-all duration-500 flex-shrink-0 ml-2 border-l border-slate-200 dark:border-slate-800",
                    isSearchExpanded ? "w-0 opacity-0 overflow-hidden" : ""
                )}>
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
                                "h-6 w-6 rounded-full flex items-center justify-center text-white overflow-hidden transition-colors shadow-sm",
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
