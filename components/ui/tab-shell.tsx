'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowDownUp, Filter, Scale, Minus, Plus, Users, Weight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortOption {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export type TabThemeColor = 'emerald' | 'blue' | 'cyan';

interface TabShellProps {
    children: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
    placeholder?: string;
    sortOptions: SortOption[];
    showFilters?: boolean;
    onFilterClick?: () => void;
    isFiltersOpen?: boolean;
    hasActiveFilters?: boolean;
    activeFilterCount?: number;
    dropdownContent?: React.ReactNode;
    theme?: TabThemeColor;
    scaleValue?: number;
    onScaleChange?: (val: number) => void;
    scaleMode?: 'multiplier' | 'grams';
    filterChildren?: React.ReactNode;
    dropdownOptions?: { id: string; label: string; icon: React.ReactNode; onClick: () => void; active?: boolean }[];
}

const themeStyles = {
    emerald: {
        text: 'text-emerald-500',
        hoverText: 'hover:text-emerald-500',
        ring: 'focus:ring-emerald-500/20',
        bg: 'bg-emerald-600',
        bgSubtle: 'bg-emerald-600/10',
        shadow: 'shadow-emerald-500/20',
        borderPulse: 'border-emerald-600 bg-emerald-500'
    },
    blue: {
        text: 'text-blue-500',
        hoverText: 'hover:text-blue-500',
        ring: 'focus:ring-blue-500/20',
        bg: 'bg-indigo-600',
        bgSubtle: 'bg-indigo-600/10',
        shadow: 'shadow-indigo-500/20',
        borderPulse: 'border-indigo-600 bg-indigo-500'
    },
    cyan: {
        text: 'text-cyan-500',
        hoverText: 'hover:text-cyan-500',
        ring: 'focus:ring-cyan-500/20',
        bg: 'bg-cyan-600',
        bgSubtle: 'bg-cyan-600/10',
        shadow: 'shadow-cyan-500/20',
        borderPulse: 'border-cyan-600 bg-cyan-500'
    }
};

