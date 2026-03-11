'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PantryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    expiration_date?: string;
}

interface ChatbotPantryProps {
    onBack?: () => void;
}

export function ChatbotPantry({ onBack }: ChatbotPantryProps) {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState('1');
    const [newUnit, setNewUnit] = useState('item');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPantryItems();
    }, []);

    const loadPantryItems = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('pantry_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error loading pantry items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addItem = async () => {
        if (!newItem.trim()) {
            toast.error('Please enter an item name');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('pantry_items')
                .insert([{
                    user_id: user.id,
                    name: newItem.trim(),
                    quantity: parseInt(newQuantity) || 1,
                    unit: newUnit,
                }])
                .select()
                .single();

            if (error) throw error;
            setItems(prev => [data, ...prev]);
            setNewItem('');
            setNewQuantity('1');
            setNewUnit('item');
            toast.success('Item added');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add item');
        }
    };

    const deleteItem = async (id: string) => {
        try {
            const { error } = await supabase
                .from('pantry_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setItems(prev => prev.filter(item => item.id !== id));
            toast.success('Item removed');
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Pantry Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">Pantry Items</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">No pantry items yet. Add one below!</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {item.name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {item.quantity} {item.unit}
                                </p>
                                {item.expiration_date && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        Expires: {new Date(item.expiration_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors ml-2"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Item Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Item name..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Qty"
                        min="1"
                        className="w-16 px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option>item</option>
                        <option>lb</option>
                        <option>kg</option>
                        <option>cup</option>
                        <option>tbsp</option>
                        <option>tsp</option>
                    </select>
                    <button
                        onClick={addItem}
                        className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
