import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { generateDailyPlan } from '@/lib/utils/meal-generator';
import { usePantry } from '@/hooks/use-pantry';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useSearch } from '@/lib/context/search-context';
import { parseTotalGrams, formatWeightStr } from './utils';
import { Recipe, DietType, GoalType, ActivityLevel } from './types';

export function usePlannerActions(state: any, actions: any) {
    const { pantryItems, quantities, updateQuantity } = usePantry();
    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const { filters } = useRecipeFilter();
    const { searchQuery } = useSearch();
    const { setGenerating, setStep, setPlan, setEatenMeals } = actions;

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({
                targetCalories: state.calories,
                diet: state.diet,
                numMeals: 3,
                favoritesOnly: state.showFavoritesOnly,
                pantryItems,
                searchQuery,
                selectedEquipment: filters.selectedEquipment,
                selectedExclusions: filters.selectedExclusions,
                selectedHealthConditions: filters.selectedHealthConditions,
                showFlavours: filters.showFlavours,
                showSupplements: filters.showSupplements,
                strictPantry: filters.pantryMode === 'pantry-only'
            });
            setPlan(newPlan);
            setStep(3);
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('Failed to generate plan');
        } finally {
            setGenerating(false);
        }
    };

    const handleMarkEaten = async (recipe: Recipe, mealType: string) => {
        const servings = recipe.servings || 1;
        let ingredients = recipe.ingredients || [];
        
        try {
            const { data: freshIngs } = await supabase
                .from('ingredients')
                .select('*, food_items(*)')
                .eq('recipe_id', recipe.id);
            if (freshIngs && freshIngs.length > 0) {
                ingredients = freshIngs.map((i: any) => ({
                    item: i.item,
                    amount: i.amount,
                    isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient,
                    food_item_id: i.food_item_id,
                    weightG: i.weight_g,
                    measureLabel: i.measure_label,
                }));
            }
        } catch (e) {
            console.warn('[markEaten] DB fetch failed, using fallback');
        }

        let subtracted = 0;
        const newQuantities = { ...quantities };

        for (const ing of ingredients) {
            const weightToSubtract = (ing.weightG ?? 0) * servings;
            if (!weightToSubtract) continue;

            let itemId: string | null = null;
            // 1. Direct match
            if (ing.food_item_id && newQuantities[ing.food_item_id] !== undefined) {
                itemId = ing.food_item_id;
            }
            // 2. Pantry match
            if (!itemId && ing.food_item_id) {
                const pMatch = pantryItems.find(p => p.id === ing.food_item_id);
                if (pMatch) itemId = pMatch.id;
            }
            // 3. Fuzzy match (simplified version for modular hook)
            if (!itemId) {
                const name = (ing.item || '').toLowerCase().trim();
                const match = pantryItems.find(p => (p.common_name || p.name || '').toLowerCase().trim() === name);
                if (match) itemId = match.id;
            }

            if (!itemId) continue;

            const totalG = parseTotalGrams(newQuantities[itemId] || '');
            if (totalG === null || totalG === 0) continue;

            const remaining = Math.max(0, totalG - weightToSubtract);
            newQuantities[itemId] = formatWeightStr(remaining);
            await updateQuantity(itemId, newQuantities[itemId]);
            subtracted++;
        }

        // Handle auto-replenishment
        const itemsToReplenish = Object.entries(newQuantities)
            .filter(([id, qty]) => (qty === '0 grams' || qty === '0 g' || qty === '0'))
            .map(([id]) => pantryItems.find(p => p.id === id))
            .filter(Boolean);

        for (const item of itemsToReplenish) {
            await addShoppingItem({
                name: `Replenish: ${item!.common_name || item!.name}`,
                quantity: 'As needed',
                source: 'manual',
            });
        }

        setEatenMeals(new Set([...state.eatenMeals, mealType]));
        
        if (subtracted > 0) {
            toast.success(`Marked as eaten. ${subtracted} items updated.`);
        } else {
            toast.success(`${recipe.title} marked as eaten.`);
        }
    };

    return {
        handleGenerate,
        handleMarkEaten,
        handleShuffleAll: handleGenerate // Logic is essentially identical for shuffle
    };
}
