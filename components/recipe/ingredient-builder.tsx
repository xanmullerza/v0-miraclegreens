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
    const [useKilojoules, setUseKilojoules] = useState(false);

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
            energy_kj: Math.round((foodItem.energy_kj || (foodItem.energy_kcal * 4.184)) * multiplier),
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
                const ratio = newWeight / ing.weight_g;

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
                            onClick={() => setUseKilojoules(false)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition ${!useKilojoules ? 'bg-background shadow-sm text-green-700 dark:text-green-400' : 'text-muted-foreground'
                                }`}
                        >
                            kcal
                        </button>
                        <button
                            type="button"
                            onClick={() => setUseKilojoules(true)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition ${useKilojoules ? 'bg-background shadow-sm text-green-700 dark:text-green-400' : 'text-muted-foreground'
                                }`}
                        >
                            kJ
                        </button>
                    </div>
                </div>
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
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                    No ingredients added yet. Click "Add Ingredient" to get started.
                </div>
            )}

            {ingredients.length > 0 && (
                <div className="space-y-3">
                    {ingredients.map((ing, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border border-border rounded-lg bg-card/50">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">{ing.food_item_name}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {useKilojoules ? ing.energy_kj : ing.calories} {useKilojoules ? 'kJ' : 'kcal'} • P: {ing.protein}g • F: {ing.fat}g • C: {ing.carbs}g
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={ing.quantity}
                                    onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                                    className="w-20 px-2 py-2 border border-border bg-background text-foreground rounded text-center"
                                    min="0"
                                    step="0.1"
                                />

                                <select
                                    value={ing.measure_label}
                                    onChange={(e) => handleUpdateUnit(index, e.target.value)}
                                    className="max-w-[140px] px-2 py-2 border border-border bg-background text-foreground text-sm"
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
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
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