export function TabShell({
    children,
    searchQuery,
    onSearchChange,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    title,
    placeholder,
    sortOptions,
    showFilters = false,
    onFilterClick,
    isFiltersOpen = false,
    hasActiveFilters = false,
    activeFilterCount = 0,
    dropdownContent,
    theme = 'blue',
    scaleValue,
    onScaleChange,
    scaleMode = 'multiplier',
    filterChildren,
    dropdownOptions,
}: TabShellProps) {
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isScaleExpanded, setIsScaleExpanded] = useState(false);
    const [isDropdownExpanded, setIsDropdownExpanded] = useState(false);
    const [internalScale, setInternalScale] = useState(scaleMode === 'grams' ? 100 : 1);
    const [gramInputValue, setGramInputValue] = useState('');
    const [gramUnit, setGramUnit] = useState<'g' | 'kg'>('g');
    const [isMobile, setIsMobile] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const gramInputRef = useRef<HTMLInputElement>(null);
    const t = themeStyles[theme];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const currentScale = scaleValue !== undefined ? scaleValue : internalScale;
    const handleScaleUpdate = (newVal: number) => {
        if (onScaleChange) onScaleChange(newVal);
        else setInternalScale(newVal);
    };

    // Auto-focus gram input when scale expanded in grams mode
    useEffect(() => {
        if (isScaleExpanded && scaleMode === 'grams' && gramInputRef.current) {
            // Determine best unit for current scale
            const unit = currentScale >= 1000 && currentScale % 1000 === 0 ? 'kg' : 'g';
            setGramUnit(unit);
            setGramInputValue(String(unit === 'kg' ? currentScale / 1000 : currentScale));
            
            gramInputRef.current.focus();
            gramInputRef.current.select();
        }
    }, [isScaleExpanded]);

    // Auto-focus search input when expanded
    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-none sm:rounded-[2rem] shadow-xl">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md rounded-none sm:rounded-t-[2rem]">
                <div className={cn(
                    "flex items-center justify-center px-4 py-4 md:px-6 md:py-5 min-h-[76px] w-full transition-all duration-500",
                    (isSearchExpanded || searchQuery || isScaleExpanded || showSortOptions || isDropdownExpanded) ? "gap-0" : "gap-2"
                )}>
                    {/* Animated Search Bar / Button */}
                    <div className={cn(
                        "transition-all duration-500 ease-in-out flex shrink-0",
                        (isSearchExpanded || searchQuery) 
                            ? "flex-1 max-w-[500px] opacity-100 mx-auto" 
                            : (isScaleExpanded || showSortOptions || isDropdownExpanded ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-11 opacity-100")
                    )}>
                        <div className={cn(
                            "relative w-full h-11 flex items-center bg-white/50 dark:bg-slate-900/50 rounded-2xl shadow-lg ring-1 ring-white/10 transition-colors",
                            (isSearchExpanded || searchQuery) ? "bg-white dark:bg-slate-800" : cn("cursor-pointer text-slate-500", t.hoverText)
                        )}
                        onClick={() => { if (!isSearchExpanded && !searchQuery) { setIsSearchExpanded(true); setIsScaleExpanded(false); } }}
                        >
                            <Search className={cn(
                                "absolute transition-all duration-300 pointer-events-none",
                                (isSearchExpanded || searchQuery) ? cn("left-4", t.text) : "left-1/2 -translate-x-1/2 text-slate-400"
                            )} size={14} />
                            
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={placeholder || `Search ${title.toLowerCase()}...`}
                                className={cn(
                                    "w-full h-full pl-11 pr-11 rounded-2xl text-[11px] font-bold tracking-tight bg-transparent outline-none transition-opacity duration-300",
                                    t.ring,
                                    (isSearchExpanded || searchQuery) ? "opacity-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" : "opacity-0 pointer-events-none"
                                )}
                            />
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSearchChange('');
                                    setIsSearchExpanded(false);
                                }}
                                className={cn(
                                    "absolute right-3 p-1 transition-all duration-300",
                                    (isSearchExpanded || searchQuery) ? "opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" : "opacity-0 pointer-events-none"
                                )}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Animated Scale Bar / Button */}
                    <div className={cn(
                        "transition-all duration-500 ease-in-out flex shrink-0",
                        isScaleExpanded 
                            ? "flex-1 max-w-[400px] opacity-100 ml-2" 
                            : ((isSearchExpanded || searchQuery || showSortOptions || isDropdownExpanded) ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-11 opacity-100 ml-2")
                    )}>
                        <div className={cn(
                            "relative w-full h-11 flex items-center bg-white/50 dark:bg-slate-900/50 justify-between rounded-2xl shadow-lg ring-1 ring-white/10 transition-colors",
                            isScaleExpanded ? "bg-white dark:bg-slate-800" : cn("cursor-pointer text-slate-500", t.hoverText)
                        )}>
                            {!isScaleExpanded ? (
                                <button 
                                    className={cn(
                                        "w-full h-full flex items-center justify-center outline-none shrink-0 transition-all rounded-2xl",
                                        (scaleMode === 'grams' ? currentScale !== 100 : currentScale !== 1) 
                                            ? cn("text-white", t.bg, t.shadow) 
                                            : cn("text-slate-500", t.hoverText)
                                    )} 
                                    onClick={() => { setIsScaleExpanded(true); setIsSearchExpanded(false); }}
                                >
                                    <Scale size={14} className={cn("transition-transform duration-300", (scaleMode === 'grams' ? currentScale !== 100 : currentScale !== 1) && "scale-110")} />
                                </button>
                            ) : scaleMode === 'grams' ? (
                                /* ── GRAMS MODE: free-type number input ── */
                                <>
                                    <div className={cn("h-11 w-11 flex items-center justify-center shrink-0 rounded-l-2xl", t.text)}>
                                        <Weight size={14} />
                                    </div>

                                    <div className="flex items-center flex-1 min-w-0 px-1 gap-0.5">
                                        <input
                                            ref={gramInputRef}
                                            type="number"
                                            min="1"
                                            max="9999"
                                            value={gramInputValue}
                                            onChange={(e) => {
                                                setGramInputValue(e.target.value);
                                            }}
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && val > 0) {
                                                    handleScaleUpdate(gramUnit === 'kg' ? val * 1000 : val);
                                                } else {
                                                    setGramInputValue(String(gramUnit === 'kg' ? currentScale / 1000 : currentScale));
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = parseFloat(gramInputValue);
                                                    if (!isNaN(val) && val > 0) {
                                                        handleScaleUpdate(gramUnit === 'kg' ? val * 1000 : val);
                                                        setIsScaleExpanded(false);
                                                    }
                                                }
                                                if (e.key === 'Escape') setIsScaleExpanded(false);
                                            }}
                                            className={cn(
                                                "w-full bg-transparent text-center text-sm font-black outline-none",
                                                t.text
                                            )}
                                        />
                                        <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-white/5 mx-1">
                                            {(['g', 'kg'] as const).map(u => (
                                                <button
                                                    key={u}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentVal = parseFloat(gramInputValue) || (gramUnit === 'kg' ? currentScale / 1000 : currentScale);
                                                        if (u === 'kg' && gramUnit === 'g') {
                                                            setGramUnit('kg');
                                                            setGramInputValue(String(currentVal / 1000));
                                                        } else if (u === 'g' && gramUnit === 'kg') {
                                                            setGramUnit('g');
                                                            setGramInputValue(String(currentVal * 1000));
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-1.5 py-0.5 text-[8px] font-black uppercase rounded transition-all",
                                                        gramUnit === u ? "bg-white text-slate-900" : "text-white/40 hover:text-white/60"
                                                    )}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {currentScale !== 100 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleScaleUpdate(100); setGramInputValue('100'); }}
                                            className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 px-1"
                                            title="Reset to 100g"
                                        >
                                            <RotateCcw size={12} className="text-slate-400 hover:text-slate-200" />
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsScaleExpanded(false); }}
                                        className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-r-2xl border-l border-white/5 dark:border-white/5 shrink-0"
                                    >
                                        <X size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                                    </button>
                                </>
                            ) : (
                                /* ── MULTIPLIER MODE: +/- stepper (default) ── */
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (currentScale > 0.5) handleScaleUpdate(currentScale - 0.5); }}
                                        className={cn("h-11 w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-l-2xl shrink-0", currentScale <= 0.5 ? 'opacity-30' : '')}
                                    >
                                        <Minus size={14} className={t.text} />
                                    </button>
                                    
                                    <div className="flex items-center justify-center gap-2 flex-1 min-w-[5rem]">
                                        <Users size={16} className={cn(t.text)} />
                                        <span className={cn("text-sm font-black leading-none", t.text)}>
                                            {currentScale}
                                        </span>
                                    </div>

                                    {currentScale !== 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleScaleUpdate(1); }}
                                            className="h-11 w-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                                            title="Reset to 1x"
                                        >
                                            <RotateCcw size={10} className="text-slate-400 hover:text-slate-200" />
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleScaleUpdate(currentScale + 0.5); }}
                                        className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                                    >
                                        <Plus size={14} className={t.text} />
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsScaleExpanded(false); }}
                                        className="h-11 w-11 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-r-2xl border-l border-white/5 dark:border-white/5 shrink-0"
                                    >
                                        <X size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Animated Sort Section */}
                    <div className={cn(
                        "transition-all duration-700 ease-in-out flex shrink-0",
                        showSortOptions 
                            ? "flex-1 max-w-[600px] opacity-100 ml-2" 
                            : ((isSearchExpanded || searchQuery || isScaleExpanded || isDropdownExpanded) ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-11 opacity-100 ml-2")
                    )}>
                        <div className={cn(
                            "relative w-full h-11 flex items-center bg-white/50 dark:bg-slate-900/50 justify-between rounded-2xl shadow-lg ring-1 ring-white/10 transition-all",
                            showSortOptions ? "bg-white dark:bg-slate-800 px-1.5 gap-1" : cn("cursor-pointer text-slate-500", t.hoverText)
                        )}
                        onClick={() => { if (!showSortOptions) { setShowSortOptions(true); setIsSearchExpanded(false); setIsScaleExpanded(false); setIsDropdownExpanded(false); } }}
                        >
                            {!showSortOptions ? (
                                <button className={cn(
                                    "w-full h-full flex items-center justify-center outline-none shrink-0 transition-all rounded-2xl",
                                    (sortField !== sortOptions[0]?.id || sortDirection !== 'asc')
                                        ? cn("text-white", t.bg, t.shadow)
                                        : cn("text-slate-500", t.hoverText)
                                )}>
                                    <ArrowDownUp size={14} className={cn("transition-transform duration-300", showSortOptions && "rotate-180")} />
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center flex-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
                                        {sortOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSort(opt.id);
                                                }}
                                                className={cn(
                                                    "h-8 px-3 rounded-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                                                    sortField === opt.id
                                                        ? cn(t.bg, "text-white shadow-lg")
                                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                )}
                                            >
                                                {opt.icon}
                                                <span className="hidden xs:inline">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 shrink-0 ml-1 pl-1 border-l border-slate-100 dark:border-slate-700">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}
                                            className={cn("h-8 w-8 flex items-center justify-center rounded-xl transition-all", t.text, "hover:bg-slate-100 dark:hover:bg-slate-700")}
                                        >
                                            <ArrowDownUp size={14} className={cn("transition-transform duration-300", sortDirection === 'desc' ? "rotate-180" : "")} />
                                        </button>
                                        
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowSortOptions(false); }}
                                            className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-xl"
                                        >
                                            <X size={14} className="text-slate-400" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Animated Dropdown Section */}
                    {dropdownContent && (
                        <div className={cn(
                            "transition-all duration-700 ease-in-out flex shrink-0",
                            isDropdownExpanded 
                                ? "flex-1 max-w-[600px] opacity-100 ml-2" 
                                : ((isSearchExpanded || searchQuery || isScaleExpanded || showSortOptions) ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-auto opacity-100 ml-2")
                        )}>
                            <div className={cn(
                                "relative h-11 flex items-center bg-white/50 dark:bg-slate-900/50 rounded-2xl shadow-lg ring-1 ring-white/10 transition-all",
                                isDropdownExpanded ? "w-full bg-white dark:bg-slate-800 px-1.5" : "w-auto"
                            )}>
                                {!isDropdownExpanded ? (
                                    <div 
                                        onClick={() => { setIsDropdownExpanded(true); setIsSearchExpanded(false); setIsScaleExpanded(false); setShowSortOptions(false); }}
                                        className="h-full w-full cursor-pointer flex items-center justify-center px-1"
                                    >
                                        <div className="origin-center">
                                            {dropdownContent}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center flex-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth px-1">
                                            {/* If we have specific options, show them horizontally */}
                                            {dropdownOptions ? (
                                                <>
                                                    <div className="shrink-0 scale-90 opacity-70">
                                                        {dropdownContent}
                                                    </div>
                                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
                                                    {dropdownOptions.map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                opt.onClick();
                                                                setIsDropdownExpanded(false);
                                                            }}
                                                            className={cn(
                                                                "h-8 px-3 rounded-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                                                                opt.active
                                                                    ? cn(t.bg, "text-white shadow-lg")
                                                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                            )}
                                                        >
                                                            {opt.icon}
                                                            <span className="hidden xs:inline">{opt.label}</span>
                                                        </button>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="flex-1 min-w-0 py-1">
                                                    {dropdownContent}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsDropdownExpanded(false)}
                                            className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-xl shrink-0 ml-1"
                                        >
                                            <X size={14} className="text-slate-400" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Controls Group */}
                    <div className={cn(
                        "flex items-center gap-2 flex-nowrap transition-all duration-500 ease-in-out shrink-0",
                        (isSearchExpanded || searchQuery || isScaleExpanded || showSortOptions || isDropdownExpanded) 
                            ? "max-w-0 opacity-0 !gap-0 overflow-hidden" 
                            : "max-w-[400px] opacity-100 overflow-visible"
                    )}>
                        {/* Filter Button */}
                        {showFilters && (
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onFilterClick?.();
                                }}
                                title={isFiltersOpen ? "Close Filters" : "Open Filters"}
                                className={cn(
                                    "shrink-0 relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-white/10 z-[40]",
                                    isFiltersOpen
                                        ? "bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-700"
                                        : (hasActiveFilters || activeFilterCount > 0)
                                            ? "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700"
                                            : cn("bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400", t.hoverText)
                                )}
                            >
                                {isFiltersOpen ? (
                                    <X size={14} className="text-white" />
                                ) : (
                                    <Filter size={14} className={(hasActiveFilters || activeFilterCount > 0) ? 'text-white' : 'text-slate-400'} />
                                )}
                                
                                {(activeFilterCount > 0 && !isFiltersOpen) && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-emerald-500/10 shadow-sm">
                                        {activeFilterCount}
                                    </span>
                                )}
                                
                                {(hasActiveFilters && activeFilterCount === 0 && !isFiltersOpen) && (
                                    <span className={cn("absolute top-2.5 right-2.5 h-2 w-2 rounded-full animate-pulse border", t.borderPulse)} />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {(isFiltersOpen && isMobile && filterChildren) ? (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                        {filterChildren}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
