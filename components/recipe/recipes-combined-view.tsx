'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';
import { Lock, Globe, Sparkles, Zap, ChevronDown, Plus, Upload, Share2, Download } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';

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
    const { navigateTo } = useActionPanel();


    const filterOptions: { value: RecipeFilter; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'all', label: 'All Recipes', icon: <Globe size={12} />, color: 'emerald' },
        { value: 'remixes', label: 'Remixes', icon: <Sparkles size={12} />, color: 'violet' },
        { value: 'my-recipes', label: 'My Recipes', icon: <Lock size={12} />, color: 'indigo' },
        { value: 'mixes', label: 'Mixes', icon: <Zap size={12} />, color: 'amber' },
    ];

    const currentFilter = filterOptions.find(f => f.value === recipeFilter);

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
                        className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                        <ChevronDown size={14} className={cn("transition-transform duration-300", showFilterMenu && "rotate-180")} />
                        <span>Actions</span>
                    </button>
                    {showFilterMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-20 p-1 min-w-[180px]">
                            <button
                                onClick={() => {
                                    navigateTo('recipe-builder');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                            >
                                <Plus size={12} />
                                Create Recipe
                            </button>
                            <button
                                onClick={() => {
                                    navigateTo('import');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
                            >
                                <Upload size={12} />
                                Import Recipe
                            </button>
                            <button
                                onClick={() => {
                                    navigateTo('export-recipes');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all"
                            >
                                <Download size={12} />
                                Export
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
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
