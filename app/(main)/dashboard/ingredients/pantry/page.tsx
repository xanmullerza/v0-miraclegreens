'use client';

import React, { useState, useEffect } from 'react';
import { PantryView } from '@/components/kitchen/pantry-view';
import { Beef, ChevronRight, Plus, X } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PantryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');
    const [selectedPortion, setSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);

    useEffect(() => {
        const searchFoods = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, energy_kcal')
                    .or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`)
                    .limit(20);

                if (error) {
                    console.error('Search error:', error);
                    setSearchResults([]);
                } else {
                    setSearchResults(data || []);
                }
            } catch (e) {
                console.error('Search error:', e);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchFoods, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    // Fetch measures when food is selected
    useEffect(() => {
        const loadMeasures = async () => {
            if (!selectedFood?.id) return;

            try {
                const measures = await fetchFoodMeasures(selectedFood.id);
                setSelectedFood((prev: any) => prev ? { ...prev, portions: measures } : null);
            } catch (error) {
                console.error('Error fetching measures:', error);
            }
        };

        loadMeasures();
    }, [selectedFood?.id]);

    const handleSelectFood = (food: any) => {
        setSelectedFood(food);
        setShowAddModal(true);
        setIsActive(false);
        setSearchQuery('');
        setQuickAddQty('1');
        setQuickAddWeight('');
        setQuickAddUnit('g');
        setQuickAddMode('pantry');
        setSelectedPortion(null);
    };

    const handleQuickAdd = async () => {
        if (!selectedFood) return;

        setIsAdding(true);
        try {
            // If a portion is selected, use its weight; otherwise use the weight input
            const finalWeight = selectedPortion ? selectedPortion.weight_g : quickAddWeight;
            const quantityString = finalWeight ? `${quickAddQty} x ${finalWeight}${quickAddUnit}` : quickAddQty;

            if (quickAddMode === 'pantry') {
                const { error } = await supabase
                    .from('food_items')
                    .update({ is_in_pantry: true } as any)
                    .eq('id', selectedFood.id);
                
                if (error) throw error;

                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                quantities[selectedFood.id] = quantityString;
                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));

                toast.success(`${selectedFood.common_name || selectedFood.name} added to pantry`);
                setRefreshKey(prev => prev + 1);
            } else {
                const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                const newItem = {
                    id: `manual-${Date.now()}`,
                    name: selectedFood.name,
                    quantity: quantityString,
                    unit: '',
                    checked: false,
                    source: 'manual'
                };
                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
                toast.success(`${selectedFood.common_name || selectedFood.name} added to groceries`);
            }

            setShowAddModal(false);
            setSelectedFood(null);
            setQuickAddQty('1');
            setQuickAddWeight('');
            setSelectedPortion(null);
        } catch (error) {
            console.error('Error adding to pantry:', error);
            toast.error('Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <PageContainer maxWidth="max-w-5xl">
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Hero Search */}
                <div className="pt-6">
                    <HeroSearch
                        searchQuery={searchQuery}
                        onQueryChange={setSearchQuery}
                        results={searchResults}
                        isLoading={isSearching}
                        isActive={isActive}
                        setIsActive={setIsActive}
                        onSelect={handleSelectFood}
                        theme="amber"
                        placeholder="SEARCH FOOD LIBRARY..."
                        idleTitle="Manage Your Pantry"
                        idleSubtitle="Search below to add items to your pantry inventory"
                        noResultsMessage="No matching items found"
                        enterMessage="Enter item name to search"
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
                                            {(food.energy_kcal ?? 0).toFixed(0)} kcal <span className="text-slate-200 dark:text-slate-700">|</span> 100g
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-amber-500 transition-colors shrink-0" size={20} />
                            </>
                        )}
                    />
                </div>

                {/* Quick Add Panel */}
                {showAddModal && selectedFood && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300 rounded-2xl mb-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                    {selectedFood.image ? (
                                        <img src={selectedFood.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <Beef size={24} className="text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Quick Action</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{selectedFood.common_name || selectedFood.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex-1 md:flex-none">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantity</Label>
                                    <Input
                                        type="number"
                                        value={quickAddQty}
                                        onChange={(e) => setQuickAddQty(e.target.value)}
                                        className="w-20 text-center"
                                    />
                                </div>

                                {selectedPortion ? (
                                    <div className="flex-1 md:flex-none">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Serving</Label>
                                        <select
                                            value={selectedPortion.label}
                                            onChange={(e) => {
                                                const portion = selectedFood.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
                                                } else {
                                                    setSelectedPortion(null);
                                                }
                                            }}
                                            className="w-auto px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            {selectedFood.portions?.map((p: any) => (
                                                <option key={p.label} value={p.label}>
                                                    {p.label} ({p.weight_g}g)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 md:flex-none">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Weight</Label>
                                            <Input
                                                type="number"
                                                value={quickAddWeight}
                                                onChange={(e) => setQuickAddWeight(e.target.value)}
                                                placeholder="e.g. 100"
                                                className="w-20 text-center"
                                            />
                                        </div>

                                        <div className="flex-1 md:flex-none">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Unit</Label>
                                            <select
                                                value={quickAddUnit}
                                                onChange={(e) => setQuickAddUnit(e.target.value)}
                                                className="w-20 px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                            >
                                                <option value="g">g</option>
                                                <option value="ml">ml</option>
                                                <option value="oz">oz</option>
                                                <option value="lb">lb</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {selectedFood.portions && selectedFood.portions.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (selectedPortion) {
                                                setSelectedPortion(null);
                                                setQuickAddWeight(`${selectedPortion.weight_g}`);
                                                setQuickAddUnit('g');
                                            } else {
                                                setSelectedPortion(selectedFood.portions[0]);
                                            }
                                        }}
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-500 transition-colors whitespace-nowrap self-end mb-0.5"
                                    >
                                        {selectedPortion ? 'Use Weight' : 'Use Serving'}
                                    </button>
                                )}

                                <div className="flex-1 md:flex-none">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Destination</Label>
                                    <select
                                        value={quickAddMode}
                                        onChange={(e) => setQuickAddMode(e.target.value as 'pantry' | 'shopping')}
                                        className="w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="pantry">Pantry</option>
                                        <option value="shopping">Groceries</option>
                                    </select>
                                </div>

                                <Button
                                    onClick={handleQuickAdd}
                                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px] h-10"
                                    disabled={isAdding}
                                >
                                    {isAdding ? (
                                        <>Loading...</>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Add
                                        </>
                                    )}
                                </Button>

                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setSelectedFood(null);
                                    }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <PantryView refreshKey={refreshKey} />
            </div>
        </PageContainer>
    );
}

