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
    RefreshCw,
    Shield,
    Battery
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
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const showShop = false;

const BOOSTABLE_NUTRIENTS = [
    'Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Iron',
    'Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)',
    'Vitamin C', 'Fiber', 'Energy', 'Protein', 'Carbs', 'Fat'
];

// --- HELPERS ---
const CAL_TO_KJ = 4.184;
type UnitType = 'kcal' | 'kJ';

type GoalType = 'lose-fat' | 'maintain' | 'build-muscle';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

const formatEnergy = (calories: number, unit: UnitType, energyKj?: number) => {
    if (unit === 'kJ') {
        const value = energyKj !== undefined ? energyKj : calories * CAL_TO_KJ;
        return `${Math.round(value).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kcal`;
};

const getNutrientLevelStyles = (percentage: number, label?: string) => {
    const l = label?.toLowerCase() || '';
    const isLimit = l.includes('sugar');
    const isStrictCurve = l.includes('sodium') || l.includes('vitamin d');
    const isAbundance = l.includes('potassium') || l.includes('iron') || l.includes('vitamin a');

    let color: 'green' | 'emerald' | 'blue' | 'yellow' | 'orange' | 'red' = 'red';

    if (isLimit) {
        if (percentage <= 50) color = 'green';
        else if (percentage <= 75) color = 'blue';
        else if (percentage <= 90) color = 'yellow';
        else if (percentage <= 100) color = 'orange';
        else color = 'red';
    } else if (isAbundance) {
        if (percentage >= 150) color = 'emerald';
        else if (percentage >= 120) color = 'emerald';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    } else if (isStrictCurve) {
        if (percentage > 200) color = 'red';
        else if (percentage > 150) color = 'orange';
        else if (percentage > 120) color = 'yellow';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    } else {
        if (percentage >= 150) color = 'emerald';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    }

    const map = {
        emerald: { bg: 'bg-emerald-800', border: 'border-emerald-800', borderLight: 'border-emerald-800/30 dark:border-emerald-400/20', text: 'text-emerald-900 dark:text-emerald-400', textFill: 'text-white', fade: 'bg-emerald-50 dark:bg-emerald-950/20' },
        green: { bg: 'bg-green-700', border: 'border-green-700', borderLight: 'border-green-700/30 dark:border-green-400/20', text: 'text-green-800 dark:text-green-400', textFill: 'text-white', fade: 'bg-green-50 dark:bg-green-950/20' },
        blue: { bg: 'bg-blue-700', border: 'border-blue-700', borderLight: 'border-blue-700/30 dark:border-blue-400/20', text: 'text-blue-800 dark:text-blue-400', textFill: 'text-white', fade: 'bg-blue-50 dark:bg-blue-950/20' },
        yellow: { bg: 'bg-amber-500', border: 'border-amber-500', borderLight: 'border-amber-500/30 dark:border-amber-400/20', text: 'text-amber-800 dark:text-amber-400', textFill: 'text-white', fade: 'bg-amber-50 dark:bg-amber-950/20' },
        orange: { bg: 'bg-orange-700', border: 'border-orange-700', borderLight: 'border-orange-700/30 dark:border-orange-400/20', text: 'text-orange-800 dark:text-orange-400', textFill: 'text-white', fade: 'bg-orange-50 dark:bg-orange-950/20' },
        red: { bg: 'bg-red-700', border: 'border-red-700', borderLight: 'border-red-700/30 dark:border-red-400/20', text: 'text-red-800 dark:text-red-400', textFill: 'text-white', fade: 'bg-red-50 dark:bg-red-950/20' },
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
                        <p className="text-muted-foreground text-sm italic">No Miracle products in this plan.</p>
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
    const [activeBoostContext, setActiveBoostContext] = useState<'daily' | 'recipe' | null>(null);

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
                return mkL.includes(bNum);
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

    const MORINGA_TSP = {
        energy_kcal: 5.00,
        energy_kj: 20.93,
        protein_g: 0.50,
        carbs_g: 0.80,
        fat_g: 0.05,
        micronutrients: {
            'Vitamin A': 112.50,
            'Vitamin C': 4.50,
            'B1 (Thiamine)': 0.05,
            'B2 (Riboflavin)': 0.41,
            'B3 (Niacin)': 0.20,
            'Calcium': 40.00,
            'Iron': 0.76,
            'Magnesium': 7.35,
            'Potassium': 26.50,
            'Sodium': 0.50,
            'Fiber': 0.80
        }
    };

    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const [mealsCount, setMealsCount] = useState(3);
    const { energyUnit: unit, setEnergyUnit: setUnit } = useUserPreferences();

    const [goal, setGoal] = useState<GoalType>('maintain');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');

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
                numMeals: 3
            });
            setPlan(newPlan);
            setStep(3);
        } catch (error) {
            console.error("Failed to generate plan:", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleNextStep = () => {
        const w = Number(weight) || 70;
        const h = Number(height) || 170;
        const a = Number(age) || 30;

        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        if (gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }

        let tdee = bmr;
        switch (activityLevel) {
            case 'sedentary': tdee = bmr * 1.2; break;
            case 'light': tdee = bmr * 1.375; break;
            case 'moderate': tdee = bmr * 1.55; break;
            case 'active': tdee = bmr * 1.725; break;
            default: tdee = bmr * 1.2;
        }

        if (goal === 'lose-fat') tdee *= 0.80;
        if (goal === 'build-muscle') tdee *= 1.10;

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
                updatedPlan.recipeMicronutrients = { ...(prevPlan.recipeMicronutrients || {}) };

                if (mealType === 'breakfast') updatedPlan.breakfast = newRecipe;
                else if (mealType === 'lunch') updatedPlan.lunch = newRecipe;
                else if (mealType === 'dinner') updatedPlan.dinner = newRecipe;

                updatedPlan.recipeMicronutrients[newRecipe.id] = newMicros;

                updatedPlan.totalCalories = updatedPlan.breakfast.calories + updatedPlan.lunch.calories + updatedPlan.dinner.calories + updatedPlan.snacks.reduce((acc, s) => acc + s.calories, 0);
                updatedPlan.totalEnergyKj = (updatedPlan.breakfast.energyKj || 0) + (updatedPlan.lunch.energyKj || 0) + (updatedPlan.dinner.energyKj || 0) + updatedPlan.snacks.reduce((acc, s) => acc + (s.energyKj || 0), 0);

                updatedPlan.macros = {
                    protein: updatedPlan.breakfast.protein + updatedPlan.lunch.protein + updatedPlan.dinner.protein + updatedPlan.snacks.reduce((acc, s) => acc + s.protein, 0),
                    carbs: updatedPlan.breakfast.carbs + updatedPlan.lunch.carbs + updatedPlan.dinner.carbs + updatedPlan.snacks.reduce((acc, s) => acc + s.carbs, 0),
                    fat: updatedPlan.breakfast.fat + updatedPlan.lunch.fat + updatedPlan.dinner.fat + updatedPlan.snacks.reduce((acc, s) => acc + s.fat, 0),
                };

                const newAggregatedMicros: Record<string, number> = {};

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

            const updateRecipeInPlan = (r: Recipe) => r.id === recipeId ? { ...r, servings: newServings } : r;

            updated.breakfast = updateRecipeInPlan(updated.breakfast);
            updated.lunch = updateRecipeInPlan(updated.lunch);
            updated.dinner = updateRecipeInPlan(updated.dinner);
            updated.snacks = updated.snacks.map(updateRecipeInPlan);

            const getField = (r: Recipe, field: 'calories' | 'protein' | 'carbs' | 'fat') => (r[field] || 0) * (r.servings || 1);

            updated.totalCalories = getField(updated.breakfast, 'calories') + getField(updated.lunch, 'calories') + getField(updated.dinner, 'calories') + updated.snacks.reduce((acc, s) => acc + getField(s, 'calories'), 0);

            updated.macros = {
                protein: getField(updated.breakfast, 'protein') + getField(updated.lunch, 'protein') + getField(updated.dinner, 'protein') + updated.snacks.reduce((acc, s) => acc + getField(s, 'protein'), 0),
                carbs: getField(updated.breakfast, 'carbs') + getField(updated.lunch, 'carbs') + getField(updated.dinner, 'carbs') + updated.snacks.reduce((acc, s) => acc + getField(s, 'carbs'), 0),
                fat: getField(updated.breakfast, 'fat') + getField(updated.lunch, 'fat') + getField(updated.dinner, 'fat') + updated.snacks.reduce((acc, s) => acc + getField(s, 'fat'), 0),
            };

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

    const displayCalories = unit === 'kJ' ? Math.round(calories * CAL_TO_KJ) : calories;
    const minCal = 1200;
    const maxCal = 4000;
    const displayMin = unit === 'kJ' ? Math.round(minCal * CAL_TO_KJ) : minCal;
    const displayMax = unit === 'kJ' ? Math.round(maxCal * CAL_TO_KJ) : maxCal;

    const isFormComplete = Boolean(age && weight && height);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Header />

            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">

                    {step !== 3 && (
                        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h1 className="text-4xl font-serif font-bold mb-4">Miracle Meal Planner</h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Generate a personalized daily meal plan in seconds.
                            </p>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden min-h-[600px]">

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

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Energy Unit</Label>
                                    <div className="flex w-full bg-muted rounded-lg p-1 h-10 border border-muted-foreground/10">
                                        <button
                                            onClick={() => setUnit('kJ')}
                                            className={cn(
                                                "flex-1 text-xs font-bold rounded-md transition-all",
                                                unit === 'kJ'
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : "text-muted-foreground hover:bg-background/50"
                                            )}
                                        >
                                            Kilojoules (kJ)
                                        </button>
                                        <button
                                            onClick={() => setUnit('kcal')}
                                            className={cn(
                                                "flex-1 text-xs font-bold rounded-md transition-all",
                                                unit === 'kcal'
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : "text-muted-foreground hover:bg-background/50"
                                            )}
                                        >
                                            Calories (kcal)
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button size="lg" onClick={handleNextStep} className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                                        {isFormComplete ? "Generate My Plan" : "Just Show Me The Recipes"} <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

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

                        {step === 3 && plan && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <div className="flex flex-wrap justify-center gap-6">
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)]">
                                        <RecipeCard
                                            recipe={plan.breakfast}
                                            mealLabel="Breakfast"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.breakfast)}
                                            onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)]">
                                        <RecipeCard
                                            recipe={plan.lunch}
                                            mealLabel="Lunch"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.lunch)}
                                            onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)]">
                                        <RecipeCard
                                            recipe={plan.dinner}
                                            mealLabel="Dinner"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.dinner)}
                                            onRegenerate={() => handleRegenerateMeal('dinner', plan.dinner.id)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center p-6 bg-muted/10 rounded-2xl border border-dashed border-border/50">
                                    <Button onClick={() => setStep(1)} variant="outline" size="sm" className="gap-2 border-muted-foreground/20 text-muted-foreground hover:bg-background">
                                        Start Over
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />

            {selectedRecipe && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
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

                        {selectedRecipe.image && (
                            <div className="aspect-video relative bg-muted">
                                <img
                                    src={selectedRecipe.image}
                                    alt={selectedRecipe.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold mb-3">Nutrition Facts</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Energy</span>
                                    </div>
                                    <div className="text-lg font-bold">
                                        {unit === 'kJ'
                                            ? Math.round((selectedRecipe.energyKj || 0) * (selectedRecipe.servings || 1)).toLocaleString()
                                            : Math.round(selectedRecipe.calories * (selectedRecipe.servings || 1)).toLocaleString()
                                        }
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">{unit}</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Beef className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Protein</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.protein * (selectedRecipe.servings || 1)).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Wheat className="h-4 w-4 text-amber-600" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Carbs</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.carbs * (selectedRecipe.servings || 1)).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Droplet className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Fat</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.fat * (selectedRecipe.servings || 1)).toFixed(1)}g</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Utensils className="h-5 w-5" />
                                        Adjust Servings
                                    </h3>
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

                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <ShoppingBasket className="h-5 w-5" />
                                Ingredients
                            </h3>
                            <ul className="space-y-2">
                                {selectedRecipe.ingredients.map((ing, i) => {
                                    const servingsFactor = selectedRecipe.servings || 1;
                                    const scaledAmount = scaleIngredient(ing.amount, servingsFactor);
                                    const displayName = /^\d+$/.test(ing.item) && ing.baseIngredient ? ing.baseIngredient : ing.item;

                                    return (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                            <div className="flex-1">
                                                <span className="font-medium capitalize">{displayName}</span>
                                                <span className="text-muted-foreground italic ml-1 text-sm">
                                                    {scaledAmount.trim() ? ` - ${scaledAmount}` : ""}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

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
            )}
        </main>
    );
}
