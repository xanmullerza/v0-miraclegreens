'use client';

import React, { useState, useEffect } from 'react';
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
    const [currentInput, setCurrentInput] = useState('');
    const [inputSuggestions, setInputSuggestions] = useState<any[]>([]);
    const [isInputSearching, setIsInputSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Debounced search for ingredients
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (currentInput.length > 1) {
                setIsInputSearching(true);
                try {
                    const results = await searchLocalFood(currentInput);
                    setInputSuggestions(results.slice(0, 5));
                } catch (error) {
                    console.error('Error searching ingredients:', error);
                } finally {
                    setIsInputSearching(false);
                }
            } else {
                setInputSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [currentInput]);

    const addIngredient = (name: string) => {
        const trimmed = name.trim();
        if (trimmed && !ingredients.includes(trimmed)) {
            setIngredients([...ingredients, trimmed]);
            setCurrentInput('');
            setInputSuggestions([]);
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
            // Updated logic to search for recipes containing added ingredients
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

                {/* Single Form Card */}
                <Card className="p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-emerald-500/5 border-emerald-500/10 bg-white dark:bg-slate-900/50">
                    <div className="space-y-8">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (inputSuggestions.length > 0) {
                                    addIngredient(inputSuggestions[0].name);
                                } else {
                                    addIngredient(currentInput);
                                }
                            }}
                            className="relative"
                        >
                            <Input
                                placeholder="TYPE INGREDIENT (EG. RICE, BEANS...)"
                                className="h-16 pl-6 pr-16 rounded-[1.5rem] md:rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500/30 text-xs md:text-sm font-black uppercase tracking-widest placeholder:text-slate-300 transition-all outline-none"
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                            />
                            <div className="absolute right-3 top-3 w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                {isInputSearching ? <Loader2 className="animate-spin w-5 h-5" /> : <Search size={20} />}
                            </div>

                            {/* Suggestions Dropdown */}
                            {inputSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {inputSuggestions.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => addIngredient(item.name)}
                                            className="w-full px-6 py-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center justify-between group transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{item.name}</span>
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.common_name || 'Library Item'}</span>
                                            </div>
                                            <Plus size={14} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </form>

                        {/* Ingredients List */}
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

                        <Button
                            onClick={findMeals}
                            disabled={ingredients.length === 0 || isSearching}
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                        >
                            {isSearching ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Utensils size={18} />
                                    <span>Find Hearty Meals</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </Card>

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
