'use client';

import { useState } from 'react';
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
    Clock
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { DietType, Recipe } from '@/lib/data/recipes';
import { generateDailyPlan, DailyPlan, generateShoppingList, ShoppingItem, getRandomRecipeByType } from '@/lib/utils/meal-generator';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
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

const RecipeCard = ({ recipe, mealLabel, unit = 'kJ', onClick, onNutritionClick, onRegenerate }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onClick?: () => void,
    onNutritionClick?: () => void,
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
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{recipe.title}</h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {formatEnergy(recipe.calories, unit)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Beef className="h-4 w-4 text-red-500" />
                        {Number(recipe.protein).toFixed(1)}g
                    </span>
                    <span className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-yellow-500" />
                        {Number(recipe.fat).toFixed(1)}g
                    </span>
                    <span className="flex items-center gap-1">
                        <Wheat className="h-4 w-4 text-amber-600" />
                        {Number(recipe.carbs).toFixed(1)}g
                    </span>
                </div>
                <button
                    className="mt-3 w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick?.();
                    }}
                >
                    View Recipe
                </button>
                <button
                    className="mt-2 w-full py-2 px-4 bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onNutritionClick?.();
                    }}
                >
                    View Nutritional Info
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
    const [nutritionRecipe, setNutritionRecipe] = useState<Recipe | null>(null);
    const [nutritionData, setNutritionData] = useState<any>(null);
    const [loadingNutrition, setLoadingNutrition] = useState(false);
    const [moringaSpoons, setMoringaSpoons] = useState(0);

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

    const getPersonalizedRDAs = (uAge: number, uGender: 'male' | 'female', uCalories: number) => {
        // Base RDAs (Female 19-30)
        const rdas: Record<string, number> = {
            'Potassium': 2600,
            'Magnesium': 310,
            'Calcium': 1000,
            'Phosphorus': 700,
            'Sodium': 2300,
            'Iron': 18,
            'Zinc': 8,
            'Selenium': 55,
            'Copper': 0.9,
            'Manganese': 1.8,
            'Vitamin A': 700,
            'Vitamin C': 75,
            'Vitamin D': 600,
            'Vitamin E': 15,
            'Vitamin K': 90,
            'B1 (Thiamine)': 1.1,
            'B2 (Riboflavin)': 1.1,
            'B3 (Niacin)': 14,
            'B5 (Pantothenic Acid)': 5,
            'B6 (Pyridoxine)': 1.3,
            'B7 (Biotin)': 30,
            'B9 (Folate)': 400,
            'B12 (Cobalamin)': 2.4,
            'Choline': 425,
            'Fiber': (uCalories / 1000) * 14
        };

        if (uGender === 'male') {
            rdas['Potassium'] = 3400;
            rdas['Magnesium'] = 400;
            rdas['Iron'] = 8;
            rdas['Zinc'] = 11;
            rdas['Manganese'] = 2.3;
            rdas['Vitamin A'] = 900;
            rdas['Vitamin C'] = 90;
            rdas['Vitamin K'] = 120;
            rdas['B1 (Thiamine)'] = 1.2;
            rdas['B2 (Riboflavin)'] = 1.3;
            rdas['B3 (Niacin)'] = 16;
            rdas['Choline'] = 550;
        }

        if (uAge > 50) {
            rdas['Calcium'] = 1200;
            rdas['B6 (Pyridoxine)'] = uGender === 'male' ? 1.7 : 1.5;
            if (uGender === 'female') rdas['Iron'] = 8;
        }

        return rdas;
    };

    const handleRegenerate = () => {
        handleGenerate();
    };

    const handleRegenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', currentId: string) => {
        if (!plan) return;

        const newRecipe = await getRandomRecipeByType(mealType, diet, currentId);
        if (newRecipe) {
            setPlan(prevPlan => {
                if (!prevPlan) return prevPlan;

                const updatedPlan = { ...prevPlan };
                if (mealType === 'breakfast') updatedPlan.breakfast = newRecipe;
                else if (mealType === 'lunch') updatedPlan.lunch = newRecipe;
                else if (mealType === 'dinner') updatedPlan.dinner = newRecipe;

                // Recalculate totals
                updatedPlan.totalCalories = updatedPlan.breakfast.calories + updatedPlan.lunch.calories + updatedPlan.dinner.calories + updatedPlan.snacks.reduce((acc, s) => acc + s.calories, 0);
                updatedPlan.macros = {
                    protein: updatedPlan.breakfast.protein + updatedPlan.lunch.protein + updatedPlan.dinner.protein + updatedPlan.snacks.reduce((acc, s) => acc + s.protein, 0),
                    carbs: updatedPlan.breakfast.carbs + updatedPlan.lunch.carbs + updatedPlan.dinner.carbs + updatedPlan.snacks.reduce((acc, s) => acc + s.carbs, 0),
                    fat: updatedPlan.breakfast.fat + updatedPlan.lunch.fat + updatedPlan.dinner.fat + updatedPlan.snacks.reduce((acc, s) => acc + s.fat, 0),
                };

                return updatedPlan;
            });
        }
    };

    const handleShowNutrition = async (recipe: Recipe) => {
        setNutritionRecipe(recipe);
        setLoadingNutrition(true);

        try {
            // Fetch recipe with full ingredient and food_items data
            const { data, error } = await supabase
                .from('recipes')
                .select(`
                    *,
                    ingredients (
                        *,
                        food_items (*)
                    )
                `)
                .eq('id', recipe.id)
                .single();

            if (error || !data) {
                console.error('Error fetching nutrition:', error);
                return;
            }

            // Calculate complete nutrition from ingredients
            const nutrition: any = {
                energy_kcal: 0,
                energy_kj: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                micronutrients: {}
            };

            // Sum up all micronutrients from ingredients
            let hasMoringa = false;

            for (const ing of data.ingredients) {
                // Check if this is Moringa Powder
                if (ing.item.toLowerCase().includes('moringa powder') ||
                    (ing.food_items && ing.food_items.name.toLowerCase().includes('moringa powder'))) {
                    hasMoringa = true;
                    continue; // Skip adding it to base nutrition
                }

                if (ing.food_items && ing.weight_g) {
                    const foodItem = ing.food_items;
                    const ratio = ing.weight_g / 100;

                    // Macros
                    nutrition.energy_kcal += (foodItem.energy_kcal || 0) * ratio;
                    nutrition.energy_kj += (foodItem.energy_kj || 0) * ratio;
                    nutrition.protein_g += (foodItem.protein_g || 0) * ratio;
                    nutrition.carbs_g += (foodItem.carbs_g || 0) * ratio;
                    nutrition.fat_g += (foodItem.fat_g || 0) * ratio;

                    // Micronutrients (from JSONB)
                    if (foodItem.micronutrients) {
                        const micro = foodItem.micronutrients;
                        for (const [key, value] of Object.entries(micro)) {
                            if (typeof value === 'number') {
                                nutrition.micronutrients[key] = (nutrition.micronutrients[key] || 0) + (value * ratio);
                            }
                        }
                    }
                }
            }

            setNutritionData(nutrition);
            setMoringaSpoons(hasMoringa ? 1 : 0); // Auto-enable 1 spoon if recipe has it default
        } catch (err) {
            console.error('Error calculating nutrition:', err);
        } finally {
            setLoadingNutrition(false);
        }
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
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-serif font-bold mb-4">Miracle Meal Planner</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Generate a personalized daily meal plan in seconds. Tailored to your goals, fueled by Miracle Greens.
                        </p>
                    </div>

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
                                {/* Dashboard Header */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors" onClick={() => setUnit(unit === 'kcal' ? 'kJ' : 'kcal')}>
                                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-2">
                                                <Flame className="h-4 w-4 text-orange-500" />
                                                Energy ({unit})
                                            </p>
                                            <p className="text-3xl font-bold text-foreground">{formatEnergy(plan.totalCalories, unit).split(' ')[0]}</p>
                                        </div>
                                        <div className="h-12 w-px bg-border mx-2"></div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2"><Beef className="h-4 w-4 text-red-500" /> <span className="font-semibold text-foreground">{plan.macros.protein.toFixed(1)}g</span> Protein</p>
                                            <p className="flex items-center gap-2"><Wheat className="h-4 w-4 text-amber-600" /> <span className="font-semibold text-foreground">{plan.macros.carbs.toFixed(1)}g</span> Carbs</p>
                                            <p className="flex items-center gap-2"><Droplet className="h-4 w-4 text-yellow-500" /> <span className="font-semibold text-foreground">{plan.macros.fat.toFixed(1)}g</span> Fat</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">

                                        <Button onClick={() => setStep(1)} className="flex-1 gap-2">
                                            Start Over
                                        </Button>
                                    </div>
                                </div>

                                {/* Meal Grid */}
                                <div className="flex flex-wrap justify-center gap-6 pb-24 md:pb-0">
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.breakfast}
                                            mealLabel="Breakfast"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.breakfast)}
                                            onNutritionClick={() => handleShowNutrition(plan.breakfast)}
                                            onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.lunch}
                                            mealLabel="Lunch"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.lunch)}
                                            onNutritionClick={() => handleShowNutrition(plan.lunch)}
                                            onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.dinner}
                                            mealLabel="Dinner"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.dinner)}
                                            onNutritionClick={() => handleShowNutrition(plan.dinner)}
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
                                                onNutritionClick={() => handleShowNutrition(snack)}
                                            />
                                        </div>
                                    ))}
                                </div>



                            </div>
                        )}

                    </div>
                </div>
            </div >
            <Footer />

            {/* Recipe Detail Modal */}
            {selectedRecipe && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedRecipe(null)}
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
                                onClick={() => setSelectedRecipe(null)}
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
                            <h3 className="font-semibold mb-3">Nutrition Facts</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Flame className="h-4 w-4 text-orange-500" />
                                        <span className="text-xs text-muted-foreground">Energy</span>
                                    </div>
                                    <div className="text-lg font-bold">{formatEnergy(selectedRecipe.calories, unit).split(' ')[0]}</div>
                                    <div className="text-xs text-muted-foreground">{unit}</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Beef className="h-4 w-4 text-red-500" />
                                        <span className="text-xs text-muted-foreground">Protein</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.protein).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Wheat className="h-4 w-4 text-amber-600" />
                                        <span className="text-xs text-muted-foreground">Carbs</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.carbs).toFixed(1)}g</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Droplet className="h-4 w-4 text-yellow-500" />
                                        <span className="text-xs text-muted-foreground">Fat</span>
                                    </div>
                                    <div className="text-lg font-bold">{Number(selectedRecipe.fat).toFixed(1)}g</div>
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
                                            <span className="text-muted-foreground"> - {ing.amount}</span>
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
            )}

            {/* Nutritional Info Modal */}
            {nutritionRecipe && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => {
                        setNutritionRecipe(null);
                        setNutritionData(null);
                        setMoringaSpoons(0);
                    }}
                >
                    <div
                        className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-green-700 text-white p-6 flex justify-between items-start z-10 rounded-t-2xl shadow-md">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-1">Nutritional Info</h2>
                                <p className="text-green-100 opacity-90 text-sm">{nutritionRecipe.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setNutritionRecipe(null);
                                    setNutritionData(null);
                                    setMoringaSpoons(0);
                                }}
                                className="p-2 hover:bg-green-600 rounded-lg transition-colors text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {loadingNutrition ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="mt-4 text-muted-foreground">Calculating nutrition...</p>
                            </div>
                        ) : nutritionData ? (() => {
                            // Calculate current nutrition based on spoon count
                            const current = moringaSpoons > 0 ? {
                                energy_kcal: nutritionData.energy_kcal + (MORINGA_TSP.energy_kcal * moringaSpoons),
                                energy_kj: nutritionData.energy_kj + (MORINGA_TSP.energy_kj * moringaSpoons),
                                protein_g: nutritionData.protein_g + (MORINGA_TSP.protein_g * moringaSpoons),
                                carbs_g: nutritionData.carbs_g + (MORINGA_TSP.carbs_g * moringaSpoons),
                                fat_g: nutritionData.fat_g + (MORINGA_TSP.fat_g * moringaSpoons),
                                micronutrients: { ...nutritionData.micronutrients }
                            } : { ...nutritionData };

                            // Add moringa micros if shown
                            if (moringaSpoons > 0) {
                                for (const [key, value] of Object.entries(MORINGA_TSP.micronutrients)) {
                                    current.micronutrients[key] = (current.micronutrients[key] || 0) + (value * moringaSpoons);
                                }
                            }

                            return (
                                <div className="p-5 space-y-6">
                                    {/* Moringa Boost Selector */}
                                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-4 rounded-xl flex flex-col gap-4 transition-all">

                                        <div className="flex-1">
                                            <div className="font-bold text-green-800 dark:text-green-300 flex items-center flex-wrap gap-2 mb-1">
                                                ✨ Miracle Boost
                                                {moringaSpoons > 0 && (
                                                    <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                                                        +{moringaSpoons} tsp ({moringaSpoons * 2}g)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-green-400">
                                                Add moringa to supercharge this meal.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex items-center bg-white dark:bg-black/20 rounded-lg p-1 border border-green-200 dark:border-green-800 flex-1 justify-between">
                                                {[0, 1, 2, 3].map(spoons => (
                                                    <button
                                                        key={spoons}
                                                        onClick={() => setMoringaSpoons(spoons)}
                                                        className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all ${moringaSpoons === spoons
                                                            ? 'bg-green-600 text-white shadow-sm'
                                                            : 'hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400'
                                                            }`}
                                                    >
                                                        {spoons > 0 ? spoons : '-'}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Main Action Button */}
                                            <button
                                                onClick={() => setMoringaSpoons(prev => Math.min(prev + 1, 5))}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold h-10 px-4 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                                            >
                                                +1 Spoon
                                            </button>
                                        </div>
                                    </div>

                                    {/* Macronutrients */}
                                    <div>
                                        <h3 className="font-semibold text-base mb-3">Macronutrients</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted rounded-lg relative overflow-hidden group">
                                                {moringaSpoons > 0 && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{(MORINGA_TSP.energy_kj * moringaSpoons).toFixed(0)}</div>}
                                                <div className="text-xs text-muted-foreground mb-0.5">Energy</div>
                                                <div className={`text-lg font-bold transition-colors ${moringaSpoons > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>{current.energy_kj.toFixed(0)} kJ</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg relative overflow-hidden">
                                                {moringaSpoons > 0 && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{(MORINGA_TSP.protein_g * moringaSpoons).toFixed(1)}</div>}
                                                <div className="text-xs text-muted-foreground mb-0.5">Protein</div>
                                                <div className={`text-lg font-bold transition-colors ${moringaSpoons > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>{current.protein_g.toFixed(1)}g</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg relative overflow-hidden group">
                                                {moringaSpoons > 0 && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{(MORINGA_TSP.carbs_g * moringaSpoons).toFixed(1)}</div>}
                                                <div className="text-xs text-muted-foreground mb-0.5">Carbs</div>
                                                <div className={`text-lg font-bold transition-colors ${moringaSpoons > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>{current.carbs_g.toFixed(1)}g</div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg relative overflow-hidden">
                                                <div className="text-xs text-muted-foreground mb-0.5">Fat</div>
                                                <div className="text-lg font-bold">{current.fat_g.toFixed(1)}g</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Micronutrients - Categorized */}
                                    {current.micronutrients && (() => {
                                        const m = current.micronutrients;

                                        // Categorize nutrients
                                        const electrolytes = {
                                            'Potassium': m.potassium_mg,
                                            'Magnesium': m.magnesium_mg,
                                            'Calcium': m.calcium_mg,
                                            'Phosphorus': m.phosphorus_mg,
                                            'Sodium': m.sodium_mg,
                                            'Chloride': m.chloride_mg,
                                        };

                                        const traceMinerals = {
                                            'Iron': m.iron_mg,
                                            'Zinc': m.zinc_mg,
                                            'Selenium': m.selenium_ug,
                                            'Copper': m.copper_mg,
                                            'Manganese': m.manganese_mg,
                                        };

                                        const vitamins = {
                                            'Vitamin A': m.vitamin_a_ug,
                                            'B1 (Thiamine)': m.thiamine_mg,
                                            'B2 (Riboflavin)': m.riboflavin_mg,
                                            'B3 (Niacin)': m.niacin_mg,
                                            'B5 (Pantothenic Acid)': m.pantothenic_acid_mg,
                                            'B6 (Pyridoxine)': m.vitamin_b6_mg,
                                            'B7 (Biotin)': m.biotin_ug,
                                            'B9 (Folate)': m.folate_ug,
                                            'B12 (Cobalamin)': m.vitamin_b12_ug,
                                            'Vitamin C': m.vitamin_c_mg,
                                            'Vitamin D': m.vitamin_d_iu,
                                            'Vitamin E': m.vitamin_e_mg,
                                            'Vitamin K': m.vitamin_k_ug,
                                        };

                                        const other = {
                                            'Choline': m.choline_mg,
                                            'Fiber': m.fiber_g,
                                        };

                                        const labelsToMoringaKey: Record<string, string> = {
                                            'Vitamin A': 'vitamin_a_ug',
                                            'Vitamin C': 'vitamin_c_mg',
                                            'B1 (Thiamine)': 'thiamine_mg',
                                            'B2 (Riboflavin)': 'riboflavin_mg',
                                            'B3 (Niacin)': 'niacin_mg',
                                            'Calcium': 'calcium_mg',
                                            'Iron': 'iron_mg',
                                            'Magnesium': 'magnesium_mg',
                                            'Potassium': 'potassium_mg',
                                            'Sodium': 'sodium_mg',
                                            'Fiber': 'fiber_g',
                                        };

                                        const userRDAs = (age && gender) ? getPersonalizedRDAs(Number(age), gender, calories) : null;

                                        const NutrientGrid = ({ nutrients, title }: { nutrients: Record<string, any>, title: string }) => {
                                            // Only show if at least one value is non-zero/non-null
                                            const filtered = Object.entries(nutrients).filter(([_, val]) => val !== undefined && val !== null && val !== 0);
                                            if (filtered.length === 0) return null;

                                            return (
                                                <div className="space-y-3 w-full max-w-[340px]">
                                                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider border-b-2 border-primary/10 pb-1.5 flex items-center">
                                                        <span>{title}</span>
                                                    </h4>
                                                    <div className="flex flex-col gap-px">
                                                        {filtered.map(([label, value], idx) => {
                                                            const mKey = labelsToMoringaKey[label];
                                                            const boostValue = (mKey && moringaSpoons > 0) ? (MORINGA_TSP.micronutrients as any)[mKey] * moringaSpoons : 0;

                                                            // Determine unit
                                                            let unit = 'mg';
                                                            const labelLower = label.toLowerCase();
                                                            if (labelLower.includes('vitamin a') || labelLower.includes('folate') || labelLower.includes('selenium') || labelLower.includes('iodine') || labelLower.includes('b12') || labelLower.includes('vitamin k')) unit = 'µg';
                                                            if (labelLower.includes('vitamin d')) unit = 'IU';
                                                            if (labelLower.includes('fiber') || labelLower.includes('fat') || labelLower.includes('carbs') || labelLower.includes('protein')) unit = 'g';

                                                            // Calculate RDA percentage
                                                            const rdaValue = userRDAs?.[label];
                                                            const percentage = (rdaValue && typeof value === 'number')
                                                                ? Math.round(((value + boostValue) / rdaValue) * 100)
                                                                : null;

                                                            return (
                                                                <div key={label} className={cn(
                                                                    "group flex items-center gap-2 py-1.5 px-2 transition-all rounded hover:bg-muted/50",
                                                                    idx % 2 === 0 ? "bg-muted/5" : "bg-transparent",
                                                                    boostValue > 0 ? "bg-green-500/5 ring-1 ring-inset ring-green-500/20" : ""
                                                                )}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium text-foreground/90 uppercase tracking-tight whitespace-nowrap">{label}</span>
                                                                        {percentage !== null && (
                                                                            <span className={cn(
                                                                                "text-[10px] px-1.5 py-0.5 rounded-sm leading-none",
                                                                                percentage >= 100 ? "bg-green-500 text-white" : "bg-primary/5 text-primary/70"
                                                                            )}>
                                                                                {percentage}%
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Dotted Leader */}
                                                                    <div className="flex-1 border-b border-dotted border-border/40 mb-1 group-hover:border-primary/20 transition-colors" />

                                                                    <div className="flex items-center justify-end gap-2">
                                                                        {boostValue > 0 && (
                                                                            <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                                                +{boostValue >= 1 ? boostValue.toFixed(1) : boostValue.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                        <div className="flex items-baseline justify-end gap-1 min-w-[60px] text-right">
                                                                            <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                                                                                {typeof value === 'number' ? (value >= 1 ? value.toFixed(1) : value.toFixed(2)) : value}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-muted-foreground w-[14px]">{unit}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="space-y-10 mt-6 pt-8 border-t border-border">
                                                <NutrientGrid nutrients={electrolytes} title="Electrolytes" />
                                                <NutrientGrid nutrients={traceMinerals} title="Trace Minerals" />
                                                <NutrientGrid nutrients={vitamins} title="Vitamins" />
                                                <NutrientGrid nutrients={other} title="Other Essential Nutrients" />
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })() : (
                            <div className="p-12 text-center text-muted-foreground">
                                No detailed nutritional data available for this recipe.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main >
    );
}
