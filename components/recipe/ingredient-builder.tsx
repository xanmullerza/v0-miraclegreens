"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Scale, Wand2, Sparkles, Loader2, Check, Apple, Pencil, Zap, X as CloseIcon, ChevronDown, Layers, Gem, Droplet, Battery, X } from 'lucide-react';
import FoodItemPicker from './food-item-picker';
import { fetchFoodMeasures, FoodMeasure } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

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
}

export interface RecipeIngredient {
    food_item_id: string;
    food_item_name: string;
    weight_g: number;
    quantity: number;
    measure_label: string;
    modifier?: string; // New field for prep state
    // Calculated nutrition
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    micronutrients: Record<string, number>;
    // Available measures
    available_measures?: FoodMeasure[];
    // Parsing state
    parsedGrams?: number;
    customUnitWeight?: number;
}

interface IngredientBuilderProps {
    ingredients: RecipeIngredient[];
    onChange: (ingredients: RecipeIngredient[]) => void;
}

export default function IngredientBuilder({ ingredients, onChange }: IngredientBuilderProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [showMagicPaste, setShowMagicPaste] = useState(false);
    const [magicText, setMagicText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [pendingIngredients, setPendingIngredients] = useState<any[]>([]);
    const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});

    const { energyUnit, setEnergyUnit } = useUserPreferences();
    const useKilojoules = energyUnit === 'kJ';

    const findNutrientMatch = (record: Record<string, any>, key: string) => {
        const mKeys = Object.keys(record);
        const kL = key.toLowerCase();
        const exact = mKeys.find(mk => mk.toLowerCase() === kL);
        if (exact) return exact;
        if (kL.includes('vitamin')) {
            const letter = kL.split(' ')[1]?.toLowerCase();
            if (letter && letter.length === 1) {
                const match = mKeys.find(mk => {
                    const mkL = mk.toLowerCase();
                    return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
                });
                if (match) return match;
            }
        }
        if (kL.startsWith('b') && /\b[b]\d+\b/.test(kL)) {
            const bNum = kL.split(' ')[0].toLowerCase();
            const match = mKeys.find(mk => {
                const mkL = mk.toLowerCase();
                return mkL.includes(bNum) || (kL.includes('thiamine') && mkL.includes('thiamine')) || (kL.includes('riboflavin') && mkL.includes('riboflavin'));
            });
            if (match) return match;
        }
        const firstWord = kL.split(' ')[0];
        if (firstWord.length > 3) {
            const fuzzy = mKeys.find(mk => mk.toLowerCase().includes(firstWord));
            if (fuzzy) return fuzzy;
        }
        return null;
    };

    const handleAddIngredient = async (foodItem: FoodItem | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string, modifier?: string }) => {
        // Fetch available measures
        let measures: FoodMeasure[] = [];
        let finalFoodItem = foodItem as any;

        // If it's a USDA item, we need to sync it or at least get measures
        if ('source' in foodItem && foodItem.source === 'usda' && foodItem.fdcId) {
            const usdaMeasures = await getUSDAMeasures(foodItem.fdcId);
            const syncedId = await syncToLocal(foodItem as FoodItemMatch, usdaMeasures);
            if (syncedId) {
                finalFoodItem = { ...foodItem, id: syncedId };
                measures = usdaMeasures;
            } else {
                measures = usdaMeasures;
            }
        } else if (foodItem.id) {
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

            const matchedMeasure = unitLower ? measures.find(m => {
                const labelLower = m.label.toLowerCase().replace(/s$/, '');
                return labelLower === unitLower ||
                    labelLower.includes(unitLower) ||
                    unitLower.includes(labelLower);
            }) : null;

            if (matchedMeasure) {
                // If we DON'T have a specific unit string already (manual add), use the matched label
                if (!unit) unit = matchedMeasure.label;

                // Only calculate weight from measure if we don't have parsed grams
                if (!hasParsedWeight) {
                    weight_g = quantity * matchedMeasure.weight_g;
                }
            } else if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'ml') {
                if (!hasParsedWeight) {
                    weight_g = quantity;
                }
                unit = 'g';
            } else if (unitLower === 'kg' || unitLower === 'kilogram') {
                if (!hasParsedWeight) {
                    weight_g = quantity * 1000;
                }
                unit = 'kg';
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
                weight_g = (unit === 'g' || unit === 'ml') ? quantity : (quantity * 100);
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

        const newIngredient: RecipeIngredient = {
            food_item_id: finalFoodItem.id || 'temp-id',
            food_item_name: finalFoodItem.common_name || finalFoodItem.name,
            weight_g,
            quantity,
            measure_label: unit,
            calories: Math.round(finalFoodItem.energy_kcal * multiplier),
            energy_kj: Math.round((finalFoodItem.energy_kj || (finalFoodItem.energy_kcal * 4.184)) * multiplier),
            protein: Math.round(finalFoodItem.protein_g * multiplier * 10) / 10,
            fat: Math.round(finalFoodItem.fat_g * multiplier * 10) / 10,
            carbs: Math.round(finalFoodItem.carbs_g * multiplier * 10) / 10,
            micronutrients: Object.entries(finalFoodItem.micronutrients || {}).reduce((acc, [key, val]) => {
                acc[key] = (val as number) * multiplier;
                return acc;
            }, {} as Record<string, number>),
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
                coreName = coreName.replace(/[,;:]\s*$/, '').trim();

                // 2. Search
                let localMatches = await searchLocalFood(coreName);
                let globalMatches: FoodItemMatch[] = [];

                // Fallback: If no results for core name, try full item if different
                if (localMatches.length === 0 && coreName !== rawItem) {
                    localMatches = await searchLocalFood(rawItem);
                }

                if (localMatches.length === 0) {
                    globalMatches = await searchUSDAFood(coreName);
                    if (globalMatches.length === 0 && coreName !== rawItem) {
                        globalMatches = await searchUSDAFood(rawItem);
                    }
                }

                const allMatches = [...localMatches, ...globalMatches];
                item.matches = allMatches;
                item.status = allMatches.length > 0 ? 'matched' : 'no-match';

                // 3. Smart Selection (Scoring)
                if (allMatches.length > 0) {
                    const queryWords = coreName.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                    let bestMatch = allMatches[0];
                    let maxMatches = 0;

                    for (const cand of allMatches) {
                        const candName = cand.name.toLowerCase();
                        let matches = 0;
                        queryWords.forEach((word: string) => {
                            if (candName.includes(word)) matches++;
                        });
                        // Bonus for exact core name match or starting with it
                        if (candName.startsWith(coreName.toLowerCase())) matches += 2;
                        if (candName === coreName.toLowerCase()) matches += 5;

                        if (matches > maxMatches) {
                            maxMatches = matches;
                            bestMatch = cand;
                        }
                    }
                    item.selectedMatch = bestMatch;
                }

                setPendingIngredients([...updatedPending]);
            }
        } catch (err) {
            console.error("Magic Parse Error:", err);
        } finally {
            setIsParsing(false);
        }
    };

    const confirmPendingIngredient = async (index: number) => {
        const item = pendingIngredients[index];
        if (!item.selectedMatch) return;

        // Resolve weight/quantity from raw parsing
        let weightG = item.raw.weightG;
        let amountStr = item.raw.amount || "";

        // Pre-clean internal "or" artifacts (e.g. "1 or 2" -> "1.5", "2 tspor" -> "2 tsp")
        amountStr = amountStr.replace(/or\b/gi, '').trim();

        // Basic amount evaluator for local use
        const evaluateLocalQty = (amt: string): number => {
            if (!amt) return 1;

            // Handle unicode fractions
            const unicodeFractions: Record<string, number> = {
                '¼': 0.25, '½': 0.5, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
            };
            for (const [char, val] of Object.entries(unicodeFractions)) {
                if (amt.includes(char)) {
                    const parts = amt.split(char);
                    const whole = parseFloat(parts[0].trim()) || 0;
                    return whole + val;
                }
            }

            const match = amt.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))/);
            if (!match) return 1;
            const val = match[1].trim();
            if (val.includes('/')) {
                if (val.includes(' ')) {
                    const [whole, frac] = val.split(' ');
                    const [num, den] = frac.split('/').map(n => parseFloat(n.trim()));
                    return parseFloat(whole) + (num / den);
                }
                const [num, den] = val.split('/').map(n => parseFloat(n.trim()));
                if (den) return num / den;
            }
            return parseFloat(val) || 1;
        };

        const qty = evaluateLocalQty(amountStr);
        // Better unit extraction: use cleaner string
        const unit = amountStr.replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();

        console.log(`[IngredientBuilder] Confirming: "${item.raw.item}"`, {
            rawWeightG: weightG,
            qty,
            unit,
            rawAmount: amountStr
        });

        await handleAddIngredient(item.selectedMatch, {
            weightG: weightG,
            quantity: qty,
            unit: unit,
            modifier: item.raw.modifier
        });

        // Remove from pending
        setPendingIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const rejectPendingIngredient = (index: number) => {
        setPendingIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, newQuantity: number) => {
        const updated = [...ingredients];
        const ing = updated[index];

        // Calculate new weight based on current measure or custom unit weight
        let newWeight = newQuantity;
        const currentWeightPerUnit = (ing.weight_g > 0 && ing.quantity > 0) ? (ing.weight_g / ing.quantity) : 0;

        if (ing.customUnitWeight) {
            newWeight = newQuantity * ing.customUnitWeight;
        } else if (ing.measure_label !== 'g' && ing.measure_label !== 'gram') {
            // Try to find in measures
            const measure = ing.available_measures?.find(m => m.label === ing.measure_label);
            if (measure) {
                newWeight = newQuantity * measure.weight_g;
            } else if (currentWeightPerUnit > 0) {
                // Use the weight-per-unit we already have
                newWeight = newQuantity * currentWeightPerUnit;
            } else {
                // Fallback to 1:1 if we truly have nothing to go on
                newWeight = newQuantity;
            }
        }

        const safeOldWeight = ing.weight_g || 1;
        const ratio = newWeight / safeOldWeight;

        updated[index] = {
            ...ing,
            quantity: newQuantity,
            weight_g: newWeight,
            calories: Math.round(ing.calories * ratio),
            energy_kj: Math.round(ing.energy_kj * ratio),
            protein: Math.round(ing.protein * ratio * 10) / 10,
            fat: Math.round(ing.fat * ratio * 10) / 10,
            carbs: Math.round(ing.carbs * ratio * 10) / 10,
            micronutrients: Object.entries(ing.micronutrients || {}).reduce((acc, [key, val]) => {
                acc[key] = (val as number) * ratio;
                return acc;
            }, {} as Record<string, number>),
        };

        onChange(updated);
    };

    const handleUpdateUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];

        // Recalculate weight based on new unit
        let newWeight = ing.weight_g;
        const newUnitLower = newUnit.toLowerCase().trim();

        if (newUnitLower === 'g' || newUnitLower === 'gram') {
            newWeight = ing.quantity;
        } else if (newUnitLower === 'kg' || newUnitLower === 'kilogram') {
            newWeight = ing.quantity * 1000;
        } else {
            const measure = ing.available_measures?.find(m => m.label.toLowerCase() === newUnitLower);
            if (measure) {
                newWeight = ing.quantity * measure.weight_g;
            }
        }

        const ratio = newWeight / (ing.weight_g || 1);

        updated[index] = {
            ...ing,
            measure_label: newUnit,
            weight_g: newWeight,
            calories: Math.round(ing.calories * ratio),
            energy_kj: Math.round(ing.energy_kj * ratio),
            protein: Math.round(ing.protein * ratio * 10) / 10,
            fat: Math.round(ing.fat * ratio * 10) / 10,
            carbs: Math.round(ing.carbs * ratio * 10) / 10,
            micronutrients: Object.entries(ing.micronutrients || {}).reduce((acc, [key, val]) => {
                acc[key] = (val as number) * ratio;
                return acc;
            }, {} as Record<string, number>),
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
        const ratio = newWeight / (ing.weight_g || 1);

        updated[index] = {
            ...ing,
            weight_g: newWeight,
            calories: Math.round(ing.calories * ratio),
            energy_kj: Math.round(ing.energy_kj * ratio),
            protein: Math.round(ing.protein * ratio * 10) / 10,
            fat: Math.round(ing.fat * ratio * 10) / 10,
            carbs: Math.round(ing.carbs * ratio * 10) / 10,
            micronutrients: Object.entries(ing.micronutrients || {}).reduce((acc, [key, val]) => {
                acc[key] = (val as number) * ratio;
                return acc;
            }, {} as Record<string, number>),
        };
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

    const userRDAs = useRDA(undefined, 'female', totals.calories); // Default RDA calc

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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Apple className="w-5 h-5 text-green-500 fill-green-500/20" />
                        Ingredients
                    </h3>
                    <div className="flex items-center bg-muted p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setEnergyUnit('kcal')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition ${energyUnit === 'kcal' ? 'bg-background shadow-sm text-green-700 dark:text-green-400' : 'text-muted-foreground'
                                }`}
                        >
                            kcal
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnergyUnit('kJ')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition ${energyUnit === 'kJ' ? 'bg-background shadow-sm text-green-700 dark:text-green-400' : 'text-muted-foreground'
                                }`}
                        >
                            kJ
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowMagicPaste(!showMagicPaste)}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-md group transition-all px-3 h-10 rounded-lg flex items-center justify-center gap-2 w-40 text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                    >
                        <Wand2 className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                        Magic Paste
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-md group transition-all px-3 h-10 rounded-lg flex items-center justify-center gap-2 w-40 text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        Add Ingredient
                    </button>
                </div>
            </div>

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
                                <span className="text-[10px] font-black uppercase text-amber-800/50">{pendingIngredients.length} Items Found</span>
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
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl shadow-sm">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-slate-800 truncate">
                                                {item.raw.amount} {item.raw.item}
                                            </div>
                                            <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                                                {item.status === 'searching' && (
                                                    <span className="text-slate-400 flex items-center gap-1">
                                                        <Loader2 size={10} className="animate-spin" /> Matching...
                                                    </span>
                                                )}
                                                {item.status === 'matched' && item.selectedMatch && (
                                                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                                                        <Check size={10} /> Matched: {item.selectedMatch.name}
                                                        <span className="text-[8px] opacity-60 uppercase">({item.selectedMatch.source})</span>
                                                    </span>
                                                )}
                                                {item.status === 'no-match' && (
                                                    <span className="text-red-500 font-bold">No match found</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.status === 'matched' && (
                                                <button
                                                    onClick={() => confirmPendingIngredient(idx)}
                                                    className="p-1.5 h-8 w-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                                                    title="Add to Recipe"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => rejectPendingIngredient(idx)}
                                                className="p-1.5 h-8 w-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition"
                                                title="Dismiss"
                                            >
                                                <CloseIcon size={14} />
                                            </button>
                                        </div>
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

            {ingredients.length === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-xl text-muted-foreground font-medium italic">
                    No ingredients added yet. Click "Add Ingredient" to get started.
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="space-y-3">
                    {ingredients.map((ing, index) => (
                        <div key={index} className="relative group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                            {/* Remove Button - Absolute Positioned */}
                            <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Left Section: Identity & Quick Macros */}
                                <div className="lg:col-span-4 space-y-4">
                                    <div className="flex items-center gap-2 group/name">
                                        {editingNameIndex === index ? (
                                            <input
                                                type="text"
                                                value={ing.food_item_name}
                                                onChange={(e) => handleUpdateName(index, e.target.value)}
                                                onBlur={() => setEditingNameIndex(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingNameIndex(null)}
                                                autoFocus
                                                className="bg-transparent border-b-2 border-emerald-500 font-black text-slate-900 dark:text-white px-0 py-1 text-lg w-full outline-none"
                                            />
                                        ) : (
                                            <>
                                                <h4 className="font-black text-slate-900 dark:text-white truncate text-lg">{ing.food_item_name}</h4>
                                                <button
                                                    onClick={() => setEditingNameIndex(index)}
                                                    className="p-1 opacity-0 group-hover/name:opacity-100 transition-opacity text-slate-400 hover:text-emerald-500"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={10} className="fill-current" />
                                            {useKilojoules ? ing.energy_kj : ing.calories} {useKilojoules ? 'kJ' : 'kcal'}
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">P: {ing.protein}g</div>
                                            <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">F: {ing.fat}g</div>
                                            <div className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">C: {ing.carbs}g</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Controls */}
                                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity</Label>
                                        <input
                                            type="number"
                                            value={ing.quantity}
                                            onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                                            className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            min="0"
                                            step="0.125"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Measure</Label>
                                        <div className="relative">
                                            <select
                                                value={ing.measure_label}
                                                onChange={(e) => handleUpdateUnit(index, e.target.value)}
                                                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="g">g</option>
                                                <option value="kg">kg</option>
                                                {ing.available_measures?.map(m => (
                                                    <option key={m.label} value={m.label}>{m.label}</option>
                                                ))}
                                                {/* If current label isn't in available, show it so it's selected */}
                                                {ing.measure_label !== 'g' && ing.measure_label !== 'kg' && !ing.available_measures?.some(m => m.label === ing.measure_label) && (
                                                    <option value={ing.measure_label}>{ing.measure_label}</option>
                                                )}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preparation</Label>
                                        <input
                                            type="text"
                                            value={ing.modifier || ''}
                                            onChange={(e) => handleUpdateModifier(index, e.target.value)}
                                            className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 text-xs rounded-xl font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                            placeholder="e.g. chopped"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight (g)</Label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={ing.weight_g % 1 === 0 ? ing.weight_g : Math.round(ing.weight_g * 10) / 10}
                                                onChange={(e) => handleUpdateWeight(index, Number(e.target.value))}
                                                step="0.1"
                                                className="w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none">G</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {
                ingredients.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-center mb-4">
                            <Button variant="outline" size="sm" onClick={() => setShowDetailedNutrients(!showDetailedNutrients)} className="gap-2 min-w-[200px] font-bold text-[10px] uppercase tracking-widest h-10 rounded-xl">
                                {showDetailedNutrients ? (
                                    <>Collapse Report <ChevronDown className="h-4 w-4 rotate-180" /></>
                                ) : (
                                    <>Expand Nutrient Report <ChevronDown className="h-4 w-4" /></>
                                )}
                            </Button>
                        </div>

                        {showDetailedNutrients && (
                            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                                {(() => {
                                    const m = totals.micronutrients;
                                    const getVal = (keys: string[]) => { for (const k of keys) if (m[k] !== undefined) return m[k]; return 0; };

                                    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, any[]>, icon: any, theme?: 'indigo' | 'rose', subtitle?: string }) => {
                                        const themes = {
                                            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" }
                                        };
                                        const t = themes[theme];

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
                                                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all", t.itemBorder, pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                <div className="flex items-baseline gap-1"><span className="text-lg font-bold">{val.toFixed(1)}</span><span className={cn("text-[10px] font-bold", (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12')) ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') ? 'µg' : 'mg'}</span></div>
                                                                {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
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
                                                            { label: 'Energy', val: totals.calories, target: 2000, unit: 'kcal' },
                                                            { label: 'Protein', val: totals.protein, target: 50, unit: 'g' },
                                                            { label: 'Carbs', val: totals.carbs, target: 250, unit: 'g' },
                                                            { label: 'Fat', val: totals.fat, target: 70, unit: 'g' },
                                                        ].map(macro => {
                                                            const pct = Math.round((macro.val / macro.target) * 100);
                                                            const styles = getNutrientLevelStyles(pct, macro.label);
                                                            return (
                                                                <div key={macro.label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", styles.borderLight, styles.fade)}>
                                                                    <div onClick={() => setSelectedNutrientInfo(macro.label)} className="cursor-pointer">
                                                                        <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{macro.label}</p>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-xl font-black">{Math.round(macro.val)}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-bold">{macro.unit}</span>
                                                                        </div>
                                                                        <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
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
                                                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-3 rounded-xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all", pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span>
                                                                    <span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitLabel}</span>
                                                                </div>
                                                                {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                                                <h4 className="font-black flex items-center gap-2 mb-1 text-emerald-400 uppercase tracking-widest text-[10px]"><Battery className="h-4 w-4" /> Stored Vitamins</h4>
                                                <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Fat-soluble storage (A, D, E, K)</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Vitamin A', keys: ['Vitamin A', 'vitamin_a_ug'], unit: 'µg', hasBreakdown: true },
                                                        { label: 'Vitamin D', keys: ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'], unit: 'IU', hasBreakdown: false },
                                                        { label: 'Vitamin E', keys: ['Vitamin E', 'vitamin_e_mg'], unit: 'mg', hasBreakdown: true },
                                                        { label: 'Vitamin K', keys: ['Vitamin K', 'vitamin_k_ug'], unit: 'µg', hasBreakdown: false },
                                                    ].map(({ label, keys, unit: unitLabel, hasBreakdown }) => {
                                                        const val = getVal(keys);
                                                        const rda = userRDAs?.[label];
                                                        const pct = rda ? Math.round((val / rda) * 100) : null;
                                                        const styles = getNutrientLevelStyles(pct || 0, label);
                                                        return (
                                                            <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-950 hover:shadow-md transition-all relative group", pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <div onClick={() => setSelectedNutrientInfo(label)} className="cursor-pointer">
                                                                    <p className="text-[10px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                    <div className="flex items-baseline gap-1"><span className="text-xl font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span><span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : unitLabel === 'IU' ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{unitLabel}</span></div>
                                                                    {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                                </div>
                                                                {hasBreakdown && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 opacity-60 group-hover:opacity-100 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all border border-emerald-200/50 dark:border-emerald-700/50"
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
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )
            }

            {
                showPicker && (
                    <FoodItemPicker
                        onSelect={handleAddIngredient}
                        onClose={() => setShowPicker(false)}
                    />
                )
            }

            {/* NUTRIENT INFO MODAL */}
            {selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNutrientInfo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedNutrientInfo(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={20} /></button>
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
            )}

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && NUTRIENT_BREAKDOWNS[breakdownNutrient] && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBreakdownNutrient(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBreakdownNutrient(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={20} /></button>

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
            )}
        </div >
    );
}
