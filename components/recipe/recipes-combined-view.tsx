'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';
import { Lock, Globe, Sparkles, Zap, ChevronDown, Plus, Upload, Share2, Download, BookOpen } from 'lucide-react';
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
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const { navigateTo, activeView } = useActionPanel();

    // Close menu when navigating elsewhere
    React.useEffect(() => {
        setShowFilterMenu(false);
    }, [activeView]);

    return (
        <RecipeTabShell
            title="Cookbook"
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
                        className="h-11 flex items-center rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg bg-emerald-600 shadow-emerald-500/20 overflow-hidden ring-1 ring-white/10 shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center justify-center w-11 h-full z-10 transition-colors">
                            <BookOpen size={14} />
                        </div>
                        <div className="flex items-center justify-center h-full px-3 border-l border-white/20 bg-black/10">
                            <ChevronDown size={14} className={cn("transition-transform duration-300", showFilterMenu && "rotate-180")} />
                        </div>
                    </button>

                    {showFilterMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-20 p-1 min-w-[180px]">
                            <button
                                onClick={() => {
                                    navigateTo('recipe-builder');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all font-black"
                            >
                                <Plus size={12} />
                                Create Recipe
                            </button>
                            <button
                                onClick={() => {
                                    navigateTo('import');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all font-black"
                            >
                                <Upload size={12} />
                                Import Recipe
                            </button>
                            <button
                                onClick={() => {
                                    navigateTo('export-recipes');
                                    setShowFilterMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all font-black"
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
