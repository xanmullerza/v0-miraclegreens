'use client';

import React, { useState, useEffect } from 'react';
import { PantryView } from '@/components/kitchen/pantry-view';
import { Beef, ChevronRight, Plus, X, Package } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { formatFoodName } from '@/lib/utils';
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
                    .select('id, name, common_name, image, energy_kcal, category')
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
            const quantityString = selectedPortion
                ? `${quickAddQty} ${selectedPortion.label} (${selectedPortion.weight_g}g)`
                : quickAddWeight
                    ? `${quickAddQty} x ${quickAddWeight}${quickAddUnit}`
                    : quickAddQty;

            if (quickAddMode === 'pantry') {
                const { error } = await supabase
                    .from('food_items')
                    .update({ is_in_pantry: true } as any)
                    .eq('id', selectedFood.id);
                
                if (error) throw error;

                // Merge with existing stock instead of overwriting
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                const existing = quantities[selectedFood.id] || '';

                const existingEntries = existing
                    .split(/\s*\+\s*/)
                    .map((s: string) => s.trim())
                    .filter((s: string) => {
                        if (!s) return false;
                        const m = s.match(/^(\d+(?:\.\d+)?)/);
                        return m ? parseFloat(m[1]) > 0 : true;
                    });

                const incomingLabeled = quantityString.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                const incomingX = quantityString.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|oz|lb)$/i);
                let merged = false;
                const fmtG = (g: number) => {
                    if (g >= 1000) {
                        const kg = g / 1000;
                        return `${kg % 1 === 0 ? kg.toString() : kg.toFixed(1)} kilogram (1000g)`;
                    }
                    return `${Math.round(g)} gram (1g)`;
                };

                if (incomingLabeled) {
                    const incQty = parseFloat(incomingLabeled[1]);
                    const incLabel = incomingLabeled[2];
                    const incWeight = incomingLabeled[3];
                    const isIncWeight = /^(gram|kilogram)s?$/i.test(incLabel);
                    if (isIncWeight) {
                        let totalGrams = incQty * parseFloat(incWeight);
                        const nonWeight: string[] = [];
                        for (const raw of existingEntries) {
                            const lbl = raw.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                            const xFmt = raw.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*g$/i);
                            if (lbl && /^(gram|kilogram)s?$/i.test(lbl[2])) {
                                totalGrams += parseFloat(lbl[1]) * parseFloat(lbl[3]);
                            } else if (xFmt) {
                                totalGrams += parseFloat(xFmt[1]) * parseFloat(xFmt[2]);
                            } else { nonWeight.push(raw); }
                        }
                        const consolidated = fmtG(totalGrams);
                        quantities[selectedFood.id] = nonWeight.length > 0 ? `${nonWeight.join(' + ')} + ${consolidated}` : consolidated;
                        merged = true;
                    } else {
                        const matchIdx = existingEntries.findIndex((raw: string) => {
                            const m = raw.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                            return m && m[2] === incLabel && m[3] === incWeight;
                        });
                        if (matchIdx >= 0) {
                            const m = existingEntries[matchIdx].match(/^(\d+(?:\.\d+)?)/);
                            existingEntries[matchIdx] = `${(m ? parseFloat(m[1]) : 0) + incQty} ${incLabel} (${incWeight}g)`;
                            quantities[selectedFood.id] = existingEntries.join(' + ');
                            merged = true;
                        }
                    }
                } else if (incomingX) {
                    let totalGrams = parseFloat(incomingX[1]) * parseFloat(incomingX[2]);
                    const nonWeight: string[] = [];
                    for (const raw of existingEntries) {
                        const lbl = raw.match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
                        const xFmt = raw.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*g$/i);
                        if (lbl && /^(gram|kilogram)s?$/i.test(lbl[2])) {
                            totalGrams += parseFloat(lbl[1]) * parseFloat(lbl[3]);
                        } else if (xFmt) {
                            totalGrams += parseFloat(xFmt[1]) * parseFloat(xFmt[2]);
                        } else { nonWeight.push(raw); }
                    }
                    const consolidated = fmtG(totalGrams);
                    quantities[selectedFood.id] = nonWeight.length > 0 ? `${nonWeight.join(' + ')} + ${consolidated}` : consolidated;
                    merged = true;
                }

                if (!merged) {
                    quantities[selectedFood.id] = existingEntries.length > 0
                        ? `${existingEntries.join(' + ')} + ${quantityString}`
                        : quantityString;
                }
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
                    source: 'manual',
                    food_item_id: selectedFood.id
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
                        idleIcon={<Package size={20} className="text-amber-500" />}
                        idleTitle="Pantry Inventory"
                        idleSubtitle="Search foods to stock your personal pantry"
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
                                        <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{formatFoodName(food.common_name || food.name)}</h4>
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

                                {selectedFood.portions && selectedFood.portions.length > 0 && !selectedPortion ? (
                                    <div className="flex-1 md:flex-none">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Serving</Label>
                                        <select
                                            onChange={(e) => {
                                                const portion = selectedFood.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
                                                }
                                            }}
                                            className="w-auto px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            <option value="">Select a serving...</option>
                                            {selectedFood.portions?.map((p: any) => (
                                                <option key={p.label} value={p.label}>
                                                    {p.label} ({p.weight_g}g)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : selectedPortion ? (
                                    <div className="flex-1 md:flex-none">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Serving</Label>
                                        <select
                                            value={selectedPortion.label}
                                            onChange={(e) => {
                                                const portion = selectedFood.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
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

