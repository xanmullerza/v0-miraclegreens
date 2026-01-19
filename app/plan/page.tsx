'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Utensils,
    Leaf,
    Flame,
    Check,
    ChevronRight,
    RotateCcw,
    ChefHat,
    ShoppingBasket,
    Sparkles,
    Download,
    Egg,
    TrendingDown,
    Activity,
    Dumbbell,
    Armchair,
    Footprints,
    Zap,
    Beef,
    Droplet,
    Wheat,
    X,
    Clock,
    Filter,
    ChevronDown,
    Gem,
    Microscope,
    FlaskConical,
    Dna,
    LayoutGrid,
    Info,
    RefreshCw
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useRDA } from '@/hooks/use-rda';
import { DietType, Recipe } from '@/lib/data/recipes';
import { nutrientInfo, NutrientInfo } from '@/lib/data/nutrient-info';
import { generateDailyPlan, DailyPlan, generateShoppingList, ShoppingItem, getRandomRecipeByType } from '@/lib/utils/meal-generator';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import Link from 'next/link';

const showShop = false;

// --- HELPERS ---
const CAL_TO_KJ = 4.184;
type UnitType = 'kcal' | 'kJ';

type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

const formatEnergy = (calories: number, unit: UnitType) => {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${calories.toLocaleString()} kcal`;
};

const getNutrientLevelStyles = (percentage: number, label?: string) => {
    const isLimit = label?.toLowerCase().includes('sodium') || label?.toLowerCase().includes('fat') || label?.toLowerCase().includes('sugar');

    let color: 'green' | 'blue' | 'yellow' | 'orange' | 'red' = 'red';

    if (isLimit) {
        if (percentage <= 25) color = 'green';
        else if (percentage <= 50) color = 'blue';
        else if (percentage <= 75) color = 'yellow';
        else if (percentage <= 100) color = 'orange';
        else color = 'red';
    } else {
        if (percentage >= 100) color = 'green';
        else if (percentage >= 75) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 25) color = 'orange';
        else color = 'red';
    }

    const map = {
        green: { bg: 'bg-green-700', border: 'border-green-700', borderLight: 'border-green-700/30', text: 'text-green-800', textFill: 'text-white', fade: 'bg-green-50' },
        blue: { bg: 'bg-blue-700', border: 'border-blue-700', borderLight: 'border-blue-700/30', text: 'text-blue-800', textFill: 'text-white', fade: 'bg-blue-50' },
        yellow: { bg: 'bg-amber-500', border: 'border-amber-500', borderLight: 'border-amber-500/30', text: 'text-amber-800', textFill: 'text-white', fade: 'bg-amber-50' },
        orange: { bg: 'bg-orange-700', border: 'border-orange-700', borderLight: 'border-orange-700/30', text: 'text-orange-800', textFill: 'text-white', fade: 'bg-orange-50' },
        red: { bg: 'bg-red-700', border: 'border-red-700', borderLight: 'border-red-700/30', text: 'text-red-800', textFill: 'text-white', fade: 'bg-red-50' },
    };

    return map[color];
};

// --- COMPONENTS ---

const DietCard = ({ type, selected, onClick, icon: Icon, label }: { type: DietType, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || (type === 'anything' ? 'Anything' : type)}</span>
    </div>
);

const GoalCard = ({ type, selected, onClick, icon: Icon, label }: { type: GoalType, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || type.replace('-', ' ')}</span>
    </div>
);



const ActivityCard = ({ type, selected, onClick, icon: Icon, label }: { type: ActivityLevel, selected: boolean, onClick: () => void, icon: any, label?: string }) => (
    <div onClick={onClick} className={cn("cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:opacity-90", selected ? "bg-primary text-primary-foreground border-primary shadow-md" : "border-border bg-card text-muted-foreground hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mb-1", selected ? "text-primary-foreground" : "text-muted-foreground")} />
        <span className="text-xs font-semibold text-center leading-tight">{label || type}</span>
    </div>
);

const RecipeCard = ({ recipe, mealLabel, unit = 'kJ', onClick, onRegenerate }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onClick?: () => void,
    onRegenerate?: () => void
}) => {
    const [imageError, setImageError] = useState(false);

    return (
        <div
            onClick={onClick}
            className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full cursor-pointer"
        >
            <div className="aspect-video relative overflow-hidden bg-muted flex-shrink-0">
                {/* Fallback pattern if no image */}
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                    {recipe.image && !imageError ? (
                        <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <ChefHat className="h-10 w-10 opacity-20" />
                    )}
                </div>
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase">
                    {mealLabel}
                </div>
                {recipe.servings && recipe.servings !== 1 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-md shadow-lg animate-in zoom-in-50">
                        x{recipe.servings}
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{recipe.title}</h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {formatEnergy(recipe.calories * (recipe.servings || 1), unit)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Beef className="h-4 w-4 text-red-500" />
                        {Number(recipe.protein * (recipe.servings || 1)).toFixed(1)}g
                    </span>
                    <span className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-yellow-500" />
                        {Number(recipe.fat * (recipe.servings || 1)).toFixed(1)}g
                    </span>
                    <span className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-amber-600" />
                        {Number(recipe.carbs * (recipe.servings || 1)).toFixed(1)}g
                    </span>
                </div>
                <button
                    className="mt-3 w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group/btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                    }}
                >
                    View Recipe
                    <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
                {onRegenerate && (
                    <button
                        className="mt-2 w-full py-2 px-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegenerate();
                        }}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Another
                    </button>
                )}
            </div>
        </div>
    );
};

const ShoppingList = ({ items, calories, unit = 'kJ' }: { items: ShoppingItem[], calories: number, unit?: UnitType }) => {
    return (
        <div className="space-y-6 py-6">
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    Miracle Essentials
                </h4>
                <div className="space-y-3">
                    {items.filter(i => i.isMiracleProduct).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-background p-3 rounded-lg border border-primary/20 shadow-sm">
                            <span className="font-medium text-foreground">{item.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {item.amounts.join(' + ')}
                                </span>
                                {showShop && (
                                    <Button size="sm" variant="secondary" className="h-8" asChild>
                                        <Link href="/shop">Buy Now</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {items.filter(i => i.isMiracleProduct).length === 0 && (
                        <p className="text-muted-foreground text-sm italic">No Miracle products in this plan. Try checking out our shop for supplements!</p>
                    )}
                </div>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
                    <ShoppingBasket className="h-5 w-5" />
                    Grocery Items
                </h4>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                    {items.filter(i => !i.isMiracleProduct).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4">
                            <span className="text-foreground">{item.name}</span>
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                {item.amounts.join(' + ')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function MealPlannerPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generating, setGenerating] = useState(false);
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [showRecipeNutrients, setShowRecipeNutrients] = useState(false);
    const [recipeMoringaGrams, setRecipeMoringaGrams] = useState(0);
    const [moringaGrams, setMoringaGrams] = useState(0);
    const [showDailyNutrients, setShowDailyNutrients] = useState(false);
    const [dailyMoringaGrams, setDailyMoringaGrams] = useState(0);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);

    // Standard 1 tsp (2g) Moringa Nutrition (Calculated from 100g data)
    const MORINGA_TSP = {
        energy_kcal: 5.00,
        energy_kj: 20.93,
        protein_g: 0.50,
        carbs_g: 0.80,
        fat_g: 0.05,
        micronutrients: {
            // Vitamins
            vitamin_a_ug: 112.50,
            vitamin_c_mg: 4.50,
            thiamine_mg: 0.05,
            riboflavin_mg: 0.41,
            niacin_mg: 0.20,
            // Minerals
            calcium_mg: 40.00,
            iron_mg: 0.76,
            magnesium_mg: 7.35,
            potassium_mg: 26.50,
            sodium_mg: 0.50,
            // Fiber
            fiber_g: 0.80
        }
    };

    // Form State
    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const [mealsCount, setMealsCount] = useState(3);
    const [unit, setUnit] = useState<UnitType>('kJ');

    // New Fields
    const [goal, setGoal] = useState<GoalType>('maintain');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');

    // Fetch Personalized RDAs from Supabase (or fallback)
    const userRDAs = useRDA(
        age === '' ? undefined : Number(age),
        gender,
        calories
    );

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({
                targetCalories: calories,
                diet,
                numMeals: 3 // Standardize on 3 meals
            });
            setPlan(newPlan);
            setStep(3);
        } catch (error) {
            console.error("Failed to generate plan:", error);
            // In a real app, show a toast or error message here
        } finally {
            setGenerating(false);
        }
    };

    const handleNextStep = () => {
        // Calculate BMR using Mifflin-St Jeor Equation
        const w = Number(weight) || 70;
        const h = Number(height) || 170;
        const a = Number(age) || 30;

        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        if (gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }

        // Activity Multiplier based on selection
        let tdee = bmr;
        switch (activityLevel) {
            case 'sedentary': tdee = bmr * 1.2; break;
            case 'light': tdee = bmr * 1.375; break;
            case 'moderate': tdee = bmr * 1.55; break;
            case 'active': tdee = bmr * 1.725; break;
            default: tdee = bmr * 1.2;
        }

        if (goal === 'lose-fat') tdee *= 0.80; // 20% deficit
        if (goal === 'build-muscle') tdee *= 1.10; // 10% surplus

        // Clamp and round
        const calculated = Math.max(1200, Math.round(tdee / 50) * 50);

        setCalories(calculated);
        setMealsCount(3);
        setStep(2);
    };

    const handleRegenerate = () => {
        handleGenerate();
    };

    const handleRegenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', currentId: string) => {
        if (!plan) return;

        const result = await getRandomRecipeByType(mealType, diet, currentId);
        if (result) {
            const { recipe: newRecipe, micronutrients: newMicros } = result;

            setPlan(prevPlan => {
                if (!prevPlan) return prevPlan;

                const updatedPlan = { ...prevPlan };
                // Ensure recipeMicronutrients exists (handle legacy state)
                updatedPlan.recipeMicronutrients = { ...(prevPlan.recipeMicronutrients || {}) };

                // Update the changed meal
                if (mealType === 'breakfast') updatedPlan.breakfast = newRecipe;
                else if (mealType === 'lunch') updatedPlan.lunch = newRecipe;
                else if (mealType === 'dinner') updatedPlan.dinner = newRecipe;

                // Add the new recipe's micros to our storage
                updatedPlan.recipeMicronutrients[newRecipe.id] = newMicros;

                // Recalculate totals
                updatedPlan.totalCalories = updatedPlan.breakfast.calories + updatedPlan.lunch.calories + updatedPlan.dinner.calories + updatedPlan.snacks.reduce((acc, s) => acc + s.calories, 0);

                updatedPlan.macros = {
                    protein: updatedPlan.breakfast.protein + updatedPlan.lunch.protein + updatedPlan.dinner.protein + updatedPlan.snacks.reduce((acc, s) => acc + s.protein, 0),
                    carbs: updatedPlan.breakfast.carbs + updatedPlan.lunch.carbs + updatedPlan.dinner.carbs + updatedPlan.snacks.reduce((acc, s) => acc + s.carbs, 0),
                    fat: updatedPlan.breakfast.fat + updatedPlan.lunch.fat + updatedPlan.dinner.fat + updatedPlan.snacks.reduce((acc, s) => acc + s.fat, 0),
                };

                // Recalculate aggregated micronutrients
                const newAggregatedMicros: Record<string, number> = {};

                // Helper to add micros
                const addMicros = (rId: string) => {
                    const m = updatedPlan.recipeMicronutrients[rId];
                    if (m) {
                        Object.entries(m).forEach(([k, v]) => {
                            newAggregatedMicros[k] = (newAggregatedMicros[k] || 0) + v;
                        });
                    }
                };

                addMicros(updatedPlan.breakfast.id);
                addMicros(updatedPlan.lunch.id);
                addMicros(updatedPlan.dinner.id);
                updatedPlan.snacks.forEach(s => addMicros(s.id));

                updatedPlan.micronutrients = newAggregatedMicros;

                return updatedPlan;
            });
        }
    };

    const updateServings = (recipeId: string, newServings: number) => {
        if (!plan) return;

        setPlan(prev => {
            if (!prev) return null;
            const updated = { ...prev };

            // Helper to get recipe by ID and update it
            const updateRecipeInPlan = (r: Recipe) => r.id === recipeId ? { ...r, servings: newServings } : r;

            updated.breakfast = updateRecipeInPlan(updated.breakfast);
            updated.lunch = updateRecipeInPlan(updated.lunch);
            updated.dinner = updateRecipeInPlan(updated.dinner);
            updated.snacks = updated.snacks.map(updateRecipeInPlan);

            // Recalculate totals
            const getField = (r: Recipe, field: 'calories' | 'protein' | 'carbs' | 'fat') => (r[field] || 0) * (r.servings || 1);

            updated.totalCalories = getField(updated.breakfast, 'calories') + getField(updated.lunch, 'calories') + getField(updated.dinner, 'calories') + updated.snacks.reduce((acc, s) => acc + getField(s, 'calories'), 0);

            updated.macros = {
                protein: getField(updated.breakfast, 'protein') + getField(updated.lunch, 'protein') + getField(updated.dinner, 'protein') + updated.snacks.reduce((acc, s) => acc + getField(s, 'protein'), 0),
                carbs: getField(updated.breakfast, 'carbs') + getField(updated.lunch, 'carbs') + getField(updated.dinner, 'carbs') + updated.snacks.reduce((acc, s) => acc + getField(s, 'carbs'), 0),
                fat: getField(updated.breakfast, 'fat') + getField(updated.lunch, 'fat') + getField(updated.dinner, 'fat') + updated.snacks.reduce((acc, s) => acc + getField(s, 'fat'), 0),
            };

            // Recalculate aggregated micronutrients
            const newAggregatedMicros: Record<string, number> = {};
            const addMicros = (r: Recipe) => {
                const m = updated.recipeMicronutrients[r.id];
                if (m) {
                    const factor = r.servings || 1;
                    Object.entries(m).forEach(([k, v]) => {
                        newAggregatedMicros[k] = (newAggregatedMicros[k] || 0) + ((v as number) * factor);
                    });
                }
            };

            addMicros(updated.breakfast);
            addMicros(updated.lunch);
            addMicros(updated.dinner);
            updated.snacks.forEach(s => addMicros(s));

            updated.micronutrients = newAggregatedMicros;

            return updated;
        });

        // Update selectedRecipe if it matches (to reflect in modal immediately)
        if (selectedRecipe?.id === recipeId) {
            setSelectedRecipe(prev => prev ? { ...prev, servings: newServings } : null);
        }
    };

    const handleCloseModal = () => {
        setSelectedRecipe(null);
        setShowRecipeNutrients(false);
        setRecipeMoringaGrams(0);
    };

    const shoppingList = plan ? generateShoppingList(plan) : [];

    // Helper for calorie display during step 1
    const displayCalories = unit === 'kJ' ? Math.round(calories * CAL_TO_KJ) : calories;
    const minCal = 1200;
    const maxCal = 4000;
    const displayMin = unit === 'kJ' ? Math.round(minCal * CAL_TO_KJ) : minCal;
    const displayMax = unit === 'kJ' ? Math.round(maxCal * CAL_TO_KJ) : maxCal;

    // Check if user has provided all necessary data for a personalized plan
    const isFormComplete = Boolean(age && weight && height);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Header />

            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    {step !== 3 && (
                        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h1 className="text-4xl font-serif font-bold mb-4">Miracle Meal Planner</h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Generate a personalized daily meal plan in seconds. Tailored to your goals, fueled by Miracle Greens.
                            </p>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden min-h-[600px]">

                        {/* COMPACT WIZARD: SINGLE VIEW */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
                                        <div className="flex w-full bg-muted rounded-lg p-1 h-10 border border-muted-foreground/10">
                                            <button
                                                onClick={() => setGender('male')}
                                                className={cn(
                                                    "flex-1 text-xs font-bold rounded-md transition-all",
                                                    gender === 'male'
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:bg-background/50"
                                                )}
                                            >
                                                Male
                                            </button>
                                            <button
                                                onClick={() => setGender('female')}
                                                className={cn(
                                                    "flex-1 text-xs font-bold rounded-md transition-all",
                                                    gender === 'female'
                                                        ? "bg-primary text-primary-foreground shadow-md"
                                                        : "text-muted-foreground hover:bg-background/50"
                                                )}
                                            >
                                                Female
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age</Label>
                                        <div className="relative">
                                            <Input
                                                id="age"
                                                type="number"
                                                className={cn(
                                                    "h-10 text-center transition-all border-2",
                                                    age ? "border-green-500 ring-green-500/10" : "border-red-500 ring-red-500/10"
                                                )}
                                                value={age}
                                                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">yrs</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weight</Label>
                                        <div className="relative">
                                            <Input
                                                id="weight"
                                                type="number"
                                                className={cn(
                                                    "h-10 text-center transition-all border-2",
                                                    weight ? "border-green-500 ring-green-500/10" : "border-red-500 ring-red-500/10"
                                                )}
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">kg</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="height" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Height</Label>
                                        <div className="relative">
                                            <Input
                                                id="height"
                                                type="number"
                                                className={cn(
                                                    "h-10 text-center transition-all border-2",
                                                    height ? "border-green-500 ring-green-500/10" : "border-red-500 ring-red-500/10"
                                                )}
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">cm</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Goal</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <GoalCard type="lose-fat" selected={goal === 'lose-fat'} onClick={() => setGoal('lose-fat')} icon={TrendingDown} label="Lose Fat" />
                                        <GoalCard type="maintain" selected={goal === 'maintain'} onClick={() => setGoal('maintain')} icon={Activity} label="Maintain" />
                                        <GoalCard type="build-muscle" selected={goal === 'build-muscle'} onClick={() => setGoal('build-muscle')} icon={Dumbbell} label="Build Muscle" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Activity</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        <ActivityCard type="sedentary" selected={activityLevel === 'sedentary'} onClick={() => setActivityLevel('sedentary')} icon={Armchair} label="Sedentary" />
                                        <ActivityCard type="light" selected={activityLevel === 'light'} onClick={() => setActivityLevel('light')} icon={Footprints} label="Light" />
                                        <ActivityCard type="moderate" selected={activityLevel === 'moderate'} onClick={() => setActivityLevel('moderate')} icon={Activity} label="Moderate" />
                                        <ActivityCard type="active" selected={activityLevel === 'active'} onClick={() => setActivityLevel('active')} icon={Zap} label="Active" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diet Preference</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <DietCard type="anything" selected={diet === 'anything'} onClick={() => setDiet('anything')} icon={Utensils} label="Balanced" />
                                        <DietCard type="vegetarian" selected={diet === 'vegetarian'} onClick={() => setDiet('vegetarian')} icon={Egg} label="Vegetarian" />
                                        <DietCard type="vegan" selected={diet === 'vegan'} onClick={() => setDiet('vegan')} icon={Leaf} label="Vegan" />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button size="lg" onClick={handleNextStep} className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                                        {isFormComplete ? "Generate My Plan" : "Just Show Me The Recipes"} <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* WIZARD STEP 2: GENERATING STATE */}
                        {step === 2 && (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8 animate-in fade-in duration-500">
                                {!generating ? (
                                    <div className="space-y-6 max-w-md animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                            <ChefHat className="h-12 w-12" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold mb-2">
                                                {isFormComplete ? "Ready to cook?" : "Random Recipes"}
                                            </h2>
                                            <p className="text-muted-foreground">
                                                {isFormComplete ? (
                                                    <>We'll generate a <strong className="capitalize">{diet === 'anything' ? 'Balanced' : diet}</strong> plan with roughly <strong>{formatEnergy(calories, unit)}</strong> across <strong>3</strong> standard meals.</>
                                                ) : (
                                                    <>You have chosen not to generate a personalized meal plan. Here are some random recipes.</>
                                                )}
                                            </p>
                                        </div>
                                        <Button size="lg" onClick={handleGenerate} className="w-full h-14 text-lg rounded-xl">
                                            {isFormComplete ? "Generate Plan" : "Just Show Me The Recipes"}
                                        </Button>
                                        <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
                                            Back to settings
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="relative h-20 w-20 mx-auto">
                                            <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <h3 className="text-2xl font-bold animate-pulse">
                                            {isFormComplete ? "Curating your menu..." : "Loading random recipes..."}
                                        </h3>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* WIZARD STEP 3: RESULTS DASHBOARD */}
                        {step === 3 && plan && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                {/* Meal Grid */}
                                <div className="flex flex-wrap justify-center gap-6">
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.breakfast}
                                            mealLabel="Breakfast"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.breakfast)}
                                            onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.lunch}
                                            mealLabel="Lunch"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.lunch)}
                                            onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.dinner}
                                            mealLabel="Dinner"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.dinner)}
                                            onRegenerate={() => handleRegenerateMeal('dinner', plan.dinner.id)}
                                        />
                                    </div>
                                    {plan.snacks.map((snack, i) => (
                                        <div key={i} className={`w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards delay-[${(i + 3) * 100}ms]`}>
                                            <RecipeCard
                                                recipe={snack}
                                                mealLabel={`Snack ${i + 1}`}
                                                unit={unit}
                                                onClick={() => setSelectedRecipe(snack)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Daily Totals Content */}
                                <div className="space-y-6">
                                    {/* Macros Section */}
                                    {(() => {
                                        const targetCals = calories;
                                        const pRatio = goal === 'lose-fat' ? 0.30 : goal === 'build-muscle' ? 0.25 : 0.20;
                                        const cRatio = goal === 'lose-fat' ? 0.40 : goal === 'build-muscle' ? 0.50 : 0.50;
                                        const fRatio = goal === 'lose-fat' ? 0.30 : goal === 'build-muscle' ? 0.25 : 0.30;

                                        const targets = {
                                            energy: targetCals,
                                            protein: (targetCals * pRatio) / 4,
                                            carbs: (targetCals * cRatio) / 4,
                                            fat: (targetCals * fRatio) / 9
                                        };

                                        const current = {
                                            energy: plan.totalCalories + ((dailyMoringaGrams / 2) * MORINGA_TSP.energy_kcal),
                                            protein: plan.macros.protein + ((dailyMoringaGrams / 2) * MORINGA_TSP.protein_g),
                                            carbs: plan.macros.carbs + ((dailyMoringaGrams / 2) * MORINGA_TSP.carbs_g),
                                            fat: plan.macros.fat + ((dailyMoringaGrams / 2) * MORINGA_TSP.fat_g)
                                        };

                                        const formatEnergyValue = (kcal: number, u: string) => {
                                            return u === 'kJ' ? kcal * 4.184 : kcal;
                                        };

                                        return (
                                            <div className="p-5 rounded-2xl border border-border bg-card/50 shadow-sm space-y-4">
                                                <h4 className="font-bold text-md text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                                                    <LayoutGrid className="h-5 w-5 text-primary" />
                                                    Macros
                                                </h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {[
                                                        { label: 'Energy', val: current.energy, target: targets.energy, icon: Flame, color: 'text-orange-500', unit: unit },
                                                        { label: 'Protein', val: current.protein, target: targets.protein, icon: Beef, color: 'text-red-500', unit: 'g' },
                                                        { label: 'Carbs', val: current.carbs, target: targets.carbs, icon: Wheat, color: 'text-amber-600', unit: 'g' },
                                                        { label: 'Fat', val: current.fat, target: targets.fat, icon: Droplet, color: 'text-yellow-500', unit: 'g' }
                                                    ].map((macro) => {
                                                        const pct = Math.round((macro.val / macro.target) * 100);
                                                        const styles = getNutrientLevelStyles(pct, macro.label);
                                                        const isEnergy = macro.label === 'Energy';

                                                        return (
                                                            <div
                                                                key={macro.label}
                                                                className={cn(
                                                                    "p-3 rounded-xl border transition-all shadow-sm cursor-pointer hover:shadow-md",
                                                                    styles.borderLight, styles.fade
                                                                )}
                                                                onClick={() => setSelectedNutrientInfo(macro.label)}
                                                            >
                                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <macro.icon className={cn("h-4 w-4", macro.color)} />
                                                                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">{macro.label}</span>
                                                                    </div>
                                                                    <div className="text-green-600 bg-green-50 rounded-full p-1 transition-all">
                                                                        <Info className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        "flex items-baseline gap-1 mb-1 group/value relative",
                                                                        isEnergy && "hover:bg-primary/5 rounded px-1 -mx-1 transition-colors"
                                                                    )}
                                                                    onClick={(e) => {
                                                                        if (isEnergy) {
                                                                            e.stopPropagation();
                                                                            setUnit(unit === 'kcal' ? 'kJ' : 'kcal');
                                                                        }
                                                                    }}
                                                                    title={isEnergy ? `Click to switch to ${unit === 'kcal' ? 'kJ' : 'kcal'}` : undefined}
                                                                >
                                                                    <span className="text-xl font-bold">
                                                                        {macro.unit === 'kcal' || macro.unit === 'kJ'
                                                                            ? Math.round(formatEnergyValue(macro.val, macro.unit))
                                                                            : macro.val.toFixed(0)}
                                                                    </span>
                                                                    <span className="text-sm font-semibold text-muted-foreground/70">
                                                                        / {macro.unit === 'kcal' || macro.unit === 'kJ'
                                                                            ? Math.round(formatEnergyValue(macro.target, macro.unit))
                                                                            : macro.target.toFixed(0)}{macro.unit}
                                                                    </span>
                                                                    {isEnergy && (
                                                                        <RefreshCw className="h-2 w-2 text-muted-foreground/30 group-hover/value:text-primary transition-colors ml-0.5" />
                                                                    )}
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between text-xs font-black">
                                                                        <span className={cn("px-1.5 py-0.5 rounded shadow-sm", styles.bg, styles.textFill)}>{pct}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden border border-black/5">
                                                                        <div
                                                                            className={cn("h-full transition-all duration-1000", styles.bg)}
                                                                            style={{ width: `${Math.min(100, pct)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Show Detailed Nutrients Toggle (Only shown when hidden) */}
                                    {!showDailyNutrients && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDailyNutrients(true)}
                                            className="w-full py-2 hover:bg-muted/50 text-muted-foreground gap-2 text-xs uppercase tracking-widest font-bold"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                            Show Detailed Nutrients
                                        </Button>
                                    )}

                                    {
                                        showDailyNutrients && plan.micronutrients && (() => {
                                            const m = { ...plan.micronutrients };

                                            // Apply Daily Moringa Boost
                                            if (dailyMoringaGrams > 0) {
                                                const ratio = dailyMoringaGrams / 2;
                                                Object.entries(MORINGA_TSP.micronutrients).forEach(([key, value]) => {
                                                    m[key] = (m[key] || 0) + (value * ratio);
                                                });
                                            }

                                            // Categorize nutrients
                                            const electrolytes: Record<string, number> = {
                                                'Potassium': m.potassium_mg || 0,
                                                'Magnesium': m.magnesium_mg || 0,
                                                'Calcium': m.calcium_mg || 0,
                                                'Phosphorus': m.phosphorus_mg || 0,
                                                'Sodium': m.sodium_mg || 0,
                                            };

                                            const traceMinerals: Record<string, number> = {
                                                'Iron': m.iron_mg || 0,
                                                'Zinc': m.zinc_mg || 0,
                                                'Selenium': m.selenium_ug || 0,
                                                'Copper': m.copper_mg || 0,
                                                'Manganese': m.manganese_mg || 0,
                                            };

                                            const vitamins: Record<string, number> = {
                                                'Vitamin A': m.vitamin_a_ug || 0,
                                                'B1 (Thiamine)': m.thiamine_mg || 0,
                                                'B2 (Riboflavin)': m.riboflavin_mg || 0,
                                                'B3 (Niacin)': m.niacin_mg || 0,
                                                'B5 (Pantothenic Acid)': m.pantothenic_acid_mg || 0,
                                                'B6 (Pyridoxine)': m.vitamin_b6_mg || 0,
                                                'B9 (Folate)': m.folate_ug || 0,
                                                'B12 (Cobalamin)': m.vitamin_b12_ug || 0,
                                                'Vitamin C': m.vitamin_c_mg || 0,
                                                'Vitamin D': m.vitamin_d_iu || 0,
                                                'Vitamin E': m.vitamin_e_mg || 0,
                                                'Vitamin K': m.vitamin_k_ug || 0,
                                            };

                                            const other: Record<string, number> = {
                                                'Choline': m.choline_mg || 0,
                                                'Fiber': m.fiber_g || 0,
                                            };

                                            const DailyNutrientGrid = ({ nutrients, title, icon: Icon }: { nutrients: Record<string, number>, title: string, icon: any }) => {
                                                const filtered = Object.entries(nutrients);
                                                if (filtered.length === 0) return null;

                                                return (
                                                    <div className="p-5 rounded-2xl border border-border bg-card/50 shadow-sm space-y-4">
                                                        <h4 className="font-bold text-md text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                                                            <Icon className="h-5 w-5 text-primary" />
                                                            {title}
                                                        </h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                            {filtered.map(([label, value]) => {
                                                                let unit = 'mg';
                                                                const labelLower = label.toLowerCase();
                                                                if (labelLower.includes('vitamin a') || labelLower.includes('folate') || labelLower.includes('selenium') || labelLower.includes('b12') || labelLower.includes('vitamin k')) unit = 'µg';
                                                                if (labelLower.includes('vitamin d')) unit = 'IU';
                                                                if (labelLower.includes('fiber')) unit = 'g';

                                                                const rdaValue = userRDAs?.[label];
                                                                const percentage = rdaValue ? Math.round((value / rdaValue) * 100) : null;
                                                                const styles = getNutrientLevelStyles(percentage || 0, label);

                                                                // Calculate Moringa Boost for this specific nutrient
                                                                const getBoost = () => {
                                                                    if (dailyMoringaGrams <= 0) return 0;
                                                                    const ratio = dailyMoringaGrams / 2;
                                                                    const mapping: Record<string, string> = {
                                                                        'Potassium': 'potassium_mg',
                                                                        'Magnesium': 'magnesium_mg',
                                                                        'Calcium': 'calcium_mg',
                                                                        'Sodium': 'sodium_mg',
                                                                        'Iron': 'iron_mg',
                                                                        'Vitamin A': 'vitamin_a_ug',
                                                                        'B1 (Thiamine)': 'thiamine_mg',
                                                                        'B2 (Riboflavin)': 'riboflavin_mg',
                                                                        'B3 (Niacin)': 'niacin_mg',
                                                                        'Vitamin C': 'vitamin_c_mg',
                                                                        'Fiber': 'fiber_g'
                                                                    };
                                                                    const key = mapping[label];
                                                                    if (!key) return 0;
                                                                    return (MORINGA_TSP.micronutrients as any)[key] * ratio;
                                                                };

                                                                const boostValue = getBoost();
                                                                const boostPct = boostValue > 0 && rdaValue ? Math.round((boostValue / rdaValue) * 100) : 0;

                                                                return (
                                                                    <div
                                                                        key={label}
                                                                        onClick={() => setSelectedNutrientInfo(label)}
                                                                        className={cn(
                                                                            "flex flex-col justify-between gap-1 p-3 rounded-xl border transition-all shadow-sm hover:shadow-md group/card relative overflow-hidden cursor-pointer",
                                                                            percentage !== null ? `${styles.borderLight} ${styles.fade}` : "bg-background border-border/50"
                                                                        )}
                                                                    >
                                                                        {boostValue > 0 && (
                                                                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-500">
                                                                                +{boostPct}% BOOST
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                                                <p className="text-[10px] uppercase font-semibold text-muted-foreground truncate tracking-tight group-hover/card:text-foreground transition-colors">{label}</p>
                                                                                <div className="text-green-600 bg-green-50 rounded-full p-0.5 transition-all">
                                                                                    <Info className="h-4 w-4" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-baseline flex-wrap gap-x-1">
                                                                                <span className="text-sm font-bold">
                                                                                    {value >= 1 ? value.toFixed(1) : value.toFixed(2)}
                                                                                    <span className="text-[10px] font-medium opacity-60 ml-0.5">{unit}</span>
                                                                                </span>
                                                                                {rdaValue && (
                                                                                    <span className="text-sm font-semibold text-muted-foreground/60">
                                                                                        / {rdaValue >= 1 ? Math.round(rdaValue) : rdaValue.toFixed(1)}{unit}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {percentage !== null && (
                                                                            <div className="mt-2 space-y-1.5">
                                                                                <div className="flex items-center justify-between text-xs font-black">
                                                                                    <span className={cn(
                                                                                        "px-1.5 py-0.5 rounded-[4px] shadow-sm",
                                                                                        styles.bg,
                                                                                        styles.textFill
                                                                                    )}>
                                                                                        {percentage}%
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden border border-black/5">
                                                                                    <div
                                                                                        className={cn("h-full transition-all duration-1000 ease-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]", styles.bg)}
                                                                                        style={{ width: `${Math.min(100, percentage)}%` }}
                                                                                    />
                                                                                </div>
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
                                                <div className="mt-6 pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <DailyNutrientGrid nutrients={electrolytes} title="Electrolytes" icon={Zap} />
                                                    <DailyNutrientGrid nutrients={traceMinerals} title="Trace Minerals" icon={Gem} />
                                                    <DailyNutrientGrid nutrients={vitamins} title="Vitamins" icon={FlaskConical} />
                                                    <DailyNutrientGrid nutrients={other} title="Other Essentials" icon={Dna} />

                                                    {/* Hide Detailed Nutrients Button at the bottom */}
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setShowDailyNutrients(false);
                                                            // Optional: Scroll back up to the macros if needed, but simple toggle for now
                                                        }}
                                                        className="w-full py-2 mt-4 hover:bg-muted/50 text-muted-foreground gap-2 text-xs uppercase tracking-widest font-bold border-t border-border/50 rounded-none"
                                                    >
                                                        <ChevronDown className="h-4 w-4 rotate-180" />
                                                        Hide Detailed Nutrients
                                                    </Button>
                                                </div>
                                            );
                                        })()
                                    }
                                    {/* Bridge Section: Miracle Boost + Start Over */}
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                            <div className="flex flex-col items-center sm:items-start gap-1">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-green-800 dark:text-green-300 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Miracle Boost
                                                </span>
                                                <div className="flex items-center bg-white dark:bg-black/20 rounded-lg shadow-sm border border-green-100 dark:border-green-800/50 p-0.5">
                                                    {[0, 1, 2, 3, 4, 5].map(spoons => {
                                                        const g = spoons * 2;
                                                        const isActive = dailyMoringaGrams === g;
                                                        return (
                                                            <button
                                                                key={spoons}
                                                                onClick={() => setDailyMoringaGrams(g)}
                                                                className={cn(
                                                                    "w-7 h-7 flex items-center justify-center text-xs font-bold transition-all rounded-md",
                                                                    isActive
                                                                        ? "bg-green-600 text-white shadow-sm"
                                                                        : "text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20"
                                                                )}
                                                                title={`${g}g`}
                                                            >
                                                                {spoons}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="relative flex items-center shrink-0">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={dailyMoringaGrams}
                                                    onChange={(e) => setDailyMoringaGrams(Number(e.target.value))}
                                                    className="w-16 h-8 text-center text-xs pr-4 border-green-200 focus:ring-green-500 bg-white"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-1.5 text-[10px] text-green-600 font-bold pointer-events-none">g</span>
                                            </div>
                                        </div>

                                        <Button onClick={() => setStep(1)} variant="outline" size="sm" className="w-full md:w-auto gap-2 border-muted-foreground/20 text-muted-foreground">
                                            Start Over
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />

            {/* Recipe Detail Modal */}
            {selectedRecipe && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-background border-b border-border p-6 flex justify-between items-start z-10">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">{selectedRecipe.title}</h2>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{selectedRecipe.prepTime} min</span>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Image */}
                        {selectedRecipe.image && (
                            <div className="aspect-video relative bg-muted">
                                <img
                                    src={selectedRecipe.image}
                                    alt={selectedRecipe.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Nutrition Summary */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold">Nutrition Facts</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRecipeNutrients(!showRecipeNutrients)}
                                    className="gap-2 h-8 text-xs"
                                >
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showRecipeNutrients && "rotate-180")} />
                                    {showRecipeNutrients ? "Hide Details" : "Show Detailed Nutrition"}
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Energy</span>
                                    </div>
                                    <div className="text-lg font-bold">{formatEnergy((selectedRecipe.calories * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.energy_kcal), unit).split(' ')[0]}</div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">{unit}</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Beef className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Protein</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.protein * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.protein_g)).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Wheat className="h-4 w-4 text-amber-600" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Carbs</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.carbs * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.carbs_g)).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Droplet className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Fat</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.fat * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.fat_g)).toFixed(1)}g</div>
                                </div>
                            </div>

                            {/* Total Weight Display */}
                            {(() => {
                                const totalWeight = selectedRecipe.ingredients.reduce((acc, ing) => acc + (ing.weightG || 0), 0) * (selectedRecipe.servings || 1) + recipeMoringaGrams;
                                if (totalWeight > 0) {
                                    return (
                                        <div className="mt-4 flex items-center justify-center gap-2 py-1.5 px-3 bg-primary/5 border border-primary/10 rounded-full w-fit mx-auto animate-in fade-in zoom-in-95 duration-300">
                                            <Activity className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Serving Weight:</span>
                                            <span className="text-sm font-black text-primary">{Math.round(totalWeight)}g</span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Detailed Nutrition Expandable Section */}
                            {showRecipeNutrients && plan?.recipeMicronutrients?.[selectedRecipe.id] && (() => {
                                const m = { ...plan?.recipeMicronutrients[selectedRecipe.id] };
                                const factor = selectedRecipe.servings || 1;

                                // Scale base micros
                                Object.keys(m).forEach(k => m[k] = (m[k] || 0) * factor);

                                // Apply local Miracle Boost
                                if (recipeMoringaGrams > 0) {
                                    const ratio = recipeMoringaGrams / 2;
                                    Object.entries(MORINGA_TSP.micronutrients).forEach(([key, value]) => {
                                        m[key] = (m[key] || 0) + (value * ratio);
                                    });
                                }

                                const electrolytes: Record<string, number> = {
                                    'Potassium': m.potassium_mg || 0,
                                    'Magnesium': m.magnesium_mg || 0,
                                    'Calcium': m.calcium_mg || 0,
                                    'Phosphorus': m.phosphorus_mg || 0,
                                    'Sodium': m.sodium_mg || 0,
                                };

                                const traceMinerals: Record<string, number> = {
                                    'Iron': m.iron_mg || 0,
                                    'Zinc': m.zinc_mg || 0,
                                    'Selenium': m.selenium_ug || 0,
                                    'Copper': m.copper_mg || 0,
                                    'Manganese': m.manganese_mg || 0,
                                };

                                const vitamins: Record<string, number> = {
                                    'Vitamin A': m.vitamin_a_ug || 0,
                                    'B1 (Thiamine)': m.thiamine_mg || 0,
                                    'B2 (Riboflavin)': m.riboflavin_mg || 0,
                                    'B3 (Niacin)': m.niacin_mg || 0,
                                    'B5 (Pantothenic Acid)': m.pantothenic_acid_mg || 0,
                                    'B6 (Pyridoxine)': m.vitamin_b6_mg || 0,
                                    'B9 (Folate)': m.folate_ug || 0,
                                    'B12 (Cobalamin)': m.vitamin_b12_ug || 0,
                                    'Vitamin C': m.vitamin_c_mg || 0,
                                    'Vitamin D': m.vitamin_d_iu || 0,
                                    'Vitamin E': m.vitamin_e_mg || 0,
                                    'Vitamin K': m.vitamin_k_ug || 0,
                                };

                                const other: Record<string, number> = {
                                    'Choline': m.choline_mg || 0,
                                    'Fiber': m.fiber_g || 0,
                                };

                                const ModalNutrientGrid = ({ nutrients, title, icon: Icon }: { nutrients: Record<string, number>, title: string, icon: any }) => {
                                    const filtered = Object.entries(nutrients).filter(([_, val]) => val > 0);
                                    if (filtered.length === 0) return null;

                                    return (
                                        <div className="p-4 rounded-xl border border-border bg-card/30 space-y-3">
                                            <h4 className="font-black text-[11px] uppercase tracking-widest text-primary flex items-center gap-2 border-b border-primary/5 pb-1.5">
                                                <Icon className="h-3.5 w-3.5" />
                                                {title}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {filtered.map(([label, value]) => {
                                                    let u = 'mg';
                                                    const labelLower = label.toLowerCase();
                                                    if (labelLower.includes('vitamin a') || labelLower.includes('folate') || labelLower.includes('selenium') || labelLower.includes('b12') || labelLower.includes('vitamin k')) u = 'µg';
                                                    if (labelLower.includes('vitamin d')) u = 'IU';
                                                    if (labelLower.includes('fiber')) u = 'g';

                                                    const rdaValue = userRDAs?.[label];
                                                    const percentage = rdaValue ? Math.round((value / rdaValue) * 100) : null;
                                                    const styles = getNutrientLevelStyles(percentage || 0, label);

                                                    // Calculate Moringa Boost for this specific nutrient
                                                    const getBoost = () => {
                                                        if (recipeMoringaGrams <= 0) return 0;
                                                        const ratio = recipeMoringaGrams / 2;
                                                        const mapping: Record<string, string> = {
                                                            'Potassium': 'potassium_mg',
                                                            'Magnesium': 'magnesium_mg',
                                                            'Calcium': 'calcium_mg',
                                                            'Sodium': 'sodium_mg',
                                                            'Iron': 'iron_mg',
                                                            'Vitamin A': 'vitamin_a_ug',
                                                            'B1 (Thiamine)': 'thiamine_mg',
                                                            'B2 (Riboflavin)': 'riboflavin_mg',
                                                            'B3 (Niacin)': 'niacin_mg',
                                                            'Vitamin C': 'vitamin_c_mg',
                                                            'Fiber': 'fiber_g'
                                                        };
                                                        const key = mapping[label];
                                                        if (!key) return 0;
                                                        return (MORINGA_TSP.micronutrients as any)[key] * ratio;
                                                    };

                                                    const boostValue = getBoost();
                                                    const boostPct = boostValue > 0 && rdaValue ? Math.round((boostValue / rdaValue) * 100) : 0;

                                                    return (
                                                        <div
                                                            key={label}
                                                            onClick={() => setSelectedNutrientInfo(label)}
                                                            className={cn(
                                                                "flex items-center justify-between gap-1 p-2 rounded-lg border shadow-sm transition-all relative overflow-hidden cursor-pointer hover:bg-muted/5",
                                                                percentage !== null ? `${styles.borderLight} ${styles.fade}` : "bg-background border-border/40"
                                                            )}
                                                        >
                                                            {boostValue > 0 && (
                                                                <div className="absolute top-0 right-0 bg-green-600 text-white text-[7px] font-black px-1 py-0.5 rounded-bl-[4px] shadow-sm">
                                                                    +{boostPct}%
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <p className="text-[10px] text-muted-foreground truncate font-medium">{label}</p>
                                                                    <div className="text-green-600 transition-colors">
                                                                        <Info className="h-2.5 w-2.5" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs font-bold tabular-nums">
                                                                    {value >= 1 ? value.toFixed(1) : value.toFixed(2)}
                                                                    <span className="ml-0.5 font-medium text-[10px] opacity-70">{u}</span>
                                                                </p>
                                                            </div>
                                                            {percentage !== null && (
                                                                <span className={cn(
                                                                    "text-xs font-black px-1.5 py-0.5 rounded-[4px] shadow-sm",
                                                                    styles.bg,
                                                                    styles.textFill
                                                                )}>
                                                                    {percentage}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                };

                                return (
                                    <div className="mt-6 pt-6 border-t border-border space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">

                                        {/* Local Miracle Boost Selector (Only in Detailed View) */}
                                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-200 dark:border-green-800/30 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase text-green-800 dark:text-green-300 tracking-wider">✨ Miracle Boost</p>
                                                <p className="text-xs text-green-700/80 dark:text-green-400/80 leading-tight">Supercharge this specific meal</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex bg-white dark:bg-background rounded-lg p-0.5 border border-green-200 shadow-sm">
                                                    {[0, 1, 2, 3].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setRecipeMoringaGrams(s * 2)}
                                                            className={cn(
                                                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all",
                                                                recipeMoringaGrams === s * 2 ? "bg-green-600 text-white" : "hover:bg-green-50 text-green-700"
                                                            )}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-baseline gap-0.5 bg-green-100 px-2 py-1 rounded text-green-800 font-bold text-xs">
                                                    {recipeMoringaGrams}g
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="space-y-6">
                                                <ModalNutrientGrid nutrients={electrolytes} title="Electrolytes" icon={Zap} />
                                                <ModalNutrientGrid nutrients={traceMinerals} title="Trace Minerals" icon={Gem} />
                                            </div>
                                            <div className="space-y-6">
                                                <ModalNutrientGrid nutrients={vitamins} title="Vitamins" icon={FlaskConical} />
                                                <ModalNutrientGrid nutrients={other} title="Other Essentials" icon={Dna} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Servings Control */}
                        <div className="p-6 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Utensils className="h-5 w-5" />
                                        Adjust Servings
                                    </h3>
                                    <p className="text-sm text-muted-foreground">Scale ingredients and nutrition up or down.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-background border rounded-xl p-1 shadow-sm">
                                    <button
                                        onClick={() => updateServings(selectedRecipe.id, Math.max(0.5, (selectedRecipe.servings || 1) - 0.5))}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-lg font-bold"
                                    >
                                        -
                                    </button>
                                    <div className="w-12 text-center">
                                        <span className="text-xl font-bold">{selectedRecipe.servings || 1}</span>
                                        <span className="block text-[10px] uppercase font-bold text-muted-foreground">Servs</span>
                                    </div>
                                    <button
                                        onClick={() => updateServings(selectedRecipe.id, (selectedRecipe.servings || 1) + 0.5)}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-lg font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <ShoppingBasket className="h-5 w-5" />
                                Ingredients
                            </h3>
                            <ul className="space-y-2">
                                {selectedRecipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                        <div className="flex-1">
                                            <span className="font-medium">{ing.item}</span>
                                            <span className="text-muted-foreground"> - {scaleIngredient(ing.amount, selectedRecipe.servings || 1)}</span>
                                            {ing.isMiracleProduct && (
                                                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                                    ✨ Miracle Product
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div className="p-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <ChefHat className="h-5 w-5" />
                                Instructions
                            </h3>
                            <ol className="space-y-4">
                                {selectedRecipe.instructions.map((instruction, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <p className="flex-1 pt-1">{instruction}</p>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Nutritional Info Modal */}
            {selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
                <div
                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedNutrientInfo(null)}
                >
                    <div
                        className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-primary">{selectedNutrientInfo}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{nutrientInfo[selectedNutrientInfo].description}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedNutrientInfo(null)}
                                    className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Microscope className="h-4 w-4 text-secondary-foreground" />
                                        Importance
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {nutrientInfo[selectedNutrientInfo].importance}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-yellow-500" />
                                        Key Benefits
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {nutrientInfo[selectedNutrientInfo].benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                                                {benefit}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-red-500" />
                                        Signs of Deficiency
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {nutrientInfo[selectedNutrientInfo].deficiencySigns.map((sign, i) => (
                                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                                {sign}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                        <Utensils className="h-4 w-4 text-orange-500" />
                                        Good Sources
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {nutrientInfo[selectedNutrientInfo].sources.map((source, i) => (
                                            <span key={i} className="text-xs font-medium px-2.5 py-1 bg-muted rounded-full text-muted-foreground border border-border">
                                                {source}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                        <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Did you know?</h5>
                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                            {nutrientInfo[selectedNutrientInfo].history}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main >
    );
}
