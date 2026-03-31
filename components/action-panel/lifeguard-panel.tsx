'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Droplet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface InventoryItem {
    id: string;
    food_id: string;
    name: string;
    weight_g: number;
}

interface SubstituteSuggestion {
    original: string;
    alternatives: string[];
    reason: string;
}

export function LifeguardPanel() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [step, setStep] = useState<'security' | 'inventory' | 'subs'>('security');
    const [securityStatus, setSecurityStatus] = useState<'safe' | 'unsafe' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [newWeight, setNewWeight] = useState('100');
    const [suggestions, setSuggestions] = useState<SubstituteSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('lifeguard_inventory')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const searchFoods = async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, image_url')
                .ilike('name', `%${query}%`)
                .limit(6);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching foods:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchFoods(query);
    };

    const addToInventory = async (food: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { error } = await supabase
                .from('lifeguard_inventory')
                .insert([{
                    user_id: user.id,
                    food_id: food.id,
                    name: food.name,
                    weight_g: parseInt(newWeight) || 100,
                }]);

            if (error) throw error;
            toast.success(`Added ${food.name}`);
            loadInventory();
            setSearchQuery('');
            setSearchResults([]);
            setNewWeight('100');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add item');
        }
    };

    const removeFromInventory = async (id: string) => {
        try {
            const { error } = await supabase
                .from('lifeguard_inventory')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Item removed');
            loadInventory();
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const generateSubstitutes = async () => {
        if (inventory.length === 0) {
            toast.error('Add items to inventory first');
            return;
        }

        setIsLoading(true);
        try {
            // Mock substitution suggestions based on common patterns
            const mockSuggestions: SubstituteSuggestion[] = [
                {
                    original: 'Milk',
                    alternatives: ['Almond Milk', 'Oat Milk', 'Coconut Milk'],
                    reason: 'Lactose-free options'
                },
                {
                    original: 'White Rice',
                    alternatives: ['Brown Rice', 'Quinoa', 'Millet'],
                    reason: 'Higher protein & fiber'
                },
                {
                    original: 'Sugar',
                    alternatives: ['Honey', 'Maple Syrup', 'Stevia'],
                    reason: 'Natural sweeteners'
                }
            ];
            setSuggestions(mockSuggestions);
            setStep('subs');
        } catch (error) {
            console.error('Error generating suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Security Step
    if (step === 'security') {
        return (
            <div className="flex-1 overflow-y-auto flex flex-col p-4">
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">Lifeguard</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Monitor ingredient health & find smart substitutes
                    </p>

                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Health Status
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSecurityStatus('safe');
                                    setStep('inventory');
                                }}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    securityStatus === 'safe'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                                )}
                            >
                                ✓ Safe
                            </button>
                            <button
                                onClick={() => {
                                    setSecurityStatus('unsafe');
                                    setStep('inventory');
                                }}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    securityStatus === 'unsafe'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                                )}
                            >
                                ⚠️ Unsafe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Inventory Step
    if (step === 'inventory') {
        return (
            <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setStep('security')}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium mb-2"
                    >
                        ← Back
                    </button>
                    <h3 className="font-bold text-slate-900 dark:text-white">Inventory</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {inventory.length} items • Status: {securityStatus === 'safe' ? '✓ Safe' : '⚠️ Unsafe'}
                    </p>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Add ingredient..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                        type="number"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        placeholder="Weight (g)"
                        min="1"
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2 max-h-40 overflow-y-auto">
                        {searchResults.map(food => (
                            <button
                                key={food.id}
                                onClick={() => addToInventory(food)}
                                className="w-full text-left p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                            >
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{food.name}</span>
                                <Plus size={14} className="text-emerald-500" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Inventory Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {inventory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            Add ingredients to your inventory
                        </div>
                    ) : (
                        inventory.map(item => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
                            >
                                <div>
                                    <p className="font-medium text-sm text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.weight_g}g</p>
                                </div>
                                <button
                                    onClick={() => removeFromInventory(item.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Action Button */}
                {inventory.length > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={generateSubstitutes}
                            disabled={isLoading}
                            className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            {isLoading ? 'Finding alternatives...' : 'Find Substitutes'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Suggestions Step
    if (step === 'subs') {
        return (
            <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setStep('inventory')}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium mb-2"
                    >
                        ← Back to Inventory
                    </button>
                    <h3 className="font-bold text-slate-900 dark:text-white">Smart Substitutes</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {suggestions.length} alternatives found
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {suggestions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No substitutes available
                        </div>
                    ) : (
                        suggestions.map((suggestion, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-start gap-2 mb-2">
                                    <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                            {suggestion.original}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            {suggestion.reason}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {suggestion.alternatives.map((alt, i) => (
                                        <div
                                            key={i}
                                            className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                                        >
                                            → {alt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return null;
}

function cn(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
