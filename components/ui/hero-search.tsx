'use client';

import React from 'react';
import { Search, X, Activity, Info } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type HeroTheme = 'emerald' | 'amber';

interface HeroSearchProps<T = any> {
    // controlled inputs/state
    searchQuery: string;
    onQueryChange: (q: string) => void;
    results: T[];
    isLoading: boolean;
    isActive: boolean;
    setIsActive: (active: boolean) => void;
    onSelect: (item: T) => void;

    // optional callbacks for extra behaviour
    onFocus?: () => void; // e.g. comparator uses this to set active slot

    // ability to render custom result item
    renderResult?: (item: T) => React.ReactNode;

    // text overrides
    placeholder?: string;
    idleIcon?: React.ReactNode;
    idleTitle?: React.ReactNode;
    idleSubtitle?: React.ReactNode;
    /**
     * extra content to render under the idle message when the search is not active.
     * useful for companion UI like a "clear all" button in the comparator.
     */
    idleExtra?: React.ReactNode;
    noResultsMessage?: string;
    enterMessage?: string;
    searchingMessage?: string;

    theme?: HeroTheme;
    powerButton?: React.ReactNode; // Button rendered to the left of search input
    /**
     * When true the results panel is suppressed — the idle view is always shown.
     * Use this when another component (e.g. ExploreView) handles the search display.
     */
    hideResults?: boolean;
    /** When true, idleIcon is rendered directly without the rounded wrapper + ping animation. */
    idleIconRaw?: boolean;
    /** Half-circle nav buttons on the left/right edges for section-level navigation. */
    sideNav?: {
        left: { icon: React.ReactNode; label: string; href: string };
        right: { icon: React.ReactNode; label: string; href: string };
    };
}

const themeStyles: Record<HeroTheme, { ring: string; border: string; accent: string; accentBg: string; iconColor: string }> = {
    emerald: {
        ring: 'ring-4 ring-emerald-500/10',
        border: 'border-emerald-500/30',
        accent: 'text-emerald-500',
        accentBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500'
    },
    amber: {
        ring: 'ring-4 ring-amber-500/10',
        border: 'border-amber-500/30',
        accent: 'text-amber-500',
        accentBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500'
    }
};

