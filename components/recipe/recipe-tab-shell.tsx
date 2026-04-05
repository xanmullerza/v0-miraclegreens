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
        <div className="w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] shadow-xl overflow-hidden">

            <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md">

                <div className="px-4 py-4 sm:px-6 sm:py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        {/* Search - Growing to fill space */}
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={14} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={`Search ${title.toLowerCase()}...`}
                                className="w-full h-11 pl-11 pr-4 rounded-[1.25rem] text-[11px] font-bold tracking-tight transition-all duration-300 outline-none bg-white/50 dark:bg-slate-900/50 shadow-inner border border-slate-200/50 dark:border-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20"
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

                        {/* Controls Group - Consolidated on the Right */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Filter Button */}
                            <button
                                onClick={() => {
                                    setActiveView('recipe-filters');
                                    setIsActionPanelOpen(true);
                                }}
                                className={cn(
                                    "h-11 px-6 rounded-2xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ring-1 ring-white/10",
                                    (hasActiveFilters || (isActionPanelOpen && activeView === 'recipe-filters'))
                                        ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-emerald-500"
                                )}
                            >
                                <Filter size={14} className={(hasActiveFilters || (isActionPanelOpen && activeView === 'recipe-filters')) ? 'text-white' : 'text-slate-400'} />
                                <span>Filter</span>
                                {hasActiveFilters && (
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </button>

                            {/* Sort Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortOptions(!showSortOptions)}
                                    className={cn(
                                        "h-11 px-6 rounded-2xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ring-1 ring-white/10",
                                        showSortOptions
                                            ? "bg-indigo-600 text-white shadow-indigo-500/20"
                                            : "bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:text-indigo-500"
                                    )}
                                >
                                    <ArrowDownUp size={14} className={showSortOptions ? 'text-white' : 'text-slate-400'} />
                                    <span>{getRecipeSortLabel(sortField)}</span>
                                </button>

                                {showSortOptions && (
                                    <div className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl z-[100] p-2 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
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
                                                        ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
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
                            {additionalControls && (
                                <div className="flex items-center">
                                    {additionalControls}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                {children}
            </div>
        </div>
    );
}
