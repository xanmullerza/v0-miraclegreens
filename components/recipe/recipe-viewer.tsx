"use client";

import { useEffect, useState } from 'react';
import { fetchRecipeWithNutrition, scaleNutrition, CalculatedNutrition } from '@/lib/utils/nutrition-calculator';
import { Clock, Users, Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;

interface RecipeViewerProps {
    recipeId: string;
}

export default function RecipeViewer({ recipeId }: RecipeViewerProps) {
    const [recipe, setRecipe] = useState<any>(null);
    const [servings, setServings] = useState(1);
    const [loading, setLoading] = useState(true);
    const { energyUnit } = useUserPreferences();

    useEffect(() => {
        const loadRecipe = async () => {
            try {
                const data = await fetchRecipeWithNutrition(recipeId);
                setRecipe(data);
                setServings(data.servings || 1);
            } catch (error) {
                console.error('Error loading recipe:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRecipe();
    }, [recipeId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading recipe...</div>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Recipe not found</div>
            </div>
        );
    }

    // Calculate nutrition per serving
    const nutrition: CalculatedNutrition = recipe.calculated_nutrition || {
        calories: recipe.calories,
        protein: recipe.protein,
        fat: recipe.fat,
        carbs: recipe.carbs,
    };

    const perServing = scaleNutrition(nutrition, recipe.servings, 1);
    const forSelectedServings = scaleNutrition(nutrition, recipe.servings, servings);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.prep_time} min
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {recipe.servings} servings
                    </div>
                    <div className="capitalize px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {recipe.type}
                    </div>
                </div>
                {recipe.diet && recipe.diet.length > 0 && (
                    <div className="flex gap-2 mt-2">
                        {recipe.diet.map((d: string) => (
                            <span key={d} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {d}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Nutrition Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-green-900">Nutrition Facts</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-green-700">Servings:</label>
                        <input
                            type="number"
                            value={servings}
                            onChange={(e) => setServings(Number(e.target.value))}
                            min="1"
                            className="w-16 px-2 py-1 border border-green-300 rounded text-center bg-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center">
                        <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                            {energyUnit === 'kJ'
                                ? Math.round(forSelectedServings.calories * CAL_TO_KJ).toLocaleString()
                                : forSelectedServings.calories.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">{energyUnit === 'kJ' ? 'Kilojoules' : 'Calories'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {energyUnit === 'kJ'
                                ? Math.round(perServing.calories * CAL_TO_KJ)
                                : perServing.calories} {energyUnit}/serving
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 text-center">
                        <Beef className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{forSelectedServings.protein}g</div>
                        <div className="text-xs text-gray-600">Protein</div>
                        <div className="text-xs text-gray-500 mt-1">{perServing.protein}g/serving</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 text-center">
                        <Droplet className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{forSelectedServings.fat}g</div>
                        <div className="text-xs text-gray-600">Fat</div>
                        <div className="text-xs text-gray-500 mt-1">{perServing.fat}g/serving</div>
                    </div>

                    <div className="bg-white rounded-lg p-4 text-center">
                        <Wheat className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">{forSelectedServings.carbs}g</div>
                        <div className="text-xs text-gray-600">Carbs</div>
                        <div className="text-xs text-gray-500 mt-1">{perServing.carbs}g/serving</div>
                    </div>
                </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-2">
                    {recipe.ingredients?.map((ing: any, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <span className="text-green-600 mt-1">•</span>
                            <div className="flex-1">
                                <span className="font-medium">{ing.amount}</span> {ing.item}
                                {ing.food_item && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {Math.round((ing.food_item.energy_kcal * ing.weight_g) / 100)} kcal
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <ol className="space-y-4">
                    {recipe.instructions
                        ?.sort((a: any, b: any) => a.step_order - b.step_order)
                        .map((instruction: any, index: number) => (
                            <li key={instruction.id} className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                                    {index + 1}
                                </div>
                                <p className="flex-1 text-gray-700 pt-1">{instruction.step_text}</p>
                            </li>
                        ))}
                </ol>
            </div>
        </div>
    );
}