export function HeroSearch<T>(props: HeroSearchProps<T>) {
    const pathname = usePathname();
    
    // Generate personalized idle title based on current page
    const getPersonalizedTitle = () => {
        const pathLower = pathname.toLowerCase();
        
        if (pathLower.includes('/pantry')) {
            return 'Pantry';
        } else if (pathLower.includes('/shopping')) {
            return 'Shopping List';
        } else if (pathLower.includes('/planner')) {
            return 'Plan Your Meals';
        } else if (pathLower.includes('/maker')) {
            return 'Create a Meal';
        } else if (pathLower.includes('/browse')) {
            return 'Discover & Learn';
        }
        
        return 'Ready to Search';
    };
    
    const {
        searchQuery,
        onQueryChange,
        results,
        isLoading,
        isActive,
        setIsActive,
        onSelect,
        onFocus,
        placeholder = 'SEARCH…',
        idleIcon = <Info />, 
        idleTitle = undefined,
        idleSubtitle = null,
        noResultsMessage = 'No matching items found',
        enterMessage = 'Enter item name to search',
        searchingMessage = 'Searching Library...',
        theme = 'emerald',
        hideResults = false,
    } = props;

    // Use provided idleTitle or fall back to personalized title
    const finalIdleTitle = idleTitle !== undefined ? idleTitle : getPersonalizedTitle();

    const style = themeStyles[theme];

    return (
        <div className="w-full md:max-w-[900px] mx-auto">
            <div className={cn("flex items-center", props.sideNav ? "gap-1 md:gap-2" : "")}>
                {props.sideNav && (
                    <Link
                        href={props.sideNav.left.href}
                        className="shrink-0 w-9 md:w-11 h-20 md:h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-500 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 dark:hover:bg-emerald-600 dark:hover:border-emerald-500 transition-all shadow-xl group active:scale-95"
                        title={props.sideNav.left.label}
                    >
                        <span className="scale-90 md:scale-100">{props.sideNav.left.icon}</span>
                        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider opacity-80 group-hover:opacity-100 leading-none">{props.sideNav.left.label}</span>
                    </Link>
                )}
                <div className="flex-1 min-w-0">
                <div
                    className={cn(
                        'w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col max-h-[240px]',
                        isActive ? `${style.ring} ${style.border}` : ''
                    )}
                >
                {/* Dynamic content */}
                <div className="overflow-y-auto flex-1 p-3 md:p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1 rounded-[2.5rem]">
                    {isActive && !hideResults ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            {isLoading ? (
                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="relative">
                                        <Activity className="animate-spin" size={32} />
                                        <div className="absolute inset-0 animate-ping bg-current/20 rounded-full" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{searchingMessage}</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {results.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                onSelect(item);
                                            }}
                                            className="w-full p-4 rounded-2xl hover:bg-current/10 dark:hover:bg-current/10 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-current/30 text-left"
                                        >
                                            {props.renderResult ? props.renderResult(item) : String(item)}
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery.length > 1 ? (
                                <div className="py-20 text-center text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-slate-700">
                                        <Search size={24} className="opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{noResultsMessage}</p>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">{enterMessage}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full animate-in fade-in duration-700">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1">{finalIdleTitle}</h3>
                            {idleSubtitle && <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">{idleSubtitle}</p>}
                            {props.idleExtra}
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="p-2 md:p-4 flex items-center gap-2 bg-transparent dark:bg-transparent order-2 rounded-b-[2.5rem]">
                    {props.powerButton}
                    <div className="flex-1 relative flex items-center">
                        <div className={cn("absolute left-4 transition-colors", isActive ? style.accent : 'text-slate-300')}>
                            <Search size={16} className="md:w-5 md:h-5" />
                        </div>
                        <input
                            autoFocus={isActive}
                            placeholder={isActive ? placeholder : ''}
                            className={cn(
                                "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-[10px] md:text-sm font-black uppercase tracking-widest h-8 md:h-10 rounded-[1.5rem] md:rounded-[2rem] pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-300",
                                isActive
                                    ? `border-${theme}-500/30 focus:border-${theme}-500/80 focus:ring-4 focus:ring-${theme}-500/10 focus:bg-white dark:focus:bg-slate-800/80`
                                    : "border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500/20"
                            )}
                            value={searchQuery}
                            onFocus={() => {
                                setIsActive(true);
                                onFocus?.();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') setIsActive(false);
                            }}
                            onChange={(e) => {
                                onQueryChange(e.target.value);
                                setIsActive(true);
                            }}
                        />
                    </div>
                    {isActive ? (
                        <button
                            onClick={() => {
                                setIsActive(false);
                                onQueryChange('');
                            }}
                            className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-current/10 text-current hover:bg-current/20 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                            title="Close Search"
                        >
                            <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                        </button>
                    ) : (
                        <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-300 flex items-center justify-center">
                            <Search size={18} className="md:w-6 md:h-6" />
                        </div>
                    )}
                </div>
            </div>{/* end card */}
            </div>{/* end flex-1 card wrapper */}
                {props.sideNav && (
                    <Link
                        href={props.sideNav.right.href}
                        className="shrink-0 w-9 md:w-11 h-20 md:h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-500 flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-300 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 dark:hover:bg-emerald-600 dark:hover:border-emerald-500 transition-all shadow-xl group active:scale-95"
                        title={props.sideNav.right.label}
                    >
                        <span className="scale-90 md:scale-100">{props.sideNav.right.icon}</span>
                        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider opacity-80 group-hover:opacity-100 leading-none">{props.sideNav.right.label}</span>
                    </Link>
                )}
            </div>{/* end flex row */}
        </div>
    );
}
