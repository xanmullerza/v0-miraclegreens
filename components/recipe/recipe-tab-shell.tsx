'use client';

import React, { useState } from 'react';
import { Search, X, ArrowDownUp, Filter, Clock, ChefHat, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { Loader2 } from 'lucide-react';

interface RecipeTabShellProps {
    children: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
    additionalControls?: React.ReactNode;
}

const RECIPE_SORT_OPTIONS = [
    { id: 'title', label: 'Title (A-Z)', icon: <ArrowDownUp size={14} /> },
    { id: 'prep_time', label: 'Prep Time', icon: <Clock size={14} /> },
    { id: 'difficulty', label: 'Difficulty', icon: <ChefHat size={14} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={14} /> }
] as const;

const getRecipeSortLabel = (field: string) => {
    switch (field) {
        case 'title': return 'A-Z';
        case 'prep_time': return 'Time';
        case 'difficulty': return 'Diff';
        case 'calories': return 'Cal';
        default: return 'Sort';
    }
};

export function RecipeTabShell({
    children,
    searchQuery,
    onSearchChange,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    title,
    additionalControls
}: RecipeTabShellProps) {
    const { setIsActionPanelOpen, setActiveView, isActionPanelOpen, activeView } = useActionPanel();
    const { filters, hasActiveFilters, updateFilter } = useRecipeFilter();
    const [showSortOptions, setShowSortOptions] = useState(false);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="px-4 py-4 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <button
                                onClick={() => {
                                    setActiveView('recipe-filters');
                                    setIsActionPanelOpen(true);
                                }}
                                className={cn(
                                    "h-9 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 border shadow-sm",
                                    (hasActiveFilters || (isActionPanelOpen && activeView === 'recipe-filters'))
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
                                )}
                            >
                                <Filter size={14} className={(hasActiveFilters || (isActionPanelOpen && activeView === 'recipe-filters')) ? 'text-white' : 'text-slate-300'} />
                                <span>Filter</span>
                                {hasActiveFilters && (
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowSortOptions(!showSortOptions)}
                                    className={cn(
                                        "h-9 px-4 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                        showSortOptions
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200"
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                                    )}
                                >
                                    <ArrowDownUp size={16} className={showSortOptions ? 'text-emerald-500' : 'text-slate-300'} />
                                    <span>
                                        {getRecipeSortLabel(sortField)}
                                    </span>
                                </button>

                                {showSortOptions && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-950 rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] p-2">
                                        {RECIPE_SORT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    handleSort(opt.id);
                                                    setShowSortOptions(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                                                    sortField === opt.id
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                                                )}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative flex-1 min-w-[180px] md:w-64 group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search size={13} className="text-slate-400 dark:text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={`Search ${title.toLowerCase()}...`}
                                    className="w-full h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0 shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => onSearchChange('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {additionalControls && (
                            <div className="flex items-center">
                                {additionalControls}
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
