'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';
import { Lock, Globe, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type RecipeFilter = 'all' | 'remixes' | 'my-recipes' | 'mixes';

interface RecipesCombinedViewProps {
    onRecipeClick?: (recipeId: string) => void;
    isPremium?: boolean;
}

export function RecipesCombinedView({ onRecipeClick, isPremium }: RecipesCombinedViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const filterOptions: { value: RecipeFilter; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'all', label: 'All Recipes', icon: <Globe size={12} />, color: 'emerald' },
        { value: 'remixes', label: 'Remixes', icon: <Sparkles size={12} />, color: 'violet' },
        { value: 'my-recipes', label: 'My Recipes', icon: <Lock size={12} />, color: 'indigo' },
        { value: 'mixes', label: 'Mixes', icon: <Zap size={12} />, color: 'amber' },
    ];

    const currentFilter = filterOptions.find(f => f.value === recipeFilter);

    const getFilterProps = () => {
        switch (recipeFilter) {
            case 'remixes':
                return { isRemix: true, onlyMyRecipes: false, isMix: false };
            case 'my-recipes':
                return { isRemix: undefined, onlyMyRecipes: true, isMix: undefined };
            case 'mixes':
                return { isRemix: false, onlyMyRecipes: false, isMix: true };
            default:
                return { isRemix: undefined, onlyMyRecipes: false, isMix: undefined };
        }
    };

    return (
        <RecipeTabShell
            title="Recipes"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            additionalControls={
                <div className="relative">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={cn(
                            "h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2",
                            recipeFilter === 'all'
                                ? `bg-emerald-600 text-white shadow-lg shadow-emerald-500/20`
                                : recipeFilter === 'remixes'
                                ? `bg-violet-600 text-white shadow-lg shadow-violet-500/20`
                                : recipeFilter === 'my-recipes'
                                ? `bg-indigo-600 text-white shadow-lg shadow-indigo-500/20`
                                : `bg-amber-600 text-white shadow-lg shadow-amber-500/20`
                        )}

                    >
                        {currentFilter?.icon && React.cloneElement(currentFilter.icon as any, { className: "animate-pulse" })}
                        <span>{currentFilter?.label}</span>
                        <ChevronDown size={10} className={cn("transition-transform duration-300", showFilterMenu && "rotate-180")} />
                    </button>
                    {showFilterMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-20 p-1 min-w-[180px]">

                            {filterOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setRecipeFilter(option.value);
                                        setShowFilterMenu(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        recipeFilter === option.value
                                            ? `bg-${option.color}-600 text-white`
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    )}
                                >
                                    {option.icon}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            }
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
                {...getFilterProps()}
                hideControls={true}
                noContainer={true}
                searchQuery={searchQuery}
                sortField={sortField}
                sortDirection={sortDirection}
                isPremium={isPremium}
            />
        </RecipeTabShell>
    );
}
