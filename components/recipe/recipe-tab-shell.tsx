'use client';

import React, { useState } from 'react';
import { Search, X, ArrowDownUp, Filter, Clock, ChefHat, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/lib/context/chatbot-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';

interface RecipeTabShellProps {
    children: React.ReactNode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortField: string;
    setSortField: (field: string) => void;
    sortDirection: 'asc' | 'desc';
    setSortDirection: (dir: 'asc' | 'desc') => void;
    title: string;
}

export function RecipeTabShell({
    children,
    searchQuery,
    onSearchChange,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    title
}: RecipeTabShellProps) {
    const { setIsChatbotOpen, setChatbotView, isChatbotOpen, chatbotView } = useChatbot();
    const { hasActiveFilters } = useRecipeFilter();
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
                <div className="px-4 py-5 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => {
                                    setChatbotView('recipe-filters');
                                    setIsChatbotOpen(true);
                                }}
                                className={cn(
                                    "h-9 px-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 border",
                                    (hasActiveFilters || (isChatbotOpen && chatbotView === 'recipe-filters'))
                                        ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600"
                                )}
                            >
                                <Filter size={14} className={(hasActiveFilters || (isChatbotOpen && chatbotView === 'recipe-filters')) ? 'text-white' : 'text-slate-500'} />
                                <span>Filters</span>
                                {hasActiveFilters && (
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowSortOptions(!showSortOptions)}
                                    className={cn(
                                        "h-9 px-4 rounded-full transition-all flex items-center gap-2 border text-[10px] font-black uppercase tracking-[0.2em]",
                                        showSortOptions
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                                    )}
                                >
                                    <ArrowDownUp size={16} className={showSortOptions ? 'text-emerald-500' : 'text-slate-500'} />
                                    <span>
                                        {sortField === 'title' ? 'A-Z' : sortField === 'prep_time' ? 'Time' : sortField === 'calories' ? 'Cal' : 'Diff'}
                                    </span>
                                </button>

                                {showSortOptions && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-950 rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-[100] p-2">
                                        {[
                                            { id: 'title', label: 'Title (A-Z)', icon: <ArrowDownUp size={14} /> },
                                            { id: 'prep_time', label: 'Prep Time', icon: <Clock size={14} /> },
                                            { id: 'difficulty', label: 'Difficulty', icon: <ChefHat size={14} /> },
                                            { id: 'calories', label: 'Calories', icon: <Flame size={14} /> }
                                        ].map((opt) => (
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

                            <div className="relative flex-1 min-w-[180px] sm:min-w-[260px] max-w-[520px] group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search size={16} className="text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={`Search ${title.toLowerCase()}...`}
                                    className="w-full h-9 pl-12 pr-10 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all shadow-sm"
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

                        <div className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/70">
                            {title === 'Library' ? 'Recipe Library' : title}
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
