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
    Wheat
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

const RecipeCard = ({ recipe, mealLabel, unit = 'kJ' }: { recipe: Recipe, mealLabel: string, unit?: UnitType }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full">
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
                                        <RecipeCard recipe={plan.breakfast} mealLabel="Breakfast" unit={unit} />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                                        <RecipeCard recipe={plan.lunch} mealLabel="Lunch" unit={unit} />
                                    </div>
                                    <div className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                                        <RecipeCard recipe={plan.dinner} mealLabel="Dinner" unit={unit} />
                                    </div>
                                    {plan.snacks.map((snack, i) => (
                                        <div key={i} className={`w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards delay-[${(i + 3) * 100}ms]`}>
                                            <RecipeCard recipe={snack} mealLabel={`Snack ${i + 1}`} unit={unit} />
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
        </main >
    );
}
