"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Scale, Wand2, Sparkles, Loader2, Check, X as CloseIcon } from 'lucide-react';
import FoodItemPicker from './food-item-picker';
import { fetchFoodMeasures, FoodMeasure } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { parseIngredientsOnly } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { cn } from '@/lib/utils';

interface FoodItem {
    id?: string;
    name: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    energy_kj?: number;
}

export interface RecipeIngredient {
    food_item_id: string;
    food_item_name: string;
    weight_g: number;
    quantity: number;
    measure_label: string;
    // Calculated nutrition
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    // Available measures
    available_measures?: FoodMeasure[];
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

    const { energyUnit, setEnergyUnit } = useUserPreferences();
    const useKilojoules = energyUnit === 'kJ';

    const handleAddIngredient = async (foodItem: FoodItem | FoodItemMatch, initialValues?: { weightG?: number, quantity?: number, unit?: string }) => {
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

        // If no unit provided, default to 'g' if we have weightG, otherwise try to find a natural measure
        if (!unit && weight_g > 0) {
            unit = 'g';
        }

        // Matching logic
        if (measures.length > 0) {
            const unitLower = unit.toLowerCase().replace(/\s*\(.*\)$/, '').replace(/s$/, '').trim(); // singularized unit

            const matchedMeasure = unitLower ? measures.find(m => {
                const labelLower = m.label.toLowerCase().replace(/s$/, '');
                return labelLower === unitLower ||
                    labelLower.includes(unitLower) ||
                    unitLower.includes(labelLower);
            }) : null;

            if (matchedMeasure) {
                unit = matchedMeasure.label;
                weight_g = quantity * matchedMeasure.weight_g;
            } else if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'ml') {
                weight_g = quantity;
                unit = 'g';
            } else if (unitLower === 'kg' || unitLower === 'kilogram') {
                weight_g = quantity * 1000;
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
                    unit = natural.label;
                    weight_g = quantity * natural.weight_g;
                } else {
                    // Safety fallback: only use first measure if it looks like a single portion
                    const first = measures[0];
                    if (first && (first.weight_g < 150 || quantity < 1)) {
                        unit = first.label;
                        weight_g = quantity * (first.weight_g || 1);
                    } else {
                        unit = 'g';
                        weight_g = weight_g || (quantity > 10 ? quantity : 100);
                    }
                }
            } else {
                // Unknown unit provided (e.g. "handful"), fallback to first measure
                const first = measures[0];
                if (first) {
                    unit = first.label;
                    weight_g = quantity * (first.weight_g || 1);
                }
            }
        } else {
            // No measures in DB
            if (!unit) unit = 'g';
            if (weight_g === 0) {
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
            food_item_name: finalFoodItem.name,
            weight_g,
            quantity,
            measure_label: unit,
            calories: Math.round(finalFoodItem.energy_kcal * multiplier),
            energy_kj: Math.round((finalFoodItem.energy_kj || (finalFoodItem.energy_kcal * 4.184)) * multiplier),
            protein: Math.round(finalFoodItem.protein_g * multiplier * 10) / 10,
            fat: Math.round(finalFoodItem.fat_g * multiplier * 10) / 10,
            carbs: Math.round(finalFoodItem.carbs_g * multiplier * 10) / 10,
            available_measures: measures
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
                const query = item.raw.item;

                // 1. Local Search
                const localMatches = await searchLocalFood(query);

                // 2. Global Search if needed
                let globalMatches: FoodItemMatch[] = [];
                if (localMatches.length === 0) {
                    globalMatches = await searchUSDAFood(query);
                }

                item.matches = [...localMatches, ...globalMatches];
                item.status = item.matches.length > 0 ? 'matched' : 'no-match';
                if (item.matches.length > 0) {
                    item.selectedMatch = item.matches[0];
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
        // Better unit extraction: remove the quantity part and keep the rest
        const unit = amountStr.replace(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[\d\s¼½¾⅛⅜⅝⅞/.]+))\s*/, '').trim();

        await handleAddIngredient(item.selectedMatch, {
            weightG: weightG,
            quantity: qty,
            unit: unit
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

        // Calculate new weight based on current measure
        let newWeight = newQuantity;

        if (ing.measure_label !== 'g' && ing.available_measures) {
            const measure = ing.available_measures.find(m => m.label === ing.measure_label);
            if (measure) {
                newWeight = newQuantity * measure.weight_g;
            }
        }

        const ratio = newWeight / ing.weight_g;

        updated[index] = {
            ...ing,
            quantity: newQuantity,
            weight_g: newWeight,
            calories: Math.round(ing.calories * ratio),
            energy_kj: Math.round(ing.energy_kj * ratio),
            protein: Math.round(ing.protein * ratio * 10) / 10,
            fat: Math.round(ing.fat * ratio * 10) / 10,
            carbs: Math.round(ing.carbs * ratio * 10) / 10,
        };

        onChange(updated);
    };

    const handleUpdateUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];

        // Calculate new weight
        let newWeight = ing.quantity; // Default if switching to grams (quantity = weight)

        if (newUnit !== 'g' && ing.available_measures) {
            const measure = ing.available_measures.find(m => m.label === newUnit);
            if (measure) {
                newWeight = ing.quantity * measure.weight_g;
            }
        }

        if (newUnit === 'g') {
            updated[index] = {
                ...ing,
                measure_label: newUnit,
                quantity: Math.round(ing.weight_g),
            };
            onChange(updated);
            return;
        }

        // Switching to a unit
        if (ing.available_measures) {
            const measure = ing.available_measures.find(m => m.label === newUnit);
            if (measure) {
                newWeight = ing.quantity * measure.weight_g;
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
                };
                onChange(updated);
                return;
            }
        }
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
        };
        onChange(updated);
    };

    const handleRemoveIngredient = (index: number) => {
        onChange(ingredients.filter((_, i) => i !== index));
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
                    <h3 className="text-lg font-semibold text-foreground">Ingredients</h3>
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
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition shadow-md shadow-amber-200"
                    >
                        <Wand2 className="w-4 h-4" />
                        Magic Paste
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Manually
                    </button>
                </div>
            </div>

            {showMagicPaste && (
                <div className="p-6 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-800 font-bold uppercase tracking-widest text-xs">
                            <Sparkles className="w-4 h-4" />
                            Magic Ingredient Import
                        </div>
                        <button onClick={() => setShowMagicPaste(false)} className="text-amber-800/50 hover:text-amber-800">
                            <CloseIcon size={16} />
                        </button>
                    </div>

                    {pendingIngredients.length === 0 ? (
                        <div className="space-y-4">
                            <p className="text-xs text-amber-900/60 leading-relaxed font-medium">
                                Paste your list of ingredients here. We'll attempt to match each one to our nutritional database automatically.
                            </p>
                            <textarea
                                value={magicText}
                                onChange={(e) => setMagicText(e.target.value)}
                                placeholder="Example:&#10;2 cups raw spinach&#10;500g chicken breast"
                                className="w-full h-32 p-4 text-sm border border-amber-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-amber-100 rounded-xl shadow-sm">
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
                                <div className="pt-4 border-t border-amber-100 flex justify-between items-center">
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
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                    No ingredients added yet. Click "Add Ingredient" to get started.
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="space-y-3">
                    {ingredients.map((ing, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-border rounded-xl bg-card/50 shadow-sm transition-all hover:border-green-200">
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-foreground truncate text-base">{ing.food_item_name}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                    <span className="font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">
                                        {useKilojoules ? ing.energy_kj : ing.calories} {useKilojoules ? 'kJ' : 'kcal'}
                                    </span>
                                    <span>P: {ing.protein}g</span>
                                    <span>F: {ing.fat}g</span>
                                    <span>C: {ing.carbs}g</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-tighter ml-1">Qty</span>
                                    <input
                                        type="number"
                                        value={ing.quantity}
                                        onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                                        className="w-14 px-1.5 py-2 border border-border bg-background text-foreground rounded-lg text-center text-sm font-bold focus:ring-2 focus:ring-green-500/20 outline-none"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>

                                <div className="flex flex-col gap-1 flex-1 md:flex-none">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-tighter ml-1">Unit</span>
                                    <select
                                        value={ing.measure_label}
                                        onChange={(e) => handleUpdateUnit(index, e.target.value)}
                                        className="min-w-[100px] max-w-[160px] px-2 py-2 border border-border bg-background text-foreground text-sm rounded-lg font-medium focus:ring-2 focus:ring-green-500/20 outline-none"
                                    >
                                        <option value="g">grams (g)</option>
                                        {ing.available_measures?.map((m, mi) => {
                                            const label = m.label.toLowerCase();
                                            let displayLabel = m.label;

                                            if (label === 'portion' || /^\d+$/.test(label)) {
                                                displayLabel = m.weight_g >= 100 ? 'Standard Serving' : 'Small Portion';
                                            }

                                            return (
                                                <option key={mi} value={m.label}>
                                                    {displayLabel} ({Math.round(m.weight_g)}g)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-tighter ml-1">Weight</span>
                                    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border border-border rounded-lg group hover:border-green-500/50 transition-colors">
                                        <input
                                            type="number"
                                            value={Math.round(ing.weight_g)}
                                            onChange={(e) => handleUpdateWeight(index, Number(e.target.value))}
                                            className="w-10 bg-transparent border-none text-sm font-black text-center focus:ring-0 p-0 outline-none"
                                        />
                                        <span className="text-[10px] font-black opacity-30 group-hover:opacity-100 transition-opacity">G</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all self-end mb-0.5"
                                    title="Remove"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
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
            )}

            {showPicker && (
                <FoodItemPicker
                    onSelect={handleAddIngredient}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
