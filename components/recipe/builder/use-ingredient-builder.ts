import { useState, useCallback, useMemo } from 'react';
import { RecipeIngredient, FoodItemData, IngredientBuilderProps, PendingIngredient } from './types';
import { FoodItemMatch } from '@/lib/services/nutrition';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

export function useIngredientBuilder(props: IngredientBuilderProps) {
    const { ingredients, onChange } = props;
    const { profile, energyUnit, dailyTargets: userRDAs } = useUserPreferences();

    const [showPicker, setShowPicker] = useState(false);
    const [showMagicPaste, setShowMagicPaste] = useState(false);
    const [magicText, setMagicText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [pendingIngredients, setPendingIngredients] = useState<PendingIngredient[]>([]);
    const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);

    const handleAddIngredient = useCallback(async (
        item: FoodItemData | FoodItemMatch,
        initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }
    ) => {
        const unit = initialValues?.unit || 'g';
        const quantity = initialValues?.quantity || (unit.toLowerCase() === 'g' ? 100 : 1);
        
        // If unit is grams, weight_g should match quantity. 
        // Otherwise use the provided weightG or default to 100.
        const isGrams = ['g', 'G', 'gram', 'grams', 'Grams'].includes(unit);
        const weight_g = initialValues?.weightG || (isGrams ? quantity : 100);

        const newIng: RecipeIngredient = {
            food_item_id: item.id || '',
            food_item_name: item.common_name || item.name || '',
            weight_g,
            quantity,
            measure_label: unit,
            modifier: initialValues?.modifier || '',
            calories: item.energy_kcal || 0,
            energy_kj: item.energy_kj || 0,
            protein: item.protein_g || 0,
            fat: item.fat_g || 0,
            carbs: item.carbs_g || 0,
            micronutrients: item.micronutrients || {},
        };

        onChange([...ingredients, newIng]);
    }, [ingredients, onChange]);

    const handleRemoveIngredient = useCallback((index: number) => {
        onChange(ingredients.filter((_, i) => i !== index));
    }, [ingredients, onChange]);

    const handleUpdateQuantity = useCallback((index: number, newQuantity: number) => {
        onChange(ingredients.map((ing, i) => {
            if (i !== index) return ing;
            
            // Calculate new weight_g. 
            // If unit is grams, weight_g = quantity.
            // Otherwise, we scale weight_g by the change in quantity.
            const isGrams = ['g', 'G', 'gram', 'grams', 'Grams'].includes(ing.measure_label);
            let newWeight = ing.weight_g;
            
            if (isGrams) {
                newWeight = newQuantity;
            } else if (ing.quantity > 0) {
                // Scale existing weight by ratio of new to old quantity
                newWeight = (newQuantity / ing.quantity) * ing.weight_g;
            }
            
            return { ...ing, quantity: newQuantity, weight_g: newWeight };
        }));
    }, [ingredients, onChange]);

    const handleUpdateName = useCallback((index: number, newName: string) => {
        onChange(ingredients.map((ing, i) => i === index ? { ...ing, food_item_name: newName } : ing));
    }, [ingredients, onChange]);

    const totals = useMemo(() => {
        return ingredients.reduce((acc, ing) => {
            const multiplier = ing.weight_g / 100;
            acc.calories += ing.calories * multiplier;
            acc.protein += ing.protein * multiplier;
            acc.fat += ing.fat * multiplier;
            acc.carbs += ing.carbs * multiplier;
            
            // Aggregate micronutrients
            if (ing.micronutrients) {
                Object.entries(ing.micronutrients).forEach(([key, value]) => {
                    acc.micronutrients[key] = (acc.micronutrients[key] || 0) + (Number(value) || 0) * multiplier;
                });
            }
            
            return acc;
        }, { calories: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> });
    }, [ingredients]);

    const handleMagicParse = async () => { setIsParsing(true); /* logic */ setIsParsing(false); };
    const confirmPendingIngredient = (index: number) => {};
    const confirmAllIngredients = () => {};
    const handleUSDASearchForPending = (index: number) => {};
    const rejectPendingIngredient = (index: number) => {};

    return {
        showPicker, setShowPicker,
        showMagicPaste, setShowMagicPaste,
        magicText, setMagicText,
        isParsing, pendingIngredients, setPendingIngredients,
        editingNameIndex, setEditingNameIndex,
        showDetailedNutrients, setShowDetailedNutrients,
        isAdmin: profile?.isPremium, // isPremium as fallback for isAdmin in this context
        handleAddIngredient,
        handleMagicParse,
        confirmPendingIngredient,
        confirmAllIngredients,
        handleUSDASearchForPending,
        rejectPendingIngredient,
        handleUpdateQuantity,
        handleRemoveIngredient,
        handleUpdateName,
        totals,
        userRDAs,
        energyUnit
    };
}
