'use client';

import React, { useState, useEffect } from 'react';
import { PantryView } from '@/components/kitchen/pantry-view';
import { ShoppingBasket, Beef, ChevronRight, Plus, X } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PantryPage() {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Quick add form state
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

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

    const handleSelectFood = (food: any) => {
        // Open the add modal with the selected food
        setSelectedFood(food);
        setShowAddModal(true);
        setIsActive(false);
        setSearchQuery('');
        // Reset form
        setQuickAddQty('1');
        setQuickAddWeight('');
        setQuickAddUnit('g');
        setQuickAddMode('pantry');
    };

    const handleQuickAdd = async () => {
        if (!selectedFood) return;

        setIsAdding(true);
        try {
            const quantityString = quickAddWeight ? `${quickAddQty} x ${quickAddWeight}${quickAddUnit}` : quickAddQty;

            if (quickAddMode === 'pantry') {
                // Update DB
                const { error } = await supabase
                    .from('food_items')
                    .update({ is_in_pantry: true } as any)
                    .eq('id', selectedFood.id);
                
                if (error) throw error;

                // Persist to localStorage
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                quantities[selectedFood.id] = quantityString;
                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));

                toast.success(`${selectedFood.common_name || selectedFood.name} added to pantry`);
            } else {
                // Add to shopping list
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

            // Close modal and reset
            setShowAddModal(false);
            setSelectedFood(null);
            setQuickAddQty('1');
            setQuickAddWeight('');
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
                                            {food.energy_kcal.toFixed(0)} kcal <span className="text-slate-200 dark:text-slate-700">|</span> 100g
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-amber-500 transition-colors shrink-0" size={20} />
                            </>
                        )}
                    />
                </div>

                {/* Add Item Modal */}
                {showAddModal && selectedFood && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 animate-in zoom-in-95 duration-300 shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                                        {selectedFood.image ? <img src={selectedFood.image} className="w-full h-full object-cover" /> : <Beef className="m-auto opacity-10 h-full w-5" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedFood.common_name || selectedFood.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold">{selectedFood.energy_kcal.toFixed(0)} kcal per 100g</p>
                                    </div>
                                </div>
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

                            {/* Form */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">Quantity</Label>
                                    <Input
                                        type="number"
                                        value={quickAddQty}
                                        onChange={(e) => setQuickAddQty(e.target.value)}
                                        className="text-center font-bold"
                                        min="0.1"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">Weight (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={quickAddWeight}
                                        onChange={(e) => setQuickAddWeight(e.target.value)}
                                        placeholder="e.g. 100"
                                        className="text-center font-bold"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">Unit</Label>
                                    <select
                                        value={quickAddUnit}
                                        onChange={(e) => setQuickAddUnit(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="g">g (grams)</option>
                                        <option value="ml">ml (milliliters)</option>
                                        <option value="oz">oz (ounces)</option>
                                        <option value="lb">lb (pounds)</option>
                                    </select>
                                </div>

                                <div>
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 block">Destination</Label>
                                    <select
                                        value={quickAddMode}
                                        onChange={(e) => setQuickAddMode(e.target.value as 'pantry' | 'shopping')}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="pantry">Pantry</option>
                                        <option value="shopping">Groceries / Shopping List</option>
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setSelectedFood(null);
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isAdding}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleQuickAdd}
                                    className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs"
                                    disabled={isAdding}
                                >
                                    {isAdding ? (
                                        <>Loading...</>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Add Item
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <PantryView />
            </div>
        </PageContainer>
    );
}

