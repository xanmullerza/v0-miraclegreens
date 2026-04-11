'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
    Wallet, Search, X, ArrowRight, Loader2, Sparkles,
    Zap, Activity, Info, Utensils, ChefHat, Plus,
    Beef, ChevronRight, Library, Calendar, Scale, Droplet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { searchLocalFood } from '@/lib/services/nutrition';
import { calculateSurvivalStatus, SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { LifeguardLongevityMeter } from '@/components/admin/lifeguard/longevity-meter';
import { LifeguardDeficitAnalysis } from '@/components/admin/lifeguard/deficit-analysis';
import { LifeguardDiagnosticWarnings } from '@/components/admin/lifeguard/diagnostic-warnings';
import { LifeguardScenarioComparison } from '@/components/admin/lifeguard/scenario-comparison';
import { LifeguardSurvivalCalendar } from '@/components/admin/lifeguard/survival-calendar';

interface InventoryItem {
    id: string;
    name: string;
    weight_g: number;
    nutrition: any;
}

interface EmergencyRecipe {
    id: string;
    name: string;
    description: string;
    purpose: 'energy' | 'nutrients' | 'balanced' | 'quick';
    servingSize: number;
    servings: number;
    ingredients: { item: InventoryItem; amount_g: number }[];
    nutrition: {
        energy_kcal: number;
        vitamin_c: number;
        b1: number;
        potential_days: number;
    };
    efficiency: number;
    difficulty: 'simple' | 'moderate' | 'complex';
    prepTime: number;
    icon: string;
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Button = ({ children, onClick, disabled, className, variant = 'default' }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "px-4 py-2 rounded-lg transition-colors font-black text-xs uppercase",
            variant === 'ghost' ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50',
            className
        )}
    >
        {children}
    </button>
);

const Badge = ({ children, className }: any) => (
    <span className={cn("px-2 py-1 rounded-full text-xs font-black uppercase bg-emerald-500 text-white", className)}>
        {children}
    </span>
);

