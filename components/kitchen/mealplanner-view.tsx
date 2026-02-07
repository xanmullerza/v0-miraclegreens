'use client';

// This component re-exports the meal planner content for use in the Kitchen tabs.
// The actual meal planner logic is complex and maintained in the original page.
// This wrapper imports and renders the core MealPlannerPage component directly.

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
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
    User,
    Apple,
    Plus,
    Library,
    Scale,
    Calendar,
    Battery,
    Layers,
    Globe,
    Heart,
    Users,
    Camera,
    Database
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
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRouter } from 'next/navigation';

const showShop = false;

const BOOSTABLE_NUTRIENTS = [
    'Potassium', 'Magnesium', 'Calcium', 'Sodium', 'Iron',
    'Vitamin A', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)',
    'Vitamin C', 'Fiber', 'Energy', 'Protein', 'Carbs', 'Fat'
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

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

const RecipeListItem = ({ recipe, mealLabel, unit = 'kJ', onRegenerate, pantryItems = [] }: {
    recipe: Recipe,
    mealLabel: string,
    unit?: UnitType,
    onRegenerate?: () => void,
    pantryItems?: any[]
}) => {
    const router = useRouter();

    // Calculate match percentage with pantry
    const pantryIds = new Set(pantryItems.map(f => f.id));
    const pantryNames = new Set(pantryItems.map(f => (f.common_name || f.name).toLowerCase().trim()));
    const ings = recipe.ingredients || [];
    let matches = 0;
    ings.forEach(ing => {
        const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
            (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
            (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));
        if (isMatch) matches++;
    });
    const matchPct = ings.length > 0 ? Math.round((matches / ings.length) * 100) : 0;

    return (
        <div className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="lg:grid lg:grid-cols-[120px_1fr_100px_80px_80px_80px_150px] gap-4 lg:items-center lg:px-8">
                {/* Image */}
                <div
                    className="aspect-[4/3] lg:aspect-square w-full lg:w-[120px] lg:h-[80px] lg:my-4 rounded-xl lg:rounded-2xl bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative cursor-pointer"
                    onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                >
                    {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ChefHat size={24} className="opacity-20" />
                        </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-1 rounded-lg backdrop-blur-sm uppercase tracking-widest">{mealLabel}</div>
                    {matchPct > 0 && (
                        <div className={cn(
                            "absolute bottom-2 right-2 text-[9px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1",
                            matchPct >= 75 ? "bg-emerald-500 text-white" : matchPct >= 50 ? "bg-amber-500 text-white" : "bg-slate-500/80 text-white"
                        )}>
                            <ShoppingBasket size={10} /> {matchPct}%
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-3 lg:p-0 cursor-pointer" onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                        {recipe.title}
                        {recipe.servings && recipe.servings !== 1 && (
                            <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 font-black">x{recipe.servings}</Badge>
                        )}
                    </h3>
                    {recipe.prepTime && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock size={12} /> {recipe.prepTime} mins
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                    {formatEnergy(recipe.calories * (recipe.servings || 1), unit)}
                </div>
                <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                    {(recipe.carbs * (recipe.servings || 1)).toFixed(1)}g
                </div>
                <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                    {(recipe.fat * (recipe.servings || 1)).toFixed(1)}g
                </div>
                <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                    {(recipe.protein * (recipe.servings || 1)).toFixed(1)}g
                </div>

                {/* Actions */}
                <div className="p-3 lg:p-0 flex justify-end lg:justify-center">
                    <div className="flex gap-2">
                        {onRegenerate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRegenerate}
                                className="h-9 px-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-[10px] font-bold uppercase tracking-wider"
                            >
                                <RefreshCw size={14} className="mr-1" /> Change
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>

                {/* Mobile Stats */}
                <div className="lg:hidden grid grid-cols-4 gap-2 px-3 pb-3">
                    {[
                        { label: 'CAL', val: recipe.calories * (recipe.servings || 1), sub: '', color: 'text-orange-500' },
                        { label: 'CHO', val: recipe.carbs * (recipe.servings || 1), sub: 'g', color: 'text-amber-500' },
                        { label: 'FAT', val: recipe.fat * (recipe.servings || 1), sub: 'g', color: 'text-amber-900' },
                        { label: 'PRO', val: recipe.protein * (recipe.servings || 1), sub: 'g', color: 'text-rose-500' }
                    ].map(stat => (
                        <div key={stat.label} className="text-center">
                            <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                            <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function MealPlannerView() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generating, setGenerating] = useState(false);
    const [pantryItems, setPantryItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchPantry = async () => {
            const { data } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true);
            if (data) setPantryItems(data);
        };
        fetchPantry();
    }, []);

    const {
        profile,
        energyUnit: unit,
        skipPlannerQuiz,
        setSkipPlannerQuiz,
        measurementUnit,
        dailyPlan: plan,
        updateDailyPlan: setPlan,
        dailyTargets
    } = useUserPreferences();

    const [showSummary, setShowSummary] = useState(false);
    const [alwaysSkip, setAlwaysSkip] = useState(skipPlannerQuiz);

    // Extract key values from profile and daily targets
    const calories = dailyTargets?.energy || 2000;
    const diet = (profile?.dietType as DietType) || 'anything';
    const numMeals = 3;
    const favoritesOnly = false;

    // Auto-step logic
    useEffect(() => {
        if (profile && dailyTargets?.energy) {
            if (skipPlannerQuiz && plan) {
                setStep(3);
            } else if (skipPlannerQuiz) {
                setStep(2);
            } else {
                setShowSummary(true);
            }
        }
    }, [profile, dailyTargets, skipPlannerQuiz, plan]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({
                targetCalories: calories,
                diet,
                numMeals,
                favoritesOnly,
                pantryItems
            });
            setPlan(newPlan);
            setStep(3);
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (skipPlannerQuiz && plan) {
                setStep(3);
            } else {
                setStep(2);
            }
        } else if (step === 2) {
            handleGenerate();
        }
    };

    const handleRegenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', currentId: string) => {
        if (!plan) return;
        const result = await getRandomRecipeByType(mealType, diet, currentId, favoritesOnly);
        if (result) {
            const newPlan = { ...plan };
            newPlan[mealType] = result.recipe;
            newPlan.recipeMicronutrients = { ...newPlan.recipeMicronutrients, [result.recipe.id]: result.micronutrients };

            // Recalculate totals
            newPlan.totalCalories = (newPlan.breakfast.calories * (newPlan.breakfast.servings || 1)) +
                (newPlan.lunch.calories * (newPlan.lunch.servings || 1)) +
                (newPlan.dinner.calories * (newPlan.dinner.servings || 1));

            newPlan.macros = {
                protein: (newPlan.breakfast.protein * (newPlan.breakfast.servings || 1)) +
                    (newPlan.lunch.protein * (newPlan.lunch.servings || 1)) +
                    (newPlan.dinner.protein * (newPlan.dinner.servings || 1)),
                carbs: (newPlan.breakfast.carbs * (newPlan.breakfast.servings || 1)) +
                    (newPlan.lunch.carbs * (newPlan.lunch.servings || 1)) +
                    (newPlan.dinner.carbs * (newPlan.dinner.servings || 1)),
                fat: (newPlan.breakfast.fat * (newPlan.breakfast.servings || 1)) +
                    (newPlan.lunch.fat * (newPlan.lunch.servings || 1)) +
                    (newPlan.dinner.fat * (newPlan.dinner.servings || 1)),
            };

            const combinedM: Record<string, number> = {};
            [newPlan.breakfast, newPlan.lunch, newPlan.dinner].forEach(r => {
                const rm = newPlan.recipeMicronutrients[r.id];
                const factor = r.servings || 1;
                if (rm) {
                    Object.entries(rm).forEach(([k, v]) => {
                        combinedM[k] = (combinedM[k] || 0) + ((v as number) * factor);
                    });
                }
            });
            newPlan.micronutrients = combinedM;

            setPlan(newPlan);
        }
    };

    return (
        <div className="space-y-8">
            {/* Profile Summary Banner (if available) */}
            {showSummary && profile && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <User size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Your Profile</h2>
                                <p className="text-sm text-slate-500">
                                    {formatEnergy(calories, unit)} daily target • {diet.charAt(0).toUpperCase() + diet.slice(1)} diet
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleNextStep}
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                            >
                                {plan ? 'View Plan' : 'Generate Plan'}
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                            <button
                                onClick={() => router.push('/dashboard/profile?from=/dashboard/kitchen')}
                                className="text-xs text-slate-400 hover:text-emerald-600 transition-colors font-bold uppercase tracking-widest"
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div
                                onClick={() => {
                                    const newVal = !alwaysSkip;
                                    setAlwaysSkip(newVal);
                                    setSkipPlannerQuiz(newVal);
                                }}
                                className={cn(
                                    "w-4 h-4 rounded border transition-colors flex items-center justify-center",
                                    alwaysSkip ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-700 hover:border-emerald-500"
                                )}
                            >
                                {alwaysSkip && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Always skip this summary</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Step 1: No Profile */}
            {step === 1 && !showSummary && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-xl mx-auto">
                    <div className="h-24 w-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                        <User size={48} className="animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black tracking-tight uppercase italic">Personalisation Required</h2>
                        <p className="text-slate-500 font-medium">
                            To curate a personalised meal plan, we need some information from you. This includes your age, weight, height, and diet goals.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-4">
                        <Button
                            size="lg"
                            onClick={() => router.push('/dashboard/recipes')}
                            className="h-16 text-lg font-black uppercase tracking-widest rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                        >
                            <ChefHat className="mr-2 h-5 w-5" /> View Recipes
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => router.push('/dashboard/profile?from=/dashboard/kitchen')}
                            className="h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 group"
                        >
                            Complete Profile <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Generate */}
            {step === 2 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in">
                    {!generating ? (
                        <div className="space-y-6 max-w-sm">
                            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"><ChefHat size={40} /></div>
                            <h2 className="text-3xl font-bold">Plan Ready</h2>
                            <p className="text-muted-foreground">Roughly <strong>{formatEnergy(calories, unit)}</strong> across 3 meals.</p>
                            <Button size="lg" onClick={handleGenerate} className="w-full h-14 text-lg">Generate Menu</Button>
                            <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">Edit details</Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-pulse"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /><h3 className="text-xl font-bold">Curating...</h3></div>
                    )}
                </div>
            )}

            {/* Step 3: Plan Display */}
            {step === 3 && plan && (
                <div className="space-y-6 animate-in fade-in-up duration-500">
                    {/* List Header */}
                    <div className="hidden lg:grid lg:grid-cols-[120px_1fr_100px_80px_80px_80px_150px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2"><Camera size={14} /> Plate</div>
                        <div className="flex items-center gap-2"><ChefHat size={14} /> Meal Details</div>
                        <div className="text-right flex items-center justify-end gap-2"><Zap size={14} /> Energy</div>
                        <div className="text-right flex items-center justify-end gap-2"><Wheat size={14} /> Carbs</div>
                        <div className="text-right flex items-center justify-end gap-2"><Droplet size={14} /> Fat</div>
                        <div className="text-right flex items-center justify-end gap-2"><Beef size={14} /> Protein</div>
                        <div className="text-right flex items-center justify-end gap-2"><Activity size={14} /> Control</div>
                    </div>

                    <div className="space-y-4">
                        <RecipeListItem recipe={plan.breakfast} mealLabel="Breakfast" unit={unit} onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)} pantryItems={pantryItems} />
                        <RecipeListItem recipe={plan.lunch} mealLabel="Lunch" unit={unit} onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)} pantryItems={pantryItems} />
                        <RecipeListItem recipe={plan.dinner} mealLabel="Dinner" unit={unit} onRegenerate={() => handleRegenerateMeal('dinner', plan.dinner.id)} pantryItems={pantryItems} />
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-wrap justify-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Energy</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{formatEnergy(plan.totalCalories, unit)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Protein</p>
                                <p className="text-2xl font-black text-rose-500">{plan.macros.protein.toFixed(0)}g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Carbs</p>
                                <p className="text-2xl font-black text-amber-500">{plan.macros.carbs.toFixed(0)}g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fat</p>
                                <p className="text-2xl font-black text-amber-900">{plan.macros.fat.toFixed(0)}g</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button
                            onClick={() => router.push('/dashboard/kitchen?tab=shoppinglist')}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                        >
                            <ShoppingBasket size={18} className="mr-2" />
                            View Shopping List
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleGenerate}
                            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest"
                        >
                            <RefreshCw size={18} className="mr-2" />
                            Regenerate All
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
