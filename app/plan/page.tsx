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
    Battery,
    Layers
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

    return map[color as keyof typeof map];
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
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
                    ) : (
                        <ChefHat className="h-10 w-10 opacity-20" />
                    )}
                </div>
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm uppercase">{mealLabel}</div>
                {recipe.servings && recipe.servings !== 1 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-md shadow-lg animate-in zoom-in-50">x{recipe.servings}</div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{recipe.title}</h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground mt-auto">
                    <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" />{formatEnergy(recipe.calories * (recipe.servings || 1), unit)}</span>
                    <span className="flex items-center gap-1"><Beef className="h-4 w-4 text-red-500" />{Number(recipe.protein * (recipe.servings || 1)).toFixed(1)}g</span>
                    <span className="flex items-center gap-1"><Droplet className="h-4 w-4 text-yellow-500" />{Number(recipe.fat * (recipe.servings || 1)).toFixed(1)}g</span>
                    <span className="flex items-center gap-1"><Wheat className="h-4 w-4 text-amber-600" />{Number(recipe.carbs * (recipe.servings || 1)).toFixed(1)}g</span>
                </div>
                <button className="mt-3 w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group/btn" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                    View Recipe <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
                {onRegenerate && (
                    <button className="mt-2 w-full py-2 px-4 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2" onClick={(e) => { e.stopPropagation(); onRegenerate(); }}>
                        <RotateCcw className="h-4 w-4" /> Try Another
                    </button>
                )}
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
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});

    // Nutrient breakdown definitions
    const NUTRIENT_BREAKDOWNS: Record<string, { label: string, keys: string[], unit: string, isEssential?: boolean, hiddenByDefault?: boolean, isExpandable?: boolean }[]> = {
        'Vitamin A': [
            { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
            { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
            { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
            { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
            { label: 'Lutein+Zeaxanthin', keys: ['Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
            { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
        ],
        'Vitamin E': [
            { label: 'Alpha-tocopherol', keys: ['Vitamin E', 'vitamin_e_mg', 'alpha_tocopherol_mg'], unit: 'mg' },
            { label: 'Beta-tocopherol', keys: ['Beta Tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
            { label: 'Delta-tocopherol', keys: ['Delta Tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
            { label: 'Gamma-tocopherol', keys: ['Gamma Tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
        ],
        'Protein': [
            { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
            { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
            { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
            { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
            { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
            { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
            { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
            { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
            { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
            { label: 'Alanine', keys: ['Alanine', 'alanine_g'], unit: 'g' },
            { label: 'Arginine', keys: ['Arginine', 'arginine_g'], unit: 'g' },
            { label: 'Aspartic acid', keys: ['Aspartic acid', 'aspartic_acid_g'], unit: 'g' },
            { label: 'Cystine', keys: ['Cystine', 'cystine_g'], unit: 'g' },
            { label: 'Glutamic acid', keys: ['Glutamic acid', 'glutamic_acid_g'], unit: 'g' },
            { label: 'Glycine', keys: ['Glycine', 'glycine_g'], unit: 'g' },
            { label: 'Proline', keys: ['Proline', 'proline_g'], unit: 'g' },
            { label: 'Serine', keys: ['Serine', 'serine_g'], unit: 'g' },
            { label: 'Tyrosine', keys: ['Tyrosine', 'tyrosine_g'], unit: 'g' },
        ],
        'Carbs': [
            { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
            { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
            { label: 'Sugars (Total)', keys: ['Sugars', 'sugars_g', 'sugar_g'], unit: 'g', isExpandable: true },
            { label: 'Fructose', keys: ['Fructose', 'fructose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Glucose', keys: ['Glucose', 'glucose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Sucrose', keys: ['Sucrose', 'sucrose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Lactose', keys: ['Lactose', 'lactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Maltose', keys: ['Maltose', 'maltose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Galactose', keys: ['Galactose', 'galactose_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Added Sugars', keys: ['Added Sugars', 'added_sugars_g'], unit: 'g', hiddenByDefault: true },
        ],
        'Fat': [
            { label: 'Saturated Fat', keys: ['Saturated', 'saturated_fat_g', 'saturated_g'], unit: 'g' },
            { label: 'Monounsaturated', keys: ['Monounsaturated', 'monounsaturated_fat_g'], unit: 'g' },
            { label: 'Polyunsaturated', keys: ['Polyunsaturated', 'polyunsaturated_fat_g'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3', 'omega3_g', 'omega_3_g'], unit: 'g' },
            { label: 'Omega-6', keys: ['Omega-6', 'omega6_g', 'omega_6_g'], unit: 'g' },
            { label: 'Trans Fat', keys: ['Trans-Fats', 'trans_fat_g'], unit: 'g' },
            { label: 'Cholesterol', keys: ['Cholesterol', 'cholesterol_mg'], unit: 'mg' },
        ],
    };

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
                return mkL.includes(bNum) || (kL.includes('thiamine') && mkL.includes('thiamine')) || (kL.includes('riboflavin') && mkL.includes('riboflavin'));
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
        energy_kcal: 5.00, energy_kj: 20.93, protein_g: 0.50, carbs_g: 0.80, fat_g: 0.05,
        micronutrients: {
            'Vitamin A': 112.50, 'Vitamin C': 4.50, 'B1 (Thiamine)': 0.05, 'B2 (Riboflavin)': 0.41,
            'B3 (Niacin)': 0.20, 'Calcium': 40.00, 'Iron': 0.76, 'Magnesium': 7.35, 'Potassium': 26.50,
            'Sodium': 0.50, 'Fiber': 0.80
        }
    };

    const [calories, setCalories] = useState(2000);
    const [diet, setDiet] = useState<DietType>('anything');
    const { energyUnit: unit, setEnergyUnit: setUnit } = useUserPreferences();
    const [goal, setGoal] = useState<GoalType>('maintain');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
    const [gender, setGender] = useState<'male' | 'female'>('female');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');

    const userRDAs = useRDA(age === '' ? undefined : Number(age), gender, calories);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const newPlan = await generateDailyPlan({ targetCalories: calories, diet, numMeals: 3 });
            setPlan(newPlan);
            setStep(3);
        } catch (error) { console.error(error); } finally { setGenerating(false); }
    };

    const handleNextStep = () => {
        const w = Number(weight) || 70; const h = Number(height) || 170; const a = Number(age) || 30;
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        if (gender === 'male') bmr += 5; else bmr -= 161;
        let tdee = bmr;
        switch (activityLevel) {
            case 'light': tdee = bmr * 1.375; break;
            case 'moderate': tdee = bmr * 1.55; break;
            case 'active': tdee = bmr * 1.725; break;
            default: tdee = bmr * 1.2;
        }
        if (goal === 'lose-fat') tdee *= 0.80; if (goal === 'build-muscle') tdee *= 1.10;
        setCalories(Math.max(1200, Math.round(tdee / 50) * 50));
        setStep(2);
    };

    const handleRegenerateMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner', currentId: string) => {
        if (!plan) return;
        const result = await getRandomRecipeByType(mealType, diet, currentId);
        if (result) {
            const { recipe: newRecipe, micronutrients: newMicros } = result;
            setPlan(p => {
                if (!p) return null;
                const up = { ...p };
                up.recipeMicronutrients = { ...p.recipeMicronutrients, [newRecipe.id]: newMicros };
                if (mealType === 'breakfast') up.breakfast = newRecipe;
                else if (mealType === 'lunch') up.lunch = newRecipe;
                else if (mealType === 'dinner') up.dinner = newRecipe;
                up.totalCalories = up.breakfast.calories + up.lunch.calories + up.dinner.calories;
                up.macros = {
                    protein: up.breakfast.protein + up.lunch.protein + up.dinner.protein,
                    carbs: up.breakfast.carbs + up.lunch.carbs + up.dinner.carbs,
                    fat: up.breakfast.fat + up.lunch.fat + up.dinner.fat,
                };
                const combinedM: Record<string, number> = {};
                [up.breakfast, up.lunch, up.dinner].forEach(r => {
                    const rm = up.recipeMicronutrients[r.id];
                    if (rm) Object.entries(rm).forEach(([k, v]) => { combinedM[k] = (combinedM[k] || 0) + (v as number); });
                });
                up.micronutrients = combinedM;
                return up;
            });
        }
    };

    const updateServings = (rid: string, n: number) => {
        if (!plan) return;
        setPlan(p => {
            if (!p) return null;
            const up = { ...p };
            const m = (r: Recipe) => r.id === rid ? { ...r, servings: n } : r;
            up.breakfast = m(up.breakfast); up.lunch = m(up.lunch); up.dinner = m(up.dinner);
            up.totalCalories = (up.breakfast.calories * (up.breakfast.servings || 1)) + (up.lunch.calories * (up.lunch.servings || 1)) + (up.dinner.calories * (up.dinner.servings || 1));
            return up;
        });
        if (selectedRecipe?.id === rid) setSelectedRecipe(prev => prev ? { ...prev, servings: n } : null);
    };

    const isFormComplete = Boolean(age && weight && height);

    return (
        <main className="min-h-screen bg-background">
            <Header />
            <div className="max-w-5xl mx-auto py-12 px-4">
                {step !== 3 && (
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-serif font-bold mb-4">Miracle Meal Planner</h1>
                        <p className="text-muted-foreground">Personalized daily nutrition plans.</p>
                    </div>
                )}

                <div className="bg-card border rounded-3xl p-10 shadow-sm relative overflow-hidden min-h-[600px]">
                    {step === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Gender</Label>
                                    <div className="flex bg-muted p-1 rounded-lg border h-10">
                                        <button onClick={() => setGender('male')} className={cn("flex-1 text-xs font-bold rounded-md", gender === 'male' ? "bg-primary text-white" : "")}>M</button>
                                        <button onClick={() => setGender('female')} className={cn("flex-1 text-xs font-bold rounded-md", gender === 'female' ? "bg-primary text-white" : "")}>F</button>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Age</Label><Input type="number" value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} className="text-center" /></div>
                                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value ? Number(e.target.value) : '')} className="text-center" /></div>
                                <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value ? Number(e.target.value) : '')} className="text-center" /></div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Goal</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <GoalCard type="lose-fat" selected={goal === 'lose-fat'} onClick={() => setGoal('lose-fat')} icon={TrendingDown} />
                                    <GoalCard type="maintain" selected={goal === 'maintain'} onClick={() => setGoal('maintain')} icon={Activity} />
                                    <GoalCard type="build-muscle" selected={goal === 'build-muscle'} onClick={() => setGoal('build-muscle')} icon={Dumbbell} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Diet</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <DietCard type="anything" selected={diet === 'anything'} onClick={() => setDiet('anything')} icon={Utensils} label="Balanced" />
                                    <DietCard type="vegetarian" selected={diet === 'vegetarian'} onClick={() => setDiet('vegetarian')} icon={Egg} />
                                    <DietCard type="vegan" selected={diet === 'vegan'} onClick={() => setDiet('vegan')} icon={Leaf} />
                                </div>
                            </div>

                            <Button size="lg" onClick={handleNextStep} className="w-full h-12 text-base font-bold rounded-xl mt-4">Generate Plan <ChevronRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                    )}

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

                    {step === 3 && plan && (
                        <div className="space-y-8 animate-in fade-in-up duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <RecipeCard recipe={plan.breakfast} mealLabel="Breakfast" unit={unit} onClick={() => setSelectedRecipe(plan.breakfast)} onRegenerate={() => handleRegenerateMeal('breakfast', plan.breakfast.id)} />
                                <RecipeCard recipe={plan.lunch} mealLabel="Lunch" unit={unit} onClick={() => setSelectedRecipe(plan.lunch)} onRegenerate={() => handleRegenerateMeal('lunch', plan.lunch.id)} />
                                <RecipeCard recipe={plan.dinner} mealLabel="Dinner" unit={unit} onClick={() => setSelectedRecipe(plan.dinner)} onRegenerate={() => handleRegenerateMeal('dinner', plan.dinner.id)} />
                            </div>

                            <div className="space-y-4 pt-10 border-t">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-bold flex items-center gap-2"><LayoutGrid className="text-primary" /> Daily Essential Nutrients</h3>
                                    <Button variant="outline" size="sm" onClick={() => setShowDailyNutrients(!showDailyNutrients)} className="gap-2">{showDailyNutrients ? "Collapse" : "Expand Report"}</Button>
                                </div>

                                {showDailyNutrients && (
                                    <div className="space-y-6 animate-in slide-in-from-top-4">
                                        {/* Summaries categorized by health focus */}
                                        {(() => {
                                            const m = { ...plan.micronutrients };
                                            if (dailyMoringaGrams > 0) {
                                                const r = dailyMoringaGrams / 2;
                                                Object.entries(MORINGA_TSP.micronutrients).forEach(([k, v]) => {
                                                    const match = findNutrientMatch(m, k);
                                                    if (match) m[match] = (m[match] || 0) + (v * r);
                                                });
                                            }
                                            const getVal = (keys: string[]) => { for (const k of keys) if (m[k] !== undefined) return m[k]; return 0; };
                                            const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, any[]>, icon: any, theme?: 'indigo' | 'rose', subtitle?: string }) => {
                                                const themes = {
                                                    indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                                    rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" }
                                                };
                                                const t = themes[theme];

                                                return (
                                                    <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                                                        <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-sm", t.text)}><Icon className="h-5 w-5" /> {title}</h4>
                                                        {subtitle && <p className={cn("text-[10px] text-muted-foreground mb-4 border-b pb-2", t.border)}>{subtitle}</p>}
                                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                                            {Object.entries(items).map(([label, keys]) => {
                                                                const val = getVal(keys as string[]);
                                                                const rda = userRDAs?.[label];
                                                                const pct = rda ? Math.round((val / rda) * 100) : null;
                                                                const styles = getNutrientLevelStyles(pct || 0, label);
                                                                return (
                                                                    <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-all", t.itemBorder, pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                        <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                        <div className="flex items-baseline gap-1"><span className="text-lg font-bold">{val.toFixed(1)}</span><span className={cn("text-[10px] font-bold", (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12')) ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') ? 'µg' : 'mg'}</span></div>
                                                                        {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            };
                                            return (
                                                <div className="space-y-6">
                                                    {/* MACROS - Split into Nutritive and Non-Nutritive */}
                                                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-6">
                                                        {/* NUTRITIVE - Energy Providers */}
                                                        <div>
                                                            <h4 className="font-black flex items-center gap-2 mb-1 text-orange-400 uppercase tracking-widest text-sm"><Zap className="h-5 w-5" /> Macronutrients</h4>
                                                            <p className="text-[10px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Energy providers • Fuel for your body</p>
                                                            <div className="grid grid-cols-4 gap-3">
                                                                {[
                                                                    {
                                                                        label: 'Energy',
                                                                        val: plan.totalCalories,
                                                                        target: calories,
                                                                        unit: 'kcal',
                                                                        secondaryVal: plan.totalEnergyKj || plan.totalCalories * 4.184,
                                                                        secondaryUnit: 'kJ'
                                                                    },
                                                                    { label: 'Protein', val: plan.macros.protein, target: (calories * 0.2) / 4, unit: 'g' },
                                                                    { label: 'Carbs', val: plan.macros.carbs, target: (calories * 0.5) / 4, unit: 'g' },
                                                                    { label: 'Fat', val: plan.macros.fat, target: (calories * 0.3) / 9, unit: 'g' },
                                                                ].map(macro => {
                                                                    const pct = Math.round((macro.val / macro.target) * 100);
                                                                    const styles = getNutrientLevelStyles(pct, macro.label);
                                                                    const canBreakdown = ['Protein', 'Carbs', 'Fat'].includes(macro.label);

                                                                    return (
                                                                        <div key={macro.label} className={cn("p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-all relative group", styles.borderLight)}>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{macro.label}</p>
                                                                                <div className="flex flex-col">
                                                                                    <div className="flex items-baseline gap-1">
                                                                                        <span className="text-xl font-black">{Math.round(macro.val)}</span>
                                                                                        <span className="text-[10px] text-muted-foreground font-bold">{macro.unit}</span>
                                                                                    </div>
                                                                                    {/* Secondary Energy Value */}
                                                                                    {macro.secondaryVal && (
                                                                                        <div className="flex items-baseline gap-1 -mt-1">
                                                                                            <span className="text-xs font-bold text-muted-foreground/70">{Math.round(macro.secondaryVal)}</span>
                                                                                            <span className="text-[9px] text-muted-foreground/60 font-bold">{macro.secondaryUnit}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
                                                                            </div>
                                                                            {canBreakdown && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(macro.label); }}
                                                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-60 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all"
                                                                                    title="View breakdown"
                                                                                >
                                                                                    <Layers className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>


                                                    </div>


                                                    {/* ELECTROLYTES */}
                                                    <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration • Muscle & Nerve Function" items={{
                                                        'Sodium': ['Sodium', 'sodium_mg'],
                                                        'Potassium': ['Potassium', 'potassium_mg'],
                                                        'Magnesium': ['Magnesium', 'magnesium_mg'],
                                                        'Calcium': ['Calcium', 'calcium_mg'],
                                                        'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                                    }} />

                                                    {/* TRACE MINERALS */}
                                                    <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-minerals" items={{
                                                        'Iron': ['Iron', 'iron_mg'],
                                                        'Zinc': ['Zinc', 'zinc_mg'],
                                                        'Copper': ['Copper', 'copper_mg'],
                                                        'Manganese': ['Manganese', 'manganese_mg'],
                                                        'Selenium': ['Selenium', 'selenium_ug']
                                                    }} />


                                                    {/* DAILY VITAMINS (Water-Soluble: B-Complex + C) */}
                                                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                                                        <h4 className="font-black flex items-center gap-2 mb-1 text-blue-400 uppercase tracking-widest text-sm"><Droplet className="h-5 w-5" /> Daily Vitamins</h4>
                                                        <p className="text-[10px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Water-soluble • Must be replenished daily</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                            {[
                                                                { label: 'B1 (Thiamine)', keys: ['B1 (Thiamine)', 'thiamine_mg'] },
                                                                { label: 'B2 (Riboflavin)', keys: ['B2 (Riboflavin)', 'riboflavin_mg'] },
                                                                { label: 'B3 (Niacin)', keys: ['B3 (Niacin)', 'niacin_mg'] },
                                                                { label: 'B5 (Pantothenic)', keys: ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'] },
                                                                { label: 'B6 (Pyridoxine)', keys: ['B6 (Pyridoxine)', 'vitamin_b6_mg'] },
                                                                { label: 'B7 (Biotin)', keys: ['Biotin', 'biotin_ug'] },
                                                                { label: 'B9 (Folate)', keys: ['B9 (Folate)', 'folate_ug'] },
                                                                { label: 'B12 (Cobalamin)', keys: ['B12 (Cobalamin)', 'vitamin_b12_ug'] },
                                                                { label: 'Vitamin C', keys: ['Vitamin C', 'vitamin_c_mg'] },
                                                                { label: 'Choline', keys: ['Choline', 'choline_mg'] },
                                                            ].map(({ label, keys }) => {
                                                                const val = getVal(keys);
                                                                const rda = userRDAs?.[label];
                                                                const pct = rda ? Math.round((val / rda) * 100) : null;
                                                                const styles = getNutrientLevelStyles(pct || 0, label);
                                                                const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') ? 'µg' : 'mg';
                                                                return (
                                                                    <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-3 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-all", pct !== null ? styles.borderLight : "")}>
                                                                        <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-lg font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span>
                                                                            <span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")} title={unitLabel === 'µg' ? 'micrograms' : 'milligrams'}>{unitLabel}</span>
                                                                        </div>
                                                                        {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* STORED VITAMINS (Fat-Soluble: A, D, E, K) */}
                                                    <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900">
                                                        <h4 className="font-black flex items-center gap-2 mb-1 text-emerald-400 uppercase tracking-widest text-sm"><Battery className="h-5 w-5" /> Stored Vitamins</h4>
                                                        <p className="text-[10px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Fat-soluble • Stored in body tissues</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            {[
                                                                { label: 'Vitamin A', keys: ['Vitamin A', 'vitamin_a_ug'], unit: 'µg', hasBreakdown: true },
                                                                { label: 'Vitamin D', keys: ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'], unit: 'IU', hasBreakdown: false },
                                                                { label: 'Vitamin E', keys: ['Vitamin E', 'vitamin_e_mg'], unit: 'mg', hasBreakdown: true },
                                                                { label: 'Vitamin K', keys: ['Vitamin K', 'vitamin_k_ug'], unit: 'µg', hasBreakdown: false },
                                                            ].map(({ label, keys, unit: unitLabel, hasBreakdown }) => {
                                                                const val = getVal(keys);
                                                                const rda = userRDAs?.[label];
                                                                const pct = rda ? Math.round((val / rda) * 100) : null;
                                                                const styles = getNutrientLevelStyles(pct || 0, label);
                                                                return (
                                                                    <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all relative group", pct !== null ? styles.borderLight : "")}>
                                                                        <div onClick={() => setSelectedNutrientInfo(label)} className="cursor-pointer">
                                                                            <p className="text-[10px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                            <div className="flex items-baseline gap-1"><span className="text-xl font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span><span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : unitLabel === 'IU' ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{unitLabel}</span></div>
                                                                            {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                                        </div>
                                                                        {hasBreakdown && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                                                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 opacity-60 group-hover:opacity-100 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all"
                                                                                title="View breakdown"
                                                                            >
                                                                                <Layers className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>


                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedRecipe && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedRecipe(null)}>
                    <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div><h2 className="text-2xl font-bold">{selectedRecipe.title}</h2><p className="text-muted-foreground text-sm uppercase font-bold tracking-widest">{selectedRecipe.prepTime} min prep</p></div>
                            <button onClick={() => setSelectedRecipe(null)} className="p-2 hover:bg-muted rounded-full"><X /></button>
                        </div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/40 rounded-2xl border">
                                <div className="text-center font-bold">Energy<div className="text-xl text-primary">{Math.round(selectedRecipe.calories)}</div></div>
                                <div className="text-center font-bold">Protein<div className="text-xl text-red-500">{selectedRecipe.protein}g</div></div>
                                <div className="text-center font-bold">Carbs<div className="text-xl text-amber-600">{selectedRecipe.carbs}g</div></div>
                                <div className="text-center font-bold">Fat<div className="text-xl text-orange-500">{selectedRecipe.fat}g</div></div>
                            </div>
                            <div>
                                <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2 text-primary"><ShoppingBasket size={18} /> Ingredients</h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                                    {selectedRecipe.ingredients.map((ing, i) => (<li key={i} className="flex gap-2 text-sm"><span>•</span> {ing.amount} <span className="font-bold underline">{ing.baseIngredient || ing.item}</span></li>))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold border-b pb-2 mb-4 flex items-center gap-2 text-primary"><ChefHat size={18} /> Method</h3>
                                <div className="space-y-4">
                                    {selectedRecipe.instructions.map((ins, i) => (<div key={i} className="flex gap-4"><div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div><p className="text-sm">{ins}</p></div>))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNutrientInfo(null)}>
                    <div className="bg-background rounded-2xl max-w-md w-full p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedNutrientInfo(null)} className="absolute top-4 right-4 text-muted-foreground"><X /></button>
                        <h3 className="text-3xl font-serif font-bold text-primary mb-2">{selectedNutrientInfo}</h3>
                        <p className="text-muted-foreground italic mb-6">"{nutrientInfo[selectedNutrientInfo].description}"</p>
                        <div className="space-y-6">
                            <div className="p-4 bg-muted/30 rounded-xl border border-primary/10"><h4 className="font-bold text-sm mb-1 uppercase tracking-wider opacity-60">Biological Significance</h4><p className="text-sm font-medium">{nutrientInfo[selectedNutrientInfo].importance}</p></div>
                            <div className="flex flex-wrap gap-2">{nutrientInfo[selectedNutrientInfo].benefits.map((b, i) => <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">{b}</span>)}</div>
                            <div><h4 className="font-bold text-sm mb-2 opacity-50">Natural Sources</h4><div className="flex flex-wrap gap-1">{nutrientInfo[selectedNutrientInfo].sources.map((s, i) => <span key={i} className="text-[10px] bg-muted px-2 py-1 rounded font-bold uppercase tracking-tighter">{s}</span>)}</div></div>
                        </div>
                    </div>
                </div>
            )}

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && NUTRIENT_BREAKDOWNS[breakdownNutrient] && plan && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBreakdownNutrient(null)}>
                    <div className="bg-background rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBreakdownNutrient(null)} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"><X className="h-5 w-5" /></button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center",
                                breakdownNutrient === 'Protein' ? "bg-red-100 dark:bg-red-900/50 text-red-600" :
                                    breakdownNutrient === 'Carbs' ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600" :
                                        breakdownNutrient === 'Fat' ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600" :
                                            "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600"
                            )}>
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{breakdownNutrient}</h3>
                                <p className="text-sm text-muted-foreground">Constituent Breakdown</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {NUTRIENT_BREAKDOWNS[breakdownNutrient].map(({ label, keys, unit, isEssential, hiddenByDefault, isExpandable }) => {
                                // Skip hidden items unless expanded
                                // For now, we assume 'Sugars (Total)' is the parent for all hidden items in Carbs
                                if (hiddenByDefault && !expandedBreakdownSections['Sugars (Total)']) return null;

                                const m = plan.micronutrients || {};
                                let val = 0;
                                for (const k of keys) {
                                    if (m[k] !== undefined) { val = m[k]; break; }
                                }
                                const isZero = val === 0;

                                const activeColor = breakdownNutrient === 'Protein' ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" :
                                    breakdownNutrient === 'Carbs' ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" :
                                        breakdownNutrient === 'Fat' ? "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" :
                                            "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";

                                const isExpanded = isExpandable && expandedBreakdownSections[label];

                                return (
                                    <div
                                        key={label}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                            isZero ? "bg-muted/30 border-border/50" : activeColor,
                                            hiddenByDefault ? "ml-8 border-l-4 border-l-current" : "", // Indent sub-items
                                            isExpandable ? "cursor-pointer hover:opacity-80 relative overflow-hidden" : ""
                                        )}
                                        onClick={() => {
                                            if (isExpandable) {
                                                setExpandedBreakdownSections(prev => ({ ...prev, [label]: !prev[label] }));
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-2 w-2 rounded-full flex-shrink-0",
                                                isZero ? "bg-muted-foreground/30" :
                                                    breakdownNutrient === 'Protein' ? "bg-red-500" :
                                                        breakdownNutrient === 'Carbs' ? "bg-amber-500" :
                                                            breakdownNutrient === 'Fat' ? "bg-orange-500" :
                                                                "bg-emerald-500"
                                            )} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("font-medium block", isZero ? "text-muted-foreground" : "text-foreground")}>{label}</span>
                                                    {isExpandable && (
                                                        <ChevronDown className={cn("h-4 w-4 transition-transform opacity-50", isExpanded ? "rotate-180" : "")} />
                                                    )}
                                                </div>
                                                {isEssential && <span className="text-[9px] uppercase font-black tracking-wider bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-foreground/50">Essential</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn("text-lg font-bold tabular-nums", isZero ? "text-muted-foreground" : "")}>
                                                {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground text-center">
                                {breakdownNutrient === 'Vitamin A' && "Carotenoids (plant-based) are converted to retinol. Beta-carotene is the most efficient precursor."}
                                {breakdownNutrient === 'Vitamin E' && "Alpha-tocopherol is the most biologically active form. Other tocopherols have antioxidant properties."}
                                {breakdownNutrient === 'Protein' && "Essential amino acids cannot be made by the body and must come from food."}
                                {breakdownNutrient === 'Carbs' && "Sugars include natural fruit sugars (fructose) and milk sugars (lactose). Added sugars should be minimized."}
                                {breakdownNutrient === 'Fat' && "Unsaturated fats (Mono/Poly) are heart-healthy. Omega-3s are vital for brain & heart health."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
