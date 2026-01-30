'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    ArrowLeft,
    ChefHat,
    Clock,
    Users,
    ChevronRight,
    Loader2,
    Utensils,
    ShoppingBasket,
    Zap,
    Scale,
    Activity,
    Info,
    CheckCircle2,
    Layers,
    Gem,
    Droplet,
    Battery,
    X,
    ChevronDown,
    Pencil
} from 'lucide-react';
import { calculateRecipeNutrition, CalculatedNutrition } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

interface Ingredient {
    item: string;
    amount: string;
    base_ingredient: string;
    weight_g: number;
    food_item?: any;
}

interface Instruction {
    step_text: string;
    step_order: number;
}

interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    servings: number;
    image: string | null;
    is_favorite: boolean;
    diet: string[];
    source?: string;
    micronutrients?: Record<string, number>;
}

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});
    const [calculatedTotals, setCalculatedTotals] = useState<CalculatedNutrition | null>(null);
    const { profile } = useUserPreferences();

    const userRDAs = useRDA(undefined, 'female', recipe?.calories || 2000);

    useEffect(() => {
        fetchRecipeDetails();
    }, [id]);

    const fetchRecipeDetails = async () => {
        setLoading(true);
        try {
            // Fetch Recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', id)
                .single();

            if (recipeError) throw recipeError;

            // Fetch Ingredients with food item data
            const { data: ingData, error: ingError } = await supabase
                .from('ingredients')
                .select('*, food_item:food_items(*)')
                .eq('recipe_id', id);

            if (ingError) throw ingError;

            const fetchedIngredients = ingData || [];
            setIngredients(fetchedIngredients);

            // Calculate live micronutrients for the report
            if (fetchedIngredients.length > 0) {
                const calculated = calculateRecipeNutrition(
                    fetchedIngredients.map(ing => ({
                        food_item: ing.food_item,
                        weight_g: ing.weight_g || 0
                    }))
                );

                setCalculatedTotals(calculated);

                // Use the fresh calculation for the entire display
                setRecipe({
                    ...recipeData,
                    calories: calculated.calories,
                    protein: calculated.protein,
                    carbs: calculated.carbs,
                    fat: calculated.fat,
                    micronutrients: calculated.micronutrients
                });
            } else {
                setRecipe(recipeData);
            }

            // Fetch Instructions
            const { data: insData, error: insError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', id)
                .order('step_order', { ascending: true });

            if (insError) throw insError;
            setInstructions(insData || []);

        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load recipe details');
            router.push('/dashboard/meals');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!recipe) return;
        const newStatus = !recipe.is_favorite;
        try {
            const { error } = await supabase
                .from('recipes')
                .update({ is_favorite: newStatus } as any)
                .eq('id', recipe.id);

            if (error) throw error;
            setRecipe({ ...recipe, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to collections' : 'Removed from collections');
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Recipe Databank...</p>
            </div>
        );
    }

    if (!recipe) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </button>
                <div className="flex gap-3">
                    <Button
                        onClick={() => router.push(`/dashboard/recipes/${id}/edit`)}
                        variant="outline"
                        className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium text-slate-600 dark:text-slate-300"
                    >
                        <Pencil size={18} />
                        Edit Recipe
                    </Button>
                    <Button
                        onClick={toggleFavorite}
                        variant="outline"
                        className={cn(
                            "rounded-2xl px-6 h-12 font-black uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800 transition-all",
                            recipe.is_favorite ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Heart size={18} fill={recipe.is_favorite ? "currentColor" : "none"} />
                        {recipe.is_favorite ? 'Favorited' : 'Favorite'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image and Specs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-3">
                        <div className="aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                            {recipe.image ? (
                                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ChefHat size={84} className="opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 backdrop-blur-md shadow-xl">
                                    Meal Type: {recipe.type}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <Clock size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Prep Time</p>
                            <p className="text-xl font-black">{recipe.prep_time}m</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <Users size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Servings</p>
                            <p className="text-xl font-black">{recipe.servings}P</p>
                        </div>
                    </div>

                    <Card className="p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            Dietary Compatibility
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['Balanced', 'Pescatarian', 'Vegetarian', 'Vegan'].map(dietType => {
                                const isSuitable = recipe.diet?.includes(dietType);

                                // Check if ingredients conflict with user exclusions
                                const userExclusions = profile.exclusions || [];
                                const hasConflict = isSuitable && userExclusions.some(ex =>
                                    ingredients.some(ing =>
                                        (ing.base_ingredient || ing.item || '').toLowerCase().includes(ex.toLowerCase())
                                    )
                                );

                                return (
                                    <div
                                        key={dietType}
                                        className={cn(
                                            "p-4 rounded-2xl border text-center transition-all relative",
                                            isSuitable
                                                ? (hasConflict ? "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30" : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20")
                                                : "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 opacity-60"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest mb-1",
                                            isSuitable
                                                ? (hasConflict ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")
                                                : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {dietType}
                                        </p>
                                        <p className={cn(
                                            "text-[8px] font-bold uppercase",
                                            isSuitable
                                                ? (hasConflict ? "text-amber-500/60" : "text-emerald-500/60")
                                                : "text-rose-500/60"
                                        )}>
                                            {isSuitable ? (hasConflict ? 'Warning' : 'Suitable') : 'Excluded'}
                                        </p>
                                        {hasConflict && (
                                            <div className="absolute top-1 right-2">
                                                <span className="text-[10px]" title="Conflict with your exclusions">⚠️</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>



                    <div className="pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowDetailedNutrients(!showDetailedNutrients)}
                            className="w-full gap-2 font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                        >
                            {showDetailedNutrients ? (
                                <>Collapse Nutrient Report <ChevronDown className="h-4 w-4 rotate-180" /></>
                            ) : (
                                <>Detailed Nutrient Report <ChevronDown className="h-4 w-4" /></>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Right Column: Title, Ingredients, Instructions, and Nutrient Report */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95] italic uppercase">
                            {recipe.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {recipe.source && (
                                <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3">
                                    Source: {recipe.source}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Ingredients */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                <ShoppingBasket className="text-emerald-500" />
                                Lab Ingredients
                            </h3>
                            <div className="space-y-2">
                                {ingredients.map((ing: any, i) => (
                                    <div
                                        key={i}
                                        onClick={() => ing.food_item_id && router.push(`/dashboard/food/${ing.food_item_id}`)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 transition-all group",
                                            ing.food_item_id ? "cursor-pointer" : ""
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-emerald-500 font-black text-xs group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{ing.base_ingredient || ing.item}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ing.amount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400">{Math.round(ing.weight_g)}g</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic text-amber-500">
                                <ChefHat />
                                Procedure
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-100 dark:before:bg-slate-800 pl-2">
                                {instructions.map((ins, i) => (
                                    <div key={i} className="relative pl-10 space-y-2 group">
                                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 group-hover:border-amber-500 transition-colors">
                                            <span className="text-xs font-black text-slate-400 group-hover:text-amber-500">{ins.step_order}</span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium pt-2">
                                            {ins.step_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {showDetailedNutrients && recipe && (
                        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500">
                            {(() => {
                                const m = recipe.micronutrients || {};
                                const getVal = (keys: string[]) => { for (const k of keys) if (m[k] !== undefined) return m[k]; return 0; };

                                const NUTRIENT_BREAKDOWNS: Record<string, any[]> = {
                                    'Vitamin A': [
                                        { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
                                        { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
                                        { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
                                        { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
                                        { label: 'Lutein + Zeaxanthin', keys: ['Lutein + Zeaxanthin', 'Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
                                        { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
                                    ],
                                    'Vitamin E': [
                                        { label: 'Alpha-tocopherol', keys: ['Alpha-tocopherol', 'Vitamin E', 'alpha_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Beta-tocopherol', keys: ['Beta-tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Delta-tocopherol', keys: ['Delta-tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Gamma-tocopherol', keys: ['Gamma-tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
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
                                    ],
                                    'Carbs': [
                                        { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
                                        { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
                                        { label: 'Sugars', keys: ['Sugars', 'sugars_g'], unit: 'g' },
                                    ],
                                    'Fat': [
                                        { label: 'Saturated Fat', keys: ['Saturated Fat'], unit: 'g' },
                                        { label: 'Monounsaturated', keys: ['Monounsaturated Fat'], unit: 'g' },
                                        { label: 'Polyunsaturated', keys: ['Polyunsaturated Fat'], unit: 'g' },
                                        { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
                                        { label: 'Omega-3', keys: ['Omega-3'], unit: 'g' },
                                        { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
                                        { label: 'Cholesterol', keys: ['Cholesterol'], unit: 'mg' },
                                    ],
                                };

                                const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, breakdownLabels = [] }: { title: string, items: Record<string, any[]>, icon: any, theme?: string, subtitle?: string, breakdownLabels?: string[] }) => {
                                    const themes = {
                                        indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                        rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
                                        orange: { bg: "bg-slate-900 border-slate-800", text: "text-orange-400", border: "border-slate-800", itemBorder: "border-orange-900/50" }
                                    };
                                    const t = (themes as any)[theme] || themes.indigo;

                                    return (
                                        <div className={cn("p-6 rounded-3xl border bg-gradient-to-br mb-6", t.bg)}>
                                            <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                                            {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                {Object.entries(items).map(([label, keys]) => {
                                                    const val = (label === 'Energy' || label === 'Protein' || label === 'Carbs' || label === 'Fat')
                                                        ? (label === 'Energy' ? (recipe as any).calories : (recipe as any)[label.toLowerCase()])
                                                        : getVal(keys as string[]);
                                                    const rda = userRDAs?.[label];
                                                    const pct = rda ? Math.round((val / rda) * 100) : null;
                                                    const styles = getNutrientLevelStyles(pct || 0, label);
                                                    const unit = label === 'Energy' ? 'kcal' : (label === 'Protein' || label === 'Carbs' || label === 'Fat') ? 'g' : (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12')) ? 'µg' : 'mg';
                                                    const hasBreakdown = breakdownLabels.includes(label);

                                                    return (
                                                        <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                            <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                            <div className="flex items-baseline gap-1"><span className="text-lg font-bold">{val.toFixed(1)}</span><span className={cn("text-[10px] font-bold", (unit === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unit}</span></div>
                                                            {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}

                                                            {hasBreakdown && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                                                    className="absolute top-2 right-2 p-1 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-40 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                                                >
                                                                    <Layers className="h-3 w-3" />
                                                                </button>
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
                                        <NutrientGrid title="Core Macronutrients" icon={Zap} theme="orange" subtitle="Caloric & Macro Breakdown" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                                            'Energy': ['calories'],
                                            'Protein': ['protein'],
                                            'Carbs': ['carbs'],
                                            'Fat': ['fat']
                                        }} />
                                        <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration & Mineral Balance" items={{
                                            'Sodium': ['Sodium', 'sodium_mg'],
                                            'Potassium': ['Potassium', 'potassium_mg'],
                                            'Magnesium': ['Magnesium', 'magnesium_mg'],
                                            'Calcium': ['Calcium', 'calcium_mg'],
                                            'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                        }} />

                                        <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-nutrients" items={{
                                            'Iron': ['Iron', 'iron_mg'],
                                            'Zinc': ['Zinc', 'zinc_mg'],
                                            'Copper': ['Copper', 'copper_mg'],
                                            'Manganese': ['Manganese', 'manganese_mg'],
                                            'Selenium': ['Selenium', 'selenium_ug']
                                        }} />

                                        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 mb-6">
                                            <h4 className="font-black flex items-center gap-2 mb-1 text-blue-400 uppercase tracking-widest text-[10px]"><Droplet className="h-4 w-4" /> Daily Vitamins</h4>
                                            <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Water-soluble vitamins (B-Complex & C)</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                {[
                                                    { label: 'B1 (Thiamine)', keys: ['B1 (Thiamine)', 'thiamine_mg'] },
                                                    { label: 'B2 (Riboflavin)', keys: ['B2 (Riboflavin)', 'riboflavin_mg'] },
                                                    { label: 'B3 (Niacin)', keys: ['B3 (Niacin)', 'niacin_mg'] },
                                                    { label: 'B5 (Pantothenic)', keys: ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'] },
                                                    { label: 'B6 (Pyridoxine)', keys: ['B6 (Pyridoxine)', 'vitamin_b6_mg'] },
                                                    { label: 'B9 (Folate)', keys: ['B9 (Folate)', 'folate_ug'] },
                                                    { label: 'B12 (Cobalamin)', keys: ['B12 (Cobalamin)', 'vitamin_b12_ug'] },
                                                    { label: 'Vitamin C', keys: ['Vitamin C', 'vitamin_c_mg'] },
                                                    { label: 'Choline', keys: ['Choline', 'choline_mg'] },
                                                ].map(({ label, keys }) => {
                                                    const val = getVal(keys);
                                                    const rda = userRDAs?.[label];
                                                    const pct = rda ? Math.round((val / rda) * 100) : null;
                                                    const styles = getNutrientLevelStyles(pct || 0, label);
                                                    const unitLabel = label.includes('Folate') || label.includes('B12') ? 'µg' : 'mg';
                                                    return (
                                                        <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-3 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all", pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                            <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-lg font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span>
                                                                <span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitLabel}</span>
                                                            </div>
                                                            {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900">
                                            <h4 className="font-black flex items-center gap-2 mb-1 text-emerald-400 uppercase tracking-widest text-[10px]"><Battery className="h-4 w-4" /> Stored Vitamins</h4>
                                            <p className="text-[9px] text-slate-400 mb-4 border-b border-slate-800 pb-2">Fat-soluble storage (A, D, E, K)</p>
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
                                                        <div key={label} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 hover:shadow-md transition-all relative group", pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                            <div onClick={() => setSelectedNutrientInfo(label)} className="cursor-pointer">
                                                                <p className="text-[10px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                <div className="flex items-baseline gap-1"><span className="text-xl font-bold">{val >= 1 ? val.toFixed(1) : val.toFixed(2)}</span><span className={cn("text-[10px] font-bold", unitLabel === 'µg' ? "text-blue-600 dark:text-blue-400" : unitLabel === 'IU' ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{unitLabel}</span></div>
                                                                {pct !== null && <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>}
                                                            </div>
                                                            {hasBreakdown && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 opacity-60 group-hover:opacity-100 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all border border-emerald-200/50 dark:border-emerald-700/50"
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

            {/* NUTRIENT INFO MODAL */}
            {selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNutrientInfo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl relative border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedNutrientInfo(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
                        <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-tighter italic">{selectedNutrientInfo}</h3>
                        <p className="text-slate-500 italic mb-8 text-sm leading-relaxed">"{nutrientInfo[selectedNutrientInfo].description}"</p>
                        <div className="space-y-8">
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800/50">
                                <h4 className="font-black text-[10px] mb-3 uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Biological Significance</h4>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed font-serif">{nutrientInfo[selectedNutrientInfo].importance}</p>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {nutrientInfo[selectedNutrientInfo].benefits.map((b, i) => (
                                    <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-4 py-2 rounded-full">
                                        {b}
                                    </span>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-black text-[10px] mb-3 uppercase tracking-widest text-slate-400">Natural Sources</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {nutrientInfo[selectedNutrientInfo].sources.map((s, i) => (
                                        <span key={i} className="text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && (recipe.micronutrients) && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setBreakdownNutrient(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 fade-in duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setBreakdownNutrient(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-current/10",
                                breakdownNutrient === 'Protein' ? "bg-red-100 text-red-600" :
                                    breakdownNutrient === 'Carbs' ? "bg-amber-100 text-amber-600" :
                                        breakdownNutrient === 'Fat' ? "bg-orange-100 text-orange-600" :
                                            "bg-emerald-100 text-emerald-600"
                            )}>
                                <Layers className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">{breakdownNutrient}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Constituent Laboratory Analysis</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                const NUTRIENT_BREAKDOWNS: Record<string, any[]> = {
                                    'Vitamin A': [
                                        { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
                                        { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
                                        { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
                                        { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
                                        { label: 'Lutein + Zeaxanthin', keys: ['Lutein + Zeaxanthin', 'Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
                                        { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
                                    ],
                                    'Vitamin E': [
                                        { label: 'Alpha-tocopherol', keys: ['Alpha-tocopherol', 'Vitamin E', 'alpha_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Beta-tocopherol', keys: ['Beta-tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Delta-tocopherol', keys: ['Delta-tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
                                        { label: 'Gamma-tocopherol', keys: ['Gamma-tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
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
                                    ],
                                    'Carbs': [
                                        { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
                                        { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
                                        { label: 'Sugars', keys: ['Sugars', 'sugars_g'], unit: 'g' },
                                    ],
                                    'Fat': [
                                        { label: 'Saturated Fat', keys: ['Saturated Fat'], unit: 'g' },
                                        { label: 'Monounsaturated', keys: ['Monounsaturated Fat'], unit: 'g' },
                                        { label: 'Polyunsaturated', keys: ['Polyunsaturated Fat'], unit: 'g' },
                                        { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
                                        { label: 'Omega-3', keys: ['Omega-3'], unit: 'g' },
                                        { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
                                        { label: 'Cholesterol', keys: ['Cholesterol'], unit: 'mg' },
                                    ],
                                };

                                const m = recipe.micronutrients || {};
                                const items = NUTRIENT_BREAKDOWNS[breakdownNutrient] || [];

                                return items.map(({ label, keys, unit, isEssential }) => {
                                    let val = 0;
                                    for (const k of keys) if (m[k] !== undefined) { val = m[k]; break; }
                                    const isZero = val === 0;

                                    return (
                                        <div
                                            key={label}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                                isZero ? "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("h-2.5 w-2.5 rounded-full", isZero ? "bg-slate-300" : "bg-emerald-500")} />
                                                <div>
                                                    <span className={cn("font-black text-sm", isZero ? "text-slate-400" : "text-slate-900 dark:text-white uppercase tracking-tight")}>{label}</span>
                                                    {isEssential && <span className="ml-2 text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-md">Essential</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={cn("text-xl font-black tabular-nums", isZero ? "text-slate-300" : "")}>
                                                    {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{unit}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
