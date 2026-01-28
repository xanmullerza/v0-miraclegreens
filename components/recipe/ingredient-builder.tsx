"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Scale, Wand2, Sparkles, Loader2, Check, Apple, Pencil, Zap, X as CloseIcon, ChevronDown } from 'lucide-react';
import FoodItemPicker from './food-item-picker';
import { fetchFoodMeasures, FoodMeasure } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

    const { energyUnit, setEnergyUnit } = useUserPreferences();
    const useKilojoules = energyUnit === 'kJ';

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
        (acc, ing) => ({
            calories: acc.calories + ing.calories,
            energy_kj: acc.energy_kj + ing.energy_kj,
            protein: acc.protein + ing.protein,
            fat: acc.fat + ing.fat,
            carbs: acc.carbs + ing.carbs,
        }),
        { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 }
    );

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
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="font-semibold text-green-900 dark:text-green-400 mb-2">Total Nutrition</div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">{useKilojoules ? 'Kilojoules' : 'Calories'}</div>
                                <div className="font-semibold text-lg text-foreground">
                                    {useKilojoules ? totals.energy_kj : totals.calories}
                                    <span className="text-xs ml-1 font-normal opacity-70">
                                        {useKilojoules ? 'kJ' : 'kcal'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Protein</div>
                                <div className="font-semibold text-lg text-foreground">{totals.protein.toFixed(1)}g</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Fat</div>
                                <div className="font-semibold text-lg text-foreground">{totals.fat.toFixed(1)}g</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Carbs</div>
                                <div className="font-semibold text-lg text-foreground">{totals.carbs.toFixed(1)}g</div>
                            </div>
                        </div>
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
        </div >
    );
}
