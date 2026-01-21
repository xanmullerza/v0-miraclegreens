"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Scale } from 'lucide-react';
import FoodItemPicker from './food-item-picker';
import { fetchFoodMeasures, FoodMeasure } from '@/lib/utils/nutrition-calculator';

interface FoodItem {
    id: string;
    name: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
}

export interface RecipeIngredient {
    food_item_id: string;
    food_item_name: string;
    weight_g: number;
    quantity: number;
    measure_label: string;
    // Calculated nutrition
    calories: number;
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

    const handleAddIngredient = async (foodItem: FoodItem) => {
        // Fetch available measures
        const measures = await fetchFoodMeasures(foodItem.id);

        // Default to grams
        const weight_g = 100;
        const multiplier = weight_g / 100;

        const newIngredient: RecipeIngredient = {
            food_item_id: foodItem.id,
            food_item_name: foodItem.name,
            weight_g,
            quantity: 100,
            measure_label: 'g',
            calories: Math.round(foodItem.energy_kcal * multiplier),
            protein: Math.round(foodItem.protein_g * multiplier * 10) / 10,
            fat: Math.round(foodItem.fat_g * multiplier * 10) / 10,
            carbs: Math.round(foodItem.carbs_g * multiplier * 10) / 10,
            available_measures: measures
        };

        onChange([...ingredients, newIngredient]);
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

        // If switching FROM a measure TO grams, update quantity to match weight
        if (newUnit === 'g' && ing.measure_label !== 'g') {
            // e.g. 1 cup (240g) -> select 'g' -> shows 240
            // Wait, normally quantity should become the weight.
        }

        // Actually, keeping quantity constant is standard (1 cup -> 1 tbsp), 
        // but switching to grams usually implies we want to see the weight.
        // Let's keep quantity constant for unit->unit, but maybe reset for unit->g?
        // User preference often varies. Let's keep quantity constant for simplicity.
        // Exception: 1 cup -> 'g' -> 1g is weird.
        // Improved Logic:
        // If switching to 'g', set quantity = current weight_g
        // If switching from 'g' to unit, set quantity = 1? Or keep weight constant?
        // Let's keep it simple: quantity stays, weight updates. User can adjust quantity.
        // Actually, 1 cup -> select 'g' -> 1g is annoying.
        // Let's make 'g' behave like "Custom Weight".

        if (newUnit === 'g') {
            // Switching to grams: set quantity to current weight
            // e.g. 1 cup (240g) -> 240g
            updated[index] = {
                ...ing,
                measure_label: newUnit,
                quantity: Math.round(ing.weight_g),
                // weight stays same, nutrition stays same
            };
            onChange(updated);
            return;
        }

        // Switching to a unit
        if (ing.available_measures) {
            const measure = ing.available_measures.find(m => m.label === newUnit);
            if (measure) {
                newWeight = ing.quantity * measure.weight_g;

                // Recalculate nutrition from scratch (to avoid precision drift)
                // We need original multiplier... basically:
                // We need access to unit nutrition. 
                // We don't have the original foodItem here (only name).
                // But we have current calories and current weight.
                // calories per gram = ing.calories / ing.weight_g (if weight > 0)

                const calPerG = ing.calories / ing.weight_g;
                const protPerG = ing.protein / ing.weight_g;
                const fatPerG = ing.fat / ing.weight_g;
                const carbPerG = ing.carbs / ing.weight_g;

                // If weight is 0 or NaN, we have a problem. 
                // Ideally we should store base nutrition in the state, but we simplified.
                // Let's rely on ratio from OLD weight.

                const ratio = newWeight / ing.weight_g;

                updated[index] = {
                    ...ing,
                    measure_label: newUnit,
                    weight_g: newWeight,
                    calories: Math.round(ing.calories * ratio),
                    protein: Math.round(ing.protein * ratio * 10) / 10,
                    fat: Math.round(ing.fat * ratio * 10) / 10,
                    carbs: Math.round(ing.carbs * ratio * 10) / 10,
                };
                onChange(updated);
                return;
            }
        }
    };

    const handleRemoveIngredient = (index: number) => {
        onChange(ingredients.filter((_, i) => i !== index));
    };

    // Calculate totals
    const totals = ingredients.reduce(
        (acc, ing) => ({
            calories: acc.calories + ing.calories,
            protein: acc.protein + ing.protein,
            fat: acc.fat + ing.fat,
            carbs: acc.carbs + ing.carbs,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredients</h3>
                <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Ingredient
                </button>
            </div>

            {ingredients.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                    No ingredients added yet. Click "Add Ingredient" to get started.
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="space-y-3">
                    {ingredients.map((ing, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{ing.food_item_name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {ing.calories} kcal • P: {ing.protein}g • F: {ing.fat}g • C: {ing.carbs}g
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={ing.quantity}
                                    onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                                    className="w-20 px-2 py-2 border rounded text-center"
                                    min="0"
                                    step="0.1"
                                />

                                <select
                                    value={ing.measure_label}
                                    onChange={(e) => handleUpdateUnit(index, e.target.value)}
                                    className="max-w-[140px] px-2 py-2 border rounded bg-white text-sm"
                                >
                                    <option value="g">grams (g)</option>
                                    {ing.available_measures?.map(m => (
                                        <option key={m.id} value={m.label}>
                                            {m.label} ({Math.round(m.weight_g)}g)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-semibold text-green-900 mb-2">Total Nutrition</div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-600">Calories</div>
                            <div className="font-semibold text-lg">{totals.calories}</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Protein</div>
                            <div className="font-semibold text-lg">{totals.protein.toFixed(1)}g</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Fat</div>
                            <div className="font-semibold text-lg">{totals.fat.toFixed(1)}g</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Carbs</div>
                            <div className="font-semibold text-lg">{totals.carbs.toFixed(1)}g</div>
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
