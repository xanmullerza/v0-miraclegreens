'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    PORTION_EXCLUDE_REGEX,
    mergeQuantityStrings,
    buildQuantityString,
    stripZeroEntries
} from './pantry-types';
import { usePantry } from '@/hooks/use-pantry';

interface PantryQuickAddProps {
    food: any;
    onClose: () => void;
    onAdded: () => void;
}

export function PantryQuickAdd({ food, onClose, onAdded }: PantryQuickAddProps) {
    const { quantities, updateQuantity, addToPantry: dbAddToPantry } = usePantry();
    const [qty, setQty] = useState('1');
    const [portions, setPortions] = useState<{ label: string; weight_g: number }[]>([]);
    const [selectedPortion, setSelectedPortion] = useState<{ label: string; weight_g: number } | null>(null);
    const [weight, setWeight] = useState('');
    const [unit, setUnit] = useState('g');
    const [isAdding, setIsAdding] = useState(false);

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
    const dedupedPortions = (() => {
        const seen = new Set<number>();
        return filteredPortions.filter(p => { if (seen.has(p.weight_g)) return false; seen.add(p.weight_g); return true; });
    })();

    const handleAdd = async () => {
        if (!food) return;
        setIsAdding(true);
        try {
            const quantityString = buildQuantityString(qty, selectedPortion, weight, unit);
            const currentQty = quantities[food.id] || '';
            
            if (currentQty) {
                const merged = mergeQuantityStrings(currentQty, quantityString);
                const cleaned = stripZeroEntries(merged);
                await updateQuantity(food.id, cleaned);
            } else {
                await dbAddToPantry(food, quantityString);
            }

            toast.success(`${food.common_name || food.name} added to pantry`);
            onAdded();
        } catch (error) {
            console.error('Error adding to pantry:', error);
            toast.error('Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 w-full animate-in slide-in-from-top duration-300 relative">
            <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X size={18} className="text-slate-500" />
            </button>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {food.image ? <img src={food.image} className="w-full h-full object-cover" /> : <Package size={22} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{food.common_name || food.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Add to Pantry</p>
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                <div>
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">QTY</Label>
                    <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full h-9 text-sm" />
                </div>

                {dedupedPortions.length > 0 ? (
                    <div>
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">SERVING</Label>
                        <select
                            value={selectedPortion?.label || ''}
                            onChange={(e) => {
                                const p = dedupedPortions.find(p => p.label === e.target.value);
                                if (p) setSelectedPortion(p);
                            }}
                            className="w-full px-3 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                        >
                            <option value="">Select a package size...</option>
                            {dedupedPortions.map(p => (
                                <option key={p.label} value={p.label}>{p.label} ({p.weight_g}g)</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">WEIGHT</Label>
                            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 100" className="w-full h-9 text-sm" />
                        </div>
                        <div>
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">UNIT</Label>
                            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-20 px-2 py-2 h-9 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white">
                                <option value="g">g</option>
                                <option value="ml">ml</option>
                                <option value="oz">oz</option>
                                <option value="lb">lb</option>
                            </select>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleAdd}
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[9px] h-9"
                    disabled={isAdding}
                >
                    {isAdding ? 'Loading...' : <><Plus size={14} /> Add to Pantry</>}
                </Button>
            </div>
        </div>
    );
}
