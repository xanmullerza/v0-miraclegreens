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
import { LifeguardLongevityMeter } from '@/components/lifeguard/longevity-meter';
import { LifeguardDeficitAnalysis } from '@/components/lifeguard/deficit-analysis';
import { LifeguardDiagnosticWarnings } from '@/components/lifeguard/diagnostic-warnings';
import { LifeguardScenarioComparison } from '@/components/lifeguard/scenario-comparison';
import { LifeguardSurvivalCalendar } from '@/components/lifeguard/survival-calendar';

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

    // Scenario Comparison
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonInventory, setComparisonInventory] = useState<InventoryItem[]>([]);
    const [comparisonWaterStatus, setComparisonWaterStatus] = useState<'clean' | 'dirty' | 'none' | null>(null);

    // Meal Planner
    const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
    const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

    interface EmergencyRecipe {
        id: string;
        name: string;
        description: string;
        purpose: 'energy' | 'nutrients' | 'balanced' | 'quick';
        servingSize: number; // grams per serving
        servings: number; // number of servings available
        ingredients: { item: InventoryItem; amount_g: number }[];
        nutrition: {
            energy_kcal: number;
            vitamin_c: number;
            b1: number;
            potential_days: number;
        };
        efficiency: number; // 0-100 score
        difficulty: 'simple' | 'moderate' | 'complex';
        prepTime: number; // minutes
        icon: string;
    }

    const generateEmergencyRecipes = async () => {
        if (inventory.length === 0) {
            toast.error("Add ingredients first!");
            return;
        }

        setIsGeneratingRecipes(true);
        try {
            const profile = SURVIVAL_PROFILES[profileType];
            const recipes: EmergencyRecipe[] = [];
            const itemsAvailable = inventory.filter(i => i.weight_g > 0);

            if (itemsAvailable.length === 0) {
                toast.error("No items with weight > 0");
                setIsGeneratingRecipes(false);
                return;
            }

            // RECIPE 1: Maximum Energy (Calorie Dense)
            if (itemsAvailable.length > 0) {
                const topEnergy = itemsAvailable.sort((a, b) => 
                    ((b.nutrition?.energy_kcal || 0) * (b.weight_g / 100)) - 
                    ((a.nutrition?.energy_kcal || 0) * (a.weight_g / 100))
                ).slice(0, 3);

                const totalEnergy = topEnergy.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0);
                const servingSize = 150;
                const servings = Math.floor(topEnergy.reduce((acc, i) => acc + i.weight_g, 0) / (servingSize * topEnergy.length));

                recipes.push({
                    id: 'max_energy',
                    name: 'Maximum Calorie Fuel',
                    description: 'Highest energy density meal for survival',
                    purpose: 'energy',
                    servingSize,
                    servings: Math.max(1, servings),
                    ingredients: topEnergy.map(item => ({
                        item,
                        amount_g: servingSize
                    })),
                    nutrition: {
                        energy_kcal: totalEnergy / Math.max(1, topEnergy.length),
                        vitamin_c: topEnergy.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (servingSize / 100), 0),
                        b1: topEnergy.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (servingSize / 100), 0),
                        potential_days: Math.ceil(totalEnergy / profile.energy_floor)
                    },
                    efficiency: Math.min(100, (totalEnergy / profile.energy_floor / 30) * 100),
                    difficulty: 'simple',
                    prepTime: 5,
                    icon: '🔥'
                });
            }

            // RECIPE 2: Vitamin Boost (Micronutrient Rich)
            const vitaminRich = itemsAvailable.filter(i => 
                (i.nutrition?.micronutrients?.['Vitamin C'] || 0) > 5 || 
                (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) > 0.5
            ).slice(0, 4);

            if (vitaminRich.length > 0) {
                const totalVitC = vitaminRich.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (i.weight_g / 100), 0);
                const totalB1 = vitaminRich.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (i.weight_g / 100), 0);
                const servingSize = 100;
                const servings = Math.floor(vitaminRich.reduce((acc, i) => acc + i.weight_g, 0) / (servingSize * vitaminRich.length));

                recipes.push({
                    id: 'vitamin_boost',
                    name: 'Nutrient Protocol',
                    description: 'Prevents scurvy, beriberi, and deficiency diseases',
                    purpose: 'nutrients',
                    servingSize,
                    servings: Math.max(1, servings),
                    ingredients: vitaminRich.map(item => ({
                        item,
                        amount_g: servingSize
                    })),
                    nutrition: {
                        energy_kcal: vitaminRich.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (servingSize / 100), 0),
                        vitamin_c: totalVitC / vitaminRich.length,
                        b1: totalB1 / vitaminRich.length,
                        potential_days: Math.ceil((totalVitC / vitaminRich.length) / profile.vit_c_floor)
                    },
                    efficiency: Math.min(100, ((totalVitC / vitaminRich.length) / profile.vit_c_floor / 30) * 100),
                    difficulty: 'moderate',
                    prepTime: 10,
                    icon: '💊'
                });
            }

            // RECIPE 3: Balanced Mix (All nutrients)
            if (itemsAvailable.length >= 2) {
                const balanced = itemsAvailable.slice(0, Math.min(5, itemsAvailable.length));
                const avgEnergy = balanced.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0) / balanced.length;
                const servingSize = 200;
                const servings = Math.floor(balanced.reduce((acc, i) => acc + i.weight_g, 0) / (servingSize * balanced.length));

                recipes.push({
                    id: 'balanced',
                    name: 'Balanced Survival Mix',
                    description: 'Combines all available foods for complete nutrition',
                    purpose: 'balanced',
                    servingSize,
                    servings: Math.max(1, servings),
                    ingredients: balanced.map(item => ({
                        item,
                        amount_g: servingSize
                    })),
                    nutrition: {
                        energy_kcal: avgEnergy,
                        vitamin_c: balanced.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (servingSize / 100), 0) / balanced.length,
                        b1: balanced.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (servingSize / 100), 0) / balanced.length,
                        potential_days: Math.ceil(avgEnergy / profile.energy_floor)
                    },
                    efficiency: Math.min(100, (avgEnergy / profile.energy_floor / 30) * 100 * 0.8),
                    difficulty: 'complex',
                    prepTime: 15,
                    icon: '🍽️'
                });
            }

            // RECIPE 4: Quick Energy (Fast preparation)
            const quick = itemsAvailable.filter(i => (i.nutrition?.energy_kcal || 0) > 100).slice(0, 2);
            if (quick.length > 0) {
                const quickTotal = quick.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0);
                const servingSize = 75;
                const servings = Math.floor(quick.reduce((acc, i) => acc + i.weight_g, 0) / (servingSize * quick.length));

                recipes.push({
                    id: 'quick_energy',
                    name: 'Quick Energy Pack',
                    description: 'Eat immediately, no prep required',
                    purpose: 'quick',
                    servingSize,
                    servings: Math.max(1, servings),
                    ingredients: quick.map(item => ({
                        item,
                        amount_g: servingSize
                    })),
                    nutrition: {
                        energy_kcal: quickTotal / quick.length,
                        vitamin_c: quick.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (servingSize / 100), 0) / quick.length,
                        b1: quick.reduce((acc, i) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (servingSize / 100), 0) / quick.length,
                        potential_days: Math.ceil((quickTotal / quick.length) / profile.energy_floor)
                    },
                    efficiency: 95,
                    difficulty: 'simple',
                    prepTime: 0,
                    icon: '⚡'
                });
            }

            setGeneratedRecipes(recipes.sort((a, b) => b.efficiency - a.efficiency));
            addBoost(`GENERATED ${recipes.length} SURVIVAL RECIPES`);
        } catch (error) {
            console.error('Error generating recipes:', error);
            toast.error("Failed to generate recipes");
        } finally {
            setIsGeneratingRecipes(false);
        }
    };

    const consumeRecipe = (recipe: EmergencyRecipe) => {
        let updated = [...inventory];
        let consumed = 0;

        recipe.ingredients.forEach(({ item, amount_g }) => {
            updated = updated.map(invItem =>
                invItem.id === item.id 
                    ? { ...invItem, weight_g: Math.max(0, invItem.weight_g - amount_g) } 
                    : invItem
            );
            consumed++;
        });

        setInventory(updated.filter(item => item.weight_g > 0));
        toast.success(`🍽️ ${recipe.name} consumed! (${recipe.servingSize}g serving)`);
        addBoost(`ATE: ${recipe.name.toUpperCase()}`);
        
        // Regenerate recipes with updated inventory
        setGeneratedRecipes([]);
    };

    const addBoost = (message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setBoosts(prev => [...prev, { id, message }]);
        setTimeout(() => setBoosts(prev => prev.filter(b => b.id !== id)), 4000);
    };

    const startComparison = () => {
        setComparisonInventory([...inventory]);
        setComparisonWaterStatus(waterStatus);
        setComparisonMode(true);
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

    // Apply water system impact to inventory
    const adjustedInventory = useMemo(() => {
        if (waterStatus === 'none' || waterStatus === null) {
            // No water source: increase dehydration risk (reduce effective inventory by 15%)
            return inventory.map(item => ({
                ...item,
                nutrition: {
                    ...item.nutrition,
                    energy_kcal: (item.nutrition?.energy_kcal || 0) * 0.85
                }
            }));
        } else if (waterStatus === 'dirty') {
            // Dirty water: reduce some nutrient absorption (75% effective)
            return inventory.map(item => ({
                ...item,
                nutrition: {
                    ...item.nutrition,
                    energy_kcal: (item.nutrition?.energy_kcal || 0) * 0.75,
                    micronutrients: item.nutrition?.micronutrients ? Object.fromEntries(
                        Object.entries(item.nutrition.micronutrients).map(([k, v]: [string, any]) => [k, v * 0.85])
                    ) : {}
                }
            }));
        }
        return inventory;
    }, [inventory, waterStatus]);

    const simStatus = calculateSurvivalStatus(
        adjustedInventory,
        simulationDay,
        profileType,
        waterStatus === 'clean'
    );

    // Comparison mode simulation
    const comparisonAdjustedInventory = useMemo(() => {
        if (comparisonWaterStatus === 'none' || comparisonWaterStatus === null) {
            return comparisonInventory.map(item => ({
                ...item,
                nutrition: {
                    ...item.nutrition,
                    energy_kcal: (item.nutrition?.energy_kcal || 0) * 0.85
                }
            }));
        } else if (comparisonWaterStatus === 'dirty') {
            return comparisonInventory.map(item => ({
                ...item,
                nutrition: {
                    ...item.nutrition,
                    energy_kcal: (item.nutrition?.energy_kcal || 0) * 0.75,
                    micronutrients: item.nutrition?.micronutrients ? Object.fromEntries(
                        Object.entries(item.nutrition.micronutrients).map(([k, v]: [string, any]) => [k, v * 0.85])
                    ) : {}
                }
            }));
        }
        return comparisonInventory;
    }, [comparisonInventory, comparisonWaterStatus]);

    const comparisonSimStatus = useMemo(() => {
        if (!comparisonMode) return null;
        return calculateSurvivalStatus(
            comparisonAdjustedInventory,
            simulationDay,
            profileType,
            comparisonWaterStatus === 'clean'
        );
    }, [comparisonMode, comparisonAdjustedInventory, simulationDay, profileType, comparisonWaterStatus]);

    return (
        <PageContainer>
            {/* Boost Toasts */}
            <div className="fixed top-20 md:top-24 right-4 md:right-8 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw] md:max-w-none">
                {boosts.map(boost => (
                    <div key={boost.id} className="bg-emerald-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest animate-in slide-in-from-right-8 fade-in flex items-center gap-2 md:gap-3">
                        <Sparkles size={14} className="shrink-0" />
                        <span className="line-clamp-2">{boost.message}</span>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20 px-3 md:px-4">
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
                        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4 duration-500">
                            {/* Component-based visualization */}

                            <LifeguardLongevityMeter
                                inventory={inventory}
                                simStatus={simStatus}
                                waterStatus={waterStatus}
                                profileType={profileType}
                                simulationDay={simulationDay}
                                onSimulationDayChange={setSimulationDay}
                                onProfileTypeChange={setProfileType}
                            />

                            <LifeguardSurvivalCalendar
                                inventory={inventory}
                                waterStatus={waterStatus}
                                profileType={profileType}
                                adjustedInventory={adjustedInventory}
                            />

                            <LifeguardScenarioComparison
                                inventory={inventory}
                                waterStatus={waterStatus}
                                profileType={profileType}
                                simulationDay={simulationDay}
                                comparisonMode={comparisonMode}
                                comparisonInventory={comparisonInventory}
                                comparisonWaterStatus={comparisonWaterStatus}
                                adjustedInventory={adjustedInventory}
                                comparisonAdjustedInventory={comparisonAdjustedInventory}
                                comparisonSimStatus={comparisonSimStatus}
                                onStartComparison={startComparison}
                                onCloseComparison={() => setComparisonMode(false)}
                                onComparisonInventoryChange={setComparisonInventory}
                                onComparisonWaterStatusChange={setComparisonWaterStatus}
                            />

                            <LifeguardDeficitAnalysis
                                inventory={inventory}
                                simStatus={simStatus}
                                profileType={profileType}
                                simulationDay={simulationDay}
                            />

                            <LifeguardDiagnosticWarnings simStatus={simStatus} />

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
