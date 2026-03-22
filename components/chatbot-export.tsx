'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, Loader2, Share2, Search, X, Check, ArrowLeft } from 'lucide-react';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';
import { cn } from '@/lib/utils';
import { ChatbotShare } from './chatbot-share';

interface ChatbotExportProps {
    onBack: () => void;
}

export function ChatbotExport({ onBack }: ChatbotExportProps) {
    const { user, fetchRecipes, loading: authLoading } = useDataPersistence();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        const loadRecipes = async () => {
            if (authLoading) return;
            setLoading(true);
            try {
                const { recipes: allRecipes } = await fetchRecipes({
                    page: 0,
                    pageSize: 1000,
                    includeDetails: false
                });

                // Filter for user's own recipes
                const userRecipes = allRecipes.filter(r => {
                    if (user) {
                        return r.user_id === user.id && !r.is_curated;
                    } else {
                        return r.id.toString().startsWith('local-') || !r.user_id;
                    }
                });

                setRecipes(userRecipes);
            } catch (err) {
                console.error('Error loading recipes for export:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRecipes();
    }, [user, authLoading]);

    const filteredRecipes = recipes.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 leading-none">Export Section</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Select a recipe to share</p>
                </div>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search your recipes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-cyan-500" size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Preparing your library...</p>
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                            <ChefHat size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                            {searchQuery ? "No matches found" : "Your library is empty"}
                        </p>
                        <p className="text-xs text-slate-500">
                            {searchQuery ? "Try a different search term" : "Add some recipes to your library first!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-2 mb-20">
                        {filteredRecipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => setSelectedRecipe(recipe)}
                                className="group relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 transition-all cursor-pointer hover:border-cyan-400/50 hover:shadow-lg active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Thumbnail */}
                                    <div className="aspect-square w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ChefHat size={20} className="opacity-10" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                            {recipe.title}
                                        </h3>
                                        {recipe.calories && (
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {recipe.calories} kcal • {recipe.prep_time || '-'} min
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Icon */}
                                    <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                                        <Share2 size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Dialog Overlay */}
            {selectedRecipe && (
                <ChatbotShare
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}
        </div>
    );
}
