'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    Loader2,
    Search,
    Trash2,
    Beef,
    Zap,
    Wheat,
    Droplet,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    Camera,
    Info,
    Sparkles,
    ChefHat,
    Users,
    Clock,
    Wand2,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { DailyPlan } from '@/lib/utils/meal-generator';
import { Recipe } from '@/lib/data/recipes';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_in_pantry: boolean;
    category?: string;
}

export default function PantryPage() {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const { dailyPlan, updateDailyPlan } = useUserPreferences();

    useEffect(() => {
        fetchPantry();
    }, []);

    const toggleGroup = (groupName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const fetchPantry = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true)
                .order('common_name', { ascending: true });

            if (error) throw error;
            setFoods(data || []);
        } catch (error: any) {
            console.error('Error fetching pantry:', error);
            if (error.code === '42703') {
                toast.error("Database schema update required. Please run the latest migration.");
            } else {
                toast.error("Failed to load pantry.");
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromPantry = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_in_pantry: false } as any)
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.filter(f => f.id !== id));
            toast.success(`${name} removed from pantry`);
        } catch (error) {
            console.error('Error removing from pantry:', error);
            toast.error("Failed to remove item.");
        }
    };

    const handleAddToPlan = async (recipeId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
        try {
            // Fetch the full recipe details including ingredients for micronutrient calculation
            const { data: r, error } = await supabase
                .from('recipes')
                .select(`
                    *,
                    ingredients (
                        *,
                        food_items (*)
                    ),
                    instructions (*)
                `)
                .eq('id', recipeId)
                .single();

            if (error) throw error;
            if (!r) return;

            // Transform to Recipe object
            const ingredients = r.ingredients || [];
            const recipe: Recipe = {
                id: r.id,
                title: r.title,
                type: r.type,
                calories: r.calories || 0,
                protein: r.protein || 0,
                carbs: r.carbs || 0,
                fat: r.fat || 0,
                prepTime: r.prep_time,
                image: r.image,
                diet: r.diet || [],
                servings: 1,
                instructions: (r.instructions || []).sort((a: any, b: any) => a.step_order - b.step_order).map((inst: any) => inst.step_text),
                ingredients: ingredients.map((i: any) => ({
                    item: i.item,
                    amount: i.amount,
                    isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient,
                    weightG: i.weight_g,
                    measureLabel: i.measure_label
                }))
            };

            // Calculate micronutrients
            const micronutrients: Record<string, number> = {};
            ingredients.forEach((ing: any) => {
                if (ing.food_items && ing.weight_g) {
                    const ratio = ing.weight_g / 100;
                    if (ing.food_items.micronutrients) {
                        Object.entries(ing.food_items.micronutrients).forEach(([k, v]) => {
                            micronutrients[k] = (micronutrients[k] || 0) + (v as number) * ratio;
                        });
                    }
                }
            });

            // Update plan - if no plan exists, we initialize it using this recipe for the selected slot
            // For the other slots, we'll use this same recipe as a placeholder or could use a "placeholder" recipe
            // For simplicity, let's just initialize all slots with this recipe if it's the first time
            let up: DailyPlan;
            if (dailyPlan) {
                up = { ...dailyPlan };
            } else {
                up = {
                    breakfast: recipe,
                    lunch: recipe,
                    dinner: recipe,
                    snacks: [],
                    totalCalories: 0,
                    totalEnergyKj: 0,
                    macros: { protein: 0, carbs: 0, fat: 0 },
                    micronutrients: {},
                    recipeMicronutrients: {}
                };
            }

            up.recipeMicronutrients = { ...up.recipeMicronutrients, [recipe.id]: micronutrients };
            if (mealType === 'breakfast') up.breakfast = recipe;
            else if (mealType === 'lunch') up.lunch = recipe;
            else if (mealType === 'dinner') up.dinner = recipe;

            // Recalculate totals
            up.totalCalories = (up.breakfast.calories * (up.breakfast.servings || 1)) +
                (up.lunch.calories * (up.lunch.servings || 1)) +
                (up.dinner.calories * (up.dinner.servings || 1));

            up.macros = {
                protein: (up.breakfast.protein * (up.breakfast.servings || 1)) +
                    (up.lunch.protein * (up.lunch.servings || 1)) +
                    (up.dinner.protein * (up.dinner.servings || 1)),
                carbs: (up.breakfast.carbs * (up.breakfast.servings || 1)) +
                    (up.lunch.carbs * (up.lunch.servings || 1)) +
                    (up.dinner.carbs * (up.dinner.servings || 1)),
                fat: (up.breakfast.fat * (up.breakfast.servings || 1)) +
                    (up.lunch.fat * (up.lunch.servings || 1)) +
                    (up.dinner.fat * (up.dinner.servings || 1)),
            };

            const combinedM: Record<string, number> = {};
            [up.breakfast, up.lunch, up.dinner].forEach(r => {
                const rm = up.recipeMicronutrients[r.id];
                const factor = r.servings || 1;
                if (rm) {
                    Object.entries(rm).forEach(([k, v]) => {
                        combinedM[k] = (combinedM[k] || 0) + ((v as number) * factor);
                    });
                }
            });
            up.micronutrients = combinedM;

            updateDailyPlan(up);
            toast.success(`Success! Added to ${mealType}.`);
            router.push('/dashboard/mealplanner');

        } catch (error) {
            console.error('Error adding to plan:', error);
            toast.error('Failed to add to plan.');
        }
    };

    const generateSuggestions = async () => {
        setLoadingSuggestions(true);
        setIsSuggesting(true);
        try {
            // Fetch recipes and ingredients
            const [recipesRes, ingredientsRes] = await Promise.all([
                supabase.from('recipes').select('*'),
                supabase.from('ingredients').select('recipe_id, food_item_id, item, base_ingredient')
            ]);

            if (recipesRes.error) throw recipesRes.error;
            if (ingredientsRes.error) throw ingredientsRes.error;

            const recipes = recipesRes.data || [];
            const ingredients = ingredientsRes.data || [];

            // Pantry item lookup maps
            const pantryIds = new Set(foods.map(f => f.id));
            const pantryNames = new Set(foods.map(f => (f.common_name || f.name).toLowerCase().trim()));

            // Group ingredients by recipe
            const recipeIngredientsMap: Record<string, any[]> = {};
            ingredients.forEach(ing => {
                if (!recipeIngredientsMap[ing.recipe_id]) recipeIngredientsMap[ing.recipe_id] = [];
                recipeIngredientsMap[ing.recipe_id].push(ing);
            });

            // Score recipes
            const scoredRecipes = recipes.map(recipe => {
                const recipeIngs = recipeIngredientsMap[recipe.id] || [];
                if (recipeIngs.length === 0) return { ...recipe, matchScore: 0, matchCount: 0, totalCount: 0, missingIngredients: [] };

                let matchCount = 0;
                const missingIngredients: string[] = [];

                recipeIngs.forEach(ing => {
                    const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
                        (ing.base_ingredient && pantryNames.has(ing.base_ingredient.toLowerCase().trim())) ||
                        (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));

                    if (isMatch) {
                        matchCount++;
                    } else {
                        missingIngredients.push(ing.base_ingredient || ing.item);
                    }
                });

                return {
                    ...recipe,
                    matchScore: matchCount / recipeIngs.length,
                    matchCount,
                    totalCount: recipeIngs.length,
                    missingIngredients: Array.from(new Set(missingIngredients)) // Unique missing items
                };
            });

            // Sort by match percentage and take top 6 with at least one match
            const topSuggestions = scoredRecipes
                .filter(r => r.matchCount > 0)
                .sort((a, b) => b.matchScore - a.matchScore || b.matchCount - a.matchCount)
                .slice(0, 6);

            setSuggestions(topSuggestions);
        } catch (error) {
            console.error('Error generating suggestions:', error);
            toast.error('Failed to analyze your kitchen.');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const filteredFoods = foods.filter(food =>
        (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping logic
    const groupedFoods = filteredFoods.reduce((acc, food) => {
        const key = food.common_name || food.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(food);
        return acc;
    }, {} as Record<string, FoodItem[]>);

    const groupNames = Object.keys(groupedFoods).sort();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <ShoppingBasket className="text-emerald-600" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Kitchen Staples</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-lg">
                        Your personal collection of healthy ingredients. Save items here to make them easy to find when planning your meals.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {foods.length > 0 && (
                        <Button
                            onClick={generateSuggestions}
                            className="bg-slate-900 border border-slate-800 text-slate-100 px-6 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-2 group transition-all hover:bg-black"
                        >
                            <Sparkles size={18} className="text-amber-400 group-hover:scale-125 transition-transform" />
                            Generate Meals
                        </Button>
                    )}
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        variant="outline"
                        className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-[10px]"
                    >
                        Browse All
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-2 group transition-all"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Add Items
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-12 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search your staples..."
                    className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Suggestions Window (Inline Focus) */}
            {isSuggesting && (
                <div className="mb-12 animate-in slide-in-from-top-4 duration-500 fade-in fill-mode-both">
                    <div className="relative w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="flex flex-col">
                            {/* Window Header */}
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                        <Wand2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 dark:text-white">Kitchen Magic</h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Suggested meals based on your pantry</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSuggesting(false)}
                                    className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 h-10 w-10"
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Window Content */}
                            <div className="p-8">
                                {loadingSuggestions ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="relative">
                                            <Loader2 className="animate-spin text-emerald-500" size={48} />
                                            <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={20} />
                                        </div>
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Analyzing Inventory...</p>
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <ChefHat size={64} className="text-slate-200 dark:text-slate-800 mb-6" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Clear Matches Found</h3>
                                        <p className="text-slate-500 max-w-sm">We couldn't find recipes that strongly match your current staples. Try adding more variety to your pantry!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-10">
                                        {suggestions.map((recipe) => (
                                            <div
                                                key={recipe.id}
                                                onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                                                className="group flex flex-col xl:flex-row items-center xl:items-stretch gap-10 p-10 rounded-[4rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/50 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-1"
                                            >
                                                {/* Hero Image */}
                                                <div className="w-full xl:w-[400px] aspect-square xl:h-auto rounded-[3rem] overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 shadow-2xl relative">
                                                    {recipe.image ? (
                                                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-300">
                                                            <ChefHat size={80} className="opacity-20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                    {/* Match Overlay */}
                                                    <div className="absolute top-6 left-6">
                                                        <div className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs tracking-[0.2em] shadow-2xl flex items-center gap-2">
                                                            <Sparkles size={16} />
                                                            {Math.round(recipe.matchScore * 100)}% MATCH
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col justify-between py-4 w-full">
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-3 py-1 font-black tracking-widest uppercase">
                                                                    {recipe.type}
                                                                </Badge>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                                    <Clock size={14} className="text-emerald-500/40" /> {recipe.prep_time} MINUTES
                                                                </div>
                                                            </div>
                                                            <h4 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] uppercase tracking-tighter transition-colors group-hover:text-emerald-500">
                                                                {recipe.title}
                                                            </h4>
                                                        </div>

                                                        {/* High-Level Nutrition Row */}
                                                        <div className="flex flex-wrap gap-8 py-6 border-y border-slate-50 dark:border-slate-800/50">
                                                            {[
                                                                { label: 'CALORIES', val: Math.round(recipe.calories || 0), unit: 'kcal', color: 'text-orange-500' },
                                                                { label: 'PROTEIN', val: (recipe.protein || 0).toFixed(1), unit: 'g', color: 'text-rose-500' },
                                                                { label: 'CARBS', val: (recipe.carbs || 0).toFixed(1), unit: 'g', color: 'text-amber-500' },
                                                                { label: 'FAT', val: (recipe.fat || 0).toFixed(1), unit: 'g', color: 'text-slate-900 dark:text-white' },
                                                            ].map(stat => (
                                                                <div key={stat.label} className="space-y-1">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                                                    <p className={cn("text-2xl font-black italic", stat.color)}>
                                                                        {stat.val}<span className="text-sm ml-0.5 opacity-50 not-italic uppercase">{stat.unit}</span>
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Dynamic Missing Items Section */}
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                                        <ShoppingBasket size={18} />
                                                                    </div>
                                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                                        {recipe.matchCount} / {recipe.totalCount} POSSESSED
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {recipe.missingIngredients.length > 0 && (
                                                                <div className="p-6 rounded-[2rem] bg-rose-50/30 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10">
                                                                    <div className="flex items-center gap-2 mb-4">
                                                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Required Purchases</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {recipe.missingIngredients.map((ing: string, idx: number) => (
                                                                            <Badge
                                                                                key={idx}
                                                                                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-950 text-rose-500 border border-rose-100 dark:border-rose-900/50 shadow-sm"
                                                                            >
                                                                                {ing}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-end gap-3 pt-8">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Plan this for:</p>
                                                        {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                                                            <button
                                                                key={meal}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAddToPlan(recipe.id, meal.toLowerCase() as any);
                                                                }}
                                                                className="px-6 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-black uppercase tracking-widest text-[9px] hover:bg-black hover:border-emerald-500/50 transition-all shadow-lg flex items-center gap-2 group/btn"
                                                            >
                                                                <span>{meal}</span>
                                                                <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                                            </button>
                                                        ))}
                                                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />
                                                        <div
                                                            onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                                                            className="flex items-center gap-3 px-8 h-16 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 group/cook hover:scale-105 transition-all"
                                                        >
                                                            <span>Recipe</span>
                                                            <ArrowRight size={20} className="group-hover/cook:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Window Footer */}
                            {!loadingSuggestions && suggestions.length > 0 && (
                                <div className="px-8 pb-8 pt-0 flex justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Tap any meal to view the full recipe
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* List Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Checking your kitchen...</p>
                </div>
            ) : filteredFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Staples List Empty</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 px-4">
                        Add your favorite healthy foods to your staples to make meal planning a breeze.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        className="rounded-xl px-10 h-14 font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                    >
                        Stock Up Now
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header - Matching Explore Foods */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_100px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5"><Camera size={14} /> View</div>
                        <div className="flex items-center gap-1.5"><Info size={14} /> Name</div>
                        <div className="flex justify-end items-center gap-1.5"><Zap size={14} className="text-emerald-500" /> Cals</div>
                        <div className="flex justify-end items-center gap-1.5"><Wheat size={14} className="text-amber-500" /> Carbs</div>
                        <div className="flex justify-end items-center gap-1.5"><Droplet size={14} className="text-amber-900" /> Fat</div>
                        <div className="flex justify-end items-center gap-1.5"><Beef size={14} className="text-rose-500" /> Protein</div>
                        <div className="text-center">Actions</div>
                    </div>

                    {/* Food Items Grouped List */}
                    <div className="space-y-6">
                        {groupNames.map((groupName) => {
                            const items = groupedFoods[groupName];
                            const isExpanded = expandedGroups[groupName] || (searchQuery.length > 0 && items.length > 0);
                            const hasMultiple = items.length > 1;

                            // If it's a single item and it's not grouped by common_name (i.e. name was used as key)
                            // Or if it's just a single entry for a common name.

                            return (
                                <div key={groupName} className="space-y-2">
                                    {/* Group Header */}
                                    {hasMultiple && (
                                        <div
                                            onClick={(e) => toggleGroup(groupName, e)}
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all shadow-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 group/header",
                                                isExpanded && "border-emerald-500/30 ring-1 ring-emerald-500/10"
                                            )}
                                        >
                                            {/* Thumbnail for group */}
                                            <div className="w-16 h-12 rounded-xl bg-slate-200 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-inner group-hover/header:scale-105 transition-transform duration-300">
                                                {items[0]?.image ? (
                                                    <img src={items[0].image} alt={groupName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Beef size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                        {groupName}
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0 shrink-0">
                                                            {items.length} options
                                                        </Badge>
                                                    </h2>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-70">
                                                        {items.map(i => i.name).join(' • ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!hasMultiple && (
                                        <div className="px-4 py-1">
                                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                                                {groupName}
                                            </h2>
                                        </div>
                                    )}

                                    {/* Items in Group */}
                                    <div className={cn("space-y-3", hasMultiple && "pl-6 lg:pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-3 lg:ml-7")}>
                                        {(isExpanded || !hasMultiple) && items.map((food) => (
                                            <div
                                                key={food.id}
                                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all overflow-hidden"
                                            >
                                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_100px] gap-4 lg:items-center lg:px-8">
                                                    {/* Thumbnail */}
                                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                                        {food.image ? (
                                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Beef size={24} className="opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="p-3 lg:p-0">
                                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                                            {food.name}
                                                        </h3>
                                                        {food.category && (
                                                            <Badge className="mt-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none">
                                                                {food.category}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Stats (Desktop View) */}
                                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                        {Math.round(food.energy_kcal)}
                                                    </div>
                                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                        {food.carbs_g.toFixed(1)}g
                                                    </div>
                                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                        {food.fat_g.toFixed(1)}g
                                                    </div>
                                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                        {food.protein_g.toFixed(1)}g
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFromPantry(food.id, food.name)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => router.push(`/dashboard/foods/${food.id}`)}
                                                                className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                            >
                                                                <ArrowRight size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Mobile Stats Row */}
                                                    <div className="lg:hidden grid grid-cols-4 gap-2 px-3 pb-3">
                                                        {[
                                                            { label: 'CAL', val: food.energy_kcal, sub: 'k', color: 'text-orange-500' },
                                                            { label: 'CHO', val: food.carbs_g, sub: 'g', color: 'text-amber-500' },
                                                            { label: 'FAT', val: food.fat_g, sub: 'g', color: 'text-amber-900' },
                                                            { label: 'PRO', val: food.protein_g, sub: 'g', color: 'text-rose-500' }
                                                        ].map(stat => (
                                                            <div key={stat.label} className="text-center">
                                                                <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                                                                <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
