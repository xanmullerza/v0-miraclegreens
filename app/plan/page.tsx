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
import { generateDailyPlan, DailyPlan, generateShoppingList, ShoppingItem } from '@/lib/utils/meal-generator';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

const DietCard = ({
    type,
    selected,
    onClick,
    icon: Icon,
    label
}: {
    type: DietType,
    selected: boolean,
    onClick: () => void,
    icon: any,
    label?: string
}) => (
    <div
        onClick={onClick}
        className={cn(
            "cursor-pointer relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
            selected
                ? "border-primary bg-primary/5 shadow-xl"
                : "border-border bg-card hover:border-primary/50"
        )}
    >
        <div className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
                "p-4 rounded-full",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="font-bold capitalize text-lg whitespace-nowrap">{label || (type === 'anything' ? 'Anything Goes' : type)}</h3>
            {selected && (
                <div className="absolute top-4 right-4 text-primary">
                    <Check className="h-6 w-6" />
                </div>
            )}
        </div>
    </div>
);

const GoalCard = ({
    type,
    selected,
    onClick,
    icon: Icon,
    label
}: {
    type: GoalType,
    selected: boolean,
    onClick: () => void,
    icon: any,
    label?: string
}) => (
    <div
        onClick={onClick}
        className={cn(
            "cursor-pointer relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
            selected
                ? "border-primary bg-primary/5 shadow-xl"
                : "border-border bg-card hover:border-primary/50"
        )}
    >
        <div className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
                "p-4 rounded-full",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="font-bold capitalize text-lg whitespace-nowrap">{label || type.replace('-', ' ')}</h3>
            {selected && (
                <div className="absolute top-4 right-4 text-primary">
                    <Check className="h-6 w-6" />
                </div>
            )}
        </div>
    </div>
);



const ActivityCard = ({
    type,
    selected,
    onClick,
    icon: Icon,
    label
}: {
    type: ActivityLevel,
    selected: boolean,
    onClick: () => void,
    icon: any,
    label?: string
}) => (
    <div
        onClick={onClick}
        className={cn(
            "cursor-pointer relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
            selected
                ? "border-primary bg-primary/5 shadow-xl"
                : "border-border bg-card hover:border-primary/50"
        )}
    >
        <div className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
                "p-4 rounded-full",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="font-bold capitalize text-lg whitespace-nowrap">{label || type}</h3>
            {selected && (
                <div className="absolute top-4 right-4 text-primary">
                    <Check className="h-6 w-6" />
                </div>
            )}
        </div>
    </div>
);

