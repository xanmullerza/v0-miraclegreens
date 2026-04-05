'use client';

import React, { useState } from 'react';
import { Search, X, ArrowDownUp, Filter, List, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';

export interface SortOption {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface TrackerTabShellProps {
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
}

export function TrackerTabShell({
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
    dropdownContent
}: TrackerTabShellProps) {
    const { isActionPanelOpen, activeView } = useActionPanel();
    const [showSortOptions, setShowSortOptions] = useState(false);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const currentSortLabel = sortOptions.find(opt => opt.id === sortField)?.label.split(' ')[0] || 'Sort';

    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-none sm:rounded-[2rem] shadow-xl">

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md rounded-none sm:rounded-t-[2rem]">
                <div className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-5">
                    
                    {/* Search Bar - Main Focus on Left */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={placeholder || `Search ${title.toLowerCase()}...`}
                            className="w-full h-11 pl-11 pr-4 rounded-[1.25rem] text-[11px] font-bold tracking-tight transition-all duration-300 outline-none bg-white/50 dark:bg-slate-900/50 shadow-inner border border-slate-200/50 dark:border-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Controls Hub - Right Side */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Filter Button (Optional) */}
                        {showFilters && (
                            <button 
                                onClick={onFilterClick}
                                className={cn(
                                    "relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-white/10",
                                    (hasActiveFilters || activeFilterCount > 0)
                                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500"
                                )}
                            >
                                <Filter size={14} className={(hasActiveFilters || activeFilterCount > 0) ? 'text-white' : 'text-slate-400'} />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-emerald-500/10 shadow-sm">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortOptions(!showSortOptions)}
                                className={cn(
                                    "relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ring-1 ring-white/10",
                                    showSortOptions
                                        ? "bg-indigo-600 text-white shadow-indigo-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-indigo-500"
                                )}
                            >
                                <ArrowDownUp size={14} className={showSortOptions ? 'text-white' : 'text-slate-400'} />
                            </button>

                            {showSortOptions && (
                                <div className="absolute right-0 top-full mt-3 w-44 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl z-20 p-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
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
                                                    ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"
                                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <span className="shrink-0">{opt.icon}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dropdown Action - Now on the far right */}
                        {dropdownContent && (
                            <div className="shrink-0">
                                {dropdownContent}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="space-y-2 p-4">
                {children}
            </div>
        </div>
    );
}
