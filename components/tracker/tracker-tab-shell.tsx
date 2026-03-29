'use client';

import React, { useState } from 'react';
import { Search, X, ArrowDownUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/lib/context/chatbot-context';

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
    hasActiveFilters = false
}: TrackerTabShellProps) {
    const { isChatbotOpen, chatbotView } = useChatbot();
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
        <div className="space-y-0">
            {/* Premium Controls Row */}
            <div className="sticky top-[72px] z-30 bg-background/80 backdrop-blur-xl py-4 px-4 border-b border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto bg-slate-950/40 dark:bg-slate-900/60 p-1.5 rounded-[2rem] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
                    <div className="flex items-center min-w-[140px] py-3 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 bg-slate-800/80 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] ring-1 ring-white/10">
                        {title}
                    </div>
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-2 py-2">
                        {/* Search Bar */}
                        <div className="relative w-full max-w-md">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={placeholder || `Search ${title.toLowerCase()}...`}
                            className="w-full pl-10 pr-10 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-800/20 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400 transition-all shadow-sm"
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
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortOptions(!showSortOptions)}
                                className={cn(
                                    "p-2 rounded-xl transition-all flex items-center gap-2 border shadow-sm outline-none",
                                    showSortOptions
                                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200"
                                        : "bg-white dark:bg-slate-800 border-emerald-800/20 text-slate-400 hover:text-indigo-500 hover:border-indigo-200"
                                )}
                                title="Sort Options"
                            >
                                <ArrowDownUp size={18} />
                                <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">
                                    {currentSortLabel}
                                </span>
                            </button>

                            {showSortOptions && (
                                <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {sortOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                handleSort(opt.id);
                                                setShowSortOptions(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
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

                        {/* Filter Button (Optional) */}
                        {showFilters && (
                            <button 
                                onClick={onFilterClick}
                                className={cn(
                                    "p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border shadow-sm outline-none",
                                    (hasActiveFilters || (isChatbotOpen && chatbotView === 'recipe-filters'))
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                                        : "bg-white dark:bg-slate-800 border-emerald-800/20 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-blue-200 hover:text-blue-600"
                                )}
                                title="Filters"
                            >
                                <Filter size={18} />
                                <span className="hidden lg:inline">Filters</span>
                                {hasActiveFilters && (
                                    <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-hidden pt-8">
                {children}
            </div>
        </div>
    );
}
