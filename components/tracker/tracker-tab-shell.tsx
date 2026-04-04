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
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] shadow-xl">

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-[2rem]">

                <div className="flex items-center gap-4 px-6 py-4 w-full">
                    {/* Filter Button (Optional) */}
                    {showFilters && (
                        <button 
                            onClick={onFilterClick}
                            className={cn(
                                (hasActiveFilters || activeFilterCount > 0)
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                    : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400"

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
                                "h-9 px-4 rounded-xl flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest",
                                showSortOptions
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                                    : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400"

                            )}
                            title="Sort Options"
                        >
                            <ArrowDownUp size={13} />
                            <span>{currentSortLabel}</span>
                        </button>

                        {showSortOptions && (
                            <div className="absolute left-0 top-full mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-20 p-1.5">

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
                                "bg-white/50 dark:bg-slate-900/50",
                                "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                "focus:bg-white dark:focus:bg-slate-800 focus:ring-0"

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

                    {/* Dropdown Action Slot */}
                    {dropdownContent && (
                        <div className="ml-auto shrink-0">
                            {dropdownContent}
                        </div>
                    )}
                </div>
            </div>

            {/* List Content */}
            <div className="space-y-2 p-4">
                {children}
            </div>
        </div>
    );
}
