'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, Check, Beef, Wheat, Droplet, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this hook exists, or I'll implement debounce manually

// Fallback debounce implementation if hook doesn't exist
function useDebounceValue(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface PantryMatchDialogProps {
    isOpen: boolean;
    initialQuery: string;
    onClose: () => void;
    onConfirm: (foodItemId: string, name: string, quantity: string) => void;
}

interface FoodResult {
    id: string;
    name: string;
    common_name?: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
}

export function PantryMatchDialog({ isOpen, initialQuery, onClose, onConfirm }: PantryMatchDialogProps) {
    const [query, setQuery] = useState(initialQuery);
    const [quantity, setQuantity] = useState('1');
    const [results, setResults] = useState<FoodResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const debouncedQuery = useDebounceValue(query, 500);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            setQuery(initialQuery);
            setQuantity('1'); // Default or could extract from string if possible?
            setSelectedId(null);
            setResults([]);
        }
    }, [isOpen, initialQuery]);

    // Search effect
    useEffect(() => {
        const searchFoods = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Search by name or common_name
                const { data, error } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, protein_g, carbs_g, fat_g, image')
                    .or(`name.ilike.%${debouncedQuery}%,common_name.ilike.%${debouncedQuery}%`)
                    .limit(10);

                if (error) throw error;
                setResults(data || []);
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            searchFoods();
        }
    }, [debouncedQuery, isOpen]);

    const handleConfirm = () => {
        if (!selectedId) return;
        const selectedFood = results.find(r => r.id === selectedId);
        if (selectedFood) {
            onConfirm(selectedFood.id, selectedFood.name, quantity);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        Match Pantry Item
                    </DialogTitle>
                    <DialogDescription>
                        Link "{initialQuery}" to our food database to get nutritional info.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search food database..."
                            className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Quantity Input */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Quantity:</span>
                        <Input
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g. 1 medium, 200g"
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-emerald-500 flex-1"
                        />
                    </div>

                    {/* Results List */}
                    <div className="h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <Loader2 className="animate-spin" size={24} />
                                <span className="text-xs font-bold uppercase tracking-widest">Searching...</span>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                <Beef className="opacity-20" size={32} />
                                <span className="text-xs font-bold uppercase tracking-widest">No matches found</span>
                            </div>
                        ) : (
                            results.map((food) => (
                                <div
                                    key={food.id}
                                    onClick={() => setSelectedId(food.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                        selectedId === food.id
                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 ring-1 ring-emerald-500"
                                            : "border-slate-200 dark:border-slate-800"
                                    )}
                                >
                                    {/* Image/Icon */}
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0">
                                        {food.image ? (
                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Beef size={18} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {food.name}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] uppercase font-black tracking-wider text-slate-400">
                                            <span className="flex items-center gap-1 text-orange-500"><Zap size={10} /> {Math.round(food.energy_kcal)}</span>
                                            <span className="flex items-center gap-1 text-rose-500"><Beef size={10} /> {food.protein_g.toFixed(1)}p</span>
                                            <span className="flex items-center gap-1 text-amber-500"><Wheat size={10} /> {food.carbs_g.toFixed(1)}c</span>
                                        </div>
                                    </div>

                                    {/* Checkmark */}
                                    {selectedId === food.id && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 animate-in zoom-in">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl">Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedId}
                        className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                        Confirm Match
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
