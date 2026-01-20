
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Search,
    Save,
    ArrowRight,
    Check,
    AlertCircle,
    Loader2,
    ChefHat,
    Scale,
    Clock,
    Beef,
    Utensils,
    Leaf
} from 'lucide-react';
import {
    searchLocalFood,
    searchUSDAFood,
    getUSDAMeasures,
    syncToLocal,
    FoodItemMatch,
    FoodMeasure
} from '@/lib/services/nutrition';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Recipe, Ingredient, MealType, DietType } from '@/lib/data/recipes';

// Simplified UI Components for the uploader
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

export default function RecipeUploaderPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [mealType, setMealType] = useState<MealType>('breakfast');
    const [diet, setDiet] = useState<DietType[]>(['anything']);
    const [prepTime, setPrepTime] = useState(15);
    const [servings, setServings] = useState(1);
    const [image, setImage] = useState('');

    const [ingredients, setIngredients] = useState<(Ingredient & { matchedFood?: FoodItemMatch, selectedMeasure?: FoodMeasure })[]>([
        { item: '', amount: '', weightG: 0, isMiracleProduct: false }
    ]);
    const [instructions, setInstructions] = useState<string[]>(['']);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItemMatch[]>([]);
    const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);
    const [searching, setSearching] = useState(false);
    const [measures, setMeasures] = useState<FoodMeasure[]>([]);

    // Add/Remove dynamic rows
    const addIngredient = () => setIngredients([...ingredients, { item: '', amount: '', weightG: 0, isMiracleProduct: false }]);
    const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));

    const addInstruction = () => setInstructions([...instructions, '']);
    const removeInstruction = (idx: number) => setInstructions(instructions.filter((_, i) => i !== idx));

    // Search logic with simple debounce
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedQuery) {
                performSearch(debouncedQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [debouncedQuery]);

    const performSearch = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // First search local
            const local = await searchLocalFood(query);
            // Then search USDA
            const usda = await searchUSDAFood(query);
            setSearchResults([...local, ...usda]);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setDebouncedQuery(query);
    };

    const selectFood = async (food: FoodItemMatch) => {
        if (activeIngredientIndex === null) return;

        setLoading(true);
        let foodMeasures: FoodMeasure[] = [];

        if (food.source === 'usda' && food.fdcId) {
            foodMeasures = await getUSDAMeasures(food.fdcId);
        } else if (food.id) {
            // Fetch local measures
            const { data } = await supabase.from('food_measures').select('label, weight_g').eq('food_item_id', food.id);
            foodMeasures = (data || []).map(m => ({ label: m.label, weight_g: m.weight_g }));
        }

        setMeasures(foodMeasures);

        const newIngs = [...ingredients];

        // Auto-detect weight from amount string (e.g., "200g", "0.5kg")
        let autoWeight = 0;
        const amount = (newIngs[activeIngredientIndex].amount || "").toLowerCase();
        if (amount.includes('kg')) {
            autoWeight = parseFloat(amount) * 1000;
        } else if (amount.includes('g')) {
            autoWeight = parseFloat(amount);
        } else if (amount.includes('ml')) {
            autoWeight = parseFloat(amount); // Estimate 1:1 for now
        }

        newIngs[activeIngredientIndex] = {
            ...newIngs[activeIngredientIndex],
            matchedFood: food,
            baseIngredient: food.name,
            weightG: autoWeight || newIngs[activeIngredientIndex].weightG
        };
        setIngredients(newIngs);
        setLoading(false);
    };

    const selectMeasure = (measure: FoodMeasure) => {
        if (activeIngredientIndex === null) return;
        const newIngs = [...ingredients];
        const ing = newIngs[activeIngredientIndex];

        // Calculate total weight (quantity * measure weight)
        const quantity = parseFloat(ing.amount) || 1;
        const weightG = quantity * measure.weight_g;

        newIngs[activeIngredientIndex] = {
            ...ing,
            selectedMeasure: measure,
            weightG: weightG
        };
        setIngredients(newIngs);
    };

    const calculateTotalNutrition = () => {
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, micronutrients: {} as Record<string, number> };
        ingredients.forEach(ing => {
            if (ing.matchedFood && ing.weightG) {
                const ratio = ing.weightG / 100;
                totals.calories += (ing.matchedFood.energy_kcal || 0) * ratio;
                totals.protein += (ing.matchedFood.protein_g || 0) * ratio;
                totals.carbs += (ing.matchedFood.carbs_g || 0) * ratio;
                totals.fat += (ing.matchedFood.fat_g || 0) * ratio;

                // Aggregate micronutrients
                if (ing.matchedFood.micronutrients) {
                    Object.entries(ing.matchedFood.micronutrients).forEach(([key, val]) => {
                        totals.micronutrients[key] = (totals.micronutrients[key] || 0) + val * ratio;
                    });
                }
            }
        });
        return totals;
    };

    const saveRecipe = async () => {
        setLoading(true);
        try {
            // 1. Ensure all USDA foods are synced to local
            const ingredientData = [];
            for (const ing of ingredients) {
                if (!ing.matchedFood) continue;

                let foodItemId = ing.matchedFood.id;
                if (ing.matchedFood.source === 'usda') {
                    // Sync to local first
                    const syncedId = await syncToLocal(ing.matchedFood, measures);
                    if (syncedId) foodItemId = syncedId;
                }

                ingredientData.push({
                    item: ing.item,
                    amount: ing.amount,
                    food_item_id: foodItemId,
                    measure_label: ing.selectedMeasure?.label,
                    weight_g: ing.weightG,
                    base_ingredient: ing.baseIngredient
                });
            }

            const { calories, protein, carbs, fat } = calculateTotalNutrition();

            const recipeId = title.toLowerCase().replace(/\s+/g, '-');

            // 2. Insert Recipe
            const { error: recipeError } = await supabase.from('recipes').insert({
                id: recipeId,
                title,
                type: mealType,
                diet,
                calories: Math.round(calories / servings),
                protein: Math.round(protein / servings),
                carbs: Math.round(carbs / servings),
                fat: Math.round(fat / servings),
                image,
                prep_time: prepTime,
                servings: servings
            });

            if (recipeError) throw recipeError;

            // 3. Insert Ingredients
            const { error: ingError } = await supabase.from('ingredients').insert(
                ingredientData.map(i => ({ ...i, recipe_id: recipeId }))
            );

            if (ingError) throw ingError;

            // 4. Insert Instructions
            const { error: instError } = await supabase.from('instructions').insert(
                instructions.map((text, idx) => ({
                    recipe_id: recipeId,
                    step_text: text,
                    step_order: idx + 1
                }))
            );

            if (instError) throw instError;

            alert('Recipe uploaded successfully!');
            // Reset state or redirect
        } catch (err) {
            console.error(err);
            alert('Error saving recipe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <ChefHat size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Recipe Uploader</h1>
                            <p className="text-slate-500">Create smart recipes with automated nutrition analysis.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                        {[1, 2, 3, 4].map(s => (
                            <button
                                key={s}
                                onClick={() => setStep(s)}
                                className={cn(
                                    "px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap",
                                    step === s ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "bg-white text-slate-600 border border-slate-200"
                                )}
                            >
                                Step {s}: {s === 1 ? 'Details' : s === 2 ? 'Ingredients' : s === 3 ? 'Instructions' : 'Review'}
                            </button>
                        ))}
                    </div>

                    <Card className="p-8">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="title">Recipe Title</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g., Avocado Toast with Poached Egg"
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                                className="text-lg py-6"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="mealType">Meal Type</Label>
                                                <select
                                                    id="mealType"
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                    value={mealType}
                                                    onChange={e => setMealType(e.target.value as MealType)}
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                    <option value="snack">Snack</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="prepTime">Prep Time (min)</Label>
                                                <Input
                                                    id="prepTime"
                                                    type="number"
                                                    value={prepTime}
                                                    onChange={e => setPrepTime(parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Diet Type</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {['anything', 'vegetarian', 'vegan'].map(d => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => {
                                                            if (d === 'anything') setDiet(['anything']);
                                                            else {
                                                                const filtered = diet.filter(x => x !== 'anything');
                                                                if (filtered.includes(d as any)) {
                                                                    const next = filtered.filter(x => x !== d);
                                                                    setDiet(next.length ? next : ['anything']);
                                                                } else {
                                                                    setDiet([...filtered, d as DietType]);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                                                            diet.includes(d as any)
                                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                                        )}
                                                    >
                                                        {d.charAt(0) + d.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="image">Image URL</Label>
                                            <Input
                                                id="image"
                                                placeholder="https://images.unsplash.com/..."
                                                value={image}
                                                onChange={e => setImage(e.target.value)}
                                            />
                                        </div>
                                        {image && (
                                            <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <Label htmlFor="servings">Servings</Label>
                                            <Input
                                                id="servings"
                                                type="number"
                                                value={servings}
                                                onChange={e => setServings(parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Next: Ingredients <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                        <Scale size={20} className="text-emerald-500" />
                                        Analyze Ingredients
                                    </h2>
                                    <p className="text-sm text-slate-500 italic">Match items to the food database for precision logic.</p>
                                </div>

                                <div className="space-y-4">
                                    {ingredients.map((ing, idx) => (
                                        <div key={idx} className="group relative bg-slate-50/50 p-4 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-emerald-100">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                <div className="md:col-span-2">
                                                    <Label className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ingredient Item (Display Name)</Label>
                                                    <Input
                                                        placeholder="e.g., Large Ripe Avocado"
                                                        value={ing.item}
                                                        onChange={e => {
                                                            const newIngs = [...ingredients];
                                                            newIngs[idx].item = e.target.value;
                                                            setIngredients(newIngs);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-400 uppercase tracking-wider mb-1">Quantity/Unit</Label>
                                                    <Input
                                                        placeholder="e.g. 1, 1/2, 200g"
                                                        value={ing.amount}
                                                        onChange={e => {
                                                            const newIngs = [...ingredients];
                                                            newIngs[idx].amount = e.target.value;
                                                            setIngredients(newIngs);
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className={cn(
                                                            "shrink-0 transition-all",
                                                            ing.isMiracleProduct ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100" : "bg-white text-slate-400 border-slate-200"
                                                        )}
                                                        onClick={() => {
                                                            const newIngs = [...ingredients];
                                                            newIngs[idx].isMiracleProduct = !ing.isMiracleProduct;
                                                            setIngredients(newIngs);
                                                        }}
                                                        title="Mark as Miracle Product"
                                                    >
                                                        <Leaf size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "flex-grow transition-all",
                                                            ing.matchedFood ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" : "border-slate-200 text-slate-600"
                                                        )}
                                                        onClick={() => {
                                                            // Clear previous context
                                                            setSearchResults([]);
                                                            setMeasures([]);
                                                            setSearchQuery(ing.item || ing.amount);

                                                            setActiveIngredientIndex(idx);
                                                            performSearch(ing.item || ing.amount);
                                                        }}
                                                    >
                                                        {ing.matchedFood ? <Check size={16} className="mr-2" /> : <Search size={16} className="mr-2" />}
                                                        {ing.matchedFood ? "Matched" : "Match Food"}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => removeIngredient(idx)} className="text-slate-400 hover:text-red-500">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {ing.matchedFood && (
                                                <div className="mt-3 pl-4 border-l-2 border-emerald-500 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                    <span className="font-medium text-emerald-700">✓ Linked to: {ing.matchedFood.name}</span>
                                                    <span className="text-slate-500">{ing.weightG ? `${Math.round(ing.weightG)}g total` : "Weight not set"}</span>
                                                    {ing.selectedMeasure && (
                                                        <Badge variant="outline" className="bg-white">{ing.selectedMeasure.label}</Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={addIngredient}
                                    className="mt-6 w-full py-6 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-all font-medium"
                                >
                                    <Plus size={20} className="mr-2" /> Add Ingredient
                                </Button>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                    <Button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Next: Instructions <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Utensils size={20} className="text-emerald-500" />
                                    <h2 className="text-xl font-semibold text-slate-800">Cooking Instructions</h2>
                                </div>

                                <div className="space-y-4">
                                    {instructions.map((text, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 mt-1">
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                className="flex-grow min-h-[100px] p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all resize-none"
                                                placeholder="e.g., Mash the avocado in a small bowl with lemon juice and salt..."
                                                value={text}
                                                onChange={e => {
                                                    const next = [...instructions];
                                                    next[idx] = e.target.value;
                                                    setInstructions(next);
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeInstruction(idx)} className="mt-1 text-slate-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={addInstruction}
                                    className="w-full py-4 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-all"
                                >
                                    <Plus size={18} className="mr-2" /> Add Step
                                </Button>

                                <div className="pt-8 border-t border-slate-100 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                    <Button onClick={() => setStep(4)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Review Nutrition <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recipe Analysis Summary</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                            <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-xs mb-4">Calculated Totals (Per Serving)</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Energy', val: calculateTotalNutrition().calories / servings, unit: 'kcal' },
                                                    { label: 'Energy (KJ)', val: (calculateTotalNutrition().calories / servings) * 4.184, unit: 'kJ' },
                                                    { label: 'Protein', val: calculateTotalNutrition().protein / servings, unit: 'g' },
                                                    { label: 'Carbs', val: calculateTotalNutrition().carbs / servings, unit: 'g' },
                                                    { label: 'Fat', val: calculateTotalNutrition().fat / servings, unit: 'g' },
                                                ].map(m => (
                                                    <div key={m.label} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                                        <p className="text-xs text-slate-400 font-medium mb-1">{m.label}</p>
                                                        <p className="text-xl font-bold text-slate-800">{Math.round(m.val)}{m.unit}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-4 pt-6 mt-6 border-t border-emerald-100">
                                                <h3 className="text-emerald-800 font-bold text-sm uppercase">Key Micronutrients</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(calculateTotalNutrition().micronutrients).slice(0, 8).map(([key, val]) => (
                                                        <div key={key} className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-xs flex justify-between gap-3 min-w-[120px]">
                                                            <span className="text-slate-500">{key}</span>
                                                            <span className="font-bold text-slate-800">{Math.round(val / servings * 10) / 10}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800">Structure Overview</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Title Match</span>
                                                    <span className={title ? "text-emerald-600" : "text-red-500"}>
                                                        {title ? <Check size={18} /> : "Missing Title"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Ingredients Mapped</span>
                                                    <span className="text-slate-800 font-bold">
                                                        {ingredients.filter(i => i.matchedFood).length} / {ingredients.length}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Instructions Count</span>
                                                    <span className="text-slate-800 font-bold">
                                                        {instructions.filter(i => i.trim()).length} Steps
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xl shadow-slate-200/50">
                                            <img src={image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80'} alt="Recipe" className="w-full h-full object-cover" />
                                        </div>
                                        <Button onClick={saveRecipe} disabled={loading} className="w-full py-8 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                            Finalize & Upload
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-start">
                                    <Button variant="ghost" onClick={() => setStep(3)}>Back to Steps</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            {/* Slide-over for matching ingredients */}
            {activeIngredientIndex !== null && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveIngredientIndex(null)} />
                    <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Match Ingredient</h3>
                                <p className="text-sm text-slate-500 italic">Searching for "{searchQuery || ingredients[activeIngredientIndex].item}"</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setActiveIngredientIndex(null)}>
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    className="pl-10 h-12"
                                    placeholder="Search global food database..."
                                    value={searchQuery}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>

                            {searching ? (
                                <div className="flex flex-col items-center py-12 text-slate-400">
                                    <Loader2 className="animate-spin mb-2" />
                                    Searching...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {searchResults.map((f, i) => (
                                        <button
                                            key={i}
                                            onClick={() => selectFood(f)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-xl border transition-all hover:shadow-md",
                                                ingredients[activeIngredientIndex].matchedFood?.name === f.name
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-slate-100 bg-white hover:border-emerald-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-800 line-clamp-1">{f.name}</span>
                                                <Badge variant="outline" className={f.source === 'local' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}>
                                                    {f.source.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-4 text-xs text-slate-500">
                                                <span>{Math.round(f.energy_kcal)} kcal</span>
                                                <span>P: {Math.round(f.protein_g)}g</span>
                                                <span>C: {Math.round(f.carbs_g)}g</span>
                                                <span>F: {Math.round(f.fat_g)}g</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {measures.length > 0 && ingredients[activeIngredientIndex].matchedFood && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Scale size={18} className="text-emerald-500" />
                                        Pick a Conversion Measure
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {measures.map((m, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectMeasure(m)}
                                                className={cn(
                                                    "p-3 rounded-lg border text-sm transition-all",
                                                    ingredients[activeIngredientIndex].selectedMeasure?.label === m.label
                                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                                                )}
                                            >
                                                {m.label} ({m.weight_g}g)
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100">
                            <Button
                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setActiveIngredientIndex(null)}
                                disabled={!ingredients[activeIngredientIndex].matchedFood}
                            >
                                Confirm Match
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}

function X({ size }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
