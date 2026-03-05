'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HeroSearch } from '@/components/ui/hero-search';
import {
    Wallet, Search, X, ArrowRight, Loader2, Sparkles,
    Zap, Activity, Info, Utensils, ChefHat, Plus,
    Beef, ChevronRight, Library, Calendar, Scale, Droplet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { searchLocalFood } from '@/lib/services/nutrition';
import Link from 'next/link';
import { calculateSurvivalStatus, SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

interface InventoryItem {
    id: string;
    name: string;
    weight_g: number;
    nutrition: any; // We'll store per-100g or total
}

interface LifeSign {
    name: string;
    status: 'optimal' | 'stable' | 'depleted' | 'critical' | 'terminal';
    value: number;
    unit: string;
    symptom?: string;
}

export default function SurvivalModePage() {
    const router = useRouter();
    const [step, setStep] = useState<'security' | 'water' | 'ingredients' | 'lifeline' | 'results'>('security');
    const [securityStatus, setSecurityStatus] = useState<'safe' | 'unsafe' | null>(null);
    const [waterStatus, setWaterStatus] = useState<'clean' | 'dirty' | 'none' | null>(null);

    // Inventory System
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const [heroResults, setHeroResults] = useState<any[]>([]);
    const [isHeroSearching, setIsHeroSearching] = useState(false);
    const [isHeroActive, setIsHeroActive] = useState(false);

    // Simulation Slider
    const [simulationDay, setSimulationDay] = useState(0);
    const [profileType, setProfileType] = useState<'maintenance' | 'starvation'>('starvation');
    const { energyUnit } = useUserPreferences();

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const heroSearchTimeoutRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

    // Achievements / Boosts
    const [boosts, setBoosts] = useState<{ id: string, message: string }[]>([]);

    const addBoost = (message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setBoosts(prev => [...prev, { id, message }]);
        setTimeout(() => setBoosts(prev => prev.filter(b => b.id !== id)), 4000);
    };

    // --- PERSISTENCE ENGINE ---
    // 1. Initial Load
    useEffect(() => {
        const loadPersistence = async () => {
            // Priority 1: LocalStorage (Fastest)
            const savedInventory = localStorage.getItem('miraclegreens_survival_inventory');
            const savedState = localStorage.getItem('miraclegreens_survival_state');

            if (savedInventory) {
                try {
                    const parsed = JSON.parse(savedInventory);
                    setInventory(parsed);
                } catch (e) { console.error("Failed to parse inventory", e); }
            }

            if (savedState) {
                try {
                    const { step, security, water, profile } = JSON.parse(savedState);
                    if (step) setStep(step);
                    if (security) setSecurityStatus(security);
                    if (water) setWaterStatus(water);
                    if (profile) setProfileType(profile);
                } catch (e) { console.error("Failed to parse survival state", e); }
            }

            // Priority 2: Cloud Sync (If authenticated)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('survival_state')
                    .eq('id', session.user.id)
                    .single();

                if (data?.survival_state && !error) {
                    const { inventory: cloudInv, state: cloudState } = data.survival_state;
                    if (cloudInv) setInventory(cloudInv);
                    if (cloudState) {
                        if (cloudState.step) setStep(cloudState.step);
                        if (cloudState.security) setSecurityStatus(cloudState.security);
                        if (cloudState.water) setWaterStatus(cloudState.water);
                        if (cloudState.profile) setProfileType(cloudState.profile);
                    }
                }
            }
        };

        loadPersistence();
    }, []);

    // 2. Automatic Saving
    useEffect(() => {
        if (inventory.length === 0 && step === 'security') return; // Don't save empty initial state

        const savePersistence = async () => {
            const state = { step, security: securityStatus, water: waterStatus, profile: profileType };

            // Save to LocalStorage
            localStorage.setItem('miraclegreens_survival_inventory', JSON.stringify(inventory));
            localStorage.setItem('miraclegreens_survival_state', JSON.stringify(state));

            // Sync to Cloud (throttled/background)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({
                        survival_state: { inventory, state }
                    } as any)
                    .eq('id', session.user.id);
            }
        };

        const timer = setTimeout(savePersistence, 1000);
        return () => clearTimeout(timer);
    }, [inventory, step, securityStatus, waterStatus, profileType]);
    // --- END PERSISTENCE ---

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

    const addIngredient = (food: any) => {
        const existing = inventory.find(item => item.id === food.id);

        // Check for "Boosts"
        if (food.name.toLowerCase().includes('cabbage')) {
            addBoost("ULTRA BOOST: Vitamin C & K reserves extended +4 days!");
        } else if (food.name.toLowerCase().includes('lemon') || food.name.toLowerCase().includes('orange')) {
            addBoost("SCURVY SHIELD: Scurvy progression halted!");
        }

        if (existing) {
            setInventory(inventory.map(item =>
                item.id === food.id
                    ? { ...item, weight_g: item.weight_g + 500 } // Default to adding 500g for now
                    : item
            ));
            toast.success(`Replenished ${food.name} stocks (+500g)`);
        } else {
            setInventory([...inventory, {
                id: food.id,
                name: food.common_name || food.name,
                weight_g: 500, // Default start
                nutrition: food
            }]);
            toast.success(`Added ${food.common_name || food.name} to Survival Pantry`);
        }

        setHeroSearchQuery('');
        setHeroResults([]);
        setIsHeroActive(false);
    };

    const updateInventoryWeight = (id: string, weight: number) => {
        setInventory(inventory.map(item =>
            item.id === id ? { ...item, weight_g: Math.max(0, weight) } : item
        ));
    };

    const removeInventoryItem = (id: string) => {
        setInventory(inventory.filter(item => item.id !== id));
    };

    const resetSimulation = () => {
        setStep('security');
        setSecurityStatus(null);
        setWaterStatus(null);
        setInventory([]);
        setSimulationDay(0);
        setSuggestions([]);
        setHasSearched(false);

        // Clear Persistence
        localStorage.removeItem('miraclegreens_survival_inventory');
        localStorage.removeItem('miraclegreens_survival_state');

        toast.success("Simulation Reset.");
    };

    const findMeals = async () => {
        if (inventory.length === 0) {
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

            // Score recipes based on missing nutrients in simStatus
            const scored = recipes.map(recipe => {
                let matchCount = 0;
                const recipeIngredientNames = recipe.ingredients?.map((i: any) => i.item.toLowerCase()) || [];
                const recipeTitle = recipe.title.toLowerCase();

                inventory.forEach(invItem => {
                    const search = invItem.name.toLowerCase();
                    if (recipeTitle.includes(search)) matchCount += 2;
                    if (recipeIngredientNames.some((ri: string) => ri.includes(search))) matchCount += 1;
                });

                // Bonus for recipes that provide nutrients the user is low on
                simStatus.activeSymptoms.forEach(s => {
                    if (recipe.title.toLowerCase().includes(s.nutrient.toLowerCase())) matchCount += 5;
                });

                return { ...recipe, matchCount };
            }).filter(r => r.matchCount > 0)
                .sort((a, b) => b.matchCount - a.matchCount)
                .slice(0, 3);

            setSuggestions(scored);
            setStep('lifeline'); // Move to lifeline which now shows results
        } catch (error) {
            console.error('Error finding survival meals:', error);
            toast.error("Failed to find protocols.");
        } finally {
            setIsSearching(false);
        }
    };

    const eatMeal = (recipe: any) => {
        // Subtract 200g of each matching ingredient from inventory
        let updated = [...inventory];
        let count = 0;
        inventory.forEach(invItem => {
            const search = invItem.name.toLowerCase();
            const isInRecipe = recipe.ingredients?.some((ri: any) => ri.item.toLowerCase().includes(search));
            if (isInRecipe) {
                updated = updated.map(item =>
                    item.id === invItem.id ? { ...item, weight_g: Math.max(0, item.weight_g - 250) } : item
                );
                count++;
            }
        });
        setInventory(updated);
        toast.info(`Protocol marked as eaten. Pantry adjusted (-${count} items).`);
    };

    const simStatus = calculateSurvivalStatus(
        inventory,
        simulationDay,
        profileType,
        waterStatus === 'clean'
    );

    return (
        <PageContainer>
            {/* Boost Toasts */}
            <div className="fixed top-24 right-8 z-50 flex flex-col gap-2 pointer-events-none">
                {boosts.map(boost => (
                    <div key={boost.id} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl font-black uppercase text-[10px] tracking-widest animate-in slide-in-from-right-8 fade-in flex items-center gap-3">
                        <Sparkles size={16} />
                        {boost.message}
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">

                {/* Always-visible Hero Search with navigation */}
                <HeroSearch
                    searchQuery={heroSearchQuery}
                    onQueryChange={handleHeroSearchInput}
                    results={heroResults}
                    isLoading={isHeroSearching}
                    isActive={isHeroActive}
                    setIsActive={(active) => {
                        setIsHeroActive(active);
                        if (active && step !== 'ingredients') setStep('ingredients');
                    }}
                    onSelect={addIngredient}
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleTitle="Life Guard"
                    idleSubtitle="Add foods to simulate a survival scenario"
                    noResultsMessage="No matching items found"
                    enterMessage="Enter item name to compare"
                    searchingMessage="Searching Library..."
                    renderResult={(food: any) => (
                        <>
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                    {food.image ? <img src={food.image} className="w-full h-full object-cover" /> : <Beef className="m-auto opacity-10 h-full w-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{food.common_name || food.name}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {energyUnit === 'kJ' ? (food.energy_kcal * 4.184).toFixed(0) : food.energy_kcal.toFixed(0)} {energyUnit} <span className="text-slate-200 dark:text-slate-700">|</span> 100g
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </>
                    )}
                />




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
                        <div className="space-y-12 animate-in fade-in duration-500">

                            {/* Inventory Section - Below Search Bar */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black uppercase italic italic tracking-tight">Active Pantry</h2>
                                    <Badge className="bg-amber-500">{inventory.length} ITEMS</Badge>
                                </div>
                                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                    {inventory.length === 0 ? (
                                        <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pantry is empty.</p>
                                        </div>
                                    ) : (
                                        inventory.map(item => (
                                            <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group shadow-sm">
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-black uppercase truncate">{item.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input
                                                            type="number"
                                                            value={item.weight_g}
                                                            onChange={(e) => updateInventoryWeight(item.id, parseInt(e.target.value))}
                                                            className="w-16 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-black p-1 text-center"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Grams</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeInventoryItem(item.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {inventory.length > 0 && (
                                    <Button
                                        onClick={findMeals}
                                        className="w-full h-14 bg-amber-500 hover:bg-amber-600 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                        disabled={isSearching}
                                    >
                                        {isSearching ? <Loader2 className="animate-spin" /> : 'Project Lifeline'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'lifeline' && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                            {/* LONGEVITY METER - Compact Header */}
                            <div className="sticky top-20 z-40 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 backdrop-blur-xl p-4 rounded-2xl border-2 border-amber-500/20 shadow-2xl overflow-hidden relative">
                                {/* Animated Background */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-transparent to-transparent animate-pulse" />
                                </div>
                                
                                <div className="relative space-y-2">
                                    {/* Title + Ring Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-amber-400">Survival Window:</p>
                                                <h2 className="text-3xl font-black italic text-white tracking-tighter">{(() => {
                                                    // Calculate days until critical failure
                                                    const profile = SURVIVAL_PROFILES[profileType];
                                                    const energyDays = inventory.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0) / profile.energy_floor;
                                                    const criticalDay = Math.max(0, Math.ceil(energyDays + 20)); // 20 day body fat reserve
                                                    return Math.min(criticalDay, 30);
                                                })()}</h2>
                                                <p className="text-[8px] font-bold text-amber-300">days</p>
                                            </div>
                                        </div>
                                        
                                        {/* Status Ring - Compact */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-3 animate-pulse", simStatus.isTerminal ? "border-rose-500 bg-rose-500/10" : "border-emerald-500 bg-emerald-500/10")}>
                                                <div className="text-center">
                                                    <p className={cn("text-2xl font-black", simStatus.isTerminal ? "text-rose-500" : "text-emerald-500")}>
                                                        {simStatus.results.energy > 0 ? '✓' : '✗'}
                                                    </p>
                                                    <p className="text-[6px] font-black uppercase leading-none text-white">
                                                        {simStatus.isTerminal ? 'CRIT' : 'OK'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className={cn("px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest whitespace-nowrap", profileType === 'starvation' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                                                {profileType === 'starvation' ? 'STARV' : 'MAINT'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slider Row - Compact */}
                                    <div className="space-y-1 pt-2 border-t border-slate-700">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[8px] font-bold text-white truncate">
                                                    Day {simulationDay} • Energy: <span className={simStatus.results.energy > 0 ? "text-emerald-400" : "text-rose-400"}>{Math.round(simStatus.results.energy)}</span> kcal
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[7px] uppercase font-black text-amber-400 hover:text-amber-300 px-2 py-0 h-auto"
                                                onClick={() => setProfileType(profileType === 'maintenance' ? 'starvation' : 'maintenance')}
                                            >
                                                Switch
                                            </Button>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            step="1"
                                            value={simulationDay}
                                            onChange={(e) => setSimulationDay(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                                        />
                                        <div className="flex justify-between px-1 text-[7px] font-black text-slate-500 uppercase tracking-widest">
                                            <span>Now</span>
                                            <span>30 Days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* INVENTORY MANAGER - Interactive */}
                            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Library size={16} className="text-blue-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Survival Pantry</h3>
                                        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[8px] font-black">
                                            {inventory.length} items
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[8px] uppercase font-black text-blue-500 hover:text-blue-400 px-2 py-1 h-auto gap-1"
                                        onClick={() => {
                                            setIsHeroActive(!isHeroActive);
                                            setHeroSearchQuery('');
                                            setHeroResults([]);
                                        }}
                                    >
                                        <Plus size={12} />
                                        Add Item
                                    </Button>
                                </div>

                                {isHeroActive && (
                                    <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-500/30">
                                        <input
                                            type="text"
                                            placeholder="Search foods..."
                                            value={heroSearchQuery}
                                            onChange={(e) => handleHeroSearchInput(e.target.value)}
                                            className="w-full px-3 py-2 text-[10px] rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        {isHeroSearching && (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 size={14} className="animate-spin text-blue-500" />
                                            </div>
                                        )}
                                        {heroResults.length > 0 && (
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {heroResults.slice(0, 8).map((food) => (
                                                    <button
                                                        key={food.id}
                                                        onClick={() => addIngredient(food)}
                                                        className="w-full text-left px-3 py-2 text-[8px] rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-colors"
                                                    >
                                                        <p className="font-black uppercase text-slate-900 dark:text-white">{food.common_name || food.name}</p>
                                                        <p className="text-[7px] text-slate-500 dark:text-slate-400">Energy: {Math.round(food.energy_kcal || 0)} kcal/100g</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {heroSearchQuery && !isHeroSearching && heroResults.length === 0 && (
                                            <p className="text-[8px] text-slate-500 py-2 text-center">No results found</p>
                                        )}
                                    </div>
                                )}

                                {inventory.length > 0 ? (
                                    <div className="space-y-3">
                                        {inventory.map((item) => (
                                            <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[9px] font-black uppercase text-slate-900 dark:text-white truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-[7px] text-slate-500 dark:text-slate-400">
                                                            {Math.round(item.weight_g)}g • ~{Math.round((item.nutrition?.energy_kcal || 0) * (item.weight_g / 100))} kcal
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeInventoryItem(item.id)}
                                                        className="shrink-0 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-rose-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>

                                                <div className="space-y-1">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="5000"
                                                        step="50"
                                                        value={item.weight_g}
                                                        onChange={(e) => updateInventoryWeight(item.id, parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                                                    />
                                                    <div className="flex justify-between text-[7px] text-slate-400">
                                                        <span>0g</span>
                                                        <span>5kg</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <p className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">No items yet. Click "Add Item" to start.</p>
                                    </div>
                                )}
                            </div>

                            {/* NUTRIENT CASCADE TIMELINE */}
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-purple-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutrient Cascade Timeline</h3>
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const profile = SURVIVAL_PROFILES[profileType];
                                        const cascade = [
                                            { label: 'Thiamine (B1)', day: Math.ceil((INITIAL_STORES.b1 * profile.b1_floor + inventory.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (i.weight_g / 100), 0)) / profile.b1_floor), icon: '💊', color: 'from-purple-500 to-purple-600' },
                                            { label: 'Vitamin C', day: Math.ceil((INITIAL_STORES.vit_c * profile.vit_c_floor + inventory.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (i.weight_g / 100), 0)) / profile.vit_c_floor), icon: '🍊', color: 'from-orange-500 to-orange-600' },
                                            { label: 'Potassium', day: Math.ceil((INITIAL_STORES.potassium + inventory.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Potassium'] || 0) * (i.weight_g / 100), 0)) / profile.potassium_floor), icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
                                            { label: 'Energy Stores', day: Math.ceil((INITIAL_STORES.energy + inventory.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0)) / profile.energy_floor), icon: '🔥', color: 'from-red-500 to-red-600' }
                                        ].sort((a, b) => a.day - b.day);
                                        
                                        return cascade.map((item, idx) => (
                                            <div key={item.label} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl">{item.icon}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{item.label}</span>
                                                    </div>
                                                    <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase", item.day > 20 ? "bg-emerald-500 text-white" : item.day > 10 ? "bg-amber-500 text-white" : "bg-rose-500 text-white")}>
                                                        Day {item.day}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={cn("h-full bg-gradient-to-r transition-all duration-500", item.color)} style={{ width: `${Math.min((item.day / 30) * 100, 100)}%` }} />
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Survival Requirements Dashboard */}
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Zap size={16} className="text-purple-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Survival Requirements</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(() => {
                                        const profile = SURVIVAL_PROFILES[profileType];
                                        const dailyReqs = [
                                            { label: 'Energy', val: profile.energy_floor, unit: 'kcal', icon: <Zap size={14} /> },
                                            { label: 'Water', val: profile.water_floor, unit: 'L/day', icon: <Droplet size={14} /> },
                                            { label: 'Thiamine', val: profile.b1_floor, unit: 'mg', icon: <Sparkles size={14} /> },
                                            { label: 'Vitamin C', val: profile.vit_c_floor, unit: 'mg', icon: <Plus size={14} /> },
                                            { label: 'Sodium', val: profile.sodium_floor, unit: 'mg', icon: <Activity size={14} /> },
                                            { label: 'Potassium', val: profile.potassium_floor, unit: 'mg', icon: <Info size={14} /> }
                                        ];
                                        return dailyReqs.map(req => (
                                            <div key={req.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{req.label}/Day</span>
                                                    <div className="p-1 rounded-lg bg-purple-500/10 text-purple-500">{req.icon}</div>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white">{Math.round(req.val)}</span>
                                                    <span className="text-[8px] font-bold text-slate-400">{req.unit}</span>
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-400 mt-1">Total: {Math.round(req.val * simulationDay)} ({simulationDay}d)</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Deficit Analysis - Required vs Actual */}
                            <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Scale size={16} className="text-blue-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deficit Analysis</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(() => {
                                        const profile = SURVIVAL_PROFILES[profileType];
                                        const analysis = [
                                            { label: 'Energy', required: profile.energy_floor * simulationDay, actual: simStatus.results.energy, unit: 'kcal', deficit: (profile.energy_floor * simulationDay) - simStatus.results.energy },
                                            { label: 'Hydration', required: profile.water_floor * simulationDay, actual: simStatus.results.water, unit: 'L', deficit: (profile.water_floor * simulationDay) - simStatus.results.water },
                                            { label: 'Thiamine (B1)', required: profile.b1_floor * simulationDay, actual: simStatus.results.b1, unit: 'mg', deficit: (profile.b1_floor * simulationDay) - simStatus.results.b1 },
                                            { label: 'Vitamin C', required: profile.vit_c_floor * simulationDay, actual: simStatus.results.vit_c, unit: 'mg', deficit: (profile.vit_c_floor * simulationDay) - simStatus.results.vit_c }
                                        ];
                                        return analysis.map(item => {
                                            const percentMet = item.actual > 0 ? Math.round((item.actual / item.required) * 100) : 0;
                                            const isDeficient = item.actual < item.required;
                                            return (
                                                <div key={item.label} className={cn("p-6 rounded-2xl border-2", isDeficient ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30" : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30")}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-[9px] font-black uppercase tracking-widest">{item.label}</h4>
                                                        <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", isDeficient ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                                                            {percentMet}%
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[8px] font-bold text-slate-500 mb-1">Required: {Math.round(item.required)} {item.unit}</p>
                                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div className="h-full bg-slate-400 dark:bg-slate-600" style={{ width: '100%' }} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-[8px] font-bold mb-1", isDeficient ? "text-rose-600" : "text-emerald-600")}>Actual: {Math.round(item.actual)} {item.unit}</p>
                                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div className={cn("h-full", isDeficient ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(percentMet, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                        {isDeficient && (
                                                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider">Shortfall: {Math.round(item.deficit)} {item.unit}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Critical Timeline - When nutrients run out */}
                            <div className="space-y-6 bg-amber-50 dark:bg-amber-500/5 p-8 rounded-[3rem] border border-amber-200 dark:border-amber-500/30">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-amber-600 dark:text-amber-400" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Critical Timeline</h3>
                                </div>
                                <div className="space-y-4">
                                    {(() => {
                                        const profile = SURVIVAL_PROFILES[profileType];
                                        const timeline = [
                                            { label: 'Energy Depletion', daysUntil: Math.max(0, Math.ceil((INITIAL_STORES.energy + inventory.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0)) / profile.energy_floor)), critical: 21 },
                                            { label: 'Dehydration Risk', daysUntil: Math.max(0, Math.ceil((INITIAL_STORES.water + inventory.reduce((acc, i) => acc + (i.nutrition?.Potassium || 0) * (i.weight_g / 100), 0) / 1000) / profile.water_floor)), critical: 3 },
                                            { label: 'Vitamin C Depletion', daysUntil: Math.max(0, Math.ceil((INITIAL_STORES.vit_c * profile.vit_c_floor + inventory.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (i.weight_g / 100), 0)) / profile.vit_c_floor)), critical: 14 },
                                            { label: 'Thiamine Deficiency', daysUntil: Math.max(0, Math.ceil((INITIAL_STORES.b1 * profile.b1_floor + inventory.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (i.weight_g / 100), 0)) / profile.b1_floor)), critical: 7 }
                                        ];
                                        return timeline.map(item => (
                                            <div key={item.label} className={cn("p-4 rounded-2xl border-l-4 flex items-center justify-between", item.daysUntil <= item.critical ? "bg-rose-100 dark:bg-rose-500/10 border-l-rose-500" : "bg-emerald-100 dark:bg-emerald-500/10 border-l-emerald-500")}>
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{item.label}</p>
                                                    <p className={cn("text-[10px] font-bold mt-1", item.daysUntil <= item.critical ? "text-rose-600" : "text-emerald-600")}>
                                                        {item.daysUntil > 365 ? 'Beyond Sim' : `Day ${item.daysUntil}`}
                                                    </p>
                                                </div>
                                                <div className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase", item.daysUntil <= item.critical ? "bg-rose-600 text-white" : "bg-emerald-600 text-white")}>
                                                    {item.daysUntil}d
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* WATER PURIFICATION GUIDE - Based on water status */}
                            {waterStatus !== 'clean' && (
                                <div className="space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-8 rounded-[3rem] border-2 border-blue-200 dark:border-blue-500/30">
                                    <div className="flex items-center gap-2">
                                        <Droplet size={16} className="text-blue-600 dark:text-blue-400" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-200">Water Purification Protocol</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {waterStatus === 'dirty' ? (
                                            <>
                                                <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-200 mb-2">🔥 Method 1: Boiling (Most Effective)</p>
                                                    <p className="text-[8px] font-medium text-blue-800 dark:text-blue-300">Bring water to rolling boil for 1 minute (3 min above 6,500 ft). Kills 99.9% pathogens. First, filter through cloth to remove particles.</p>
                                                </div>
                                                <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200 mb-2">💊 Method 2: Chemical (Bleach)</p>
                                                    <p className="text-[8px] font-medium text-amber-800 dark:text-amber-300">Add 2 drops unscented bleach per quart. Stir well and wait 30 minutes. Cup in hand - liquid should smell faintly of chlorine.</p>
                                                </div>
                                                <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-200 mb-2">☀️ Method 3: Solar (SODIS)</p>
                                                    <p className="text-[8px] font-medium text-emerald-800 dark:text-emerald-300">Clear plastic bottle in direct sun for 6-8 hours. UV radiation inactivates pathogens. Works if weather is clear.</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-200 mb-2">🌊 Finding Water</p>
                                                    <p className="text-[8px] font-medium text-blue-800 dark:text-blue-300">Look for: green vegetation areas, animal tracks, morning dew on leaves (collect with cloth). Avoid seawater and urine—both cause severe dehydration.</p>
                                                </div>
                                                <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-rose-200 dark:border-rose-500/20">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-900 dark:text-rose-200 mb-2">⚠️ Dehydration Warning</p>
                                                    <p className="text-[8px] font-medium text-rose-800 dark:text-rose-300">Even 2% fluid loss impairs cognition. Dark urine = dehydrated. Prioritize finding water immediately. Rationing without water found = fatal strategy.</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* RECOVERY PROTOCOLS - Smart food suggestions */}
                            {simStatus.activeSymptoms.length > 0 && inventory.length > 0 && (
                                <div className="space-y-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 p-8 rounded-[3rem] border-2 border-emerald-200 dark:border-emerald-500/30">
                                    <div className="flex items-center gap-2">
                                        <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-200">Recovery Protocols</h3>
                                        <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-300 ml-auto">Add foods to extend survival</span>
                                    </div>
                                    <div className="space-y-3">
                                        {simStatus.activeSymptoms.slice(0, 3).map(symptom => (
                                            <div key={symptom.name} className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-100">{symptom.name}</h4>
                                                    <span className="text-[7px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded">Need: {symptom.nutrient}</span>
                                                </div>
                                                <p className="text-[8px] font-medium text-slate-600 dark:text-slate-400 mb-3">
                                                    {symptom.nutrient === 'b1' && 'Add whole grains, legumes, nuts to restore thiamine levels'}
                                                    {symptom.nutrient === 'vit_c' && 'Add citrus, peppers, kale, or berries for ascorbic acid'}
                                                    {symptom.nutrient === 'potassium' && 'Add potatoes, beans, spinach, or bananas'}
                                                    {symptom.nutrient === 'sodium' && 'Add salt, dried fish, or cured meats to restore electrolytes'}
                                                    {symptom.nutrient === 'energy' && 'Add oils, nuts, grains, or any calorie-dense foods'}
                                                    {symptom.nutrient === 'water' && 'Prioritize finding clean water source immediately'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* EMERGENCY FOOD RANKING - Top survival foods */}
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Library size={16} className="text-amber-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Food Ranking</h3>
                                    <span className="text-[8px] font-black text-slate-500 ml-auto">Top survival foods by score</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { name: 'Rice', kcal: 130, score: 95, nutrients: ['Carbs', 'B1'], shelf: '∞', icon: '🍚' },
                                        { name: 'Beans', kcal: 95, score: 98, nutrients: ['Protein', 'B1', 'Fiber'], shelf: '∞', icon: '🫘' },
                                        { name: 'Nuts', kcal: 160, score: 96, nutrients: ['Fats', 'Minerals'], shelf: '2y', icon: '🥜' },
                                        { name: 'Honey', kcal: 65, score: 92, nutrients: ['Sugar', 'Energy'], shelf: '∞', icon: '🍯' },
                                        { name: 'Powdered Milk', kcal: 110, score: 89, nutrients: ['Protein', 'Calcium'], shelf: '1y', icon: '🥛' },
                                        { name: 'Oats', kcal: 150, score: 94, nutrients: ['Carbs', 'B1', 'Fiber'], shelf: '2y', icon: '🌾' },
                                        { name: 'Peanut Butter', kcal: 188, score: 97, nutrients: ['Protein', 'Fats', 'B1'], shelf: '1y', icon: '🥜' },
                                        { name: 'Dried Fruit', kcal: 80, score: 85, nutrients: ['Sugars', 'Vit C', 'Fiber'], shelf: '1y', icon: '🍇' },
                                        { name: 'Canned Fish', kcal: 60, score: 91, nutrients: ['Protein', 'Omega3'], shelf: '5y', icon: '🐟' }
                                    ].map((food, idx) => (
                                        <div key={food.name} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-2xl">{food.icon}</span>
                                                <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase text-white", food.score >= 95 ? "bg-emerald-500" : "bg-amber-500")}>
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{food.name}</p>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-bold text-slate-600 dark:text-slate-400">{food.kcal} kcal/100g</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {food.nutrients.map(n => <span key={n} className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-500/20 text-[7px] font-black text-sky-700 dark:text-sky-300 rounded">{n}</span>)}
                                                </div>
                                                <p className="text-[7px] font-bold text-slate-500 mt-2">Shelf: {food.shelf}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Biological Reserves */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 ml-4">
                                        <Activity size={16} className="text-amber-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biological Reserves</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Energy', val: simStatus.results.energy, unit: 'kcal', icon: <Zap size={14} /> },
                                            { label: 'Hydration', val: simStatus.results.water, unit: 'days', icon: <Utensils size={14} /> },
                                            { label: 'Thiamine', val: simStatus.results.b1, unit: 'mg', icon: <Sparkles size={14} /> },
                                            { label: 'Vitamin C', val: simStatus.results.vit_c, unit: 'mg', icon: <Plus size={14} /> },
                                            { label: 'Potassium', val: simStatus.results.potassium, unit: 'mg', icon: <Activity size={14} /> },
                                            { label: 'Sodium', val: simStatus.results.sodium, unit: 'mg', icon: <Info size={14} /> }
                                        ].map(stat => (
                                            <Card key={stat.label} className="p-5 flex flex-col justify-between border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                                                    <div className={cn("p-1.5 rounded-lg", stat.val <= 0 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500")}>
                                                        {stat.icon}
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={cn("text-xl font-black italic", stat.val <= 0 ? "text-rose-500" : "text-slate-900 dark:text-white")}>
                                                        {Math.round(stat.val)}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{stat.unit}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Symptoms */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 ml-4">
                                        <Info size={16} className="text-rose-500" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Diagnostic Warnings</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {simStatus.activeSymptoms.length === 0 ? (
                                            <div className="p-12 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                                                    <Sparkles size={24} className="text-emerald-500" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Bio-Integrity Maintained.</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase max-w-xs mt-2">Current inventory sustains all critical functions through Day {simulationDay}.</p>
                                            </div>
                                        ) : (
                                            simStatus.activeSymptoms.map(s => (
                                                <div key={s.name} className="p-6 bg-rose-50 dark:bg-rose-500/5 border-2 border-rose-500/20 rounded-[2.5rem] animate-in zoom-in-95 duration-300">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-rose-500 text-white p-2 rounded-xl">
                                                            <Activity size={18} />
                                                        </div>
                                                        <h4 className="text-lg font-black uppercase italic text-rose-600">{s.name}</h4>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase leading-relaxed mb-3">
                                                        {s.symptom}
                                                    </p>
                                                    <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/10">
                                                        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-rose-500">Terminal Risk: {s.terminal}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Protocols to Fix Issues */}
                            <div className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Protocol Lifelines</h3>
                                    <Button variant="ghost" onClick={() => setStep('ingredients')} className="text-[10px] font-black uppercase">Adjust Pantry</Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {suggestions.length === 0 ? (
                                        <div className="md:col-span-2 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No matching protocols in library.</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Add more diverse ingredients to unlock recommendations.</p>
                                        </div>
                                    ) : (
                                        suggestions.map(recipe => (
                                            <div key={recipe.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:shadow-xl transition-all">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover rounded-2xl" /> : <ChefHat className="text-slate-300" size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black uppercase italic truncate max-w-[200px]">{recipe.title}</h4>
                                                        <p className="text-[9px] font-bold text-emerald-500 uppercase">{recipe.calories} KCAL SHIELD</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => eatMeal(recipe)}
                                                    className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[9px]"
                                                >
                                                    Consume Protocol
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Survival Context Note */}
                <div className="p-10 bg-slate-900 text-white rounded-[4rem] space-y-6 animate-in fade-in delay-500 border border-amber-500/10 shadow-3xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-2xl">
                            <Info className="text-amber-500" size={24} />
                        </div>
                        <h5 className="text-xl font-black uppercase italic tracking-[0.1em]">Biological Hierarchy of Needs</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { label: 'Stability (3 Hrs)', detail: 'Regulate core temp or face hypothermia.', color: 'text-amber-500' },
                            { label: 'Hydration (3 Days)', detail: 'Without water, blood thickens and kidneys fail.', color: 'text-blue-500' },
                            { label: 'Nutrition (3 Weeks)', detail: 'Body begins consuming vital organs for energy.', color: 'text-emerald-500' }
                        ].map((rule, idx) => (
                            <div key={idx} className="space-y-2 border-l-2 border-slate-800 pl-6">
                                <p className={cn("font-black text-xs uppercase tracking-widest", rule.color)}>{rule.label}</p>
                                <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">{rule.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PageContainer >
    );
}