export function LifeguardFullIntegration() {
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
    const [boosts, setBoosts] = useState<{ id: string; message: string }[]>([]);

    // Scenario Comparison
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonInventory, setComparisonInventory] = useState<InventoryItem[]>([]);
    const [comparisonWaterStatus, setComparisonWaterStatus] = useState<'clean' | 'dirty' | 'none' | null>(null);

    // Meal Planner
    const [generatedRecipes, setGeneratedRecipes] = useState<EmergencyRecipe[]>([]);
    const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

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

            // RECIPE 1: Maximum Energy
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

            // RECIPE 2: Vitamin Boost
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

            // RECIPE 3: Balanced Mix
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

            // RECIPE 4: Quick Energy
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

    useEffect(() => {
        const loadPersistence = async () => {
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
        };

        loadPersistence();
    }, []);

    useEffect(() => {
        if (inventory.length === 0 && step === 'security') return;

        const savePersistence = async () => {
            const state = { step, security: securityStatus, water: waterStatus, profile: profileType };
            localStorage.setItem('miraclegreens_survival_inventory', JSON.stringify(inventory));
            localStorage.setItem('miraclegreens_survival_state', JSON.stringify(state));
        };

        const timer = setTimeout(savePersistence, 1000);
        return () => clearTimeout(timer);
    }, [inventory, step, securityStatus, waterStatus, profileType]);

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

        if (food.name.toLowerCase().includes('cabbage')) {
            addBoost("ULTRA BOOST: Vitamin C & K reserves extended +4 days!");
        } else if (food.name.toLowerCase().includes('lemon') || food.name.toLowerCase().includes('orange')) {
            addBoost("SCURVY SHIELD: Scurvy progression halted!");
        }

        if (existing) {
            setInventory(inventory.map(item =>
                item.id === food.id
                    ? { ...item, weight_g: item.weight_g + 500 }
                    : item
            ));
            toast.success(`Replenished ${food.name} stocks (+500g)`);
        } else {
            setInventory([...inventory, {
                id: food.id,
                name: food.common_name || food.name,
                weight_g: 500,
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
        localStorage.removeItem('miraclegreens_survival_inventory');
        localStorage.removeItem('miraclegreens_survival_state');
        toast.success("Simulation Reset.");
    };

    const adjustedInventory = useMemo(() => {
        if (waterStatus === 'none' || waterStatus === null) {
            return inventory.map(item => ({
                ...item,
                nutrition: {
                    ...item.nutrition,
                    energy_kcal: (item.nutrition?.energy_kcal || 0) * 0.85
                }
            }));
        } else if (waterStatus === 'dirty') {
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
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar pb-32 pr-2">
            {/* Boost Toasts */}
            <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[90vw]">
                {boosts.map(boost => (
                    <div key={boost.id} className="bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-xl font-black uppercase text-[8px] tracking-widest animate-in slide-in-from-right-8 fade-in flex items-center gap-2">
                        <Sparkles size={12} className="shrink-0" />
                        <span className="line-clamp-1">{boost.message}</span>
                    </div>
                ))}
            </div>

            {step === 'security' && (
                <Card className="p-6 text-center space-y-4 border-2 border-amber-500/20">
                    <h2 className="text-lg font-black uppercase italic tracking-tight">Are you in a safe space?</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => { setSecurityStatus('safe'); setStep('water'); }} className="h-16 bg-emerald-500 hover:bg-emerald-600">
                            Yes, Safe
                        </Button>
                        <Button onClick={() => setSecurityStatus('unsafe')} className="h-16 bg-rose-500 hover:bg-rose-600">
                            Need Shelter
                        </Button>
                    </div>
                </Card>
            )}

            {step === 'water' && (
                <Card className="p-6 text-center space-y-4 border-2 border-blue-500/20">
                    <h2 className="text-lg font-black uppercase italic tracking-tight">Water access?</h2>
                    <div className="grid grid-cols-3 gap-2">
                        <Button onClick={() => { setWaterStatus('clean'); setStep('ingredients'); }} className="h-14 bg-blue-500 hover:bg-blue-600 text-xs">
                            Clean
                        </Button>
                        <Button onClick={() => { setWaterStatus('dirty'); setStep('ingredients'); }} className="h-14 bg-amber-500 hover:bg-amber-600 text-xs">
                            Dirty
                        </Button>
                        <Button onClick={() => { setWaterStatus('none'); setStep('ingredients'); }} className="h-14 bg-rose-500 hover:bg-rose-600 text-xs">
                            None
                        </Button>
                    </div>
                </Card>
            )}

            {step === 'ingredients' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase">Active Pantry</h3>
                        <Badge>{inventory.length}</Badge>
                    </div>

                    {/* Search */}
                    {isHeroActive && (
                        <div className="space-y-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <input
                                type="text"
                                placeholder="Search foods..."
                                value={heroSearchQuery}
                                onChange={(e) => handleHeroSearchInput(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                            />
                            {isHeroSearching && <Loader2 size={12} className="animate-spin mx-auto text-emerald-500" />}
                            {heroResults.length > 0 && (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {heroResults.slice(0, 6).map(food => (
                                        <button
                                            key={food.id}
                                            onClick={() => addIngredient(food)}
                                            className="w-full text-left p-2 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors"
                                        >
                                            <p className="font-black uppercase truncate">{food.common_name || food.name}</p>
                                            <p className="text-[10px] text-slate-500">~{Math.round(food.energy_kcal || 0)} kcal</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Inventory Items */}
                    <div className="space-y-2">
                        {inventory.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center">
                                <p className="text-xs font-black uppercase text-slate-400">Pantry empty</p>
                            </div>
                        ) : (
                            inventory.map(item => (
                                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-xs font-black uppercase">{item.name}</p>
                                            <p className="text-[10px] text-slate-500">{Math.round(item.weight_g)}g</p>
                                        </div>
                                        <button onClick={() => removeInventoryItem(item.id)} className="text-rose-500 hover:text-rose-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="50"
                                        value={item.weight_g}
                                        onChange={(e) => updateInventoryWeight(item.id, parseInt(e.target.value))}
                                        className="w-full h-1.5 accent-emerald-500"
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    <Button
                        onClick={() => setIsHeroActive(!isHeroActive)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        <Plus size={14} className="mr-2" />
                        Add Ingredient
                    </Button>

                    {inventory.length > 0 && (
                        <Button
                            onClick={generateEmergencyRecipes}
                            disabled={isGeneratingRecipes}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            {isGeneratingRecipes ? <Loader2 size={14} className="animate-spin" /> : '🔥 Generate Recipes'}
                        </Button>
                    )}

                    {inventory.length > 0 && (
                        <Button
                            onClick={() => setStep('lifeline')}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            View Analysis
                        </Button>
                    )}
                </div>
            )}

            {step === 'lifeline' && (
                <div className="space-y-4">
                    {/* Phase 1: Critical Components */}
                    <LifeguardLongevityMeter
                        inventory={inventory}
                        simStatus={simStatus}
                        waterStatus={waterStatus}
                        profileType={profileType}
                        simulationDay={simulationDay}
                        onSimulationDayChange={setSimulationDay}
                        onProfileTypeChange={setProfileType}
                        energyUnit={energyUnit}
                    />

                    <LifeguardSurvivalCalendar
                        inventory={inventory}
                        adjustedInventory={adjustedInventory}
                        profileType={profileType}
                        waterStatus={waterStatus}
                    />

                    <LifeguardScenarioComparison
                        inventory={inventory}
                        comparisonInventory={comparisonInventory}
                        comparisonMode={comparisonMode}
                        comparisonWaterStatus={comparisonWaterStatus}
                        adjustedInventory={adjustedInventory}
                        comparisonAdjustedInventory={comparisonAdjustedInventory}
                        comparisonSimStatus={comparisonSimStatus}
                        profileType={profileType}
                        simulationDay={simulationDay}
                        waterStatus={waterStatus}
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

                    <LifeguardDiagnosticWarnings
                        simStatus={simStatus}
                    />

                    {/* Generated Recipes */}
                    {generatedRecipes.length > 0 && (
                        <Card className="p-4">
                            <h3 className="text-sm font-black uppercase mb-3">Generated Recipes ({generatedRecipes.length})</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {generatedRecipes.map((recipe) => (
                                    <div key={recipe.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-orange-100 dark:border-orange-500/20">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{recipe.icon}</span>
                                                <div>
                                                    <p className="text-xs font-black uppercase">{recipe.name}</p>
                                                    <p className="text-[9px] text-slate-500">{recipe.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded">{recipe.efficiency.toFixed(0)}%</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1 text-[8px] mb-2">
                                            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded"><strong>Energy</strong><p>{Math.round(recipe.nutrition.energy_kcal)} kcal</p></div>
                                            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded"><strong>Vit C</strong><p>{Math.round(recipe.nutrition.vitamin_c)} mg</p></div>
                                            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded"><strong>B1</strong><p>{recipe.nutrition.b1.toFixed(2)} mg</p></div>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded"><strong>Days</strong><p>{recipe.nutrition.potential_days}</p></div>
                                        </div>

                                        <Button
                                            onClick={() => consumeRecipe(recipe)}
                                            className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            🍽️ Consume
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <Button onClick={() => setStep('ingredients')} className="w-full bg-slate-500 hover:bg-slate-600 text-white">
                        ← Back to Pantry
                    </Button>

                    <Button onClick={resetSimulation} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
                        🔄 Reset Simulation
                    </Button>
                </div>
            )}
        </div>
    );
}
