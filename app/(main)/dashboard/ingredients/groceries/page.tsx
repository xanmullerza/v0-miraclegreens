'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ChevronRight, ShoppingCart, Plus, X } from 'lucide-react';
import { ShoppingListView } from '@/components/kitchen/shopping-list-view';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { formatFoodName } from '@/lib/utils';
import { toast } from 'sonner';

const CAL_TO_KJ = 4.184;

function formatEnergy(calories: number, unit: 'kcal' | 'kJ') {
    if (unit === 'kJ') return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    return `${Math.round(calories).toLocaleString()} kcal`;
}

export default function ShoppingListPage() {
    const router = useRouter();
    const { energyUnit } = useUserPreferences();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);

    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('shopping');
    const [selectedPortion, setSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);

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

    const performSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, energy_kcal, category')
                .or(`name.ilike.%${query}%,common_name.ilike.%${query}%`)
                .limit(8);
            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    const handleSelectFood = (food: any) => {
        setSelectedFood(food);
        setShowAddModal(true);
        setIsSearchActive(false);
        setSearchQuery('');
        setQuickAddQty('1');
        setQuickAddWeight('');
        setQuickAddUnit('g');
        setQuickAddMode('shopping');
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

            if (quickAddMode === 'shopping') {
                const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
                
                // Check if item already exists by food_item_id
                const existingIndex = currentList.findIndex((item: any) => item.food_item_id === selectedFood.id);
                
                if (existingIndex !== -1) {
                    // Aggregate quantities by appending with " + "
                    const existingQty = currentList[existingIndex].quantity;
                    currentList[existingIndex].quantity = `${existingQty} + ${quantityString}`;
                    toast.success(`Added to ${selectedFood.common_name || selectedFood.name} total`);
                } else {
                    // Add new item
                    const newItem = {
                        id: `manual-${Date.now()}`,
                        name: selectedFood.common_name || selectedFood.name,
                        quantity: quantityString,
                        unit: '',
                        checked: false,
                        source: 'manual',
                        food_item_id: selectedFood.id,
                        category: selectedFood.category,
                    };
                    currentList.push(newItem);
                    toast.success(`${selectedFood.common_name || selectedFood.name} added to groceries`);
                }
                
                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(currentList));
                window.dispatchEvent(new Event('storage'));
            } else {
                // Add to pantry
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
            }

            setShowAddModal(false);
            setSelectedFood(null);
            setQuickAddQty('1');
            setQuickAddWeight('');
            setSelectedPortion(null);
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <PageContainer>
            <div className="space-y-8 animate-in fade-in duration-500">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={handleSelectFood}
                    theme="emerald"
                    placeholder="SEARCH FOODS TO ADD..."
                    idleIcon={<ShoppingCart size={20} className="text-emerald-500" />}
                    idleTitle="Grocery List"
                    idleSubtitle="Search foods to add to your shopping list"
                    noResultsMessage="No matching foods found"
                    enterMessage="Enter food name to search"
                    searchingMessage="Searching Foods..."
                    renderResult={(food: any) => (
                        <div className="flex items-center gap-4 min-w-0 w-full">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                {food.image ? (
                                    <img src={food.image} className="w-full h-full object-cover" alt={food.common_name || food.name} />
                                ) : (
                                    <Leaf className="m-auto opacity-10 h-full w-5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">
                                    {formatFoodName(food.common_name || food.name)}
                                </h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {formatEnergy(food.energy_kcal || 0, energyUnit)} <span className="text-slate-200 dark:text-slate-700">|</span> {food.category || 'General'}
                                </p>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </div>
                    )}
                />

                {/* Quick Add Panel */}
                {showAddModal && selectedFood && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300 rounded-2xl mb-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                    {selectedFood.image ? (
                                        <img src={selectedFood.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingCart size={24} className="text-emerald-500" />
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
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors whitespace-nowrap self-end mb-0.5"
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
                                        <option value="shopping">Groceries</option>
                                        <option value="pantry">Pantry</option>
                                    </select>
                                </div>

                                <Button
                                    onClick={handleQuickAdd}
                                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] h-10"
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

                <ShoppingListView />
            </div>
        </PageContainer>
    );
}