const RecipeCard = ({ recipe, mealLabel, unit = 'kJ', onClick, onNutritionClick }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onClick?: () => void,
    onNutritionClick?: () => void
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
                                <Button size="sm" variant="secondary" className="h-8" asChild>
                                    <Link href="/shop">Buy Now</Link>
                                </Button>
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
    const [showMoringa, setShowMoringa] = useState(false);

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

    const handleRegenerate = () => {
        handleGenerate();
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
            setShowMoringa(hasMoringa); // Auto-enable if recipe has it default
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

                        {/* WIZARD STEP 1: PREFERENCES */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                        What is your goal?
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <GoalCard
                                            type="lose-fat" selected={goal === 'lose-fat'}
                                            onClick={() => setGoal('lose-fat')} icon={TrendingDown}
                                            label="Lose Fat"
                                        />
                                        <GoalCard
                                            type="maintain" selected={goal === 'maintain'}
                                            onClick={() => setGoal('maintain')} icon={Activity}
                                            label="Maintain Weight"
                                        />
                                        <GoalCard
                                            type="build-muscle" selected={goal === 'build-muscle'}
                                            onClick={() => setGoal('build-muscle')} icon={Dumbbell}
                                            label="Build Muscle"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                        About You
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <div className="flex w-full bg-muted rounded-lg p-1">
                                                <button
                                                    onClick={() => setGender('male')}
                                                    className={cn(
                                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                        gender === 'male' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    Male
                                                </button>
                                                <button
                                                    onClick={() => setGender('female')}
                                                    className={cn(
                                                        "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                                        gender === 'female' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    Female
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="age">Age</Label>
                                            <Input
                                                id="age" type="number" placeholder="25"
                                                value={age} onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight">Weight (kg)</Label>
                                            <Input
                                                id="weight" type="number" placeholder="70"
                                                value={weight} onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="height">Height (cm)</Label>
                                            <Input
                                                id="height" type="number" placeholder="175"
                                                value={height} onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : '')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                        Activity Level
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <ActivityCard
                                            type="sedentary" selected={activityLevel === 'sedentary'}
                                            onClick={() => setActivityLevel('sedentary')} icon={Armchair}
                                            label="Sedentary"
                                        />
                                        <ActivityCard
                                            type="light" selected={activityLevel === 'light'}
                                            onClick={() => setActivityLevel('light')} icon={Footprints}
                                            label="Light Active"
                                        />
                                        <ActivityCard
                                            type="moderate" selected={activityLevel === 'moderate'}
                                            onClick={() => setActivityLevel('moderate')} icon={Activity}
                                            label="Moderate"
                                        />
                                        <ActivityCard
                                            type="active" selected={activityLevel === 'active'}
                                            onClick={() => setActivityLevel('active')} icon={Zap}
                                            label="Very Active"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                        Choose your diet style
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                                        <DietCard
                                            type="anything" selected={diet === 'anything'}
                                            onClick={() => setDiet('anything')} icon={Utensils}
                                        />
                                        <DietCard
                                            type="vegetarian" selected={diet === 'vegetarian'}
                                            onClick={() => setDiet('vegetarian')} icon={Egg}
                                        />
                                        <DietCard
                                            type="vegan" selected={diet === 'vegan'}
                                            onClick={() => setDiet('vegan')} icon={Leaf}
                                        />

                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <Button size="lg" onClick={handleNextStep} className="h-14 px-8 text-lg rounded-xl gap-2">
                                        Generate Plan <ChevronRight className="h-5 w-5" />
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
                                            <h2 className="text-3xl font-bold mb-2">Ready to cook?</h2>
                                            <p className="text-muted-foreground">
                                                We'll generate a <strong className="capitalize">{diet === 'anything' ? 'Balanced' : diet}</strong> plan with roughly <strong>{formatEnergy(calories, unit)}</strong> across <strong>3</strong> standard meals.
                                            </p>
                                        </div>
                                        <Button size="lg" onClick={handleGenerate} className="w-full h-14 text-lg rounded-xl">
                                            Generate Plan
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
                                        <h3 className="text-2xl font-bold animate-pulse">Curating your menu...</h3>
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
                                        <Button variant="outline" onClick={handleRegenerate} className="flex-1 gap-2">
                                            <RotateCcw className="h-4 w-4" />
                                            Regenerate
                                        </Button>
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
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.lunch}
                                            mealLabel="Lunch"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.lunch)}
                                            onNutritionClick={() => handleShowNutrition(plan.lunch)}
                                        />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                                        <RecipeCard
                                            recipe={plan.dinner}
                                            mealLabel="Dinner"
                                            unit={unit}
                                            onClick={() => setSelectedRecipe(plan.dinner)}
                                            onNutritionClick={() => handleShowNutrition(plan.dinner)}
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

                                {/* Actions - Desktop (Standard) / Mobile (Sticky Bottom) */}
                                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border md:static md:bg-transparent md:border-t-0 md:p-0 z-10 flex justify-center md:pt-8">
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button size="lg" className="w-full md:w-auto rounded-full shadow-lg h-14 md:h-16 px-6 md:px-10 gap-3 text-lg bg-green-600 hover:bg-green-700 transition-all hover:scale-105 active:scale-95">
                                                <ShoppingBasket className="h-5 w-5 md:h-6 md:w-6" />
                                                Get Grocery List
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
                                            <SheetHeader className="text-left">
                                                <SheetTitle>Your Shopping List</SheetTitle>
                                                <SheetDescription>
                                                    Everything you need for your {formatEnergy(calories, unit)} plan.
                                                </SheetDescription>
                                            </SheetHeader>
                                            <ShoppingList items={shoppingList} calories={calories} unit={unit} />
                                            <div className="mt-8 pt-6 border-t border-border pb-8 md:pb-0">
                                                <Button className="w-full gap-2" variant="outline" onClick={() => window.print()}>
                                                    <Download className="h-4 w-4" />
                                                    Print / Save Plan
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
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
                    }}
                >
                    <div
                        className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-background border-b border-border p-6 flex justify-between items-start z-10">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-1">Complete Nutritional Information</h2>
                                <p className="text-muted-foreground">{nutritionRecipe.title}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setNutritionRecipe(null);
                                    setNutritionData(null);
                                }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
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
                            // Calculate current nutrition based on toggle
                            const current = showMoringa ? {
                                energy_kcal: nutritionData.energy_kcal + MORINGA_TSP.energy_kcal,
                                energy_kj: nutritionData.energy_kj + MORINGA_TSP.energy_kj,
                                protein_g: nutritionData.protein_g + MORINGA_TSP.protein_g,
                                carbs_g: nutritionData.carbs_g + MORINGA_TSP.carbs_g,
                                fat_g: nutritionData.fat_g + MORINGA_TSP.fat_g,
                                micronutrients: { ...nutritionData.micronutrients }
                            } : { ...nutritionData };

                            // Add moringa micros if shown
                            if (showMoringa) {
                                for (const [key, value] of Object.entries(MORINGA_TSP.micronutrients)) {
                                    current.micronutrients[key] = (current.micronutrients[key] || 0) + value;
                                }
                            }

                            return (
                                <div className="p-6 space-y-6">
                                    {/* Moringa Boost Toggle */}
                                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-4 rounded-xl flex items-center gap-4 transition-all">
                                        <div
                                            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${showMoringa ? 'bg-green-500' : 'bg-gray-300'}`}
                                            onClick={() => setShowMoringa(!showMoringa)}
                                        >
                                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showMoringa ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                                                ✨ Boost with Moringa Powder
                                                <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">+1 tsp</span>
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-green-400">
                                                See the difference 1 teaspoon makes to your nutrition profile!
                                            </p>
                                        </div>
                                    </div>

                                    {/* Macronutrients */}
                                    <div>
                                        <h3 className="font-semibold text-lg mb-3">Macronutrients</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-4 bg-muted rounded-lg relative overflow-hidden group">
                                                {showMoringa && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{MORINGA_TSP.energy_kcal.toFixed(0)}</div>}
                                                <div className="text-sm text-muted-foreground mb-1">Energy</div>
                                                <div className={`text-xl font-bold transition-colors ${showMoringa ? 'text-green-600 dark:text-green-400' : ''}`}>{current.energy_kcal.toFixed(1)} kcal</div>
                                                <div className="text-xs text-muted-foreground">{current.energy_kj.toFixed(1)} kJ</div>
                                            </div>
                                            <div className="p-4 bg-muted rounded-lg relative overflow-hidden">
                                                {showMoringa && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{MORINGA_TSP.protein_g.toFixed(1)}g</div>}
                                                <div className="text-sm text-muted-foreground mb-1">Protein</div>
                                                <div className={`text-xl font-bold transition-colors ${showMoringa ? 'text-green-600 dark:text-green-400' : ''}`}>{current.protein_g.toFixed(1)}g</div>
                                            </div>
                                            <div className="p-4 bg-muted rounded-lg relative overflow-hidden">
                                                {showMoringa && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold">+{MORINGA_TSP.carbs_g.toFixed(1)}g</div>}
                                                <div className="text-sm text-muted-foreground mb-1">Carbohydrates</div>
                                                <div className={`text-xl font-bold transition-colors ${showMoringa ? 'text-green-600 dark:text-green-400' : ''}`}>{current.carbs_g.toFixed(1)}g</div>
                                            </div>
                                            <div className="p-4 bg-muted rounded-lg relative overflow-hidden">
                                                <div className="text-sm text-muted-foreground mb-1">Fat</div>
                                                <div className="text-xl font-bold">{current.fat_g.toFixed(1)}g</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Micronutrients - Categorized */}
                                    {current.micronutrients && (() => {
                                        const m = current.micronutrients;

                                        // Categorize nutrients
                                        const vitamins = {
                                            'Vitamin A': m.vitamin_a_ug,
                                            'Vitamin C': m.vitamin_c_mg,
                                            'Vitamin D': m.vitamin_d_iu,
                                            'Vitamin E': m.vitamin_e_mg,
                                            'Vitamin K': m.vitamin_k_ug,
                                            'Thiamine (B1)': m.thiamine_mg,
                                            'Riboflavin (B2)': m.riboflavin_mg,
                                            'Niacin (B3)': m.niacin_mg,
                                            'Pantothenic Acid (B5)': m.pantothenic_acid_mg,
                                            'Vitamin B6': m.vitamin_b6_mg,
                                            'Vitamin B12': m.vitamin_b12_ug,
                                            'Folate': m.folate_ug,
                                        };

                                        const minerals = {
                                            'Calcium': m.calcium_mg,
                                            'Iron': m.iron_mg,
                                            'Magnesium': m.magnesium_mg,
                                            'Phosphorus': m.phosphorus_mg,
                                            'Potassium': m.potassium_mg,
                                            'Sodium': m.sodium_mg,
                                            'Zinc': m.zinc_mg,
                                            'Copper': m.copper_mg,
                                            'Manganese': m.manganese_mg,
                                            'Selenium': m.selenium_ug,
                                            'Iodine': m.iodine_ug,
                                        };

                                        const fats = {
                                            'Saturated Fat': m.saturated_fat_g,
                                            'Monounsaturated Fat': m.monounsaturated_fat_g,
                                            'Polyunsaturated Fat': m.polyunsaturated_fat_g,
                                            'Omega-3': m.omega_3_g,
                                            'Omega-6': m.omega_6_g,
                                            'Trans Fats': m.trans_fats_g,
                                            'Cholesterol': m.cholesterol_mg,
                                        };

                                        const carbs = {
                                            'Fiber': m.fiber_g,
                                            'Sugars': m.sugars_g,
                                            'Added Sugars': m.added_sugars_g,
                                        };

                                        const other = {
                                            'Choline': m.choline_mg,
                                        };

                                        const NutrientGrid = ({ nutrients, title }: { nutrients: Record<string, any>, title: string }) => {
                                            const filtered = Object.entries(nutrients).filter(([_, val]) => val !== undefined && val !== null);
                                            if (filtered.length === 0) return null;

                                            return (
                                                <div>
                                                    <h4 className="font-medium mb-3 text-primary">{title}</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {filtered.map(([label, value]) => {
                                                            // Determine unit
                                                            let unit = '';
                                                            if (label.includes('Vitamin') || label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine')) {
                                                                unit = label.toLowerCase().includes('vitamin d') ? ' IU' :
                                                                    typeof value === 'number' && value < 1 ? ' µg' : ' mg';
                                                            } else if (label.includes('Cholesterol') || label.toLowerCase().includes('calcium') || label.toLowerCase().includes('iron') || label.toLowerCase().includes('magnesium') || label.toLowerCase().includes('phosphorus') || label.toLowerCase().includes('potassium') || label.toLowerCase().includes('sodium') || label.toLowerCase().includes('zinc') || label.toLowerCase().includes('copper') || label.toLowerCase().includes('manganese') || label.toLowerCase().includes('choline')) {
                                                                unit = ' mg';
                                                            } else {
                                                                unit = ' g';
                                                            }

                                                            // Check for boosts
                                                            let boostText = null;
                                                            if (showMoringa) {
                                                                // Simple mapping checks for key nutrients in Moringa
                                                                if (label.includes('Vitamin A') && MORINGA_TSP.micronutrients.vitamin_a_ug) boostText = `+${Math.round(MORINGA_TSP.micronutrients.vitamin_a_ug)}µg`;
                                                                if (label.includes('Calcium') && MORINGA_TSP.micronutrients.calcium_mg) boostText = `+${Math.round(MORINGA_TSP.micronutrients.calcium_mg)}mg`;
                                                                if (label.includes('Iron') && MORINGA_TSP.micronutrients.iron_mg) boostText = `+${MORINGA_TSP.micronutrients.iron_mg.toFixed(1)}mg`;
                                                                if (label.includes('Riboflavin (B2)') && MORINGA_TSP.micronutrients.riboflavin_mg) boostText = `+${MORINGA_TSP.micronutrients.riboflavin_mg.toFixed(1)}mg`;
                                                            }

                                                            return (
                                                                <div key={label} className={`flex justify-between items-center p-3 rounded-lg relative overflow-hidden transition-colors ${showMoringa && boostText ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30' : 'bg-muted/50'}`}>
                                                                    <span className="text-sm relative z-10">{label}</span>
                                                                    <div className="flex items-center gap-2 relative z-10">
                                                                        {showMoringa && boostText && (
                                                                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-white dark:bg-black/20 px-1.5 rounded-full">
                                                                                {boostText}
                                                                            </span>
                                                                        )}
                                                                        <span className={`text-sm font-semibold transition-colors ${showMoringa && boostText ? 'text-green-700 dark:text-green-300' : ''}`}>
                                                                            {typeof value === 'number' ? value.toFixed(2) : value}{unit}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="space-y-6">
                                                <NutrientGrid nutrients={vitamins} title="Vitamins" />
                                                <NutrientGrid nutrients={minerals} title="Minerals" />
                                                <NutrientGrid nutrients={fats} title="Fats Breakdown" />
                                                <NutrientGrid nutrients={carbs} title="Carbohydrates Breakdown" />
                                                <NutrientGrid nutrients={other} title="Other Nutrients" />
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
