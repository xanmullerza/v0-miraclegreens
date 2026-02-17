'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, X, LayoutGrid, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function BreadcrumbPillbox({
    searchQuery,
    setSearchQuery,
    sectionLabel,
    sectionColor = 'text-emerald-500',
    showHomeButton = true,
    customLastSegment,
    filterContent,
    isFilterActive = false,
    isFilterExpanded: controlledIsFilterExpanded,
    onFilterToggle
}: BreadcrumbPillboxProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [internalIsFilterExpanded, setInternalIsFilterExpanded] = useState(false);

    const isFilterExpanded = controlledIsFilterExpanded !== undefined ? controlledIsFilterExpanded : internalIsFilterExpanded;
    const setIsFilterExpanded = (val: boolean) => {
        if (onFilterToggle) {
            onFilterToggle(val);
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
        <div className="space-y-3 w-full">
            {sectionLabel && (
                <p className={cn("text-[9px] font-black uppercase tracking-widest px-4 md:px-0", sectionColor)}>
                    {sectionLabel}
                </p>
            )}
            <div className={cn(
                "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0 transition-all duration-500",
                isSearchExpanded ? "ring-2 ring-emerald-500/20" : ""
            )}>
                {/* Left side - Filter/Home Button area */}
                <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0 opacity-0" : "w-12 opacity-100")}>
                    {filterContent ? (
                        <button
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            className={cn(
                                "flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all flex-shrink-0",
                                isFilterExpanded
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 shadow-inner"
                                    : isFilterActive
                                        ? "text-indigo-500 bg-indigo-50/50"
                                        : "text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
                            )}
                            title={isFilterExpanded ? "Back to Breadcrumbs" : "Open Filters"}
                        >
                            {isFilterExpanded ? (
                                <LayoutGrid size={18} className="animate-in zoom-in spin-in-90 duration-300" />
                            ) : (
                                <Filter size={18} className="animate-in zoom-in duration-300" />
                            )}
                        </button>
                    ) : showHomeButton && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                </div>

                {/* Center - Breadcrumb/Filter area */}
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500", isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")}>
                    {isFilterExpanded && filterContent ? (
                        <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 w-full justify-center px-4">
                            {filterContent}
                        </div>
                    ) : (
                        <div className={cn("flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-4", isFilterExpanded ? "hidden" : "flex")}>
                            {segments.map((segment, index) => {
                                const path = '/' + segments.slice(0, index + 1).join('/');
                                const isLast = index === segments.length - 1;
                                const label = isLast && customLastSegment
                                    ? customLastSegment
                                    : decodeURIComponent(segment).replace(/-/g, ' ');

                                return (
                                    <React.Fragment key={path}>
                                        {index > 0 && (
                                            <ChevronRight size={12} className="text-slate-300 dark:text-slate-700 flex-shrink-0" />
                                        )}
                                        {isLast ? (
                                            <span className={cn("text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap", sectionColor)}>
                                                {label}
                                            </span>
                                        ) : (
                                            <Link
                                                href={path}
                                                className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors whitespace-nowrap"
                                            >
                                                {label}
                                            </Link>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right side - Search area */}
                <div className={cn(
                    "flex items-center justify-end transition-all duration-500",
                    isSearchExpanded ? "flex-1 pl-2" : "w-12"
                )}>
                    <div className={cn(
                        "flex items-center transition-all duration-500 overflow-hidden",
                        isSearchExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                    )}>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-12 rounded-[1.5rem] px-6 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (isSearchExpanded) setSearchQuery('');
                            setIsSearchExpanded(!isSearchExpanded);
                        }}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all flex-shrink-0",
                            isSearchExpanded
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                        )}
                        title="Search"
                    >
                        {isSearchExpanded ? <X size={18} /> : <Search size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
