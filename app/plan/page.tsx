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
    Bean
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

const RecipeCard = ({ recipe, mealLabel, unit = 'kcal' }: { recipe: Recipe, mealLabel: string, unit?: UnitType }) => (
    <div className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full">
        <div className="aspect-video relative overflow-hidden bg-muted flex-shrink-0">
            {/* Fallback pattern if no image */}
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {formatEnergy(recipe.calories, unit)}
                </span>
                <span className="flex items-center gap-1">
                    <Leaf className="h-4 w-4 text-green-500" />
                    {recipe.protein}g protein
                </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
                {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <span
                        key={i}
                        className={cn(
                            "text-xs px-2 py-1 rounded-md border",
                            ing.isMiracleProduct
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 font-medium"
                                : "bg-muted text-muted-foreground border-transparent"
                        )}
                    >
                        {ing.isMiracleProduct && <Sparkles className="inline-block h-3 w-3 mr-1" />}
                        {ing.item}
                    </span>
                ))}
                {recipe.ingredients.length > 3 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md border border-transparent">
                        +{recipe.ingredients.length - 3} more
                    </span>
                )}
            </div>
        </div>
    </div>
);

const ShoppingList = ({ items, calories, unit = 'kcal' }: { items: ShoppingItem[], calories: number, unit?: UnitType }) => {
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
    const [unit, setUnit] = useState<UnitType>('kcal');

    const handleGenerate = () => {
        setGenerating(true);
        // Simulate "thinking" time for effect
        setTimeout(() => {
            const newPlan = generateDailyPlan({
                targetCalories: calories,
                diet,
                numMeals: mealsCount
            });
            setPlan(newPlan);
            setGenerating(false);
            setStep(3);
        }, 1500);
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
                                        Choose your diet style
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                                        <DietCard
                                            type="anything" selected={diet === 'anything'}
                                            onClick={() => setDiet('anything')} icon={Utensils}
                                        />
                                        <DietCard
                                            type="vegan" selected={diet === 'vegan'}
                                            onClick={() => setDiet('vegan')} icon={Leaf}
                                        />
                                        <DietCard
                                            type="vegetarian" selected={diet === 'vegetarian'}
                                            onClick={() => setDiet('vegetarian')} icon={Bean}
                                        />

                                    </div>
                                </div>

                                <div className="max-w-xl">
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                        Set your targets
                                    </h2>

                                    <div className="space-y-8">
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <Label className="text-base font-medium">Daily Energy Goal</Label>
                                                <div className="bg-background border border-input rounded-lg p-1 flex">
                                                    <button
                                                        onClick={() => setUnit('kcal')}
                                                        className={cn(
                                                            "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                                                            unit === 'kcal' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        Calories
                                                    </button>
                                                    <button
                                                        onClick={() => setUnit('kJ')}
                                                        className={cn(
                                                            "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                                                            unit === 'kJ' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        Kilojoules
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs text-muted-foreground">Min: {displayMin}</span>
                                                <span className="font-bold text-primary text-2xl">
                                                    {displayCalories} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
                                                </span>
                                                <span className="text-xs text-muted-foreground">Max: {displayMax}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={minCal}
                                                max={maxCal}
                                                step="50"
                                                value={calories}
                                                onChange={(e) => setCalories(parseInt(e.target.value))}
                                                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-base font-medium mb-3 block">Number of Meals</Label>
                                            <div className="flex gap-4">
                                                {[3, 4, 5].map(num => (
                                                    <Button
                                                        key={num}
                                                        type="button"
                                                        variant={mealsCount === num ? 'default' : 'outline'}
                                                        onClick={() => setMealsCount(num)}
                                                        className="flex-1 h-12 text-lg"
                                                    >
                                                        {num} Meals
                                                    </Button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2 ml-1">
                                                3 meals + {Math.max(0, mealsCount - 3)} snacks
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <Button size="lg" onClick={() => setStep(2)} className="h-14 px-8 text-lg rounded-xl gap-2">
                                        Next Step <ChevronRight className="h-5 w-5" />
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
                                                We'll generate a <strong>{diet}</strong> plan with roughly <strong>{formatEnergy(calories, unit)}</strong> across <strong>{mealsCount}</strong> meals.
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
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Energy</p>
                                            <p className="text-3xl font-bold text-foreground">{formatEnergy(plan.totalCalories, unit)}</p>
                                        </div>
                                        <div className="h-12 w-px bg-border mx-2"></div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p><span className="font-semibold text-foreground">{plan.macros.protein}g</span> Protein</p>
                                            <p><span className="font-semibold text-foreground">{plan.macros.carbs}g</span> Carbs</p>
                                            <p><span className="font-semibold text-foreground">{plan.macros.fat}g</span> Fat</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 md:pb-0">
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-0 fill-mode-backwards">
                                        <RecipeCard recipe={plan.breakfast} mealLabel="Breakfast" unit={unit} />
                                    </div>
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
                                        <RecipeCard recipe={plan.lunch} mealLabel="Lunch" unit={unit} />
                                    </div>
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
                                        <RecipeCard recipe={plan.dinner} mealLabel="Dinner" unit={unit} />
                                    </div>
                                    {plan.snacks.map((snack, i) => (
                                        <div key={i} className={`animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards delay-[${(i + 3) * 100}ms]`}>
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
            </div>
            <Footer />
        </main>
    );
}
