"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient } from '@/components/recipe/ingredient-builder';
import { ChefHat, Clock, Users, Save } from 'lucide-react';

export default function CreateRecipePage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [prepTime, setPrepTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [diet, setDiet] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [saving, setSaving] = useState(false);

    const handleAddInstruction = () => {
        setInstructions([...instructions, '']);
    };

    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...instructions];
        updated[index] = value;
        setInstructions(updated);
    };

    const handleRemoveInstruction = (index: number) => {
        setInstructions(instructions.filter((_, i) => i !== index));
    };

    const toggleDiet = (dietType: string) => {
        setDiet(prev =>
            prev.includes(dietType)
                ? prev.filter(d => d !== dietType)
                : [...prev, dietType]
        );
    };

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i.trim()).length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setSaving(true);

        try {
            // Calculate total nutrition
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

            // Generate recipe ID
            const recipeId = `recipe-${Date.now()}`;

            // Create recipe record
            // Note: energy_kj is included, but requires the DB column to exist.
            // If the insert fails due to missing column, we'll catch it.
            const { error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    id: recipeId,
                    title,
                    type,
                    calories: Math.round(totals.calories),
                    energy_kj: Math.round(totals.energy_kj),
                    protein: Math.round(totals.protein),
                    fat: Math.round(totals.fat),
                    carbs: Math.round(totals.carbs),
                    diet,
                    prep_time: prepTime,
                    servings,
                });

            if (recipeError) {
                console.warn('Recipe insert error (checking for missing energy_kj):', recipeError);
                // Fallback: try without energy_kj if column doesn't exist
                if (recipeError.code === '42703') { // undefined_column
                    const { error: retryError } = await supabase
                        .from('recipes')
                        .insert({
                            id: recipeId,
                            title,
                            type,
                            calories: Math.round(totals.calories),
                            protein: Math.round(totals.protein),
                            fat: Math.round(totals.fat),
                            carbs: Math.round(totals.carbs),
                            diet,
                            prep_time: prepTime,
                            servings,
                        });
                    if (retryError) throw new Error(`Recipes error (retry): ${retryError.message}`);
                } else {
                    throw new Error(`Recipes error: ${recipeError.message}`);
                }
            }

            // Insert ingredients
            const ingredientsData = ingredients.map(ing => ({
                recipe_id: recipeId,
                food_item_id: ing.food_item_id,
                item: ing.food_item_name,
                amount: `${ing.weight_g}g`,
                weight_g: ing.weight_g,
                quantity: ing.quantity,
                measure_label: ing.measure_label,
                base_ingredient: ing.food_item_name,
            }));

            const { error: ingredientsError } = await supabase
                .from('ingredients')
                .insert(ingredientsData);

            if (ingredientsError) {
                throw new Error(`Ingredients error: ${ingredientsError.message}`);
            }

            // Insert instructions
            const instructionsData = instructions
                .filter(step => step.trim())
                .map((step, index) => ({
                    recipe_id: recipeId,
                    step_text: step,
                    step_order: index + 1,
                }));

            const { error: instructionsError } = await supabase
                .from('instructions')
                .insert(instructionsData);

            if (instructionsError) {
                throw new Error(`Instructions error: ${instructionsError.message}`);
            }

            // Success!
            alert('Recipe created successfully!');
            router.push('/plan');
        } catch (error: any) {
            console.error('Error creating recipe:', error);
            alert(`Failed to create recipe: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <ChefHat className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-foreground">Create New Recipe</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Build your recipe with precise nutrition tracking using our food database
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-4 text-foreground">
                        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Recipe Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Grilled Chicken with Roasted Vegetables"
                                className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Meal Type *
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Prep Time (min)
                                </label>
                                <input
                                    type="number"
                                    value={prepTime}
                                    onChange={(e) => setPrepTime(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Servings
                                </label>
                                <input
                                    type="number"
                                    value={servings}
                                    onChange={(e) => setServings(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-3">
                                Dietary Suitability *
                            </label>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    { id: 'balanced', label: 'Balanced (Omnivore)', tags: [] },
                                    { id: 'vegetarian', label: 'Vegetarian', tags: ['vegetarian'] },
                                    { id: 'vegan', label: 'Vegan', tags: ['vegan', 'vegetarian'] }
                                ].map(option => {
                                    const isSelected = option.id === 'balanced'
                                        ? (!diet.includes('vegan') && !diet.includes('vegetarian'))
                                        : (option.id === 'vegan' ? diet.includes('vegan') : (diet.includes('vegetarian') && !diet.includes('vegan')));

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => {
                                                // Clear primary tags and set new ones
                                                const others = diet.filter(d => d !== 'vegan' && d !== 'vegetarian');
                                                setDiet([...others, ...option.tags]);
                                            }}
                                            className={`p-3 rounded-lg border-2 text-sm font-bold transition flex items-center justify-center text-center ${isSelected
                                                ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Additional Tags (Optional)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['gluten-free', 'dairy-free', 'low-carb', 'nut-free', 'high-protein'].map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleDiet(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${diet.includes(tag)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Ingredients */}
                    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                        <IngredientBuilder
                            ingredients={ingredients}
                            onChange={setIngredients}
                        />
                    </div>

                    {/* Instructions */}
                    <div className="bg-card border border-border rounded-lg shadow-sm p-6 space-y-4 text-foreground">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Instructions</h3>
                            <button
                                type="button"
                                onClick={handleAddInstruction}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                + Add Step
                            </button>
                        </div>

                        <div className="space-y-3">
                            {instructions.map((step, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <textarea
                                        value={step}
                                        onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                        placeholder={`Step ${index + 1}...`}
                                        className="flex-1 px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                        rows={2}
                                    />
                                    {instructions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInstruction(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Recipe'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
