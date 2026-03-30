'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';
import { Lock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipesCombinedViewProps {
    onRecipeClick?: (recipeId: string) => void;
    isPremium?: boolean;
}

export function RecipesCombinedView({ onRecipeClick, isPremium }: RecipesCombinedViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showPrivateOnly, setShowPrivateOnly] = useState(false);

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
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white/50 dark:bg-slate-900/50">
                    <button
                        onClick={() => setShowPrivateOnly(false)}
                        className={cn(
                            "h-7 px-3 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                            !showPrivateOnly
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        title="Show public recipes"
                    >
                        <Globe size={12} />
                        <span className="hidden sm:inline">Public</span>
                    </button>
                    <button
                        onClick={() => setShowPrivateOnly(true)}
                        className={cn(
                            "h-7 px-3 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                            showPrivateOnly
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        title="Show only my recipes"
                    >
                        <Lock size={12} />
                        <span className="hidden sm:inline">Private</span>
                    </button>
                </div>
            }
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
                onlyMyRecipes={showPrivateOnly}
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
