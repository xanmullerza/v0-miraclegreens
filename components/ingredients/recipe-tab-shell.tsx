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
        <div className="space-y-0">
            {/* Tab Search/Filter UI */}
            <div className="bg-background/80 backdrop-blur-md py-8 px-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-5xl mx-auto">
                    {/* Search Bar */}
                    <div className="relative w-full sm:flex-1 max-w-2xl group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="w-full pl-14 pr-12 py-4 bg-slate-950/40 dark:bg-slate-900/60 border border-white/5 rounded-full text-xs font-black uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-600 transition-all shadow-xl group-hover:border-white/10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Sort Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortOptions(!showSortOptions)}
                                className={cn(
                                    "px-6 py-4 rounded-full transition-all flex items-center gap-3 border shadow-xl outline-none text-[10px] font-black uppercase tracking-[0.2em]",
                                    showSortOptions
                                        ? "bg-slate-800 text-emerald-400 border-emerald-500/30"
                                        : "bg-slate-950/40 dark:bg-slate-900/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800"
                                )}
                            >
                                <ArrowDownUp size={18} className={showSortOptions ? 'text-emerald-400' : 'text-slate-500'} />
                                <span>
                                    {sortField === 'title' ? 'A-Z' : sortField === 'prep_time' ? 'Time' : sortField === 'calories' ? 'Cal' : 'Diff'}
                                </span>
                            </button>

                            {showSortOptions && (
                                <div className="absolute top-full right-0 mt-3 w-48 bg-slate-900 rounded-[2rem] shadow-2xl border border-white/10 z-[100] p-2 animate-in fade-in zoom-in-95 duration-200">
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
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                                            )}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Filter Button */}
                        <button 
                            onClick={() => {
                                setChatbotView('recipe-filters');
                                setIsChatbotOpen(true);
                            }}
                            className={cn(
                                "px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 border shadow-xl outline-none",
                                (hasActiveFilters || (isChatbotOpen && chatbotView === 'recipe-filters'))
                                    ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
                                    : "bg-slate-950/40 dark:bg-slate-900/60 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <Filter size={18} className={(hasActiveFilters || (isChatbotOpen && chatbotView === 'recipe-filters')) ? 'text-white' : 'text-slate-500'} />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
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
