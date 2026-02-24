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

export default function SurvivalModePage() {
    const [step, setStep] = useState<'security' | 'water' | 'ingredients' | 'results'>('security');
    const [securityStatus, setSecurityStatus] = useState<'safe' | 'unsafe' | null>(null);
    const [waterStatus, setWaterStatus] = useState<'clean' | 'dirty' | 'none' | null>(null);

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
            toast.error("Add some essentials first!");
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
            setStep('results');
        } catch (error) {
            console.error('Error finding survival meals:', error);
            toast.error("Failed to find protocols. Try again!");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Wallet className="text-amber-500 w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                        Survival Mode
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] max-w-sm mx-auto">
                        Stability First. Then Nutrition. Then Survival.
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-4">
                    {[
                        { id: 'security', label: 'Security' },
                        { id: 'water', label: 'Hydration' },
                        { id: 'ingredients', label: 'Intake' }
                    ].map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                step === s.id ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            )}>
                                {idx + 1}
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                step === s.id ? "text-slate-900 dark:text-white" : "text-slate-400"
                            )}>{s.label}</span>
                            {idx < 2 && <ArrowRight size={10} className="text-slate-200" />}
                        </div>
                    ))}
                </div>

                <div className="min-h-[400px]">
                    {step === 'security' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <Card className="p-12 text-center space-y-8 border-2 border-amber-500/20">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">Are you in a safe space or shelter?</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setSecurityStatus('safe'); setStep('water'); }}
                                        className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-emerald-500"
                                    >
                                        Yes, I am Safe
                                    </button>
                                    <button
                                        onClick={() => setSecurityStatus('unsafe')}
                                        className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-rose-500"
                                    >
                                        No, I need Shelter
                                    </button>
                                </div>
                                {securityStatus === 'unsafe' && (
                                    <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95">
                                        <div className="flex items-center gap-2 text-rose-500">
                                            <Info size={18} />
                                            <span className="font-black uppercase text-xs tracking-widest">Safe Space Advisory</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
                                            Priority one: Find shelter. Look for brick or concrete structures if weather is harsh. If outside, create a thermal barrier between you and the ground (dry leaves, cardboard). Keep your core warm—layers are essential.
                                        </p>
                                        <Button
                                            onClick={() => setStep('water')}
                                            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Next: Water Assessment
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {step === 'water' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <Card className="p-12 text-center space-y-8 border-2 border-blue-500/20">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">Do you have access to clean water?</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => { setWaterStatus('clean'); setStep('ingredients'); }}
                                        className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-blue-500"
                                    >
                                        Clean Water
                                    </button>
                                    <button
                                        onClick={() => setWaterStatus('dirty')}
                                        className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-amber-500"
                                    >
                                        Dirty Source
                                    </button>
                                    <button
                                        onClick={() => setWaterStatus('none')}
                                        className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-rose-500"
                                    >
                                        No Source
                                    </button>
                                </div>

                                {waterStatus === 'dirty' && (
                                    <div className="p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95 text-xs">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Info size={18} />
                                            <span className="font-black uppercase tracking-widest">Purification Advisory</span>
                                        </div>
                                        <p className="font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
                                            Never drink standing water. Boiling is the safest method. Filter through cloth/sand first to remove sediment. If fire is not possible, use water purification tablets or 2 drops of bleach per quart (let stand for 30 mins).
                                        </p>
                                        <Button onClick={() => setStep('ingredients')} className="w-full h-12 bg-amber-500 text-white font-black uppercase">Continue</Button>
                                    </div>
                                )}

                                {waterStatus === 'none' && (
                                    <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95 text-xs">
                                        <div className="flex items-center gap-2 text-rose-500">
                                            <Info size={18} />
                                            <span className="font-black uppercase tracking-widest">Finding Water</span>
                                        </div>
                                        <p className="font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
                                            Scan environment for: lower ground (where rain collects), green vegetation, animal tracks, or morning dew on leaves (collect with cloth). Avoid seawater or urine; they dehydrate you faster.
                                        </p>
                                        <Button onClick={() => setStep('ingredients')} className="w-full h-12 bg-rose-500 text-white font-black uppercase">Continue</Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {step === 'ingredients' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            {/* Integrated Hero Search */}
                            <div className={cn(
                                "w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col",
                                isHeroActive ? "ring-4 ring-amber-500/5 border-amber-500/20" : ""
                            )}>
                                <div className="h-[240px] overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50/50 dark:bg-slate-800/10 order-1">
                                    {isHeroActive ? (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            {isHeroSearching ? (
                                                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
                                                    <div className="relative">
                                                        <Loader2 className="animate-spin text-amber-500" size={32} />
                                                        <div className="absolute inset-0 animate-ping bg-amber-500/20 rounded-full" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Scanning Library...</p>
                                                </div>
                                            ) : heroResults.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {heroResults.map(food => (
                                                        <button
                                                            key={food.id}
                                                            onClick={() => addIngredient(food.name)}
                                                            className="w-full p-4 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/20 flex items-center justify-between group transition-all border border-slate-100 dark:border-slate-800 hover:border-amber-500/30 text-left"
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                                                                    <Utensils size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white truncate">{food.name}</h4>
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                                        {food.common_name || 'Library Item'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Plus className="text-slate-200 group-hover:text-amber-500 transition-colors shrink-0" size={16} />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center text-slate-400">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">
                                                        {heroSearchQuery.length > 1 ? "No matching items found" : "Enter survival essential name"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-700">
                                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 relative">
                                                <Utensils size={24} className="text-amber-500" />
                                                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-1 font-inter">Add Intake</h3>
                                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs">
                                                List what edibles you have available.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900 order-2">
                                    <div className="flex-1 relative flex items-center">
                                        <div className={cn("absolute left-5 transition-colors", isHeroActive ? "text-amber-500/50" : "text-slate-300")}>
                                            <Search size={20} />
                                        </div>
                                        <input
                                            placeholder="SEARCH LIBRARY FOR FOOD SOURCES..."
                                            className={cn(
                                                "w-full bg-slate-50 dark:bg-slate-800/50 border-2 transition-all shadow-sm text-xs md:text-sm font-black uppercase tracking-widest h-14 md:h-16 rounded-[1.5rem] md:rounded-[2rem] pl-14 pr-6 text-slate-900 dark:text-white placeholder:text-slate-300 outline-none",
                                                isHeroActive
                                                    ? "border-amber-500/30 focus:border-amber-500/80 focus:ring-4 focus:ring-amber-500/10"
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
                                            className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center justify-center transition-all group/cancel"
                                        >
                                            <X size={20} className="group-hover/cancel:rotate-90 transition-transform duration-300" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Ingredients Chip List */}
                            {ingredients.length > 0 && (
                                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {ingredients.map((ing, idx) => (
                                        <div
                                            key={idx}
                                            className="group px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-amber-500/20"
                                        >
                                            {ing}
                                            <button onClick={() => removeIngredient(idx)} className="hover:text-amber-800 dark:hover:text-amber-200 transition-colors">
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
                                className="w-full h-16 md:h-20 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] md:rounded-[3rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98]"
                            >
                                {isSearching ? (
                                    <Loader2 className="animate-spin w-5 h-5" />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ChefHat size={20} />
                                        <span>Scan Profiles For Lifeline Matches</span>
                                    </div>
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 'results' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Lifeline Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <Card className="p-8 bg-amber-500/10 border-amber-500/20 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Calculated Lifeline</p>
                                    <h4 className="text-4xl font-black italic">3-5 DAYS</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Estimated based on minimum caloric floor</p>
                                </Card>
                                <Card className="p-8 bg-blue-500/10 border-blue-500/20 text-center space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Hydration Runway</p>
                                    <h4 className="text-4xl font-black italic">{waterStatus === 'clean' ? 'UNLIMITED' : 'CRITICAL'}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{waterStatus === 'clean' ? 'Access to clean water secured' : 'Water source is unstable or absent'}</p>
                                </Card>
                            </div>

                            <div className="flex items-center gap-2 mb-2 ml-4">
                                <Sparkles size={16} className="text-amber-500" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Survival Protocols</h2>
                            </div>

                            <div className="space-y-4">
                                {suggestions.map((recipe) => (
                                    <Link key={recipe.id} href={`/dashboard/library/meals/${recipe.id}`}>
                                        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] hover:border-amber-500/40 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-xl hover:-translate-y-1">
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
                                                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight font-inter">{recipe.title}</h3>
                                                        <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded-lg uppercase">High Sustenance</div>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {recipe.calories} KCAL <span className="text-slate-200 dark:text-slate-700 mx-1">|</span> {Math.round(recipe.calories / 1500 * 100)}% DAILY FLOOR
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                <ArrowRight size={20} />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setStep('security')}
                                className="w-full h-14 rounded-full font-black uppercase tracking-widest text-[10px] border-slate-200"
                            >
                                Start New Assessment
                            </Button>
                        </div>
                    )}
                </div>

                {/* Survival Context Note */}
                <div className="p-8 bg-slate-900 text-white rounded-[3rem] space-y-4 animate-in fade-in delay-500 border border-amber-500/20 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <Info className="text-amber-500" size={20} />
                        <h5 className="font-black uppercase tracking-[0.2em] text-xs">The Rules of Three</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: '3 Minutes', detail: 'Without air or in icy water' },
                            { label: '3 Hours', detail: 'Without shelter in extreme heat/cold' },
                            { label: '3 Days', detail: 'Without water' }
                        ].map((rule, idx) => (
                            <div key={idx} className="space-y-1 border-l-2 border-amber-500/30 pl-4">
                                <p className="text-amber-500 font-black text-sm">{rule.label}</p>
                                <p className="text-[9px] font-bold uppercase text-slate-400">{rule.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
