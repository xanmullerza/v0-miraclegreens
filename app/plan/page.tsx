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
        // Safe plant nutrients - excess is rewarded, not penalized
        if (percentage >= 150) color = 'emerald';       // Super-Optimal abundance
        else if (percentage >= 120) color = 'emerald';  // Abundance
        else if (percentage >= 100) color = 'green';    // Perfect baseline
        else if (percentage >= 70) color = 'blue';      // Optimal zone (70-100%)
        else if (percentage >= 50) color = 'yellow';    // Low
        else if (percentage >= 35) color = 'orange';    // Very low
        else color = 'red';                             // Critical deficiency
    } else if (isStrictCurve) {
        // Essential but toxic in excess (Strict Bell Curve logic for Sodium/VitD)
        if (percentage > 200) color = 'red';           // Extreme excess
        else if (percentage > 150) color = 'orange';    // Significant excess
        else if (percentage > 120) color = 'yellow';    // Approaching upper limit
        else if (percentage >= 100) color = 'green';    // Perfect
        else if (percentage >= 70) color = 'blue';      // Optimal zone (70-100%)
        else if (percentage >= 50) color = 'yellow';    // Low
        else if (percentage >= 35) color = 'orange';    // Very low
        else color = 'red';                             // Critical deficiency
    } else {
        // Standard Nutrients (Reaching 100% is the goal, excess is fine)
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
    const [activeBoostContext, setActiveBoostContext] = useState<'daily' | 'recipe' | null>(null);

    /**
     * Helper to find a matching nutrient key in a record, 
     * handling full names, snake_case, and common abbreviations.
     */
    const findNutrientMatch = (record: Record<string, any>, key: string) => {
        const mKeys = Object.keys(record);
        const kL = key.toLowerCase();

        // 1. Exact match (case insensitive)
        const exact = mKeys.find(mk => mk.toLowerCase() === kL);
        if (exact) return exact;

        // 2. Specific Vitamin Handling (Strict Regex to avoid "Vitamin A" matching "Vitamin C")
        if (kL.includes('vitamin')) {
            const letter = kL.split(' ')[1]?.toLowerCase(); // "a", "c", "d", etc.
            if (letter && letter.length === 1) {
                const match = mKeys.find(mk => {
                    const mkL = mk.toLowerCase();
                    return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
                });
                if (match) return match;
            }
        }

        // 3. B-Vitamins (B1, B2, B3, etc. or names like Thiamine)
        if (kL.startsWith('b') && /\b[b]\d+\b/.test(kL)) {
            const bNum = kL.split(' ')[0].toLowerCase(); // "b1", "b2"
            const match = mKeys.find(mk => {
                const mkL = mk.toLowerCase();
                return mkL.includes(bNum) || (kL.includes('thiamine') && mkL.includes('thiamine')) || (kL.includes('riboflavin') && mkL.includes('riboflavin'));
            });
            if (match) return match;
        }

        // 4. Substring match for minerals (e.g. 'calcium' matches 'calcium_mg')
        const firstWord = kL.split(' ')[0];
        if (firstWord.length > 3) {
            const fuzzy = mKeys.find(mk => mk.toLowerCase().includes(firstWord));
            if (fuzzy) return fuzzy;
        }

        return null;
    };

    // Standard 1 tsp (2g) Moringa Nutrition (Calculated from 100g data)
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

    // Form State
    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const [mealsCount, setMealsCount] = useState(3);
    const { energyUnit: unit, setEnergyUnit: setUnit } = useUserPreferences();

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
                updatedPlan.totalEnergyKj = (updatedPlan.breakfast.energyKj || 0) + (updatedPlan.lunch.energyKj || 0) + (updatedPlan.dinner.energyKj || 0) + updatedPlan.snacks.reduce((acc, s) => acc + (s.energyKj || 0), 0);

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
                                    {/* Combined Essential Nutrients Report */}
                                    <div className="space-y-4">
                                        {!showDailyNutrients ? (
                                            <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
                                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                    <LayoutGrid className="h-8 w-8 text-primary" />
                                                </div>
                                                <h3 className="text-xl font-bold text-foreground mb-2">Essential Nutrient Report</h3>
                                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                                                    Explore your complete daily nutritional breakdown, including macros and over 50 essential vitamins and minerals.
                                                </p>
                                                <Button
                                                    onClick={() => setShowDailyNutrients(true)}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Expand Daily Report
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                                {/* Expanded Header */}
                                                <div className="flex items-center justify-between border-b border-border pb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                                            <LayoutGrid className="h-6 w-6 text-primary" />
                                                            Daily Essential Nutrients
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Comprehensive Daily Breakdown</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowDailyNutrients(false)}
                                                        className="gap-2 border-border hover:bg-muted text-muted-foreground font-bold"
                                                    >
                                                        <ChevronDown className="h-4 w-4 rotate-180" />
                                                        Collapse
                                                    </Button>
                                                </div>

                                                {/* Macros Section */}
                                                {(() => {
                                                    const targetCals = calories;
                                                    const pRatio = goal === 'lose-fat' ? 0.30 : goal === 'build-muscle' ? 0.25 : 0.20;
                                                    const cRatio = goal === 'lose-fat' ? 0.40 : goal === 'build-muscle' ? 0.50 : 0.50;
                                                    const fRatio = goal === 'lose-fat' ? 0.30 : goal === 'build-muscle' ? 0.25 : 0.30;

                                                    const targets = {
                                                        energy: unit === 'kJ' ? targetCals * CAL_TO_KJ : targetCals,
                                                        protein: (targetCals * pRatio) / 4,
                                                        carbs: (targetCals * cRatio) / 4,
                                                        fat: (targetCals * fRatio) / 9
                                                    };

                                                    const current = {
                                                        energy: unit === 'kJ'
                                                            ? plan.totalEnergyKj + ((dailyMoringaGrams / 2) * MORINGA_TSP.energy_kj)
                                                            : plan.totalCalories + ((dailyMoringaGrams / 2) * MORINGA_TSP.energy_kcal),
                                                        protein: plan.macros.protein + ((dailyMoringaGrams / 2) * MORINGA_TSP.protein_g),
                                                        carbs: plan.macros.carbs + ((dailyMoringaGrams / 2) * MORINGA_TSP.carbs_g),
                                                        fat: plan.macros.fat + ((dailyMoringaGrams / 2) * MORINGA_TSP.fat_g)
                                                    };

                                                    const formatEnergyValue = (val: number, u: string) => {
                                                        return val; // current object already handles unit conversion
                                                    };

                                                    return (
                                                        <div className="p-5 rounded-2xl border border-border bg-card/50 shadow-sm space-y-4">
                                                            <h4 className="font-bold text-md text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                                                                <Activity className="h-5 w-5 text-primary" />
                                                                Main Macronutrients
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
                                                                                    <span className="text-[10px] uppercase font-semibold text-foreground tracking-widest">{macro.label}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    {BOOSTABLE_NUTRIENTS.includes(macro.label) && (
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setActiveBoostContext('daily');
                                                                                            }}
                                                                                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full p-1 transition-all border border-green-100 dark:border-green-800/30 hover:scale-110 active:scale-95"
                                                                                            title="Add Miracle Boost"
                                                                                        >
                                                                                            <Sparkles className="h-4 w-4" />
                                                                                        </button>
                                                                                    )}
                                                                                    <div className="text-primary/40 bg-muted/50 rounded-full p-1 transition-all hover:text-primary hover:bg-primary/5">
                                                                                        <Info className="h-4 w-4" />
                                                                                    </div>
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
                                                                                <span className="text-sm font-medium text-foreground/70">
                                                                                    / {macro.unit === 'kcal' || macro.unit === 'kJ'
                                                                                        ? Math.round(formatEnergyValue(macro.target, macro.unit))
                                                                                        : macro.target.toFixed(0)}{macro.unit}
                                                                                </span>
                                                                                {isEnergy && (
                                                                                    <RefreshCw className="h-2 w-2 text-muted-foreground/30 group-hover/value:text-primary transition-colors ml-0.5" />
                                                                                )}
                                                                            </div>
                                                                            <div className="mt-auto pt-2 border-t border-border/10 flex items-center justify-between gap-2">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className={cn("text-xs font-black px-2 py-0.5 rounded bg-muted/50", styles.text)}>{pct}%</span>
                                                                                </div>
                                                                                {macro.label !== 'Energy' && (() => {
                                                                                    const grams = dailyMoringaGrams;
                                                                                    const ratio = grams / 2;
                                                                                    const boostVal = macro.label === 'Protein' ? 0.5 * ratio :
                                                                                        macro.label === 'Carbs' ? 0.8 * ratio :
                                                                                            macro.label === 'Fat' ? 0.05 * ratio : 0;
                                                                                    const boostPct = Math.round((boostVal / macro.target) * 100);
                                                                                    if (boostPct > 0) return (
                                                                                        <span className="text-sm font-black text-white bg-green-600 px-2.5 py-1 rounded-lg shadow-lg shadow-green-500/20 animate-in fade-in zoom-in-50">
                                                                                            +{boostPct}%
                                                                                        </span>
                                                                                    );
                                                                                    return null;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Micros Content */}
                                                {plan.micronutrients && (() => {
                                                    const m = { ...plan.micronutrients };

                                                    // Apply Daily Moringa Boost
                                                    if (dailyMoringaGrams > 0) {
                                                        const ratio = dailyMoringaGrams / 2;
                                                        Object.entries(MORINGA_TSP.micronutrients).forEach(([key, value]) => {
                                                            const match = findNutrientMatch(m, key);
                                                            if (match) {
                                                                m[match] = (m[match] || 0) + (value * ratio);
                                                            } else {
                                                                m[key] = value * ratio;
                                                            }
                                                        });
                                                    }

                                                    // Helper to extract nutrients from diverse JSONB structures
                                                    const n = (data: Record<string, number>, keys: string[]) => {
                                                        for (const k of keys) {
                                                            if (data[k] !== undefined) return data[k];
                                                        }
                                                        return 0;
                                                    };

                                                    // Categorize nutrients
                                                    const metabolicFuel: Record<string, number> = {
                                                        'B1 (Thiamine)': n(m, ['B1 (Thiamine)', 'thiamine_mg']),
                                                        'B2 (Riboflavin)': n(m, ['B2 (Riboflavin)', 'riboflavin_mg']),
                                                        'B3 (Niacin)': n(m, ['B3 (Niacin)', 'niacin_mg']),
                                                        'B5 (Pantothenic Acid)': n(m, ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg']),
                                                        'Manganese': n(m, ['Manganese', 'manganese_mg']),
                                                    };

                                                    const cognitiveFocus: Record<string, number> = {
                                                        'B6 (Pyridoxine)': n(m, ['B6 (Pyridoxine)', 'vitamin_b6_mg']),
                                                        'Choline': n(m, ['Choline', 'choline_mg']),
                                                        'Magnesium': n(m, ['Magnesium', 'magnesium_mg']),
                                                        'Copper': n(m, ['Copper', 'copper_mg']),
                                                    };

                                                    const bloodDNA: Record<string, number> = {
                                                        'Iron': n(m, ['Iron', 'iron_mg']),
                                                        'B9 (Folate)': n(m, ['B9 (Folate)', 'folate_ug']),
                                                        'B12 (Cobalamin)': n(m, ['B12 (Cobalamin)', 'vitamin_b12_ug']),
                                                    };

                                                    const skeletalHealth: Record<string, number> = {
                                                        'Calcium': n(m, ['Calcium', 'calcium_mg', 'calcium_ca']),
                                                        'Phosphorus': n(m, ['Phosphorus', 'phosphorus_mg', 'phosphorus_p']),
                                                        'Vitamin D': n(m, ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug', 'vitamin_d3_ug']),
                                                        'Vitamin K': n(m, ['Vitamin K', 'vitamin_k_ug', 'vitamin_k1_ug']),
                                                    };

                                                    const electrolytes: Record<string, number> = {
                                                        'Potassium': n(m, ['Potassium', 'potassium_mg', 'potassium_k']),
                                                        'Sodium': n(m, ['Sodium', 'sodium_mg', 'Sodium']),
                                                    };

                                                    const immuneShield: Record<string, number> = {
                                                        'Vitamin A': n(m, ['Vitamin A', 'vitamin_a_ug']),
                                                        'Vitamin C': n(m, ['Vitamin C', 'vitamin_c_mg']),
                                                        'Vitamin E': n(m, ['Vitamin E', 'vitamin_e_mg']),
                                                        'Zinc': n(m, ['Zinc', 'zinc_mg']),
                                                        'Selenium': n(m, ['Selenium', 'selenium_ug']),
                                                    };

                                                    const other: Record<string, number> = {
                                                        'Fiber': n(m, ['Fiber', 'fiber_g']),
                                                    };

                                                    const DailyNutrientGrid = ({ nutrients, title, icon: Icon }: { nutrients: Record<string, number>, title: string, icon: any }) => {
                                                        const filtered = Object.entries(nutrients);
                                                        if (filtered.length === 0) return null;

                                                        return (
                                                            <div className="p-5 rounded-2xl border border-border bg-card/50 shadow-sm space-y-4">
                                                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                                                    <h4 className="font-bold text-md text-foreground flex items-center gap-2">
                                                                        <Icon className="h-5 w-5 text-primary" />
                                                                        {title}
                                                                    </h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-tighter bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-800/30 flex items-center gap-1">
                                                                            <Sparkles className="h-2.5 w-2.5" />
                                                                            Boostable
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                                    {filtered.map(([label, value]) => {
                                                                        let unitDisplay = 'mg';
                                                                        const labelLower = label.toLowerCase();
                                                                        if (labelLower.includes('vitamin a') || labelLower.includes('folate') || labelLower.includes('selenium') || labelLower.includes('b12') || labelLower.includes('vitamin k')) unitDisplay = 'µg';
                                                                        if (labelLower.includes('vitamin d')) unitDisplay = 'IU';
                                                                        if (labelLower.includes('fiber')) unitDisplay = 'g';
                                                                        if (labelLower.includes('energy')) unitDisplay = unit === 'kJ' ? 'kJ' : 'kcal';

                                                                        let valueDisplay = value;
                                                                        if (labelLower.includes('energy') && unit === 'kJ') {
                                                                            valueDisplay = value * CAL_TO_KJ;
                                                                        }

                                                                        const rdaValue = userRDAs?.[label];
                                                                        const percentage = rdaValue ? Math.round((value / rdaValue) * 100) : null;
                                                                        const styles = getNutrientLevelStyles(percentage || 0, label);

                                                                        // Calculate Moringa Boost for this specific nutrient
                                                                        const getBoost = () => {
                                                                            if (dailyMoringaGrams <= 0) return 0;
                                                                            const ratio = dailyMoringaGrams / 2;
                                                                            const mapping: Record<string, any> = {
                                                                                'Potassium': MORINGA_TSP.micronutrients['Potassium'],
                                                                                'Magnesium': MORINGA_TSP.micronutrients['Magnesium'],
                                                                                'Calcium': MORINGA_TSP.micronutrients['Calcium'],
                                                                                'Sodium': MORINGA_TSP.micronutrients['Sodium'],
                                                                                'Iron': MORINGA_TSP.micronutrients['Iron'],
                                                                                'Vitamin A': MORINGA_TSP.micronutrients['Vitamin A'],
                                                                                'B1 (Thiamine)': MORINGA_TSP.micronutrients['B1 (Thiamine)'],
                                                                                'B2 (Riboflavin)': MORINGA_TSP.micronutrients['B2 (Riboflavin)'],
                                                                                'B3 (Niacin)': MORINGA_TSP.micronutrients['B3 (Niacin)'],
                                                                                'Vitamin C': MORINGA_TSP.micronutrients['Vitamin C'],
                                                                                'Fiber': MORINGA_TSP.micronutrients['Fiber'],
                                                                                'Protein': MORINGA_TSP.protein_g,
                                                                                'Carbs': MORINGA_TSP.carbs_g,
                                                                                'Fat': MORINGA_TSP.fat_g,
                                                                                'Energy': unit === 'kJ' ? MORINGA_TSP.energy_kj : MORINGA_TSP.energy_kcal
                                                                            };
                                                                            const baseVal = mapping[label];
                                                                            if (baseVal === undefined) return 0;
                                                                            return baseVal * ratio;
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
                                                                                <div className="min-w-0 pb-1">
                                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                                        <p className="text-[10px] uppercase font-bold text-foreground/80 truncate tracking-tight">{label}</p>
                                                                                        <div className="flex items-center gap-1">
                                                                                            {BOOSTABLE_NUTRIENTS.includes(label) && (
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        setActiveBoostContext('daily');
                                                                                                    }}
                                                                                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full p-0.5 transition-all border border-green-100 dark:border-green-800/30 hover:scale-110 active:scale-95"
                                                                                                    title="Add Miracle Boost"
                                                                                                >
                                                                                                    <Sparkles className="h-3.5 w-3.5" />
                                                                                                </button>
                                                                                            )}
                                                                                            <div className="text-primary/40 bg-muted/50 rounded-full p-0.5 transition-all hover:text-primary hover:bg-primary/5">
                                                                                                <Info className="h-4 w-4" />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-baseline flex-wrap gap-x-1">
                                                                                        <span className="text-xl font-bold">
                                                                                            {valueDisplay >= 1 ? valueDisplay.toFixed(1) : valueDisplay.toFixed(2)}
                                                                                        </span>
                                                                                        <span className="text-[10px] font-medium text-muted-foreground">{unitDisplay}</span>
                                                                                        {rdaValue && (
                                                                                            <span className="text-sm font-medium text-foreground/70">
                                                                                                / {rdaValue >= 1 ? Math.round(rdaValue) : rdaValue.toFixed(1)}{unitDisplay}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {percentage !== null && (
                                                                                    <div className="mt-auto pt-2 border-t border-border/10 flex items-center justify-between gap-2">
                                                                                        <span className={cn(
                                                                                            "px-2 py-0.5 rounded bg-muted/50 text-xs font-black",
                                                                                            styles.text
                                                                                        )}>
                                                                                            {percentage}%
                                                                                        </span>
                                                                                        {boostValue > 0 && (
                                                                                            <span className="text-sm font-black text-white bg-green-600 px-2.5 py-1 rounded-lg shadow-lg shadow-green-500/20 animate-in fade-in zoom-in-50">
                                                                                                +{boostPct}%
                                                                                            </span>
                                                                                        )}
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
                                                        <div className="space-y-6">
                                                            <DailyNutrientGrid nutrients={metabolicFuel} title="Energy & Vitality" icon={Flame} />
                                                            <DailyNutrientGrid nutrients={immuneShield} title="Immune Defense" icon={Shield} />
                                                            <DailyNutrientGrid nutrients={skeletalHealth} title="Strong Foundations" icon={Dumbbell} />
                                                            <DailyNutrientGrid nutrients={cognitiveFocus} title="Mental Clarity" icon={Activity} />
                                                            <DailyNutrientGrid nutrients={bloodDNA} title="Blood & Repair" icon={Droplet} />
                                                            <DailyNutrientGrid nutrients={electrolytes} title="Hydration Balance" icon={Zap} />
                                                            <DailyNutrientGrid nutrients={other} title="Daily Digestion" icon={Leaf} />

                                                            {/* Collapse Report Button at the bottom */}
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setShowDailyNutrients(false);
                                                                    // Scroll up to the combined section header if needed
                                                                }}
                                                                className="w-full py-2 mt-4 hover:bg-muted/50 text-muted-foreground gap-2 text-xs uppercase tracking-widest font-bold border-t border-border/50 rounded-none"
                                                            >
                                                                <ChevronDown className="h-4 w-4 rotate-180" />
                                                                Collapse Essential Report
                                                            </Button>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center p-6 bg-muted/10 rounded-2xl border border-dashed border-border/50">
                                        <Button onClick={() => setStep(1)} variant="outline" size="sm" className="gap-2 border-muted-foreground/20 text-muted-foreground hover:bg-background">
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

            {/* Miracle Boost Overlay */}
            {activeBoostContext && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setActiveBoostContext(null)}>
                    <div
                        className="bg-background rounded-[32px] max-w-sm w-full p-8 shadow-2xl border border-border animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <Sparkles className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground">
                                {activeBoostContext === 'daily' ? "Daily Miracle Boost" : "Recipe Miracle Boost"}
                            </h3>
                            <p className="text-sm text-balance text-muted-foreground px-4">
                                {activeBoostContext === 'daily'
                                    ? "Supercharge your entire day with Miracle Greens Moringa powder."
                                    : "Supercharge this specific meal with a concentrated nutrients boost."}
                            </p>

                            <div className="py-6">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="flex items-center bg-muted/50 p-1.5 rounded-2xl border border-border/50">
                                        {[0, 1, 2, 3, 4, 5].map(spoons => {
                                            const g = spoons * 2;
                                            const contextGrams = activeBoostContext === 'daily' ? dailyMoringaGrams : recipeMoringaGrams;
                                            const isActive = contextGrams === g;
                                            return (
                                                <button
                                                    key={spoons}
                                                    onClick={() => activeBoostContext === 'daily' ? setDailyMoringaGrams(g) : setRecipeMoringaGrams(g)}
                                                    className={cn(
                                                        "w-10 h-10 flex flex-col items-center justify-center transition-all rounded-xl",
                                                        isActive
                                                            ? "bg-green-600 text-white shadow-lg scale-110"
                                                            : "text-muted-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    <span className="text-sm font-bold">{spoons}</span>
                                                    <span className="text-[8px] uppercase font-black opacity-60">tsp</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative group">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={activeBoostContext === 'daily' ? dailyMoringaGrams : recipeMoringaGrams}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (activeBoostContext === 'daily') setDailyMoringaGrams(val);
                                                    else setRecipeMoringaGrams(val);
                                                }}
                                                className="w-24 h-12 text-center text-lg font-black border-2 border-green-100 focus:border-green-500 rounded-xl bg-background"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-green-600">g</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 rounded-2xl text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 active:scale-[0.98] transition-all"
                                onClick={() => setActiveBoostContext(null)}
                            >
                                Confirm Boost
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <div className="text-lg font-bold">
                                        {unit === 'kJ'
                                            ? Math.round(((selectedRecipe.energyKj || 0) * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.energy_kj)).toLocaleString()
                                            : Math.round((selectedRecipe.calories * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.energy_kcal)).toLocaleString()
                                        }
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase">{unit}</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50 relative group/macro-card cursor-pointer hover:bg-muted/80 transition-all" onClick={() => setActiveBoostContext('recipe')}>
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Beef className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Protein</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.protein * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.protein_g)).toFixed(1)}g</div>
                                    {recipeMoringaGrams > 0 && (
                                        <div className="absolute -top-2 -right-1 bg-green-600 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm">
                                            +{Math.round(((recipeMoringaGrams / 2) * MORINGA_TSP.protein_g))}g BOOST
                                        </div>
                                    )}
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50 relative group/macro-card cursor-pointer hover:bg-muted/80 transition-all" onClick={() => setActiveBoostContext('recipe')}>
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Wheat className="h-4 w-4 text-amber-600" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Carbs</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.carbs * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.carbs_g)).toFixed(1)}g</div>
                                    {recipeMoringaGrams > 0 && (
                                        <div className="absolute -top-2 -right-1 bg-green-600 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm">
                                            +{Math.round(((recipeMoringaGrams / 2) * MORINGA_TSP.carbs_g))}g BOOST
                                        </div>
                                    )}
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg border border-border/50 relative group/macro-card cursor-pointer hover:bg-muted/80 transition-all" onClick={() => setActiveBoostContext('recipe')}>
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Droplet className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Fat</span>
                                    </div>
                                    <div className="text-lg font-bold">{(Number(selectedRecipe.fat * (selectedRecipe.servings || 1)) + ((recipeMoringaGrams / 2) * MORINGA_TSP.fat_g)).toFixed(1)}g</div>
                                    {recipeMoringaGrams > 0 && (
                                        <div className="absolute -top-2 -right-1 bg-green-600 text-white text-[7px] font-black px-1 py-0.5 rounded shadow-sm">
                                            +{Math.round(((recipeMoringaGrams / 2) * MORINGA_TSP.fat_g * 10)) / 10}g BOOST
                                        </div>
                                    )}
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
                                        const match = findNutrientMatch(m, key);
                                        if (match) {
                                            m[match] = (m[match] || 0) + (value * ratio);
                                        } else {
                                            m[key] = value * ratio;
                                        }
                                    });
                                }

                                // Helper for modal view nutrients
                                const n = (data: Record<string, number>, keys: string[]) => {
                                    for (const k of keys) {
                                        if (data[k] !== undefined) return data[k];
                                    }
                                    return 0;
                                };

                                const metabolicFuel: Record<string, number> = {
                                    'B1 (Thiamine)': n(m, ['B1 (Thiamine)', 'thiamine_mg']),
                                    'B2 (Riboflavin)': n(m, ['B2 (Riboflavin)', 'riboflavin_mg']),
                                    'B3 (Niacin)': n(m, ['B3 (Niacin)', 'niacin_mg']),
                                    'B5 (Pantothenic Acid)': n(m, ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg']),
                                    'Manganese': n(m, ['Manganese', 'manganese_mg']),
                                };

                                const cognitiveFocus: Record<string, number> = {
                                    'B6 (Pyridoxine)': n(m, ['B6 (Pyridoxine)', 'vitamin_b6_mg']),
                                    'Choline': n(m, ['Choline', 'choline_mg']),
                                    'Magnesium': n(m, ['Magnesium', 'magnesium_mg']),
                                    'Copper': n(m, ['Copper', 'copper_mg']),
                                };

                                const bloodDNA: Record<string, number> = {
                                    'Iron': n(m, ['Iron', 'iron_mg']),
                                    'B9 (Folate)': n(m, ['B9 (Folate)', 'folate_ug']),
                                    'B12 (Cobalamin)': n(m, ['B12 (Cobalamin)', 'vitamin_b12_ug']),
                                };

                                const skeletalHealth: Record<string, number> = {
                                    'Calcium': n(m, ['Calcium', 'calcium_mg', 'calcium_ca']),
                                    'Phosphorus': n(m, ['Phosphorus', 'phosphorus_mg', 'phosphorus_p']),
                                    'Vitamin D': n(m, ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug', 'vitamin_d3_ug']),
                                    'Vitamin K': n(m, ['Vitamin K', 'vitamin_k_ug', 'vitamin_k1_ug']),
                                };

                                const electrolytes: Record<string, number> = {
                                    'Potassium': n(m, ['Potassium', 'potassium_mg', 'potassium_k']),
                                    'Sodium': n(m, ['Sodium', 'sodium_mg', 'Sodium']),
                                };

                                const immuneShield: Record<string, number> = {
                                    'Vitamin A': n(m, ['Vitamin A', 'vitamin_a_ug']),
                                    'Vitamin C': n(m, ['Vitamin C', 'vitamin_c_mg']),
                                    'Vitamin E': n(m, ['Vitamin E', 'vitamin_e_mg']),
                                    'Zinc': n(m, ['Zinc', 'zinc_mg']),
                                    'Selenium': n(m, ['Selenium', 'selenium_ug']),
                                };

                                const other: Record<string, number> = {
                                    'Fiber': n(m, ['Fiber', 'fiber_g']),
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
                                                    let uDisplay = 'mg';
                                                    const labelLower = label.toLowerCase();
                                                    if (labelLower.includes('vitamin a') || labelLower.includes('folate') || labelLower.includes('selenium') || labelLower.includes('b12') || labelLower.includes('vitamin k')) uDisplay = 'µg';
                                                    if (labelLower.includes('vitamin d')) uDisplay = 'IU';
                                                    if (labelLower.includes('fiber')) uDisplay = 'g';
                                                    if (labelLower.includes('energy')) uDisplay = unit === 'kJ' ? 'kJ' : 'kcal';

                                                    let vDisplay = value;
                                                    if (labelLower.includes('energy') && unit === 'kJ') {
                                                        vDisplay = value * CAL_TO_KJ;
                                                    }

                                                    const rdaValue = userRDAs?.[label];
                                                    const percentage = rdaValue ? Math.round((value / rdaValue) * 100) : null;
                                                    const styles = getNutrientLevelStyles(percentage || 0, label);

                                                    // Calculate Moringa Boost for this specific nutrient
                                                    const getBoost = () => {
                                                        if (recipeMoringaGrams <= 0) return 0;
                                                        const ratio = recipeMoringaGrams / 2;
                                                        const mapping: Record<string, any> = {
                                                            'Potassium': MORINGA_TSP.micronutrients['Potassium'],
                                                            'Magnesium': MORINGA_TSP.micronutrients['Magnesium'],
                                                            'Calcium': MORINGA_TSP.micronutrients['Calcium'],
                                                            'Sodium': MORINGA_TSP.micronutrients['Sodium'],
                                                            'Iron': MORINGA_TSP.micronutrients['Iron'],
                                                            'Vitamin A': MORINGA_TSP.micronutrients['Vitamin A'],
                                                            'B1 (Thiamine)': MORINGA_TSP.micronutrients['B1 (Thiamine)'],
                                                            'B2 (Riboflavin)': MORINGA_TSP.micronutrients['B2 (Riboflavin)'],
                                                            'B3 (Niacin)': MORINGA_TSP.micronutrients['B3 (Niacin)'],
                                                            'Vitamin C': MORINGA_TSP.micronutrients['Vitamin C'],
                                                            'Fiber': MORINGA_TSP.micronutrients['Fiber'],
                                                            'Protein': MORINGA_TSP.protein_g,
                                                            'Carbs': MORINGA_TSP.carbs_g,
                                                            'Fat': MORINGA_TSP.fat_g,
                                                            'Energy': unit === 'kJ' ? MORINGA_TSP.energy_kj : MORINGA_TSP.energy_kcal
                                                        };
                                                        const baseVal = mapping[label];
                                                        if (baseVal === undefined) return 0;
                                                        return baseVal * ratio;
                                                    };

                                                    const boostValue = getBoost();
                                                    const boostPct = boostValue > 0 && rdaValue ? Math.round((boostValue / rdaValue) * 100) : 0;

                                                    return (
                                                        <div
                                                            key={label}
                                                            onClick={() => setSelectedNutrientInfo(label)}
                                                            className={cn(
                                                                "flex flex-col justify-between gap-2 p-3 rounded-xl border shadow-sm transition-all relative overflow-hidden cursor-pointer hover:bg-muted/5",
                                                                percentage !== null ? `${styles.borderLight} ${styles.fade}` : "bg-background border-border/40"
                                                            )}
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="flex items-center justify-between gap-1.5 mb-2">
                                                                    <p className="text-[10px] text-foreground/90 font-bold uppercase tracking-tight truncate">{label}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        {BOOSTABLE_NUTRIENTS.includes(label) && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveBoostContext('recipe');
                                                                                }}
                                                                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full p-0.5 transition-all border border-green-100 dark:border-green-800/30"
                                                                            >
                                                                                <Sparkles className="h-3 w-3" />
                                                                            </button>
                                                                        )}
                                                                        <div className="text-primary/40 transition-colors">
                                                                            <Info className="h-3 w-3" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-baseline flex-wrap gap-x-1">
                                                                    <span className="text-lg font-bold tabular-nums">
                                                                        {vDisplay >= 1 ? vDisplay.toFixed(1) : vDisplay.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-muted-foreground">{uDisplay}</span>
                                                                    {rdaValue && (
                                                                        <span className="text-[10px] font-medium text-foreground/60">
                                                                            / {rdaValue >= 1 ? Math.round(rdaValue) : rdaValue.toFixed(1)}{uDisplay}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-auto pt-2 border-t border-border/5 flex items-center justify-between gap-2">
                                                                {percentage !== null && (
                                                                    <span className={cn(
                                                                        "text-[10px] font-black px-1.5 py-0.5 rounded bg-muted/50",
                                                                        styles.text
                                                                    )}>
                                                                        {percentage}%
                                                                    </span>
                                                                )}
                                                                {boostValue > 0 && (
                                                                    <span className="text-[10px] font-black text-white bg-green-600 px-2 py-0.5 rounded shadow-sm animate-in fade-in zoom-in-50">
                                                                        +{boostPct}%
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                                recipeMoringaGrams === s * 2 ? "bg-green-600 text-white" : "hover:bg-green-50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400"
                                                            )}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-baseline gap-0.5 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded text-green-800 dark:text-green-300 font-bold text-xs">
                                                    {recipeMoringaGrams}g
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="space-y-6">
                                                <ModalNutrientGrid nutrients={metabolicFuel} title="Energy & Vitality" icon={Flame} />
                                                <ModalNutrientGrid nutrients={immuneShield} title="Immune Defense" icon={Shield} />
                                                <ModalNutrientGrid nutrients={skeletalHealth} title="Strong Foundations" icon={Dumbbell} />
                                            </div>
                                            <div className="space-y-6">
                                                <ModalNutrientGrid nutrients={cognitiveFocus} title="Mental Clarity" icon={Activity} />
                                                <ModalNutrientGrid nutrients={bloodDNA} title="Blood & Repair" icon={Droplet} />
                                                <ModalNutrientGrid nutrients={electrolytes} title="Hydration Balance" icon={Zap} />
                                                <ModalNutrientGrid nutrients={other} title="Daily Digestion" icon={Leaf} />
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
                                {selectedRecipe.ingredients.map((ing, i) => {
                                    const servingsFactor = selectedRecipe.servings || 1;
                                    const scaledAmount = scaleIngredient(ing.amount, servingsFactor);

                                    // 1. Smart Name: If item is just digits, use the baseIngredient name
                                    const displayName = /^\d+$/.test(ing.item) && ing.baseIngredient ? ing.baseIngredient : ing.item;

                                    // 2. Smart Units: Handle pluralization
                                    let unitDisp = ing.measureLabel || "";
                                    const qtyNum = parseFloat(scaledAmount.replace(/[^\d./]/g, '')) || 1;
                                    if (qtyNum > 1) {
                                        if (unitDisp.toLowerCase() === 'slice') unitDisp = 'slices';
                                        if (unitDisp.toLowerCase() === 'cup') unitDisp = 'cups';
                                    }

                                    // 3. Weight Display
                                    const rawWeight = (ing.weightG || 0) * servingsFactor;
                                    const weightDisp = rawWeight > 0
                                        ? (rawWeight < 1 ? `${rawWeight.toFixed(1)}g` : `${Math.round(rawWeight)}g`)
                                        : null;

                                    const hasAmountOrUnit = scaledAmount.trim() || unitDisp.trim();

                                    return (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                            <div className="flex-1">
                                                <span className="font-medium capitalize">{displayName}</span>
                                                <span className="text-muted-foreground italic ml-1 text-sm">
                                                    {hasAmountOrUnit ? ` - ${scaledAmount}` : ""}
                                                    {weightDisp && (
                                                        <span className="ml-1 text-[11px] opacity-70 font-mono not-italic">({weightDisp})</span>
                                                    )}
                                                </span>
                                                {ing.isMiracleProduct && (
                                                    <span className="ml-2 text-[10px] font-black uppercase tracking-tighter bg-green-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                                                        ✨ Miracle Boosted
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
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
