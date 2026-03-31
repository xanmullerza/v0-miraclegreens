'use client';

import React, { useState } from 'react';
import { Search, X, ArrowDownUp, Filter } from 'lucide-react';
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
    activeFilterCount = 0
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
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 rounded-t-[2rem]">
                <div className="flex items-center gap-4 px-6 py-4 w-full">
                    {/* Filter Button (Optional) */}
                    {showFilters && (
                        <button 
                            onClick={onFilterClick}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border relative shadow-sm",
                                (hasActiveFilters || activeFilterCount > 0)
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
                            )}
                            title="Filters"
                        >
                            <Filter size={13} />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[7px] font-black rounded-full border border-white dark:border-slate-900">
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
                                "h-9 px-4 rounded-xl flex items-center gap-2 transition-all border text-[10px] font-black uppercase tracking-widest",
                                showSortOptions
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200"
                                    : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                            )}
                            title="Sort Options"
                        >
                            <ArrowDownUp size={13} />
                            <span>{currentSortLabel}</span>
                        </button>

                        {showSortOptions && (
                            <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-20 p-1.5">
                                {sortOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            handleSort(opt.id);
                                            setShowSortOptions(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                            sortField === opt.id
                                                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600"
                                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {opt.icon}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={placeholder || `Search ${title.toLowerCase()}...`}
                            className={cn(
                                "w-full h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Clear search"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Title Label */}
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50 whitespace-nowrap ml-auto">
                        {title.toUpperCase()} LIBRARY
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
