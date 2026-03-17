'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { toast } from 'sonner';
import {
    type ShoppingItem,
    SHOPPING_STORAGE_KEY,
    smartCombineQuantities,
    PORTION_EXCLUDE_REGEX,
} from './shopping-types';

interface ShoppingQuickAddProps {
    food: any;
    onClose: () => void;
    onAdded: () => void;
}

export function ShoppingQuickAdd({ food, onClose, onAdded }: ShoppingQuickAddProps) {
    const [qty, setQty] = useState('1');
    const [portions, setPortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [selectedPortion, setSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Fetch measures when food changes
    useEffect(() => {
        if (!food?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const measures = await fetchFoodMeasures(food.id);
                if (!cancelled && measures) setPortions(measures);
            } catch (e) {
                console.error('Error fetching measures:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [food?.id]);

    const filteredPortions = portions.filter(p => !PORTION_EXCLUDE_REGEX.test(p.label));

    const handleAdd = () => {
        if (!food) return;
        setIsAdding(true);

        try {
            const quantityString = selectedPortion
                ? `${qty} ${selectedPortion.label} (${selectedPortion.weight_g}g)`
                : qty;

            const currentList: ShoppingItem[] = JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY) || '[]');

            const existingIndex = currentList.findIndex((item) => item.food_item_id === food.id);

            if (existingIndex !== -1) {
                const existingQty = currentList[existingIndex].quantity;
                currentList[existingIndex].quantity = smartCombineQuantities(existingQty, quantityString);
                toast.success(`Added to ${food.common_name || food.name} total`);
            } else {
                const newItem: ShoppingItem = {
                    id: `manual-${Date.now()}`,
                    name: food.common_name || food.name,
                    quantity: quantityString,
                    unit: '',
                    source: 'manual',
                    food_item_id: food.id,
                    category: food.category,
                    image: food.image,
                };
                currentList.push(newItem);
                toast.success(`${food.common_name || food.name} added to shopping list`);
            }

            localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(currentList));
            window.dispatchEvent(new Event('storage'));
            onAdded();
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 w-full animate-in slide-in-from-top duration-300 relative">
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
                <X size={18} className="text-slate-500" />
            </button>

            {/* Food Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {food.image ? (
                        <img src={food.image} className="w-full h-full object-cover" />
                    ) : (
                        <ShoppingCart size={22} className="text-emerald-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{food.common_name || food.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Manually Added</p>
                </div>
            </div>

            {/* Form */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">QTY</Label>
                    <Input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        className="w-full h-9 text-sm"
                    />
                </div>

                {filteredPortions.length > 0 && (
                    <div>
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">SERVING</Label>
                        <select
                            value={selectedPortion?.label || ''}
                            onChange={(e) => {
                                const p = filteredPortions.find(p => p.label === e.target.value);
                                if (p) setSelectedPortion(p);
                            }}
                            className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                        >
                            <option value="">Select a package size...</option>
                            {filteredPortions.map(p => (
                                <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                            ))}
                        </select>
                    </div>
                )}

                <Button
                    onClick={handleAdd}
                    className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] h-9"
                    disabled={isAdding}
                >
                    {isAdding ? 'Loading...' : <><Plus size={14} /> Add to Shopping List</>}
                </Button>
            </div>
        </div>
    );
}
