'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const PANTRY_QUANTITIES_KEY = 'pantry_quantities';

export function usePantry() {
    const [pantryItems, setPantryItems] = useState<any[]>([]);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const fetchPantry = useCallback(async (currentUser: any) => {
        setLoading(true);
        try {
            if (currentUser) {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('pantry_items')
                    .select('*, food_items(*)')
                    .eq('user_id', currentUser.id)
                    .eq('is_deleted', false);

                if (error) throw error;
                
                setPantryItems(data || []);
                
                // Construct quantities mapping from table items
                const mapping: Record<string, string> = {};
                data?.forEach(item => {
                    if (item.food_item_id && item.quantity) {
                        mapping[item.food_item_id] = item.quantity;
                    }
                });
                setQuantities(mapping);
                
                // Note: We don't overwrite localStorage here because we want to keep it consistent
                // but components should now prefer this 'quantities' state.
            } else {
                // Fetch from LocalStorage
                const localData = localStorage.getItem(PANTRY_QUANTITIES_KEY);
                setQuantities(localData ? JSON.parse(localData) : {});
                setPantryItems([]);
            }
        } catch (err) {
            console.error('Error fetching pantry:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchPantry(u);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            fetchPantry(u);
        });

        const handleLegacyUpdate = () => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                fetchPantry(session?.user ?? null);
            });
        };

        window.addEventListener('pantry-quantities-updated', handleLegacyUpdate);
        
        return () => {
            subscription.unsubscribe();
            window.removeEventListener('pantry-quantities-updated', handleLegacyUpdate);
        };
    }, [fetchPantry]);

    const updateQuantity = async (foodItemId: string, newQuantity: string) => {
        try {
            if (user) {
                // Update in Supabase pantry_items
                const { error } = await supabase
                    .from('pantry_items')
                    .update({ quantity: newQuantity })
                    .eq('user_id', user.id)
                    .eq('food_item_id', foodItemId);
                
                if (error) throw error;
            } else {
                // Update in LocalStorage mapping
                const localData = localStorage.getItem(PANTRY_QUANTITIES_KEY);
                const mapping = localData ? JSON.parse(localData) : {};
                mapping[foodItemId] = newQuantity;
                localStorage.setItem(PANTRY_QUANTITIES_KEY, JSON.stringify(mapping));
            }

            // Sync local state
            setQuantities(prev => ({ ...prev, [foodItemId]: newQuantity }));
            
            // Dispatch legacy event
            window.dispatchEvent(new CustomEvent('pantry-quantities-updated'));
            return true;
        } catch (err) {
            console.error('Error updating pantry quantity:', err);
            return false;
        }
    };

    const addToPantry = async (foodItem: any, quantity: string) => {
        try {
            if (user) {
                // check if already exists
                const existing = pantryItems.find(p => p.food_item_id === foodItem.id);
                if (existing) {
                    return await updateQuantity(foodItem.id, quantity);
                }

                const { error } = await supabase
                    .from('pantry_items')
                    .insert({
                        user_id: user.id,
                        food_item_id: foodItem.id,
                        name: foodItem.name,
                        quantity: quantity
                    });
                
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(PANTRY_QUANTITIES_KEY);
                const mapping = localData ? JSON.parse(localData) : {};
                mapping[foodItem.id] = quantity;
                localStorage.setItem(PANTRY_QUANTITIES_KEY, JSON.stringify(mapping));
            }

            fetchPantry(user);
            window.dispatchEvent(new CustomEvent('pantry-quantities-updated'));
            return true;
        } catch (err) {
            console.error('Error adding to pantry:', err);
            return false;
        }
    };

    const removeFromPantry = async (foodItemId: string) => {
        try {
            if (user) {
                const { error } = await supabase
                    .from('pantry_items')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('food_item_id', foodItemId);
                if (error) throw error;
            } else {
                const localData = localStorage.getItem(PANTRY_QUANTITIES_KEY);
                const mapping = localData ? JSON.parse(localData) : {};
                delete mapping[foodItemId];
                localStorage.setItem(PANTRY_QUANTITIES_KEY, JSON.stringify(mapping));
            }

            fetchPantry(user);
            window.dispatchEvent(new CustomEvent('pantry-quantities-updated'));
            return true;
        } catch (err) {
            console.error('Error removing from pantry:', err);
            return false;
        }
    };

    const refresh = useCallback(() => fetchPantry(user), [fetchPantry, user]);

    return {
        pantryItems,
        quantities,
        loading,
        updateQuantity,
        addToPantry,
        removeFromPantry,
        refresh
    };
}

