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
        
        if (pathLower.includes('/pantry')) return 'Pantry';
        if (pathLower.includes('/shopping')) return 'Shopping List';
        if (pathLower.includes('/planner')) return 'Meal Planner';
        if (pathLower.includes('/maker')) return 'Create a Meal';
        if (pathLower === '/') return 'Discover & Learn';
        if (pathLower.includes('/comparator')) return 'Ready to Compare';
        
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
        <div className="w-full md:max-w-[900px] mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
            <div className={cn("flex items-center", props.sideNav ? "gap-1 md:gap-2" : "")}>
                {props.sideNav && (
                    <Link
                        href={props.sideNav.left.href}
                        className="shrink-0 w-9 md:w-11 h-20 md:h-24 rounded-2xl bg-card border-2 border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-xl group active:scale-95"
                        title={props.sideNav.left.label}
                    >
                        <span className="scale-90 md:scale-100">{props.sideNav.left.icon}</span>
                        <span className="text-[6px] md:text-[7px] font-black uppercase tracking-wider opacity-80 group-hover:opacity-100 leading-none">{props.sideNav.left.label}</span>
                    </Link>
                )}
                <div className="flex-1 min-w-0">
                    <div
                        className={cn(
                            'w-full bg-card rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-500 flex flex-col max-h-[240px] border border-border/50',
                            isActive ? `${style.ring} border-emerald-500/20` : ''
                        )}
                    >
                        {/* Dynamic content */}
                        <div className="overflow-y-auto flex-1 p-3 md:p-6 custom-scrollbar bg-background/50 order-1 rounded-t-[2.5rem]">
                            {isActive && !hideResults ? (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    {isLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-4">
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
                                                    className="w-full p-4 rounded-2xl bg-background/80 hover:bg-current/10 flex items-center justify-between group transition-all border border-border hover:border-current/30 text-left"
                                                >
                                                    {props.renderResult ? props.renderResult(item) : String(item)}
                                                </button>
                                            ))}
                                        </div>
                                    ) : searchQuery.length > 1 ? (
                                        <div className="py-20 text-center text-muted-foreground">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
                                                <Search size={24} className="opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{noResultsMessage}</p>
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            <p className="text-[10px] font-black uppercase tracking-widest italic">{enterMessage}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center h-full animate-in fade-in duration-700">
                                    <h3 className="text-lg font-black text-foreground uppercase italic tracking-tight mb-1">{finalIdleTitle}</h3>
                                    {idleSubtitle && <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest max-w-xs">{idleSubtitle}</p>}
                                    {props.idleExtra}
                                </div>
                            )}
                        </div>
                        {/* Footer */}
                        <div className="p-2 md:p-4 flex items-center gap-2 bg-background/50 order-2 rounded-b-[2.5rem] border-t border-border/30">
                            {props.powerButton}
                            <div className="flex-1 relative flex items-center">
                                <div className={cn("absolute left-4 transition-colors", isActive ? style.accent : 'text-muted-foreground/30')}>
                                    <Search size={16} className="md:w-5 md:h-5" />
                                </div>
                                <input
                                    autoFocus={isActive}
                                    placeholder={isActive ? placeholder : ''}
                                    className={cn(
                                        "w-full bg-muted transition-all shadow-inner text-[10px] md:text-sm font-black uppercase tracking-widest h-8 md:h-10 rounded-[1.5rem] md:rounded-[2rem] pl-10 pr-4 text-foreground placeholder:text-muted-foreground/40",
                                        isActive
                                            ? `border-0 focus:border-0 focus:ring-4 focus:ring-${theme}-500/10 bg-card`
                                            : "border-0 cursor-pointer hover:bg-muted/80"
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
                                    className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center transition-all active:scale-95 group/cancel shadow-sm"
                                    title="Close Search"
                                >
                                    <X size={18} className="md:w-6 md:h-6 group-hover/cancel:rotate-90 transition-transform duration-300" />
                                </button>
                            ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-full bg-muted text-muted-foreground/30 flex items-center justify-center">
                                    <Search size={18} className="md:w-6 md:h-6" />
                                </div>
                            )}
                        </div>
                    </div>{/* end card */}
                </div>{/* end flex-1 card wrapper */}
                {props.sideNav && (
                    <Link
                        href={props.sideNav.right.href}
                        className="shrink-0 w-9 md:w-11 h-20 md:h-24 rounded-2xl bg-card border-2 border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-xl group active:scale-95"
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
