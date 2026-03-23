"use client";

import { useState, useEffect, Suspense, useImperativeHandle, forwardRef } from 'react';
import { Plus, Trash2, Scale, Wand2, Sparkles, Loader2, Check, Apple, Pencil, Zap, X as CloseIcon, ChevronDown, Layers, Gem, Droplet, Battery, Activity, Utensils, ShoppingBasket, ArrowRight, Beaker } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures, FoodMeasure, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { COOKING_STATES, CookingState } from '@/lib/utils/cooking-states';
import { findSpiceFactor, isSpice, getSpiceMeasures, getSpiceStates } from '@/lib/utils/spice-conversion';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { searchFoodItem, searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';
import { toast } from 'sonner';

interface FoodItem {
    id?: string;
    name: string;
    common_name?: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    energy_kj?: number;
    micronutrients?: Record<string, number>;
    portions?: FoodMeasure[];
    image?: string;
    source?: string;
    fdcId?: number;
}

export interface RecipeIngredient {
    food_item_id: string;
    food_item_name: string;
    weight_g: number;
    quantity: number;
    measure_label: string;
    modifier?: string; // New field for prep state
    image?: string;
    source?: string;
    // Calculated nutrition
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients: Record<string, number>;
    // Base nutrition per 100g (to avoid rounding drift)
    base_nutrition?: {
        calories: number;
        energy_kj: number;
        protein: number;
        fat: number;
        carbs: number;
        micronutrients: Record<string, number>;
    };
    // Available measures
    available_measures?: FoodMeasure[];
    // Parsing state
    parsedGrams?: number;
    customUnitWeight?: number;
    cooking_state?: CookingState;
}

export interface IngredientBuilderHandle {
    handleAddIngredient: (foodItem: FoodItem | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }) => Promise<void>;
}

interface IngredientBuilderProps {
    ingredients: RecipeIngredient[];
    onChange: (ingredients: RecipeIngredient[]) => void;
    initialShowPicker?: boolean;
    initialShowMagicPaste?: boolean;
    onNext?: () => void;
}

