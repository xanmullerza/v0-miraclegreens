'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SHOPPING_STORAGE_KEY, ShoppingItem } from '@/components/tracker/shopping/shopping-types';
import { toast } from 'sonner';

export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const fetchItems = useCallback(async (currentUser: any) => {
        setLoading(true);
        try {
            if (currentUser) {
                const { data, error } = await supabase
                    .from('shopping_list_items')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('added_at', { ascending: false });

                if (error) throw error;
                setItems(data || []);
            } else {
                const localData = localStorage.getItem(SHOPPING_STORAGE_KEY);
                setItems(localData ? JSON.parse(localData) : []);
            }
        } catch (err) {
            console.error('Error fetching shopping list:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchItems(u);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchItems(u);
        });

        // Listen for legacy events
        const handleLegacyUpdate = () => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                fetchItems(session?.user ?? null);
            });
        };

        window.addEventListener('shopping-list-updated', handleLegacyUpdate);
        
        return () => {
            subscription.unsubscribe();
            window.removeEventListener('shopping-list-updated', handleLegacyUpdate);
        };
    }, [fetchItems]);

    const addItem = async (item: Partial<ShoppingItem>) => {
        const newItem: ShoppingItem = {
            id: item.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || 'New Item',
            quantity: item.quantity || '',
            unit: item.unit || '',
            food_item_id: item.food_item_id,
            source: item.source || 'manual',
            ...item
        };

        try {
            if (user) {
                const { error } = await supabase
                    .from('shopping_list_items')
                    .insert({
                        user_id: user.id,
                        food_item_id: newItem.food_item_id,
                        name: newItem.name,
                        quantity: newItem.quantity,
                        unit: newItem.unit,
                        source: newItem.source,
                        checked: false
                    });
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(SHOPPING_STORAGE_KEY);
                const localItems = localData ? JSON.parse(localData) : [];
                localItems.push(newItem);
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(localItems));
            }
            
            // Trigger legacy update and refresh local state
            window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            fetchItems(user);
            return true;
        } catch (err) {
            console.error('Error adding to shopping list:', err);
            toast.error('Failed to add item to shopping list');
            return false;
        }
    };

    const toggleChecked = async (id: string, checked: boolean) => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('shopping_list_items')
                    .update({ checked })
                    .eq('id', id)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(SHOPPING_STORAGE_KEY);
                const localItems = localData ? JSON.parse(localData) : [];
                const updated = localItems.map((item: ShoppingItem) => 
                    item.id === id ? { ...item, checked } : item
                );
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(updated));
            }
            
            window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            fetchItems(user);
        } catch (err) {
            console.error('Error toggling shopping item:', err);
        }
    };

    const removeItem = async (id: string) => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('shopping_list_items')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(SHOPPING_STORAGE_KEY);
                const localItems = localData ? JSON.parse(localData) : [];
                const updated = localItems.filter((item: ShoppingItem) => item.id !== id);
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(updated));
            }
            
            window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            fetchItems(user);
        } catch (err) {
            console.error('Error removing shopping item:', err);
        }
    };

    const clearChecked = async () => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('shopping_list_items')
                    .delete()
                    .eq('checked', true)
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(SHOPPING_STORAGE_KEY);
                const localItems = localData ? JSON.parse(localData) : [];
                const updated = localItems.filter((item: ShoppingItem) => !item.checked);
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(updated));
            }
            
            window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            fetchItems(user);
        } catch (err) {
            console.error('Error clearing checked items:', err);
        }
    };

    const clearAll = async () => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('shopping_list_items')
                    .delete()
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify([]));
            }
            
            window.dispatchEvent(new CustomEvent('shopping-list-updated'));
            fetchItems(user);
        } catch (err) {
            console.error('Error clearing shopping list:', err);
        }
    };

    return {
        items,
        loading,
        addItem,
        toggleChecked,
        removeItem,
        clearChecked,
        clearAll,
        refresh: () => fetchItems(user)
    };
}
