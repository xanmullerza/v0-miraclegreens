"use client";

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import FoodItemPicker from './food-item-picker';

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
}

interface IngredientBuilderProps {
    ingredients: RecipeIngredient[];
    onChange: (ingredients: RecipeIngredient[]) => void;
}

export default function IngredientBuilder({ ingredients, onChange }: IngredientBuilderProps) {
    const [showPicker, setShowPicker] = useState(false);

    const handleAddIngredient = (foodItem: FoodItem) => {
        // Default to 100g
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
        };

        onChange([...ingredients, newIngredient]);
    };

    const handleUpdateWeight = (index: number, newWeight: number) => {
        const updated = [...ingredients];
        const ing = updated[index];

        // Recalculate nutrition based on new weight
        // We need to fetch the original food item data
        // For now, we'll use the ratio
        const ratio = newWeight / ing.weight_g;

        updated[index] = {
            ...ing,
            weight_g: newWeight,
            quantity: newWeight,
            calories: Math.round(ing.calories * ratio),
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
                        <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">{ing.food_item_name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {ing.calories} kcal • P: {ing.protein}g • F: {ing.fat}g • C: {ing.carbs}g
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={ing.weight_g}
                                    onChange={(e) => handleUpdateWeight(index, Number(e.target.value))}
                                    className="w-20 px-2 py-1 border rounded text-center"
                                    min="1"
                                />
                                <span className="text-sm text-gray-600">g</span>
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