const IngredientBuilderContent = forwardRef<IngredientBuilderHandle, IngredientBuilderProps>(({ ingredients, onChange, initialShowPicker = false, initialShowMagicPaste = false, onNext }, ref) => {
    const [showPicker, setShowPicker] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [showMagicPaste, setShowMagicPaste] = useState(false);
    const [magicText, setMagicText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [pendingIngredients, setPendingIngredients] = useState<any[]>([]);
    const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Inline ingredient picker state
    const [inlineSearchQuery, setInlineSearchQuery] = useState('');
    const [inlineSearchResults, setInlineSearchResults] = useState<any[]>([]);
    const [inlineSearchLoading, setInlineSearchLoading] = useState(false);
    const [inlineSearchView, setInlineSearchView] = useState<'local' | 'usda'>('local');


    const { energyUnit, setEnergyUnit, nutrientDisplayMode, profile } = useUserPreferences();
    const useKilojoules = energyUnit === 'kJ';

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

    useImperativeHandle(ref, () => ({
        handleAddIngredient: async (foodItem, initialValues) => {
            await handleAddIngredient(foodItem, initialValues);
        }
    }));

    // Inline ingredient search handlers
    const handleInlineSearch = async (query: string) => {
        setInlineSearchQuery(query);
        if (query.length < 2) {
            setInlineSearchResults([]);
            return;
        }

        setInlineSearchLoading(true);
        try {
            // Use unified search that returns both USDA and local results
            const results = await searchFoodItem(query);
            setInlineSearchResults(results);
        } catch (err) {
            console.error("Inline search error:", err);
            setInlineSearchResults([]);
        } finally {
            setInlineSearchLoading(false);
        }
    };

    const handleInlineSelectIngredient = async (item: any) => {
        await handleAddIngredient(item);
        // Clear search after selection
        setInlineSearchQuery('');
        setInlineSearchResults([]);
        setShowPicker(false);
    };

    useEffect(() => {
        if (initialShowPicker) setShowPicker(true);
        if (initialShowMagicPaste) setShowMagicPaste(true);
    }, [initialShowPicker, initialShowMagicPaste]);


    useEffect(() => {
        const newFoodId = searchParams.get('newFoodId');
        const swapIndexStr = searchParams.get('swapIndex');
        const pendingJson = sessionStorage.getItem('moringa_spice_lab_pending');

        if (newFoodId && swapIndexStr !== null && pendingJson) {
            const index = parseInt(swapIndexStr);
            const pendingIngredients = JSON.parse(pendingJson);

            // Clean up immediately so it doesn't run again on refresh
            sessionStorage.removeItem('moringa_spice_lab_pending');

            // Fetch the new food and update
            const performSwap = async () => {
                try {
                    const { data: food, error } = await supabase
                        .from('food_items')
                        .select('*')
                        .eq('id', newFoodId)
                        .single();

                    if (error) throw error;
                    if (food) {
                        toast.success(`Swapped spice with Lab version: ${food.name}`);
                        const updated = [...pendingIngredients];
                        const oldIng = updated[index];

                        // Create the new ingredient object
                        // We keep the quantity and unit from the old one, but update the weight and nutrition
                        const newIng: RecipeIngredient = {
                            ...oldIng,
                            food_item_id: food.id,
                            food_item_name: food.name,
                            source: food.source || 'manual',
                            calories: food.energy_kcal * (oldIng.weight_g / 100),
                            energy_kj: (food.energy_kj || 0) * (oldIng.weight_g / 100),
                            protein: food.protein_g * (oldIng.weight_g / 100),
                            fat: food.fat_g * (oldIng.weight_g / 100),
                            carbs: food.carbs_g * (oldIng.weight_g / 100),
                            micronutrients: Object.entries(food.micronutrients || {}).reduce((acc, [key, val]) => {
                                acc[key] = (val as number) * (oldIng.weight_g / 100);
                                return acc;
                            }, {} as Record<string, number>),
                            base_nutrition: {
                                calories: food.energy_kcal,
                                energy_kj: food.energy_kj || 0,
                                protein: food.protein_g,
                                fat: food.fat_g,
                                carbs: food.carbs_g,
                                micronutrients: food.micronutrients || {}
                            },
                            available_measures: food.portions
                        };

                        updated[index] = newIng;
                        onChange(updated);

                        // Remove search params from URL without refresh
                        const newUrl = pathname;
                        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
                    }
                } catch (err) {
                    console.error("Error swapping spice:", err);
                    toast.error("Failed to swap spice after Lab calibration");
                }
            };

            performSwap();
        }
    }, [searchParams, pathname, onChange]);

    const handleAddIngredient = async (foodItem: FoodItem | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }) => {
        // Fetch available measures
        let measures: FoodMeasure[] = [];
        let finalFoodItem = foodItem as any;

        // If it's a USDA item, we need to sync it or at least get measures
        if ('source' in foodItem && foodItem.source === 'usda' && foodItem.fdcId) {
            const usdaMeasures = await getUSDAMeasures(foodItem.fdcId);
            const syncedId = await syncToLocal(foodItem as FoodItemMatch, usdaMeasures, currentUser?.id, isAdmin);

            if (syncedId) {
                finalFoodItem = { ...foodItem, id: syncedId };
                measures = usdaMeasures;
            } else {
                measures = usdaMeasures;
            }
        } else if (foodItem.portions && foodItem.portions.length > 0) {
            // Use local JSONB portions if available
            measures = foodItem.portions;
        } else if (foodItem.id) {
            // Fallback to fetching from table (legacy support)
            measures = await fetchFoodMeasures(foodItem.id);
        }

        // Determine initial weight and unit
        let weight_g = initialValues?.weightG || 0;
        let quantity = initialValues?.quantity || (weight_g > 0 ? weight_g : 1);
        let unit = initialValues?.unit?.trim() || '';
        let modifier = initialValues?.modifier?.trim() || '';

        // KEY: If weightG was provided from parsing, it is the source of truth
        // We should NOT overwrite it with measure calculations
        const hasParsedWeight = initialValues?.weightG && initialValues.weightG > 0;

        console.log(`[handleAddIngredient] "${(foodItem as any).name}"`, {
            initialWeightG: initialValues?.weightG,
            hasParsedWeight,
            quantity,
            unit,
            measuresCount: measures.length
        });

        // If no unit provided, default to 'g' if we have weightG, otherwise try to find a natural measure
        if (!unit && weight_g > 0) {
            unit = 'g';
        }

        // Matching logic - only calculate weight from measures if we DON'T have a parsed weight
        if (measures.length > 0) {
            const unitLower = unit.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/s$/, '').trim(); // singularized unit

            const standardMassUnits: Record<string, number> = {
                'g': 1, 'gram': 1, 'ml': 1,
                'kg': 1000, 'kilogram': 1000,
                'lb': 453.59, 'lbs': 453.59, 'pound': 453.59, 'lb.': 453.59,
                'oz': 28.35, 'ounce': 28.35, 'oz.': 28.35
            };

            const matchedStandard = standardMassUnits[unitLower];

            const matchedMeasure = unitLower ? measures.find(m => {
                const labelLower = m.label.toLowerCase().replace(/s$/, '');
                return labelLower === unitLower ||
                    labelLower.includes(unitLower) ||
                    unitLower.includes(labelLower);
            }) : null;

            if (matchedStandard && !hasParsedWeight) {
                weight_g = quantity * matchedStandard;
                // Normalize label if it's one of the standard variants
                if (unitLower.startsWith('lb')) unit = 'lb';
                if (unitLower.startsWith('oz')) unit = 'oz';
            } else if (matchedMeasure) {
                // If we DON'T have a specific unit string already (manual add), use the matched label
                if (!unit) unit = matchedMeasure.label;

                // Only calculate weight from measure if we don't have parsed grams
                if (!hasParsedWeight) {
                    weight_g = quantity * matchedMeasure.weight_g;
                }
            } else if (!unit || ['g', 'item', 'whole', 'unit'].includes(unitLower)) {
                // Try harder to find a "natural" count measure
                // Check for labels that mean "1 item"
                const natural = measures.find(m => {
                    const l = m.label.toLowerCase();
                    return l.includes('whole') || l.includes('item') || l.includes('unit') ||
                        l.includes('medium') || l.includes('large') || l.includes('each') ||
                        l.includes('portion') || l.includes('fruit') || l.includes('vegetable') ||
                        l.includes('clove');
                });

                if (natural) {
                    if (!unit) unit = natural.label;
                    if (!hasParsedWeight) {
                        weight_g = quantity * natural.weight_g;
                    }
                } else {
                    // Safety fallback: only use first measure if it looks like a single portion
                    const first = measures[0];
                    if (first && (first.weight_g < 150 || quantity < 1)) {
                        if (!unit) unit = first.label;
                        if (!hasParsedWeight) {
                            weight_g = quantity * (first.weight_g || 1);
                        }
                    } else {
                        if (!unit) unit = 'g';
                        if (!hasParsedWeight) {
                            weight_g = weight_g || (quantity > 10 ? quantity : 100);
                        }
                    }
                }
            } else {
                // Unknown unit provided (e.g. "handful"), fallback to first measure logic for WEIGHT but keep label
                const first = measures[0];
                if (first) {
                    if (!hasParsedWeight) {
                        // We have a unit string (e.g. "cup"), but we need a weight.
                        // Try to see if our unit string matches any measure label loosely again?
                        // actually matchedMeasure above handles the fuzzy match.
                        // If we are here, we have a unit string but it didn't match a measure.
                        // Just default to first measure weight? Or 0?
                        // Let's use first measure weight as a best guess
                        weight_g = quantity * (first.weight_g || 1);
                    }
                }
            }
        } else {
            // No measures in DB
            if (!unit) unit = 'g';
            if (!hasParsedWeight && weight_g === 0) {
                const uL = unit.toLowerCase();
                const standardWeights: Record<string, number> = {
                    'tsp': 5, 'teaspoon': 5, 'tbsp': 15, 'tablespoon': 15,
                    'cup': 240, 'ml': 1, 'oz': 28.35, 'lb': 453.59, 'head': 800, 'medium': 150,
                    'large': 200, 'small': 100, 'clove': 5, 'pinch': 0.5, 'dash': 0.5,
                    'slice': 25, 'piece': 20, 'can': 400, 'jar': 400, 'bottle': 500
                };
                const baseWeight = standardWeights[uL] || 100;
                weight_g = (unit === 'g' || unit === 'ml') ? quantity : (quantity * baseWeight);
            }
        }

        // Final UI cleanup: humanize ID-like labels if any leaked in
        const cleanLabel = (l: string) => {
            if (/^\d+$/.test(l)) return 'portion';
            if (l.toLowerCase() === 'undetermined') return 'portion';
            return l;
        };
        unit = cleanLabel(unit);

        const multiplier = weight_g / 100;

        const base_nutrition = {
            calories: finalFoodItem.energy_kcal,
            energy_kj: finalFoodItem.energy_kj || (finalFoodItem.energy_kcal * 4.184),
            protein: finalFoodItem.protein_g,
            fat: finalFoodItem.fat_g,
            carbs: finalFoodItem.carbs_g,
            micronutrients: finalFoodItem.micronutrients || {},
            phytonutrients: finalFoodItem.phytonutrients || {}
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
            micronutrients: Object.entries(base_nutrition.micronutrients).reduce((acc, [key, val]) => {
                acc[key] = (val as number) * multiplier;
                return acc;
            }, {} as Record<string, number>),
            base_nutrition,
            available_measures: measures,
            parsedGrams: hasParsedWeight ? weight_g : undefined,
            customUnitWeight: (hasParsedWeight && quantity > 0) ? (weight_g / quantity) : undefined,
            modifier: modifier
        };

        onChange([...ingredients, newIngredient]);
    };

    const handleMagicParse = async () => {
        if (!magicText.trim()) return;
        setIsParsing(true);

        try {
            const parsed = parseIngredientsOnly(magicText);
            const pending = [];

            for (const item of parsed) {
                pending.push({
                    raw: item,
                    status: 'searching',
                    matches: [] as FoodItemMatch[],
                    selectedMatch: null as FoodItemMatch | null
                });
            }

            setPendingIngredients(pending);

            // Start matching process
            const updatedPending = [...pending];
            for (let i = 0; i < updatedPending.length; i++) {
                const item = updatedPending[i];

                // 1. Prepare Query (Core Name Logic)
                const rawItem = item.raw.item;
                const parenIndex = rawItem.indexOf('(');
                let coreName = parenIndex !== -1 ? rawItem.substring(0, parenIndex).trim() : rawItem;
                coreName = coreName.replace(/[*,;:]+\s*$/, '').trim();

                // 2. Unified Search (USDA + Local, with USDA prioritized)
                let matches = await searchFoodItem(coreName);

                // Fallback: If no results for core name, try full item
                if (matches.length === 0 && coreName !== rawItem) {
                    matches = await searchFoodItem(rawItem);
                }

                if (matches.length > 0) {
                    item.matches = matches;

                    // Auto-select top result (already sorted USDA-first by searchFoodItem)
                    item.selectedMatch = matches[0];
                    item.status = 'matched';

                    console.log(`[Magic Parse] Auto-selected "${matches[0].name}" (source: ${matches[0].source}) for "${coreName}"`);
                } else {
                    item.status = 'no-match';
                }

                setPendingIngredients([...updatedPending]);
            }
        } catch (err) {
            console.error("Magic Parse Error:", err);
        } finally {
            setIsParsing(false);
        }
    };

    const handleUSDASearchForPending = async (index: number) => {
        const updated = [...pendingIngredients];
        const item = updated[index];
        item.status = 'searching-usda';
        setPendingIngredients(updated);

        const rawItem = item.raw.item;
        const parenIndex = rawItem.indexOf('(');
        let coreName = parenIndex !== -1 ? rawItem.substring(0, parenIndex).trim() : rawItem;
        coreName = coreName.replace(/[,;:]\s*$/, '').trim();

        // Use unified search (includes both USDA and local)
        let matches = await searchFoodItem(coreName);
        if (matches.length === 0 && coreName !== rawItem) {
            matches = await searchFoodItem(rawItem);
        }

        const newUpdated = [...pendingIngredients];
        const newItem = newUpdated[index];
        newItem.matches = matches;
        newItem.status = matches.length > 0 ? 'matched' : 'no-match-global';
        if (matches.length > 0) {
            newItem.selectedMatch = matches[0];
        }
        setPendingIngredients(newUpdated);
    };

    const evaluateLocalQty = (amt: string): number => {
        if (!amt) return 1;
        let cleanAmt = amt.replace(/,/g, '.').trim();
        const unicodeFractions: Record<string, number> = {
            '¼': 0.25, '½': 0.5, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
        };
        for (const [char, val] of Object.entries(unicodeFractions)) {
            if (cleanAmt.includes(char)) {
                const parts = cleanAmt.split(char);
                const whole = parseFloat(parts[0].trim()) || 0;
                return whole + val;
            }
        }
        const match = cleanAmt.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))/);
        if (!match) return 1;
        const val = match[1].trim();
        if (val.includes('/')) {
            if (val.includes(' ')) {
                const [whole, frac] = val.split(/\s+/);
                const [num, den] = frac.split('/').map(n => parseFloat(n.trim()));
                return (parseFloat(whole) || 0) + (num / (den || 1));
            }
            const [num, den] = val.split('/').map(n => parseFloat(n.trim()));
            return num / (den || 1);
        }
        const numVal = parseFloat(val);
        return isNaN(numVal) ? 1 : numVal;
    };

    const confirmPendingIngredient = async (index: number) => {
        const item = pendingIngredients[index];
        if (!item || !item.selectedMatch) return;

        let weightG = item.raw.weightG;
        let amountStr = (item.raw.amount || "").replace(/or\b/gi, '').trim();
        const qty = evaluateLocalQty(amountStr);
        const unit = amountStr.replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();

        await handleAddIngredient(item.selectedMatch, {
            weightG: weightG,
            quantity: qty,
            unit: unit,
            modifier: item.raw.modifier
        });

        setPendingIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const confirmAllIngredients = async () => {
        const matchedItems = pendingIngredients.filter(item => item.status === 'matched' && item.selectedMatch);
        if (matchedItems.length === 0) return;

        setIsParsing(true); // Reuse parsing state for loading
        try {
            // Sequential is safer for handleAddIngredient as it uses state internally
            for (const item of matchedItems) {
                let weightG = item.raw.weightG;
                let amountStr = (item.raw.amount || "").replace(/or\b/gi, '').trim();
                const qty = evaluateLocalQty(amountStr);
                const unit = amountStr.replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();

                await handleAddIngredient(item.selectedMatch, {
                    weightG: weightG,
                    quantity: qty,
                    unit: unit,
                    modifier: item.raw.modifier
                });
            }

            // Remove all matched items from pending
            setPendingIngredients(prev => prev.filter(item => item.status !== 'matched'));
            toast.success(`Ported ${matchedItems.length} ingredients to Protocol Workspace`);
        } catch (err) {
            console.error("Add All Error:", err);
            toast.error("Failed to add all ingredients");
        } finally {
            setIsParsing(false);
        }
    };

    const rejectPendingIngredient = (index: number) => {
        setPendingIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, newQuantity: number) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const unitLower = (ing.measure_label || 'g').toLowerCase().trim();

        // Recalculate weight based on unit type
        let newWeight = newQuantity;

        if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'ml') {
            newWeight = newQuantity;
        } else if (unitLower === 'kg' || unitLower === 'kilogram') {
            newWeight = newQuantity * 1000;
        } else if (['lb', 'lbs', 'pound', 'pounds', 'lb.'].includes(unitLower)) {
            newWeight = newQuantity * 453.59;
        } else if (['oz', 'oz.', 'ounce', 'ounces'].includes(unitLower)) {
            newWeight = newQuantity * 28.35;
        } else {
            // Priority 1: Search standard available measures
            let measures = [...(ing.available_measures || [])];
            if (isSpice(ing.food_item_name)) {
                measures = [...measures, ...getSpiceMeasures(ing.food_item_name, ing.cooking_state)];
            }

            const measure = measures.find(m => m.label.toLowerCase() === unitLower);
            if (measure) {
                newWeight = newQuantity * measure.weight_g;
            }
            // Priority 2: Use custom unit weight if we have one (from magic paste)
            else if (ing.customUnitWeight) {
                newWeight = newQuantity * ing.customUnitWeight;
            }
            // Priority 3: Maintain current ratio
            else {
                const currentWeightPerUnit = (ing.weight_g > 0 && ing.quantity > 0) ? (ing.weight_g / ing.quantity) : 1;
                newWeight = newQuantity * currentWeightPerUnit;
            }
        }

        const multiplier = newWeight / 100;

        if (ing.base_nutrition) {
            const base = ing.base_nutrition;
            updated[index] = {
                ...ing,
                quantity: newQuantity,
                weight_g: newWeight,
                calories: base.calories * multiplier,
                energy_kj: base.energy_kj * multiplier,
                protein: base.protein * multiplier,
                fat: base.fat * multiplier,
                carbs: base.carbs * multiplier,
                micronutrients: Object.entries(base.micronutrients).reduce((acc, [key, val]) => {
                    acc[key] = (val as number) * multiplier;
                    return acc;
                }, {} as Record<string, number>),
            };
        } else {
            const safeOldWeight = ing.weight_g || 1;
            const ratio = newWeight / safeOldWeight;
            updated[index] = {
                ...ing,
                quantity: newQuantity,
                weight_g: newWeight,
                calories: ing.calories * ratio,
                energy_kj: ing.energy_kj * ratio,
                protein: ing.protein * ratio,
                fat: ing.fat * ratio,
                carbs: ing.carbs * ratio,
                micronutrients: Object.entries(ing.micronutrients || {}).reduce((acc, [key, val]) => {
                    acc[key] = (val as number) * ratio;
                    return acc;
                }, {} as Record<string, number>),
            };
        }

        onChange(updated);
    };

    const handleUpdateUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const newUnitLower = newUnit.toLowerCase().trim();

        // If we are just changing the label but want to keep the mass constant:
        // (Molecularly, the ingredient is the same amount, we just change the ruler)
        let newQuantity = ing.quantity;
        let newWeight = ing.weight_g;

        // If switching TO mass-based, quantity IS weight
        if (newUnitLower === 'g' || newUnitLower === 'gram' || newUnitLower === 'ml') {
            newQuantity = ing.weight_g;
            newWeight = ing.weight_g;
        }
        else if (newUnitLower === 'kg' || newUnitLower === 'kilogram') {
            newQuantity = ing.weight_g / 1000;
            newWeight = ing.weight_g;
        }
        else if (['lb', 'lbs', 'pound', 'pounds', 'lb.'].includes(newUnitLower)) {
            newQuantity = ing.weight_g / 453.59;
            newWeight = ing.weight_g;
        }
        else if (['oz', 'oz.', 'ounce', 'ounces'].includes(newUnitLower)) {
            newQuantity = ing.weight_g / 28.35;
            newWeight = ing.weight_g;
        }
        else {
            // Find density of the NEW unit
            let measures = [...(ing.available_measures || [])];
            if (isSpice(ing.food_item_name)) {
                measures = [...measures, ...getSpiceMeasures(ing.food_item_name, ing.cooking_state)];
            }

            const newMeasure = measures.find(m => m.label.toLowerCase() === newUnitLower);
            if (newMeasure && newMeasure.weight_g > 0) {
                newQuantity = ing.weight_g / newMeasure.weight_g;
            } else if (ing.customUnitWeight && ing.customUnitWeight > 0) {
                newQuantity = ing.weight_g / ing.customUnitWeight;
            }
        }

        updated[index] = {
            ...ing,
            measure_label: newUnit,
            quantity: Number(newQuantity.toFixed(3)),
            weight_g: newWeight
        };

        onChange(updated);
    };

    const handleUpdateModifier = (index: number, newModifier: string) => {
        const updated = [...ingredients];
        updated[index] = {
            ...updated[index],
            modifier: newModifier
        };
        onChange(updated);
    };

    const handleUpdateWeight = (index: number, newWeight: number) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const multiplier = newWeight / 100;
        const stateFactor = COOKING_STATES[ing.cooking_state || 'raw'];

        // Recalculate quantity based on new weight and unit density
        let newQuantity = ing.quantity;
        const unitLower = (ing.measure_label || 'g').toLowerCase().trim();

        if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'ml') {
            newQuantity = newWeight;
        } else if (unitLower === 'kg' || unitLower === 'kilogram') {
            newQuantity = newWeight / 1000;
        } else if (['lb', 'lbs', 'pound', 'pounds', 'lb.'].includes(unitLower)) {
            newQuantity = newWeight / 453.59;
        } else if (['oz', 'oz.', 'ounce', 'ounces'].includes(unitLower)) {
            newQuantity = newWeight / 28.35;
        } else {
            let measures = [...(ing.available_measures || [])];
            if (isSpice(ing.food_item_name)) {
                measures = [...measures, ...getSpiceMeasures(ing.food_item_name, ing.cooking_state)];
            }
            const measure = measures.find(m => m.label.toLowerCase() === unitLower);
            if (measure && measure.weight_g > 0) {
                newQuantity = newWeight / measure.weight_g;
            } else if (ing.customUnitWeight && ing.customUnitWeight > 0) {
                newQuantity = newWeight / ing.customUnitWeight;
            }
        }

        if (ing.base_nutrition) {
            const base = ing.base_nutrition;
            updated[index] = {
                ...ing,
                weight_g: newWeight,
                quantity: Number(newQuantity.toFixed(3)),
                calories: base.calories * multiplier * stateFactor.energy,
                energy_kj: base.energy_kj * multiplier * stateFactor.energy,
                protein: base.protein * multiplier * stateFactor.protein,
                fat: base.fat * multiplier * stateFactor.fat,
                carbs: base.carbs * multiplier * stateFactor.carbs,
                micronutrients: Object.entries(base.micronutrients).reduce((acc, [key, val]) => {
                    acc[key] = (val as number) * multiplier * stateFactor.micros;
                    return acc;
                }, {} as Record<string, number>),
            };
        } else {
            const ratio = newWeight / (ing.weight_g || 1);
            updated[index] = {
                ...ing,
                weight_g: newWeight,
                quantity: Number(newQuantity.toFixed(3)),
                calories: ing.calories * ratio,
                energy_kj: ing.energy_kj * ratio,
                protein: ing.protein * ratio,
                fat: ing.fat * ratio,
                carbs: ing.carbs * ratio,
                micronutrients: Object.entries(ing.micronutrients || {}).reduce((acc, [key, val]) => {
                    acc[key] = (val as number) * ratio;
                    return acc;
                }, {} as Record<string, number>),
            };
        }
        onChange(updated);
    };

    const handleUpdateState = async (index: number, newState: CookingState) => {
        const updated = [...ingredients];
        const ing = updated[index];

        // 1. DIRECT MATCH LOGIC
        if (newState === 'raw' || newState === 'boiled' || newState === 'fried' || newState === 'roasted') {
            const baseName = (ing.food_item_name || '').split(',')[0].trim();

            try {
                // Broad search for the base name using unified search (USDA + local)
                const matches = await searchFoodItem(baseName);

                const directMatch = matches.find((m: any) => {
                    const itemName = m.name.toLowerCase();
                    const commonName = (m.common_name || '').toLowerCase();
                    const b = baseName.toLowerCase();
                    const firstWord = b.split(' ')[0];

                    const hasBase = itemName.includes(firstWord) || commonName.includes(firstWord);

                    if (!hasBase) return false;

                    if (newState === 'raw') {
                        // Raw must NOT contain cooked/boiled/fried/roasted
                        const isCooked = ['cooked', 'boiled', 'fried', 'roasted'].some(s => itemName.includes(s));
                        if (isCooked) return false;
                        return itemName.includes('raw') || itemName.includes('fresh') || itemName === b || itemName === firstWord;
                    }

                    if (newState === 'boiled') {
                        return itemName.includes('cooked') || itemName.includes('boiled');
                    }

                    return itemName.includes(newState.toLowerCase());
                });

                if (directMatch) {
                    toast.success(`Found match: ${directMatch.name}`, {
                        description: `Applying profile and portion weights...`,
                        duration: 3000
                    });

                    // Similar to the detail page, we swap the food item data
                    // We need to fetch full details (portions) to do the weight recalculation
                    const details = directMatch.portions?.length ? directMatch : (await searchFoodItem(directMatch.name))[0];

                    if (details) {
                        let newWeight = ing.weight_g;
                        const currentUnit = (ing.measure_label || 'g').toLowerCase();
                        const quantity = ing.quantity || 1;

                        // 1. HARD OVERRIDE FOR GRAMS
                        // If the unit is exactly 'g', we don't need portion math, it's 1:1
                        if (currentUnit === 'g' || currentUnit === 'gram' || currentUnit === 'grams') {
                            newWeight = quantity;
                        } else {
                            // 2. Robust portion matching logic
                            const normalize = (s: string) => {
                                return s.toLowerCase()
                                    .replace(/,/g, ' ')
                                    .replace(/\b(chopped|shredded|sliced|diced|minced|cut|pieces|raw|cooked|boiled|fried|roasted)\b/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            };

                            const nUnit = normalize(currentUnit);
                            const baseUnits = ['cup', 'tbsp', 'tsp', 'g', 'oz', 'leaf', 'bunch', 'piece', 'item'];
                            const foundBase = baseUnits.find(bu => nUnit.startsWith(bu));

                            const portion = details.portions?.find((p: any) => {
                                const l = p.label.toLowerCase();
                                const nL = normalize(l);

                                // Strict match for short units (g, oz) to avoid matching 'large'
                                if (currentUnit.length <= 2) {
                                    return l === currentUnit || nL === nUnit;
                                }

                                if (l === currentUnit || nL === nUnit) return true;
                                if (foundBase && nL.startsWith(foundBase)) return true;
                                return l.includes(currentUnit) || currentUnit.includes(l) || nL.includes(nUnit) || nUnit.includes(nL);
                            });

                            if (portion) {
                                newWeight = quantity * portion.weight_g;
                                console.log(`[PortionMatch] Matched ${currentUnit} to ${portion.label}, new weight: ${newWeight}`);
                            } else {
                                console.warn(`[PortionMatch] No match for ${currentUnit} in ${details.name}, keeping weight ${ing.weight_g}`);
                            }
                        }

                        updated[index] = {
                            ...ing,
                            food_item_name: details.name,
                            weight_g: newWeight,
                            cooking_state: 'stored',
                            calories: details.energy_kcal * (newWeight / 100),
                            energy_kj: details.energy_kj * (newWeight / 100),
                            protein: details.protein_g * (newWeight / 100),
                            fat: details.fat_g * (newWeight / 100),
                            carbs: details.carbs_g * (newWeight / 100),
                            micronutrients: Object.entries(details.micronutrients || {}).reduce((acc, [key, val]) => {
                                acc[key] = (val as number) * (newWeight / 100);
                                return acc;
                            }, {} as Record<string, number>),
                            base_nutrition: {
                                calories: details.energy_kcal,
                                energy_kj: details.energy_kj,
                                protein: details.protein_g,
                                fat: details.fat_g,
                                carbs: details.carbs_g,
                                micronutrients: details.micronutrients || {}
                            },
                            available_measures: details.portions,
                            source: details.source || 'usda'
                        };

                        onChange(updated);
                        return;
                    }
                }
            } catch (err) {
                console.error("Direct match failed in builder:", err);
            }
        }

        if (newState === 'stored') {
            updated[index] = { ...ing, cooking_state: 'stored' };
            onChange(updated);
            return;
        }

        // Spice logic for volume adjustment
        const isSpice = findSpiceFactor(ing.food_item_name).name !== 'Generic';
        if (isSpice && (newState === 'ground' || newState === 'whole')) {
            const factor = findSpiceFactor(ing.food_item_name);
            const currentUnit = ing.measure_label;
            const isVolume = ['tsp', 'teaspoon', 'tbsp', 'tablespoon', 'cup'].some(unit => currentUnit.toLowerCase().includes(unit));

            if (isVolume) {
                const dWhole = factor.gPerTspWhole || 2.5;
                const dGround = factor.gPerTspGround || 2.3;

                let unitToTsp = 1;
                if (currentUnit.toLowerCase().includes('tbsp')) unitToTsp = 3;
                if (currentUnit.toLowerCase().includes('cup')) unitToTsp = 48;

                const currentQty = ing.quantity || 1;
                const currentState = ing.cooking_state || 'whole';
                const currentMass = currentQty * (currentState === 'ground' ? dGround : dWhole) * unitToTsp;

                const newDensity = (newState === 'ground' ? dGround : dWhole);
                const newQty = currentMass / (newDensity * unitToTsp);

                updated[index] = {
                    ...ing,
                    cooking_state: newState,
                    quantity: Number(newQty.toFixed(2)),
                    weight_g: Number(currentMass.toFixed(2))
                };

                // Trigger recalculation with the updated state/weight
                const multiplier = Number(currentMass.toFixed(2)) / 100;
                const stateFactor = COOKING_STATES[newState];
                const base = ing.base_nutrition;
                if (base) {
                    updated[index] = {
                        ...updated[index],
                        calories: base.calories * multiplier * stateFactor.energy,
                        energy_kj: base.energy_kj * multiplier * stateFactor.energy,
                        protein: base.protein * multiplier * stateFactor.protein,
                        fat: base.fat * multiplier * stateFactor.fat,
                        carbs: base.carbs * multiplier * stateFactor.carbs,
                        micronutrients: Object.entries(base.micronutrients).reduce((acc, [key, val]) => {
                            acc[key] = (val as number) * multiplier * stateFactor.micros;
                            return acc;
                        }, {} as Record<string, number>),
                    };
                }

                onChange(updated);
                return;
            }
        }

        const stateFactor = COOKING_STATES[newState];
        const multiplier = ing.weight_g / 100;
        const base = ing.base_nutrition;

        if (base) {
            updated[index] = {
                ...ing,
                cooking_state: newState,
                calories: base.calories * multiplier * stateFactor.energy,
                energy_kj: base.energy_kj * multiplier * stateFactor.energy,
                protein: base.protein * multiplier * stateFactor.protein,
                fat: base.fat * multiplier * stateFactor.fat,
                carbs: base.carbs * multiplier * stateFactor.carbs,
                micronutrients: Object.entries(base.micronutrients).reduce((acc, [key, val]) => {
                    acc[key] = (val as number) * multiplier * stateFactor.micros;
                    return acc;
                }, {} as Record<string, number>),
            };
        } else {
            updated[index] = { ...ing, cooking_state: newState };
        }

        onChange(updated);
    };

    const handleRemoveIngredient = (index: number) => {
        onChange(ingredients.filter((_, i) => i !== index));
    };

    const handleUpdateName = (index: number, newName: string) => {
        const updated = [...ingredients];
        updated[index] = { ...updated[index], food_item_name: newName };
        onChange(updated);
    };

    // Calculate totals
    const totals = ingredients.reduce(
        (acc, ing) => {
            const newMicros = { ...acc.micronutrients };
            Object.entries(ing.micronutrients || {}).forEach(([key, val]) => {
                const match = findNutrientMatch(newMicros, key) || key;
                newMicros[match] = (newMicros[match] || 0) + (val as number);
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
    );

    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        totals.calories || 2000
    );

    const NUTRIENT_BREAKDOWNS: Record<string, { label: string, keys: string[], unit: string, isEssential?: boolean, hiddenByDefault?: boolean, isExpandable?: boolean }[]> = {
        'Vitamin A': [
            { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
            { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
            { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
            { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
            { label: 'Lutein+Zeaxanthin', keys: ['Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
            { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
        ],
        'Vitamin E': [
            { label: 'Alpha-tocopherol', keys: ['Vitamin E', 'vitamin_e_mg', 'alpha_tocopherol_mg'], unit: 'mg' },
            { label: 'Beta-tocopherol', keys: ['Beta Tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
            { label: 'Delta-tocopherol', keys: ['Delta Tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
            { label: 'Gamma-tocopherol', keys: ['Gamma Tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
        ],
        'Protein': [
            { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
            { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
            { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
            { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
            { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
            { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
            { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
            { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
            { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
            { label: 'Alanine', keys: ['Alanine', 'alanine_g'], unit: 'g' },
            { label: 'Arginine', keys: ['Arginine', 'arginine_g'], unit: 'g' },
            { label: 'Aspartic acid', keys: ['Aspartic acid', 'aspartic_acid_g'], unit: 'g' },
            { label: 'Cystine', keys: ['Cystine', 'cystine_g'], unit: 'g' },
            { label: 'Glutamic acid', keys: ['Glutamic acid', 'glutamic_acid_g'], unit: 'g' },
            { label: 'Glycine', keys: ['Glycine', 'glycine_g'], unit: 'g' },
            { label: 'Proline', keys: ['Proline', 'proline_g'], unit: 'g' },
            { label: 'Serine', keys: ['Serine', 'serine_g'], unit: 'g' },
            { label: 'Tyrosine', keys: ['Tyrosine', 'tyrosine_g'], unit: 'g' },
        ],
        'Carbs': [
            { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
            { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
            { label: 'Sugars (Total)', keys: ['Sugars', 'sugars_g', 'sugar_g'], unit: 'g', isExpandable: true },
            { label: 'Fructose', keys: ['Fructose', 'fructose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Glucose', keys: ['Glucose', 'glucose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Sucrose', keys: ['Sucrose', 'sucrose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Lactose', keys: ['Lactose', 'lactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Maltose', keys: ['Maltose', 'maltose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Galactose', keys: ['Galactose', 'galactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Added Sugars', keys: ['Added Sugars', 'added_sugars_g'], unit: 'g', hiddenByDefault: true },
        ],
        'Fat': [
            { label: 'Saturated Fat', keys: ['Saturated', 'saturated_fat_g', 'saturated_g'], unit: 'g' },
            { label: 'Monounsaturated', keys: ['Monounsaturated', 'monounsaturated_fat_g'], unit: 'g' },
            { label: 'Polyunsaturated', keys: ['Polyunsaturated', 'polyunsaturated_fat_g'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3', 'omega3_g', 'omega_3_g'], unit: 'g' },
            { label: 'Omega-6', keys: ['Omega-6', 'omega6_g', 'omega_6_g'], unit: 'g' },
            { label: 'Trans Fat', keys: ['Trans-Fats', 'trans_fat_g'], unit: 'g' },
            { label: 'Cholesterol', keys: ['Cholesterol', 'cholesterol_mg'], unit: 'mg' },
        ],
    };

    return (
        <div className="space-y-4">
            {showMagicPaste && (
                <div className="p-6 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-widest text-xs">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Magic Ingredient Import
                        </div>
                        <button onClick={() => setShowMagicPaste(false)} className="text-slate-500 hover:text-slate-300">
                            <CloseIcon size={16} />
                        </button>
                    </div>

                    {pendingIngredients.length === 0 ? (
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Paste your list of ingredients here. We'll attempt to match each one to our nutritional database automatically.
                            </p>
                            <textarea
                                value={magicText}
                                onChange={(e) => setMagicText(e.target.value)}
                                placeholder="Example:&#10;2 cups raw spinach&#10;500g chicken breast"
                                className="w-full h-32 p-4 text-sm border border-slate-800 bg-slate-950/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-600"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleMagicParse}
                                    disabled={isParsing || !magicText.trim()}
                                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-200"
                                >
                                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Analyze Ingredients
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-amber-800/50">{pendingIngredients.length} Items Found</span>
                                    {pendingIngredients.some(item => item.status === 'matched' && item.selectedMatch) && (
                                        <button
                                            onClick={confirmAllIngredients}
                                            className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1.5"
                                        >
                                            <Plus size={12} /> Add All Matched
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setPendingIngredients([]);
                                        setMagicText('');
                                    }}
                                    className="text-[10px] font-black uppercase text-amber-800 hover:text-red-600 transition"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {pendingIngredients.map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                                                    <span className="text-amber-600 opacity-60">#{(idx + 1).toString().padStart(2, '0')}</span>
                                                    {item.raw.amount} {item.raw.item}
                                                </div>

                                                <div className="text-[10px] mt-1.5 min-h-[1.5rem] flex items-center">
                                                    {item.status === 'searching' && (
                                                        <span className="text-slate-400 flex items-center gap-2 italic">
                                                            <Loader2 size={12} className="animate-spin text-violet-500" /> Clinical Registry Lookup...
                                                        </span>
                                                    )}

                                                    {item.status === 'searching-usda' && (
                                                        <span className="text-violet-500 flex items-center gap-2 italic">
                                                            <Loader2 size={12} className="animate-spin" /> Querying Global Database...
                                                        </span>
                                                    )}

                                                    {item.status === 'matched' && item.matches.length > 0 && (
                                                        <div className="flex flex-col gap-2 w-full">
                                                            <div className="flex items-center gap-2">
                                                                <Check size={12} className="text-emerald-500" />
                                                                <select
                                                                    className="bg-transparent border-none text-[10px] font-bold text-emerald-600 focus:ring-0 p-0 cursor-pointer hover:underline max-w-[200px]"
                                                                    value={item.selectedMatch?.id || item.selectedMatch?.fdcId}
                                                                    onChange={(e) => {
                                                                        const selected = item.matches.find((m: any) => (m.id || m.fdcId) === e.target.value);
                                                                        const updated = [...pendingIngredients];
                                                                        updated[idx].selectedMatch = selected;
                                                                        setPendingIngredients(updated);
                                                                    }}
                                                                >
                                                                    {item.matches.map((m: any) => (
                                                                        <option key={m.id || m.fdcId} value={m.id || m.fdcId} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                                                            {m.name} ({m.source === 'local' ? 'LOCAL' : 'USDA'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {item.matches.length > 1 && (
                                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">+{item.matches.length - 1} more types</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {item.status === 'no-match-local' && (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-slate-400 font-bold uppercase tracking-tight">Registry mismatch</span>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleUSDASearchForPending(idx)}
                                                                    className="text-violet-600 hover:text-violet-700 font-black flex items-center gap-1.5 transition-all hover:gap-2"
                                                                >
                                                                    <Sparkles size={10} /> Search Global?
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {item.status === 'no-match-global' && (
                                                        <span className="text-rose-500 font-black uppercase tracking-widest">Protocol Sync Failed</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {item.status === 'matched' && (
                                                    <button
                                                        onClick={() => confirmPendingIngredient(idx)}
                                                        className={cn(
                                                            "h-10 px-4 rounded-xl text-white shadow-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
                                                            item.selectedMatch?.source === 'local'
                                                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                                                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10"
                                                        )}
                                                        title={item.selectedMatch?.source === 'local' ? "Add Local Match" : "Add USDA Match"}
                                                    >
                                                        <Plus size={14} /> Add
                                                    </button>
                                                )}

                                                {item.status === 'no-match-local' && (
                                                    <button
                                                        onClick={() => {
                                                            // Fallback to manual search for this specific item if everything fails
                                                            setShowPicker(true);
                                                            rejectPendingIngredient(idx);
                                                        }}
                                                        className="h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                                                        title="Manual Search"
                                                    >
                                                        <Utensils size={14} /> Manual
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => rejectPendingIngredient(idx)}
                                                    className="h-10 w-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-100 dark:border-slate-800"
                                                    title="Dismiss"
                                                >
                                                    <CloseIcon size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Optional: Show tiny "Switch to Global" if matched locally but user wants to browse USDA */}
                                        {item.status === 'matched' && item.selectedMatch?.source === 'local' && isAdmin && (
                                            <div className="px-1 pt-1 opacity-0 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleUSDASearchForPending(idx)}
                                                    className="text-[8px] font-bold text-violet-400 hover:text-violet-500 uppercase tracking-widest"
                                                >
                                                    Not the right version? Browse Global Database
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {pendingIngredients.every(i => i.status !== 'searching') && (
                                <div className="pt-4 flex justify-between items-center">
                                    <p className="text-[10px] text-amber-800/40 font-medium">Review and add individual items above</p>
                                    <button
                                        onClick={() => setShowMagicPaste(false)}
                                        className="text-xs font-bold text-amber-800 bg-amber-100 px-4 py-2 rounded-lg hover:bg-amber-200 transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {ingredients.length === 0 && !showPicker && !showMagicPaste && (
                <div className="py-12 flex flex-col items-center justify-center gap-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                        <h4 className="text-xl font-black uppercase tracking-tighter">Ingredient Protocol</h4>
                        <p className="text-sm font-medium text-slate-500">Choose how to document the clinical building blocks</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowMagicPaste(true)}
                            className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Wand2 size={32} />
                            </div>
                            <div className="text-center">
                                <div className="font-black text-xs uppercase tracking-widest mb-1 text-slate-800 dark:text-slate-200">Magic Paste</div>
                                <div className="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-widest">Paste list for parsing</div>
                            </div>
                        </button>
                        <button
                            onClick={() => setShowPicker(true)}
                            className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Plus size={32} />
                            </div>
                            <div className="text-center">
                                <div className="font-black text-xs uppercase tracking-widest mb-1 text-slate-800 dark:text-slate-200">Manual Build</div>
                                <div className="text-[10px] text-slate-500 font-bold leading-tight uppercase tracking-widest">Add items precisely</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {
                ingredients.length > 0 && (
                    <div className="space-y-2">
                        {ingredients.map((ing, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group">
                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="shrink-0 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                                    title="Delete Ingredient"
                                >
                                    <Trash2 size={14} />
                                </button>

                                {/* Ingredient Name */}
                                <div className="flex-1 min-w-0">
                                    {editingNameIndex === index ? (
                                        <input
                                            type="text"
                                            value={ing.food_item_name}
                                            onChange={(e) => handleUpdateName(index, e.target.value)}
                                            onBlur={() => setEditingNameIndex(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingNameIndex(null)}
                                            autoFocus
                                            className="bg-transparent border-b-2 border-emerald-500 font-black text-slate-900 dark:text-white px-0 py-1 text-sm w-full outline-none"
                                        />
                                    ) : (
                                        <div 
                                            onClick={() => setEditingNameIndex(index)}
                                            className="font-bold text-slate-900 dark:text-white truncate text-sm cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                        >
                                            {ing.food_item_name}
                                        </div>
                                    )}
                                </div>

                                {/* Quantity and Measure */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <input
                                        type="number"
                                        value={ing.quantity}
                                        onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                                        className="w-14 h-8 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                        min="0"
                                        step="0.125"
                                    />
                                    <select
                                        value={ing.measure_label}
                                        onChange={(e) => handleUpdateUnit(index, e.target.value)}
                                        className="w-16 h-8 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        {(() => {
                                            const measures = [...(ing.available_measures || [])];
                                            if (isSpice(ing.food_item_name)) {
                                                const spiceMeasures = getSpiceMeasures(ing.food_item_name, ing.cooking_state);
                                                spiceMeasures.forEach(sm => {
                                                    if (!measures.some(m => m.label.toLowerCase() === sm.label.toLowerCase())) {
                                                        measures.push(sm);
                                                    }
                                                });
                                            }
                                            return measures.map(m => (
                                                <option key={m.label} value={m.label}>{m.label}</option>
                                            ));
                                        })()}
                                        {ing.measure_label !== 'g' && ing.measure_label !== 'kg' && !ing.available_measures?.some(m => m.label === ing.measure_label) && !isSpice(ing.food_item_name) && (
                                            <option value={ing.measure_label}>{ing.measure_label}</option>
                                        )}
                                    </select>
                                </div>

                                {/* Add Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowPicker(true)}
                                    className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                                    title="Add Ingredient"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            }

            {
                ingredients.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-center items-center gap-4 mb-4">
                             {/* Hide nutrient report button as requested */}
                             {/* <Button variant="outline" size="sm" onClick={() => setShowDetailedNutrients(!showDetailedNutrients)} className="gap-2 min-w-[200px] font-bold text-[10px] uppercase tracking-widest h-10 rounded-xl">
                                 {showDetailedNutrients ? (
                                     <>Collapse Report <ChevronDown className="h-4 w-4 rotate-180" /></>
                                 ) : (
                                     <>Expand Nutrient Report <ChevronDown className="h-4 w-4" /></>
                                 )}
                             </Button> */}
                            {onNext && (
                                <Button
                                    onClick={onNext}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-10 rounded-xl shadow-lg shadow-emerald-500/20"
                                >
                                    Next: Cooking Steps <ArrowRight size={14} />
                                </Button>
                            )}
                        </div>

                        {showDetailedNutrients && (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                {(() => {
                                    const m = totals.micronutrients;
                                    const getVal = (keys: string[]) => { for (const k of keys) if (m[k] !== undefined) return m[k]; return 0; };

                                    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, forceRaw = false }: { title: string, items: Record<string, any[]>, icon: any, theme?: 'indigo' | 'rose' | 'amber' | 'emerald' | 'blue', subtitle?: string, forceRaw?: boolean }) => {
                                        const themes = {
                                            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
                                            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" },
                                            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
                                            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" }
                                        };
                                        const t = (themes as any)[theme] || themes.indigo;

                                        return (
                                            <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                                                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                                                {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                                    {Object.entries(items).map(([label, keys]) => {
                                                        const val = getVal(keys as string[]);
                                                        const rda = userRDAs?.[label];
                                                        const pct = rda ? Math.round((val / rda) * 100) : null;
                                                        const styles = getNutrientLevelStyles(pct || 0, label);
                                                        return (
                                                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all", t.itemBorder, pct !== null && !forceRaw ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold">
                                                                        {nutrientDisplayMode === "percentage" && pct !== null && !forceRaw ? `${pct}%` : (val >= 1 ? val.toFixed(1) : val.toFixed(2))}
                                                                    </span>
                                                                    {(nutrientDisplayMode !== "percentage" || forceRaw) && (
                                                                        <span className={cn("text-[10px] font-black", (label === "Vitamin D") ? "text-amber-600 dark:text-amber-400" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                                                                            {(label === "Vitamin D") ? "IU" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "µg" : "mg"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {pct !== null && !forceRaw && (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                                            <div className="text-[9px] font-bold text-slate-400 opacity-80">Target: {rda}{(label === "Vitamin D") ? "IU" : (label.includes("Folate") || label.includes("Selenium") || label.includes("Iodine") || label.includes("B12") || label === "Vitamin A" || label === "Vitamin K") ? "µg" : "mg"}</div>
                                                                        )}
                                                                        {(nutrientDisplayMode === 'percentage' || nutrientDisplayMode === 'both') && (
                                                                            <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    };

                                    return (
                                        <div className="space-y-6">
                                            {/* Combined Macros Breakdown */}
                                            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
                                                <div>
                                                    <h4 className="font-black flex items-center gap-2 mb-1 text-orange-400 uppercase tracking-widest text-[10px]"><Zap className="h-4 w-4" /> Macronutrients</h4>
                                                    <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Analysis of primary fuel sources</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {[
                                                            { label: 'Energy', val: useKilojoules ? totals.energy_kj : totals.calories, target: useKilojoules ? (profile.goal === 'build-muscle' ? 12500 : profile.goal === 'lose-fat' ? 8400 : 10500) : (profile.goal === 'build-muscle' ? 3000 : profile.goal === 'lose-fat' ? 2000 : 2500), unit: useKilojoules ? 'kJ' : 'kcal' },
                                                            { label: 'Protein', val: totals.protein, target: profile.goal === 'build-muscle' ? 150 : 50, unit: 'g' },
                                                            { label: 'Carbs', val: totals.carbs, target: profile.goal === 'lose-fat' ? 150 : 250, unit: 'g' },
                                                            { label: 'Fat', val: totals.fat, target: 70, unit: 'g' },
                                                        ].map(macro => {
                                                            const pct = Math.round((macro.val / macro.target) * 100);
                                                            const styles = getNutrientLevelStyles(pct, macro.label);
                                                            return (
                                                                <div key={macro.label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group flex flex-col justify-between", styles.borderLight, styles.fade)}>
                                                                    <div onClick={() => setSelectedNutrientInfo(macro.label)} className="cursor-pointer">
                                                                        <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{macro.label}</p>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black">
                                                                                {nutrientDisplayMode === 'percentage' ? `${pct}%` : (macro.val >= 1 ? macro.val.toFixed(1) : macro.val.toFixed(2))}
                                                                            </span>
                                                                            {nutrientDisplayMode !== 'percentage' && (
                                                                                <span className="text-[10px] text-muted-foreground font-bold">{macro.unit}</span>
                                                                            )}
                                                                        </div>
                                                                        {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && (
                                                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                                Target: {macro.target}{macro.unit}
                                                                            </p>
                                                                        )}
                                                                        {nutrientDisplayMode === 'both' && (
                                                                            <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
                                                                        )}
                                                                    </div>
                                                                    {['Protein', 'Carbs', 'Fat'].includes(macro.label) && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(macro.label); }}
                                                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-60 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                                                            title="View breakdown"
                                                                        >
                                                                            <Layers className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Other Nutrient Sections */}
                                            <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration & Mineral Balance" items={{
                                                'Sodium': ['Sodium', 'sodium_mg'],
                                                'Potassium': ['Potassium', 'potassium_mg'],
                                                'Magnesium': ['Magnesium', 'magnesium_mg'],
                                                'Calcium': ['Calcium', 'calcium_mg'],
                                                'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                            }} />

                                            <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-nutrients" items={{
                                                'Iron': ['Iron', 'iron_mg'],
                                                'Zinc': ['Zinc', 'zinc_mg'],
                                                'Copper': ['Copper', 'copper_mg'],
                                                'Manganese': ['Manganese', 'manganese_mg'],
                                                'Selenium': ['Selenium', 'selenium_ug']
                                            }} />

                                            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                                                <h4 className="font-black flex items-center gap-2 mb-1 text-blue-400 uppercase tracking-widest text-[10px]"><Droplet className="h-4 w-4" /> Daily Vitamins</h4>
                                                <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Water-soluble vitamins (B-Complex & C)</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {[
                                                        { label: 'B1 (Thiamine)', keys: ['B1 (Thiamine)', 'thiamine_mg'] },
                                                        { label: 'B2 (Riboflavin)', keys: ['B2 (Riboflavin)', 'riboflavin_mg'] },
                                                        { label: 'B3 (Niacin)', keys: ['B3 (Niacin)', 'niacin_mg'] },
                                                        { label: 'B5 (Pantothenic)', keys: ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'] },
                                                        { label: 'B6 (Pyridoxine)', keys: ['B6 (Pyridoxine)', 'vitamin_b6_mg'] },
                                                        { label: 'B7 (Biotin)', keys: ['Biotin', 'biotin_ug'] },
                                                        { label: 'B9 (Folate)', keys: ['B9 (Folate)', 'folate_ug'] },
                                                        { label: 'B12 (Cobalamin)', keys: ['B12 (Cobalamin)', 'vitamin_b12_ug'] },
                                                        { label: 'Vitamin C', keys: ['Vitamin C', 'vitamin_c_mg'] },
                                                        { label: 'Choline', keys: ['Choline', 'choline_mg'] },
                                                    ].map(({ label, keys }) => {
                                                        const val = getVal(keys);
                                                        const rda = userRDAs?.[label];
                                                        const pct = rda ? Math.round((val / rda) * 100) : null;
                                                        const styles = getNutrientLevelStyles(pct || 0, label);
                                                        const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') ? 'µg' : 'mg';
                                                        return (
                                                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-3 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between", pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <div>
                                                                    <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-bold">
                                                                            {nutrientDisplayMode === 'percentage' && pct !== null ? `${pct}%` : (val >= 1 ? val.toFixed(1) : val.toFixed(2))}
                                                                        </span>
                                                                        {nutrientDisplayMode !== 'percentage' && (
                                                                            <span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitLabel}</span>
                                                                        )}
                                                                    </div>
                                                                    {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                            Target: {rda}{unitLabel}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {nutrientDisplayMode === 'both' && pct !== null && <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <NutrientGrid title="Stored Vitamins" icon={Battery} theme="emerald" subtitle="Fat-soluble storage (A, D, E, K)" items={{
                                                'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                                'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                                'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                                'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                                            }} />

                                            <NutrientGrid title="Clinical Markers" icon={Activity} theme="amber" subtitle="Secondary markers for advanced health profile mapping" forceRaw={true} items={{
                                                'Fiber': ['Fiber', 'fiber_g'],
                                                'Sugars': ['Sugars', 'sugars_g'],
                                                'Oxalate': ['Oxalate', 'oxalate_mg'],
                                                'Omega-3': ['Omega-3', 'omega3_g'],
                                                'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                                            }} />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )
            }

            {showPicker && (
                <div className="w-full space-y-3 p-6 bg-gradient-to-b from-emerald-50 to-emerald-50/30 dark:from-slate-800/40 dark:to-slate-800/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/40 animate-in slide-in-from-top-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="font-black text-sm uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Search Ingredients</h3>
                            <p className="text-xs text-emerald-600/60 dark:text-emerald-300/50">Type to find and add items to your recipe</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowPicker(false);
                                setInlineSearchQuery('');
                                setInlineSearchResults([]);
                            }}
                            className="p-2 hover:bg-emerald-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors"
                        >
                            <CloseIcon size={18} />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Search for ingredients (e.g., chicken, spinach, olive oil)..."
                            value={inlineSearchQuery}
                            onChange={(e) => handleInlineSearch(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-3 border-2 border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400 transition-all text-sm font-medium"
                        />

                        {/* View Toggle (for admins) */}
                        {isAdmin && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setInlineSearchView('local');
                                        handleInlineSearch(inlineSearchQuery);
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        inlineSearchView === 'local'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-emerald-100/50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    Local Registry
                                </button>
                                <button
                                    onClick={() => {
                                        setInlineSearchView('usda');
                                        handleInlineSearch(inlineSearchQuery);
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                        inlineSearchView === 'usda'
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                            : 'bg-violet-100/50 dark:bg-slate-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    USDA Database
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {inlineSearchLoading && (
                            <div className="flex items-center justify-center py-8 gap-2 text-emerald-600 dark:text-emerald-400">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-medium">Searching...</span>
                            </div>
                        )}

                        {!inlineSearchLoading && inlineSearchQuery.length < 2 && (
                            <div className="text-center py-6 text-emerald-600/60 dark:text-emerald-300/50 text-xs font-medium">
                                Type at least 2 characters to search
                            </div>
                        )}

                        {!inlineSearchLoading && inlineSearchQuery.length >= 2 && inlineSearchResults.length === 0 && (
                            <div className="text-center py-6 text-emerald-600/60 dark:text-emerald-300/50 text-xs font-medium">
                                No results found for "{inlineSearchQuery}"
                            </div>
                        )}

                        {!inlineSearchLoading && inlineSearchResults.length > 0 && (
                            <div className="space-y-2">
                                {inlineSearchResults.map((item, idx) => (
                                    <button
                                        key={item.id || item.fdcId || idx}
                                        onClick={() => handleInlineSelectIngredient(item)}
                                        className="w-full text-left p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    <Apple size={14} className="text-slate-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                                    {item.common_name || item.name}
                                                </div>
                                                {item.common_name && (
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                        {item.name}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex gap-2">
                                                    <span>{Math.round(item.energy_kcal)} kcal</span>
                                                    <span>•</span>
                                                    <span>P: {item.protein_g?.toFixed(1)}g</span>
                                                    <span>F: {item.fat_g?.toFixed(1)}g</span>
                                                    <span>C: {item.carbs_g?.toFixed(1)}g</span>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={14} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NUTRIENT INFO MODAL */}
            {
                selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNutrientInfo(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedNutrientInfo(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><CloseIcon size={20} /></button>
                            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-tighter">{selectedNutrientInfo}</h3>
                            <p className="text-slate-500 italic mb-6 text-sm">"{nutrientInfo[selectedNutrientInfo].description}"</p>
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                    <h4 className="font-black text-[10px] mb-2 uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Biological Significance</h4>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{nutrientInfo[selectedNutrientInfo].importance}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {nutrientInfo[selectedNutrientInfo].benefits.map((b, i) => (
                                        <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-3 py-1.5 rounded-full">
                                            {b}
                                        </span>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="font-black text-[10px] mb-2 uppercase tracking-widest text-slate-400">Natural Sources</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {nutrientInfo[selectedNutrientInfo].sources.map((s, i) => (
                                            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-bold">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* NUTRIENT BREAKDOWN MODAL */}
            {
                breakdownNutrient && NUTRIENT_BREAKDOWNS[breakdownNutrient] && (
                    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBreakdownNutrient(null)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setBreakdownNutrient(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><CloseIcon size={20} /></button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg shadow-current/20",
                                    breakdownNutrient === 'Protein' ? "bg-red-100 text-red-600" :
                                        breakdownNutrient === 'Carbs' ? "bg-amber-100 text-amber-600" :
                                            breakdownNutrient === 'Fat' ? "bg-orange-100 text-orange-600" :
                                                "bg-emerald-100 text-emerald-600"
                                )}>
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">{breakdownNutrient}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Constituent Laboratory Analysis</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {NUTRIENT_BREAKDOWNS[breakdownNutrient].map(({ label, keys, unit, isEssential, hiddenByDefault, isExpandable }) => {
                                    if (hiddenByDefault && !expandedBreakdownSections['Sugars (Total)']) return null;

                                    const m = totals.micronutrients;
                                    let val = 0;
                                    for (const k of keys) {
                                        if (m[k] !== undefined) { val = m[k]; break; }
                                    }
                                    const isZero = val === 0;

                                    const activeColor = breakdownNutrient === 'Protein' ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50" :
                                        breakdownNutrient === 'Carbs' ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50" :
                                            breakdownNutrient === 'Fat' ? "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50" :
                                                "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50";

                                    const isExpanded = isExpandable && expandedBreakdownSections[label];

                                    return (
                                        <div
                                            key={label}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                                isZero ? "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60" : activeColor,
                                                hiddenByDefault ? "ml-8 border-l-4 border-l-current" : "",
                                                isExpandable ? "cursor-pointer hover:opacity-90 relative overflow-hidden" : ""
                                            )}
                                            onClick={() => {
                                                if (isExpandable) {
                                                    setExpandedBreakdownSections(prev => ({ ...prev, [label]: !prev[label] }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-2 w-2 rounded-full",
                                                    isZero ? "bg-slate-300 dark:bg-slate-700" :
                                                        breakdownNutrient === 'Protein' ? "bg-red-500" :
                                                            breakdownNutrient === 'Carbs' ? "bg-amber-500" :
                                                                breakdownNutrient === 'Fat' ? "bg-orange-500" :
                                                                    "bg-emerald-500"
                                                )} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("font-bold text-sm", isZero ? "text-slate-400" : "text-foreground")}>{label}</span>
                                                        {isExpandable && (
                                                            <ChevronDown className={cn("h-4 w-4 transition-transform opacity-50", isExpanded ? "rotate-180" : "")} />
                                                        )}
                                                    </div>
                                                    {isEssential && <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">Essential</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-lg font-black tabular-nums", isZero ? "text-slate-300" : "")}>
                                                    {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{unit}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
});

const IngredientBuilder = forwardRef<IngredientBuilderHandle, IngredientBuilderProps>((props, ref) => {
    return (
        <Suspense fallback={
            <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Initializing Protocol Lab...</p>
            </div>
        }>
            <IngredientBuilderContent {...props} ref={ref} />
        </Suspense>
    );
});

export default IngredientBuilder;
