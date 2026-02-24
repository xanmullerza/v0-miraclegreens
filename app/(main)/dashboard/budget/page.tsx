'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Search, ChefHat, ArrowRight, X, Sparkles, Loader2, Utensils, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { searchLocalFood } from '@/lib/services/nutrition';
import { toast } from 'sonner';
import Link from 'next/link';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

export default function BudgetModePage() {
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroResults, setHeroResults] = useState<any[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const heroSearchTimeoutRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

    const performLocalSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setHeroResults([]);
            return;
        }
        setIsHeroSearching(true);
        try {
            const results = await searchLocalFood(query);
            setHeroResults(results);
        } catch (error) {
            console.error('Local search error:', error);
        } finally {
            setIsHeroSearching(false);
        }
    };

    const handleHeroSearchInput = (val: string) => {
        setHeroSearchQuery(val);
        if (heroSearchTimeoutRef.current) clearTimeout(heroSearchTimeoutRef.current);
        heroSearchTimeoutRef.current = setTimeout(() => performLocalSearch(val), 300);
    };

    const addIngredient = (name: string) => {
        const trimmed = name.trim();
        if (trimmed && !ingredients.includes(trimmed)) {
            setIngredients([...ingredients, trimmed]);
            setHeroSearchQuery('');
            setHeroResults([]);
            setIsHeroActive(false);
        }
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const findMeals = async () => {
        if (ingredients.length === 0) {
            toast.error("Add some ingredients first!");
            return;
        }

        setIsSearching(true);
        setHasSearched(true);
        try {
            const { data: recipes, error } = await supabase
                .from('recipes')
                .select('*, ingredients(*)');

            if (error) throw error;

            const scored = recipes.map(recipe => {
                let matchCount = 0;
                const recipeIngredientNames = recipe.ingredients?.map((i: any) => i.item.toLowerCase()) || [];
                const recipeTitle = recipe.title.toLowerCase();

                ingredients.forEach(myIng => {
                    const search = myIng.toLowerCase();
                    if (recipeTitle.includes(search)) matchCount += 2;
                    if (recipeIngredientNames.some((ri: string) => ri.includes(search))) matchCount += 1;
                });

                return { ...recipe, matchCount };
            }).filter(r => r.matchCount > 0)
                .sort((a, b) => b.matchCount - a.matchCount)
                .slice(0, 3);

            setSuggestions(scored);
        } catch (error) {
            console.error('Error finding meals:', error);
            toast.error("Failed to find meals. Try again!");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Wallet className="text-emerald-500 w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                        Budget Mode
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] max-w-sm mx-auto">
                        Tell us what you have, we&apos;ll tell you what to make. No fuss, just food.
                    </p>
                </div>

                {/* Integrated Hero Search */}
                <div className={cn(
                    "w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col",
                    isHeroActive ? "ring-4 ring-emerald-500/5 border-emerald-500/20" : ""
                )}>
                    <div className="h-[240px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                        {isHeroActive ? (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {isHeroSearching ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                        <div className="relative">
                                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                                            <div className="absolute inset-0 animate-ping bg-emerald-500/20 rounded-full" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Searching Library...</p>
                                    </div>
                                ) : heroResults.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {heroResults.map(food => (
                                            <button
                                                key={food.id}
                                                onClick={() => addIngredient(food.name)}
                                                className="w-full p-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 text-left"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                                        <Utensils size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white truncate">{food.name}</h4>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {food.common_name || 'Library Item'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Plus className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={16} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                                            {heroSearchQuery.length > 1 ? "No matching items found" : "Enter ingredient name to search library"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-700">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative">
                                    <Search size={24} className="text-emerald-500" />
                                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1 font-inter">Add Ingredients</h3>
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">
                                    Search for the ingredients you have on hand
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2">
                        <div className="flex-1 relative flex items-center">
                            <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-emerald-500/50" : "text-slate-300")}>
                                <Search size={20} />
                            </div>
                            <input
                                placeholder="SEARCH LIBRARY FOR INGREDIENTS..."
                                className={cn(
                                    "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-xs md:text-sm font-black uppercase tracking-widest h-14 md:h-16 rounded-[1.5rem] md:rounded-[2rem] pl-14 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 outline-none",
                                    isHeroActive
                                        ? "border-emerald-500/30 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10"
                                        : "border-slate-100 dark:border-slate-800"
                                )}
                                value={heroSearchQuery}
                                onFocus={() => setIsHeroActive(true)}
                                onChange={(e) => handleHeroSearchInput(e.target.value)}
                            />
                        </div>
                        {isHeroActive && (
                            <button
                                onClick={() => {
                                    setIsHeroActive(false);
                                    setHeroSearchQuery("");
                                    setHeroResults([]);
                                }}
                                className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-all group/cancel"
                            >
                                <X size={20} className="group-hover/cancel:rotate-90 transition-transform duration-300" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Ingredients Chip List - Moved below search */}
                {ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {ingredients.map((ing, idx) => (
                            <div
                                key={idx}
                                className="group px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20"
                            >
                                {ing}
                                <button onClick={() => removeIngredient(idx)} className="hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            className="text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-rose-500"
                            onClick={() => setIngredients([])}
                        >
                            Clear All
                        </Button>
                    </div>
                )}

                {/* Big Search Trigger */}
                <Button
                    onClick={findMeals}
                    disabled={ingredients.length === 0 || isSearching}
                    className="w-full h-16 md:h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] md:rounded-[3rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                    {isSearching ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <div className="flex items-center gap-3">
                            <ChefHat size={20} />
                            <span>Scan Protocols For Hearty Matches</span>
                        </div>
                    )}
                </Button>

                {/* Results Area */}
                <div className="space-y-6">
                    {isSearching ? (
                        <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                            <Sparkles className="animate-pulse text-emerald-500" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning Protocols...</p>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 animate-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center gap-2 mb-2 ml-4">
                                <Sparkles size={16} className="text-amber-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Recommended Protocols</h2>
                            </div>
                            {suggestions.map((recipe) => (
                                <Link key={recipe.id} href={`/dashboard/library/meals/${recipe.id}`}>
                                    <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                                                {recipe.image ? (
                                                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <ChefHat className="text-slate-200 w-8 h-8 md:w-10 md:h-10" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{recipe.title}</h3>
                                                    {recipe.matchCount > 2 && (
                                                        <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded-lg uppercase">Great Match</div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {recipe.prep_time} MIN <span className="text-slate-200 dark:text-slate-700 mx-1">|</span> {recipe.calories} KCAL
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : hasSearched && (
                        <div className="py-20 text-center space-y-4 animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-dashed border-slate-200 dark:border-slate-700">
                                <Utensils size={24} className="text-slate-300" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No direct matches found. Try adding generic ingredients!</p>
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] flex gap-4 items-start border border-slate-100 dark:border-slate-800 animate-in fade-in delay-500">
                    <Info className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                        Budget Mode prioritizes simple, hearty meals from your existing protocol collection. We strip away the complex biological metrics to focus on getting you fed with what you have.
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
