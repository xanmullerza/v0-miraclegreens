'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Search, X, Plus, Trash2, ChevronLeft, ChevronRight, Shield, Droplet, Utensils, Sparkles, Zap, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InventoryItem {
    id: string;
    name: string;
    common_name?: string;
    image_url: string | null;
    weight_g: number;
    nutrition?: any;
}

interface EmergencyRecipe {
    id: string;
    name: string;
    description: string;
    icon: string;
    energy_kcal: number;
    servings: number;
    efficiency: number;
    difficulty: 'simple' | 'moderate' | 'complex';
}

const SURVIVAL_PROFILES = {
    maintenance: { energy_floor: 1500, vit_c_floor: 50 },
    starvation: { energy_floor: 800, vit_c_floor: 30 }
};

export function LifeguardFull() {
    const [step, setStep] = useState<'security' | 'water' | 'inventory' | 'recipes'>('security');
    const [securityStatus, setSecurityStatus] = useState<'safe' | 'unsafe' | null>(null);
    const [waterStatus, setWaterStatus] = useState<'clean' | 'dirty' | 'none' | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [profileType, setProfileType] = useState<'maintenance' | 'starvation'>('starvation');
    const [generatedRecipes, setGeneratedRecipes] = useState<EmergencyRecipe[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedWeight, setSelectedWeight] = useState('100');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const totalWeight = useMemo(() => {
        return inventory.reduce((acc, i) => acc + i.weight_g, 0);
    }, [inventory]);

    const performSearch = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image_url, energy_kcal, micronutrients')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);
            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(value), 300);
    }, [performSearch]);

    const addToInventory = useCallback((food: any) => {
        const newItem: InventoryItem = {
            id: food.id,
            name: food.name,
            common_name: food.common_name,
            image_url: food.image_url,
            weight_g: parseInt(selectedWeight) || 100,
            nutrition: food
        };
        setInventory([...inventory, newItem]);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedWeight('100');
        toast.success(`Added ${food.name}`);
    }, [inventory, selectedWeight]);

    const removeItem = useCallback((id: string) => {
        setInventory(inventory.filter(i => i.id !== id));
    }, [inventory]);

    const generateRecipes = useCallback(() => {
        if (inventory.length === 0) {
            toast.error('Add ingredients first!');
            return;
        }

        const profile = SURVIVAL_PROFILES[profileType];
        const recipes: EmergencyRecipe[] = [];

        const totalEnergy = inventory.reduce((acc, i) => 
            acc + ((i.nutrition?.energy_kcal || 0) * (i.weight_g / 100)), 0
        );

        if (totalEnergy > 0) {
            recipes.push({
                id: 'max_energy',
                name: 'Calorie Fuel',
                description: 'Highest energy density meal',
                icon: '🔥',
                energy_kcal: Math.round(totalEnergy / inventory.length),
                servings: Math.max(1, Math.floor(totalWeight / 150)),
                efficiency: Math.min(100, (totalEnergy / profile.energy_floor) * 100),
                difficulty: 'simple'
            });
        }

        const hasVitamins = inventory.some(i => 
            (i.nutrition?.micronutrients?.['Vitamin C'] || 0) > 5
        );
        if (hasVitamins) {
            recipes.push({
                id: 'vitamin_boost',
                name: 'Nutrient Protocol',
                description: 'Prevents deficiency diseases',
                icon: '💊',
                energy_kcal: Math.round(totalEnergy / inventory.length * 0.8),
                servings: Math.max(1, Math.floor(totalWeight / 100)),
                efficiency: 75,
                difficulty: 'moderate'
            });
        }

        if (inventory.length >= 2) {
            recipes.push({
                id: 'balanced',
                name: 'Balanced Mix',
                description: 'Complete nutrition profile',
                icon: '🥗',
                energy_kcal: Math.round(totalEnergy / inventory.length),
                servings: Math.max(1, Math.floor(totalWeight / 200)),
                efficiency: 85,
                difficulty: 'moderate'
            });
        }

        setGeneratedRecipes(recipes);
        setStep('recipes');
    }, [inventory, profileType, totalWeight]);

    // Security Step
    if (step === 'security') {
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 space-y-3">
                    <h3 className="font-black flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100 uppercase">
                        <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                        Health Status
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">What's your current health situation?</p>
                    <div className="space-y-2">
                        <button
                            onClick={() => { setSecurityStatus('safe'); setStep('water'); }}
                            className="w-full p-2.5 rounded-lg border-2 border-green-300 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 text-left font-bold text-sm text-green-700 dark:text-green-300 transition-colors"
                        >
                            ✅ Safe & Healthy
                        </button>
                        <button
                            onClick={() => { setSecurityStatus('unsafe'); setStep('water'); }}
                            className="w-full p-2.5 rounded-lg border-2 border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-left font-bold text-sm text-orange-700 dark:text-orange-300 transition-colors"
                        >
                            ⚠️ Compromised Health
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Water Step
    if (step === 'water') {
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <button
                    onClick={() => setStep('security')}
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold uppercase tracking-wider mb-2"
                >
                    <ChevronLeft size={14} /> Back
                </button>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 space-y-3">
                    <h3 className="font-black flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100 uppercase">
                        <Droplet size={16} className="text-blue-600 dark:text-blue-400" />
                        Water Quality
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Do you have clean water access?</p>
                    <div className="space-y-2">
                        <button
                            onClick={() => { setWaterStatus('clean'); setStep('inventory'); }}
                            className="w-full p-2.5 rounded-lg border-2 border-green-300 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 text-left font-bold text-sm text-green-700 dark:text-green-300 transition-colors"
                        >
                            💧 Clean Water
                        </button>
                        <button
                            onClick={() => { setWaterStatus('dirty'); setStep('inventory'); }}
                            className="w-full p-2.5 rounded-lg border-2 border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-left font-bold text-sm text-orange-700 dark:text-orange-300 transition-colors"
                        >
                            ⚠️ Contaminated
                        </button>
                        <button
                            onClick={() => { setWaterStatus('none'); setStep('inventory'); }}
                            className="w-full p-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-left font-bold text-sm text-red-700 dark:text-red-300 transition-colors"
                        >
                            ❌ No Water
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Inventory Step
    if (step === 'inventory') {
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <button
                    onClick={() => setStep('water')}
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold uppercase tracking-wider mb-2"
                >
                    <ChevronLeft size={14} /> Back
                </button>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800 space-y-3">
                    <h3 className="font-black flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100 uppercase">
                        <Utensils size={16} className="text-blue-600 dark:text-blue-400" />
                        Build Inventory ({totalWeight}g)
                    </h3>

                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="Search foods..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>

                        {searchQuery && (
                            <div className="space-y-1 max-h-[100px] overflow-y-auto border rounded text-xs">
                                {isSearching ? (
                                    <div className="text-center p-2 text-muted-foreground">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((food) => (
                                        <button
                                            key={food.id}
                                            onClick={() => addToInventory(food)}
                                            className="w-full text-left p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 truncate text-xs"
                                        >
                                            {food.common_name || food.name}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center p-2 text-muted-foreground text-xs">No results</div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={selectedWeight}
                                onChange={(e) => setSelectedWeight(e.target.value)}
                                placeholder="Grams"
                                className="flex-1 px-2 py-1 border rounded text-xs dark:bg-slate-800 dark:border-slate-700"
                                min="10"
                            />
                            <span className="text-xs text-muted-foreground py-1">g</span>
                        </div>
                    </div>

                    {inventory.length > 0 && (
                        <>
                            <div className="space-y-1 max-h-[120px] overflow-y-auto">
                                {inventory.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded border text-xs">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate text-xs">{item.common_name || item.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{item.weight_g}g</p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded shrink-0"
                                        >
                                            <X size={12} className="text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={generateRecipes}
                                className="w-full p-2 bg-blue-600 text-white rounded font-bold text-xs hover:bg-blue-700 transition-colors"
                            >
                                Generate Recipes →
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Recipes Step
    if (step === 'recipes') {
        return (
            <div className="space-y-3 max-h-[550px] overflow-y-auto">
                <button
                    onClick={() => setStep('inventory')}
                    className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold uppercase tracking-wider mb-2"
                >
                    <ChevronLeft size={14} /> Back
                </button>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800 space-y-3">
                    <h3 className="font-black text-sm text-green-900 dark:text-green-100 uppercase">Emergency Recipes</h3>
                    {generatedRecipes.map((recipe) => (
                        <div key={recipe.id} className="bg-white dark:bg-slate-900 rounded p-2 border text-xs">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-bold flex items-center gap-1 text-xs">
                                        <span>{recipe.icon}</span> {recipe.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{recipe.description}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                    <p className="text-muted-foreground text-[9px]">Energy</p>
                                    <p className="font-bold">{recipe.energy_kcal} kcal</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[9px]">Servings</p>
                                    <p className="font-bold">{recipe.servings}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[9px]">Efficiency</p>
                                    <p className="font-bold">{recipe.efficiency.toFixed(0)}%</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[9px]">Difficulty</p>
                                    <p className="font-bold capitalize text-[10px]">{recipe.difficulty}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
