'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ChevronRight, ShoppingBag, ShoppingCart, Plus, X, ScanLine, Calendar, Package } from 'lucide-react';
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
    const [selectedPortion, setSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);

    // Scanner state
    const [scannerOpen, setScannerOpen] = useState(false);

    // Cleanup old "Replenish: " format items and auto-replenish entries on first load
    useEffect(() => {
        try {
            const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            const needsCleanup = currentList.some((item: any) => 
                item.name?.startsWith('Replenish: ') || item.source === 'auto-replenish'
            );
            
            if (needsCleanup) {
                // Remove old replenish format items and auto-replenish entries
                const cleaned = currentList.filter((item: any) => 
                    !item.name?.startsWith('Replenish: ') && item.source !== 'auto-replenish'
                );
                localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(cleaned));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) { /* ignore */ }
    }, []);

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
        setSelectedPortion(null);
    };

    // Helper function to intelligently combine quantities
    const combineQuantities = (existing: string, newQty: string): string => {
        // Try to parse both quantities
        // Format examples: "1 kilogram (1000g)", "2 x 100g", "3"
        
        const parseQty = (qty: string): { value: number; unit: string; full: string } | null => {
            // Pattern: "number unit (weight)" or "number x weight-unit" or just "number"
            const portionMatch = qty.match(/^(\d+(?:\.\d+)?)\s+([^(]+)\s*\(/);
            if (portionMatch) {
                return { value: parseFloat(portionMatch[1]), unit: portionMatch[2].trim(), full: qty };
            }
            
            const weightMatch = qty.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)(g|ml|oz|lb)/);
            if (weightMatch) {
                return { value: parseFloat(weightMatch[1]), unit: `x ${weightMatch[2]}${weightMatch[3]}`, full: qty };
            }
            
            const simpleMatch = qty.match(/^(\d+(?:\.\d+)?)$/);
            if (simpleMatch) {
                return { value: parseFloat(simpleMatch[1]), unit: '', full: qty };
            }
            
            return null;
        };
        
        const existingParsed = parseQty(existing);
        const newParsed = parseQty(newQty);
        
        // If both parsed successfully and have the same unit, combine them
        if (existingParsed && newParsed && existingParsed.unit === newParsed.unit) {
            const combinedValue = existingParsed.value + newParsed.value;
            
            // Reconstruct the quantity string
            if (existingParsed.unit) {
                // Has a unit, reconstruct: "3 kilogram (1000g)" format
                const weightMatch = existingParsed.full.match(/\((\d+(?:\.\d+)?g)\)/);
                if (weightMatch) {
                    const baseWeight = parseFloat(weightMatch[1]);
                    const newWeight = baseWeight * (combinedValue / existingParsed.value);
                    return `${combinedValue} ${existingParsed.unit} (${newWeight.toFixed(0)}g)`;
                }
                
                // For "x weight-unit" format
                const xMatch = existingParsed.unit.match(/^x\s*(\d+(?:\.\d+)?)(g|ml|oz|lb)$/);
                if (xMatch) {
                    return `${combinedValue} x ${xMatch[1]}${xMatch[2]}`;
                }
            } else {
                // No unit, just return the number
                return `${combinedValue}`;
            }
        }
        
        // Fall back to concatenation with " + "
        return `${existing} + ${newQty}`;
    };

    const handleQuickAdd = async () => {
        if (!selectedFood) return;

        setIsAdding(true);
        try {
            const quantityString = selectedPortion
                ? `${quickAddQty} ${selectedPortion.label} (${selectedPortion.weight_g}g)`
                : quickAddQty;

            const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            
            // Check if item already exists by food_item_id
            const existingIndex = currentList.findIndex((item: any) => item.food_item_id === selectedFood.id);
            
            if (existingIndex !== -1) {
                // Try to intelligently combine quantities
                const existingQty = currentList[existingIndex].quantity;
                const combined = combineQuantities(existingQty, quantityString);
                currentList[existingIndex].quantity = combined;
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
                    image: selectedFood.image,
                };
                currentList.push(newItem);
                toast.success(`${selectedFood.common_name || selectedFood.name} added to shopping list`);
            }
            
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify(currentList));
            window.dispatchEvent(new Event('storage'));

            setShowAddModal(false);
            setSelectedFood(null);
            setQuickAddQty('1');
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
                    idleIconRaw
                    idleIcon={
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/meal-o-matic/pantry'); }}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all active:scale-95"
                                title="Pantry"
                            >
                                <Package size={16} />
                            </button>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm relative">
                                <ShoppingBag size={20} />
                                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); router.push('/dashboard/meal-o-matic/planner'); }}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all active:scale-95"
                                title="Meal Planner"
                            >
                                <Calendar size={16} />
                            </button>
                        </div>
                    }
                    idleTitle="Shopping List"
                    idleSubtitle="Search foods to add to your shopping list"
                    noResultsMessage="No matching foods found"
                    enterMessage="Enter food name to search"
                    searchingMessage="Searching Foods..."                    powerButton={
                        <button
                            onClick={() => setScannerOpen(true)}
                            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:border-emerald-500 hover:bg-emerald-500/10 shrink-0"
                        >
                            <ScanLine size={16} className="text-slate-900 dark:text-white" />
                        </button>
                    }                    renderResult={(food: any) => (
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full animate-in slide-in-from-top duration-300 mb-6 relative">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowAddModal(false);
                                setSelectedFood(null);
                            }}
                            className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>

                        {/* Food Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {selectedFood.image ? (
                                    <img src={selectedFood.image} className="w-full h-full object-cover" />
                                ) : (
                                    <ShoppingCart size={28} className="text-emerald-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{selectedFood.common_name || selectedFood.name}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Manually Added</p>
                            </div>
                        </div>

                        {/* Add to Shopping List Section */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">QTY</Label>
                                    <Input
                                        type="number"
                                        value={quickAddQty}
                                        onChange={(e) => setQuickAddQty(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                {selectedFood.portions && selectedFood.portions.length > 0 && (
                                    <div>
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">SERVING</Label>
                                        <select
                                            value={selectedPortion?.label || ''}
                                            onChange={(e) => {
                                                const portion = selectedFood.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            <option value="">Select a package size...</option>
                                            {selectedFood.portions?.filter((p: any) => !/cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i.test(p.label)).map((p: any) => (
                                                <option key={p.label} value={p.label}>
                                                    {p.label} ({p.weight_g}g)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <Button
                                    onClick={handleQuickAdd}
                                    className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] h-10"
                                    disabled={isAdding}
                                >
                                    {isAdding ? (
                                        <>Loading...</>
                                    ) : (
                                        <>
                                            <Plus size={16} />
                                            Add to Shopping List
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <ShoppingListView
                    scannerOpen={scannerOpen}
                    onScannerOpenChange={setScannerOpen}
                />
            </div>
        </PageContainer>
    );
}
