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
    hasActiveFilters?: boolean;
    activeFilterCount?: number;
    dropdownContent?: React.ReactNode;
    theme?: TabThemeColor;
    scaleValue?: number;
    onScaleChange?: (val: number) => void;
    scaleMode?: 'multiplier' | 'grams';
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
    hasActiveFilters = false,
    activeFilterCount = 0,
    dropdownContent,
    theme = 'blue',
    scaleValue,
    onScaleChange,
    scaleMode = 'multiplier',
}: TabShellProps) {
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isScaleExpanded, setIsScaleExpanded] = useState(false);
    const [internalScale, setInternalScale] = useState(scaleMode === 'grams' ? 100 : 1);
    const [gramInputValue, setGramInputValue] = useState('');
    const [gramUnit, setGramUnit] = useState<'g' | 'kg'>('g');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const gramInputRef = useRef<HTMLInputElement>(null);
    const t = themeStyles[theme];

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
                <div className="flex items-center justify-center px-4 py-4 md:px-6 md:py-5 min-h-[76px] w-full gap-2">
                    {/* Animated Search Bar / Button */}
                    <div className={cn(
                        "transition-all duration-500 ease-in-out flex shrink-0",
                        (isSearchExpanded || searchQuery) ? "flex-1 max-w-[500px] opacity-100" : (isScaleExpanded ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-11 opacity-100")
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
                        isScaleExpanded ? "flex-1 max-w-[400px] opacity-100 ml-2" : ((isSearchExpanded || searchQuery) ? "max-w-0 opacity-0 overflow-hidden !ml-0" : "w-11 opacity-100 ml-2")
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
                                    
                                    <div className="flex flex-col items-center justify-center flex-1 min-w-[3rem]">
                                        <Users size={12} className={cn("mb-0.5", t.text)} />
                                        <span className={cn("text-[10px] font-black leading-none", t.text)}>
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

                    {/* Controls Group */}
                    <div className={cn(
                        "flex items-center gap-2 flex-nowrap transition-all duration-500 ease-in-out shrink-0",
                        (isSearchExpanded || searchQuery || isScaleExpanded) 
                            ? "max-w-0 opacity-0 !gap-0 overflow-hidden" 
                            : "max-w-[400px] opacity-100 overflow-visible"
                    )}>
                        {/* Filter Button */}
                        {showFilters && (
                            <button 
                                onClick={onFilterClick}
                                className={cn(
                                    "shrink-0 relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-white/10",
                                    (hasActiveFilters || activeFilterCount > 0)
                                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                        : cn("bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400", t.hoverText)
                                )}
                            >
                                <Filter size={14} className={(hasActiveFilters || activeFilterCount > 0) ? 'text-white' : 'text-slate-400'} />
                                
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-emerald-500/10 shadow-sm">
                                        {activeFilterCount}
                                    </span>
                                )}
                                
                                {(hasActiveFilters && activeFilterCount === 0) && (
                                    <span className={cn("absolute top-2.5 right-2.5 h-2 w-2 rounded-full animate-pulse border", t.borderPulse)} />
                                )}
                            </button>
                        )}

                        {/* Sort Button */}
                        <div className="relative shrink-0">
                             <button
                                onClick={() => setShowSortOptions(!showSortOptions)}
                                className={cn(
                                    "relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-white/10",
                                    (showSortOptions || (sortField !== sortOptions[0]?.id || sortDirection !== 'asc'))
                                        ? cn("text-white", t.bg, t.shadow)
                                        : cn("bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400", t.hoverText)
                                )}
                            >
                                <ArrowDownUp size={14} className={(showSortOptions || (sortField !== sortOptions[0]?.id || sortDirection !== 'asc')) ? 'text-white' : 'text-slate-400'} />
                            </button>

                            {showSortOptions && (
                                <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl z-[100] p-2 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                    {sortOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                handleSort(opt.id);
                                                setShowSortOptions(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                                                sortField === opt.id
                                                    ? cn(t.bgSubtle, t.text)
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dropdown Action Wrapper */}
                        {dropdownContent && (
                            <div className="flex items-center shrink-0">
                                {dropdownContent}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {children}
            </div>
        </div>
    );
}
