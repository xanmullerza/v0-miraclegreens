import { useState, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { COOKING_STATES, CookingState } from '@/lib/utils/cooking-states';
import { findSpiceFactor, isSpice, getSpiceMeasures } from '@/lib/utils/spice-conversion';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { searchFoodItem, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { useRDA } from '@/hooks/use-rda';
import { toast } from 'sonner';
import { RecipeIngredient, FoodItemData, PendingIngredient, IngredientBuilderProps } from './types';
import { evaluateLocalQty, normalizeUnit, getStandardMassMultiplier, findNaturalMeasure } from './utils';
import { structureRecipeForSaving } from '@/lib/utils/recipe-parser';

export function useIngredientBuilder({ ingredients, onChange, initialShowPicker, initialShowMagicPaste }: IngredientBuilderProps) {
    const [showPicker, setShowPicker] = useState(initialShowPicker || false);
    const [showMagicPaste, setShowMagicPaste] = useState(initialShowMagicPaste || false);
    const [magicText, setMagicText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [pendingIngredients, setPendingIngredients] = useState<PendingIngredient[]>([]);
    const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const { energyUnit, profile } = useUserPreferences();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUser(user);
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        checkAdmin();
    }, []);

    const handleAddIngredient = async (foodItem: FoodItemData | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }) => {
        let measures: any[] = [];
        let finalFoodItem = foodItem as any;

        if ('source' in foodItem && foodItem.source === 'usda' && foodItem.fdcId) {
            const usdaMeasures = await getUSDAMeasures(foodItem.fdcId);
            const syncedId = await syncToLocal(foodItem as FoodItemMatch, usdaMeasures, currentUser?.id, isAdmin);
            finalFoodItem = { ...foodItem, id: syncedId || 'temp-id' };
            measures = usdaMeasures;
        } else if (foodItem.portions && foodItem.portions.length > 0) {
            measures = foodItem.portions;
        } else if (foodItem.id) {
            measures = await fetchFoodMeasures(foodItem.id);
        }

        let weight_g = initialValues?.weightG || 0;
        let quantity = initialValues?.quantity || (weight_g > 0 ? weight_g : 1);
        let unit = initialValues?.unit?.trim() || '';
        let modifier = initialValues?.modifier?.trim() || '';

        const hasParsedWeight = initialValues?.weightG && initialValues.weightG > 0;

        if (!unit && weight_g > 0) unit = 'g';

        if (measures.length > 0) {
            const unitLower = normalizeUnit(unit);
            const matchedStandard = getStandardMassMultiplier(unit);
            const matchedMeasure = unitLower ? measures.find(m => normalizeUnit(m.label) === unitLower) : null;

            if (matchedStandard && !hasParsedWeight) {
                weight_g = quantity * matchedStandard;
                if (unitLower.startsWith('lb')) unit = 'lb';
                if (unitLower.startsWith('oz')) unit = 'oz';
            } else if (matchedMeasure) {
                if (!unit) unit = matchedMeasure.label;
                if (!hasParsedWeight) weight_g = quantity * matchedMeasure.weight_g;
            } else if (!unit || ['g', 'item', 'whole', 'unit'].includes(unitLower)) {
                const natural = findNaturalMeasure(measures);
                if (natural) {
                    if (!unit) unit = natural.label;
                    if (!hasParsedWeight) weight_g = quantity * natural.weight_g;
                } else {
                    const first = measures[0];
                    if (first && (first.weight_g < 150 || quantity < 1)) {
                        if (!unit) unit = first.label;
                        if (!hasParsedWeight) weight_g = quantity * (first.weight_g || 1);
                    } else {
                        if (!unit) unit = 'g';
                        if (!hasParsedWeight) weight_g = weight_g || (quantity > 10 ? quantity : 100);
                    }
                }
            } else {
                const first = measures[0];
                if (first && !hasParsedWeight) weight_g = quantity * (first.weight_g || 1);
            }
        } else {
            if (!unit) unit = 'g';
            if (!hasParsedWeight && weight_g === 0) {
                const std: Record<string, number> = { 'tsp': 5, 'tbsp': 15, 'cup': 240, 'lb': 453.59, 'oz': 28.35 };
                weight_g = quantity * (std[unit.toLowerCase()] || 100);
            }
        }

        const multiplier = weight_g / 100;
        const base_nutrition = {
            calories: finalFoodItem.energy_kcal,
            energy_kj: finalFoodItem.energy_kj || (finalFoodItem.energy_kcal * 4.184),
            protein: finalFoodItem.protein_g,
            fat: finalFoodItem.fat_g,
            carbs: finalFoodItem.carbs_g,
            micronutrients: finalFoodItem.micronutrients || {}
        };

        const newIngredient: RecipeIngredient = {
            food_item_id: finalFoodItem.id || 'temp-id',
            food_item_name: finalFoodItem.common_name || finalFoodItem.name,
            weight_g,
            quantity,
            measure_label: unit,
            image: finalFoodItem.image,
            calories: base_nutrition.calories * multiplier,
            energy_kj: base_nutrition.energy_kj * multiplier,
            protein: base_nutrition.protein * multiplier,
            fat: base_nutrition.fat * multiplier,
            carbs: base_nutrition.carbs * multiplier,
            micronutrients: Object.entries(base_nutrition.micronutrients).reduce((acc, [k, v]) => { acc[k] = (v as number) * multiplier; return acc; }, {} as Record<string, number>),
            base_nutrition,
            available_measures: measures,
            modifier
        };

        onChange([...ingredients, newIngredient]);
    };

    const handleMagicParse = async () => {
        if (!magicText.trim()) return;
        setIsParsing(true);
        try {
            const parsed = parseIngredientsOnly(magicText);
            const pending: PendingIngredient[] = parsed.map(item => ({
                raw: item,
                status: 'searching',
                matches: [],
                selectedMatch: null
            }));
            setPendingIngredients(pending);

            const updated = [...pending];
            for (let i = 0; i < updated.length; i++) {
                const item = updated[i];
                const rawItem = item.raw.item;
                const parenIndex = rawItem.indexOf('(');
                let coreName = parenIndex !== -1 ? rawItem.substring(0, parenIndex).trim() : rawItem;
                coreName = coreName.replace(/[*,;:]+\s*$/, '').trim();

                let matches = await searchFoodItem(coreName);
                if (matches.length === 0 && coreName !== rawItem) matches = await searchFoodItem(rawItem);

                if (matches.length > 0) {
                    item.matches = matches;
                    item.selectedMatch = matches[0];
                    item.status = 'matched';
                } else {
                    item.status = 'no-match-local';
                }
                setPendingIngredients([...updated]);
            }
        } catch (err) { console.error("Magic Parse Error:", err); }
        finally { setIsParsing(false); }
    };

    const handleUSDASearchForPending = async (index: number) => {
        const updated = [...pendingIngredients];
        updated[index].status = 'searching-usda';
        setPendingIngredients([...updated]);

        const coreName = updated[index].raw.item.split('(')[0].replace(/[,;:]\s*$/, '').trim();
        const matches = await searchFoodItem(coreName);

        const newUpdated = [...pendingIngredients];
        newUpdated[index].matches = matches;
        newUpdated[index].status = matches.length > 0 ? 'matched' : 'no-match-global';
        if (matches.length > 0) newUpdated[index].selectedMatch = matches[0];
        setPendingIngredients(newUpdated);
    };

    const confirmPendingIngredient = async (index: number) => {
        const item = pendingIngredients[index];
        if (!item?.selectedMatch) return;
        const qty = evaluateLocalQty(item.raw.amount || "");
        const unit = (item.raw.amount || "").replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();
        await handleAddIngredient(item.selectedMatch, { weightG: item.raw.weightG, quantity: qty, unit, modifier: item.raw.modifier });
        setPendingIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const confirmAllIngredients = async () => {
        const matched = pendingIngredients.filter(item => item.status === 'matched' && item.selectedMatch);
        if (matched.length === 0) return;
        setIsParsing(true);
        for (const item of matched) {
            const qty = evaluateLocalQty(item.raw.amount || "");
            const unit = (item.raw.amount || "").replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();
            await handleAddIngredient(item.selectedMatch!, { weightG: item.raw.weightG, quantity: qty, unit, modifier: item.raw.modifier });
        }
        setPendingIngredients(prev => prev.filter(item => item.status !== 'matched'));
        setIsParsing(false);
        toast.success(`Ported ${matched.length} ingredients`);
    };

    const handleUpdateQuantity = (index: number, newQty: number) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const multiplier = (newQty * (ing.weight_g / (ing.quantity || 1))) / 100;
        const base = ing.base_nutrition;
        if (base) {
            updated[index] = {
                ...ing,
                quantity: newQty,
                weight_g: newQty * (ing.weight_g / (ing.quantity || 1)),
                calories: base.calories * multiplier,
                energy_kj: base.energy_kj * multiplier,
                protein: base.protein * multiplier,
                fat: base.fat * multiplier,
                carbs: base.carbs * multiplier,
                micronutrients: Object.entries(base.micronutrients).reduce((acc, [k, v]) => { acc[k] = (v as number) * multiplier; return acc; }, {} as Record<string, number>),
            };
        }
        onChange(updated);
    };

    const totals = useMemo(() => ingredients.reduce(
        (acc, ing) => {
            const newMicros = { ...acc.micronutrients };
            Object.entries(ing.micronutrients || {}).forEach(([k, v]) => {
                const match = findNutrientMatch(newMicros, k) || k;
                newMicros[match] = (newMicros[match] || 0) + (v as number);
            });
            return {
                calories: acc.calories + ing.calories,
                energy_kj: acc.energy_kj + ing.energy_kj,
                protein: acc.protein + ing.protein,
                fat: acc.fat + ing.fat,
                carbs: acc.carbs + ing.carbs,
                micronutrients: newMicros
            };
        },
        { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> }
    ), [ingredients]);

    const userRDAs = useRDA(profile.age || 30, profile.gender || 'female', totals.calories || 2000);

    return {
        showPicker, setShowPicker, showMagicPaste, setShowMagicPaste, magicText, setMagicText,
        isParsing, pendingIngredients, setPendingIngredients, editingNameIndex, setEditingNameIndex,
        showDetailedNutrients, setShowDetailedNutrients, isAdmin, currentUser,
        handleAddIngredient, handleMagicParse, confirmPendingIngredient, confirmAllIngredients,
        handleUSDASearchForPending, rejectPendingIngredient: (i: number) => setPendingIngredients(p => p.filter((_, idx) => idx !== i)),
        handleUpdateQuantity, handleRemoveIngredient: (i: number) => onChange(ingredients.filter((_, idx) => idx !== i)),
        handleUpdateName: (i: number, n: string) => { const u = [...ingredients]; u[i].food_item_name = n; onChange(u); },
        totals, userRDAs, energyUnit
    };
}
