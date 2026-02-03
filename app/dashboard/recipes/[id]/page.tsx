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
    Pencil,
    Eye,
    EyeOff,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RotateCcw,
    Diff,
    Plus,
    Minus,
    Trash2
} from 'lucide-react';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import { calculateRecipeNutrition, CalculatedNutrition, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
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
    id: string; // Added ID for toggling
    item: string;
    amount: string;
    base_ingredient: string;
    weight_g: number;
    food_item?: any;
    food_item_id?: string;
    quantity?: number;
    measure_label?: string;
    modifier?: string;
    recipe_id?: string;
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
    const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]); // To support reset
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hiddenIngredientIds, setHiddenIngredientIds] = useState<string[]>([]);
    const [isReordering, setIsReordering] = useState(false);
    const [isEditingIngredients, setIsEditingIngredients] = useState(false); // Add/Remove mode
    const [isEditingMeasures, setIsEditingMeasures] = useState(false); // New: Edit Measures mode
    const [showPicker, setShowPicker] = useState(false);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(true);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});
    const [calculatedTotals, setCalculatedTotals] = useState<CalculatedNutrition | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { profile, nutrientDisplayMode, energyUnit, dailyTargets } = useUserPreferences();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
                setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
            }
        };
        getUser();
    }, []);

    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        recipe?.calories || 2000
    );

    // Identify dietary conflicts once ingredients are loaded
    const dietaryConflicts = React.useMemo(() => {
        if (!ingredients.length || !profile.exclusions?.length) return [];

        const conflicts: { exclusion: string; ingredient: string }[] = [];
        const userExclusions = profile.exclusions;

        userExclusions.forEach(ex => {
            const exclusion = ex.toLowerCase();
            const matchingIng = ingredients.find(ing => {
                const ingName = (ing.base_ingredient || ing.item || '').toLowerCase();
                const exSingular = exclusion.replace(/s$/, '');
                if (ingName.includes(exSingular)) return true;
                if (exclusion.includes(ingName) && ingName.length > 3) return true;

                if (exclusion === 'dairy') {
                    const dairyTerms = ['milk', 'butter', 'cheese', 'cream', 'yogurt', 'curd', 'whey', 'casein'];
                    if (dairyTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'eggs' && ingName.includes('egg')) return true;
                if ((exclusion === 'nuts' || exclusion === 'peanuts')) {
                    const nutTerms = ['nut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'peanut'];
                    if (nutTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'nightshades') {
                    const nightshadeTerms = ['tomato', 'potato', 'eggplant', 'pepper', 'chili', 'paprika', 'cayenne'];
                    // Exclusion: Sweet potatoes and Yams are NOT nightshades
                    if (ingName.includes('sweet potato') || ingName.includes('yam')) return false;
                    if (nightshadeTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'gluten') {
                    const glutenTerms = ['wheat', 'barley', 'rye', 'spelt', 'flour', 'bread', 'pasta', 'couscous', 'semolina', 'kamut'];
                    if (glutenTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'shellfish') {
                    const shellfishTerms = ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop', 'crayfish'];
                    if (shellfishTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'soy') {
                    const soyTerms = ['soy', 'tofu', 'tempeh', 'edamame', 'miso', 'tamari'];
                    if (soyTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'fish') {
                    const fishTerms = [
                        'fish', 'salmon', 'tuna', 'cod', 'haddock', 'trout', 'sardine', 'anchovy', 'mackerel',
                        'pilchard', 'snapper', 'tilapia', 'bass', 'carp', 'catfish', 'hake', 'herring', 'halibut',
                        'sole', 'bream', 'mullet', 'kingfish', 'yellowtail', 'tuna', 'snoek', 'yellowfin'
                    ];
                    if (fishTerms.some(term => ingName.includes(term))) return true;
                }
                if (exclusion === 'corn') {
                    const cornTerms = ['corn', 'maize', 'polenta', 'hominy'];
                    if (cornTerms.some(term => ingName.includes(term))) return true;
                }
                return false;
            });

            if (matchingIng) {
                conflicts.push({ exclusion: ex, ingredient: matchingIng.item });
            }
        });

        return conflicts;
    }, [ingredients, profile.exclusions]);

    // Notify user of conflicts on mount/load
    useEffect(() => {
        if (dietaryConflicts.length > 0) {
            const items = dietaryConflicts.map(c => c.exclusion).join(', ');
            toast.warning(`Dietary Warning: This meal contains ${items}, which you've excluded from your profile.`, {
                duration: 6000,
                position: 'top-center'
            });
        }
    }, [dietaryConflicts]);

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
            setOriginalIngredients(fetchedIngredients); // Save original order

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

    // Effect to recalculate nutrition when ingredients or hidden status changes
    useEffect(() => {
        if (ingredients.length === 0 || !recipe) return;

        const activeIngredients = ingredients.filter(ing => !hiddenIngredientIds.includes(ing.id));

        const calculated = calculateRecipeNutrition(
            activeIngredients.map(ing => ({
                food_item: ing.food_item,
                weight_g: ing.weight_g || 0
            }))
        );

        setCalculatedTotals(calculated);
        setRecipe(prev => prev ? ({
            ...prev,
            calories: calculated.calories,
            energy_kj: calculated.calories * 4.184, // Ensure KJ updates too
            protein: calculated.protein,
            carbs: calculated.carbs,
            fat: calculated.fat,
            micronutrients: calculated.micronutrients
        }) : null);

    }, [ingredients, hiddenIngredientIds]);

    const toggleIngredient = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHiddenIngredientIds(prev =>
            prev.includes(id)
                ? prev.filter(hid => hid !== id)
                : [...prev, id]
        );
    };

    // Load saved order AND list when user ID is available
    useEffect(() => {
        if (currentUserId && originalIngredients.length > 0) {
            const savedData = localStorage.getItem(`recipe_customization_${currentUserId}_${id}`);
            if (savedData) {
                try {
                    const savedIngredients = JSON.parse(savedData);
                    // We trust the saved list. It contains the full ingredient objects for added items,
                    // and maintains the order / removals of the original items.
                    // However, we should try to refresh the data of original items from DB to get latest info (like images)
                    // For now, simpler approach: Use the saved list's IDs to map back to originalIngredients where possible.

                    const mergedIngredients = savedIngredients.map((savedIng: Ingredient) => {
                        const original = originalIngredients.find(o => o.id === savedIng.id);
                        return original ? { ...original, ...savedIng } : savedIng;
                    });

                    setIngredients(mergedIngredients);
                } catch (e) {
                    console.error("Failed to parse saved ingredient customization", e);
                    // Fallback to original ingredients if parsing fails
                    setIngredients(originalIngredients);
                }
            } else {
                // If no saved customization, use the original fetched ingredients
                setIngredients(originalIngredients);
            }
        } else if (originalIngredients.length > 0 && !currentUserId) {
            // If no user logged in, just use original ingredients
            setIngredients(originalIngredients);
        }
    }, [currentUserId, originalIngredients, id]);

    const saveCustomization = (newIngs: Ingredient[]) => {
        if (currentUserId) {
            localStorage.setItem(`recipe_customization_${currentUserId}_${id}`, JSON.stringify(newIngs));
        }
    };

    const moveIngredient = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === ingredients.length - 1)) return;

        const newIngredients = [...ingredients];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newIngredients[index], newIngredients[swapIndex]] = [newIngredients[swapIndex], newIngredients[index]];

        setIngredients(newIngredients);
        saveCustomization(newIngredients);
    };

    const removeIngredient = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
        saveCustomization(newIngredients);
        toast.success("Ingredient removed (local view only)");
    };

    const handleUpdateIngredientQuantity = (index: number, newQty: number) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const food = ing.food_item;

        // Find current unit definition
        let unitWeight = 0;
        const currentUnit = ing.measure_label || 'g';

        if (['g', 'ml', 'gram', 'grams'].includes(currentUnit.toLowerCase())) {
            unitWeight = 1;
        } else if (['kg', 'kilogram'].includes(currentUnit.toLowerCase())) {
            unitWeight = 1000;
        } else if (['oz', 'ounce'].includes(currentUnit.toLowerCase())) {
            unitWeight = 28.3495;
        } else if (['lb', 'pound'].includes(currentUnit.toLowerCase())) {
            unitWeight = 453.592;
        } else {
            // Check portions
            const portion = food?.portions?.find((p: any) => p.label === currentUnit);
            if (portion) {
                unitWeight = portion.weight_g;
            } else {
                // Fallback: derived from current state if valid
                if (ing.quantity && ing.quantity > 0 && ing.weight_g > 0) {
                    unitWeight = ing.weight_g / ing.quantity;
                } else {
                    unitWeight = 0; // standard fallback?
                }
            }
        }

        const newWeight = newQty * unitWeight;

        updated[index] = {
            ...ing,
            quantity: newQty,
            weight_g: newWeight,
            amount: `${newQty} ${currentUnit}`
        };

        setIngredients(updated);
        saveCustomization(updated);
    };

    const handleUpdateIngredientUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const food = ing.food_item;

        // Calculate unit weight for NEW unit
        let unitWeight = 1; // Default to 1g

        if (['g', 'ml', 'gram', 'grams'].includes(newUnit.toLowerCase())) {
            unitWeight = 1;
        } else if (['kg', 'kilogram'].includes(newUnit.toLowerCase())) {
            unitWeight = 1000;
        } else if (['oz', 'ounce'].includes(newUnit.toLowerCase())) {
            unitWeight = 28.3495;
        } else if (['lb', 'pound'].includes(newUnit.toLowerCase())) {
            unitWeight = 453.592;
        } else {
            // Check portions
            const portion = food?.portions?.find((p: any) => p.label === newUnit);
            if (portion) {
                unitWeight = portion.weight_g;
            }
        }

        // Maintain quantity, update weight
        const qty = ing.quantity || 1;
        const newWeight = qty * unitWeight;

        updated[index] = {
            ...ing,
            measure_label: newUnit,
            weight_g: newWeight,
            amount: `${qty} ${newUnit}`
        };

        setIngredients(updated);
        saveCustomization(updated);
    };

    const handleAddIngredient = (foodItem: any) => {
        // Default to 100g or a standard portion if available
        let weight_g = 100;
        let quantity = 1;
        let measure_label = 'g';

        if (foodItem.portions && foodItem.portions.length > 0) {
            // Try to find a "whole" or "piece" unit first
            const natural = foodItem.portions.find((p: any) =>
                ['item', 'whole', 'unit', 'piece', 'cup', 'serving'].some(k => p.label.toLowerCase().includes(k))
            );
            if (natural) {
                weight_g = natural.weight_g;
                measure_label = natural.label;
            } else {
                // Fallback to first portion
                weight_g = foodItem.portions[0].weight_g;
                measure_label = foodItem.portions[0].label;
            }
        }

        const multiplier = weight_g / 100;

        const newIngredient: Ingredient = {
            id: crypto.randomUUID(), // Temporary local ID
            food_item_id: foodItem.id,
            recipe_id: id as string,
            item: foodItem.common_name || foodItem.name,
            base_ingredient: foodItem.name,
            amount: `${quantity} ${measure_label}`,
            quantity: quantity,
            measure_label: measure_label,
            weight_g: weight_g,
            modifier: '',
            food_item: {
                ...foodItem,
                image: foodItem.image
            }
            // Note: We don't have full Ingredient persistence structure here (like 'calories' on the ingredient row itself vs food_item)
            // But the UI mostly uses `ing.food_item` for calculations now in `calculateRecipeNutrition`.
            // However, `calculateRecipeNutrition` expects `ingredients` to have keys or `food_item` to have keys.
            // Let's ensure the necessary fields are present on the `Ingredient` object if the calculator needs them.
            // Looking at `calculateRecipeNutrition` in `utils`, it uses `i.weight_g` and `i.food_item.energy_kcal`.
            // So we are good with just linking the `food_item`.
        };

        const newIngredients = [...ingredients, newIngredient];
        setIngredients(newIngredients);
        saveCustomization(newIngredients);
        setShowPicker(false);
        toast.success(`Added ${foodItem.name}`);
    };

    const resetOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIngredients(originalIngredients);
        setHiddenIngredientIds([]);
        if (currentUserId) {
            localStorage.removeItem(`recipe_customization_${currentUserId}_${id}`);
            // Legacy cleanup
            localStorage.removeItem(`recipe_order_${currentUserId}_${id}`);
            toast.info("Recipe restored to original state");
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
            {/* Navigation Header - Edit Button for Admins */}


            <div className="space-y-8">
                {/* Title Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95] italic uppercase">
                            {recipe.title}
                        </h1>
                        {isAdmin && (
                            <button
                                onClick={() => router.push(`/dashboard/recipes/${id}/edit`)}
                                className="p-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 hover:text-emerald-500 transition-all hover:scale-110 active:scale-95 group mt-1"
                                title="Edit Recipe"
                            >
                                <Pencil size={32} className="group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all" />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recipe.source && (
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3">
                                Source: {recipe.source}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Header Section: Image & Specs aligned at top */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_200px_150px_1.5fr] gap-6 items-stretch">
                    {/* Column 1: Image */}
                    <div className="lg:col-span-1 h-full">
                        <Card className="p-3 h-full flex flex-col bg-white dark:bg-slate-900">
                            <div className="flex-1 rounded-[2rem] bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800 aspect-square lg:aspect-auto">
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
                    </div>

                    {/* Column 2: Specs (Prep/Servings) */}
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center flex-1 flex flex-col items-center justify-center">
                            <Clock size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Prep Time</p>
                            <p className="text-xl font-black">{recipe.prep_time}m</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center flex-1 flex flex-col items-center justify-center">
                            <Users size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Servings</p>
                            <p className="text-xl font-black">{recipe.servings}P</p>
                        </div>
                    </div>

                    {/* Column 3: Dietary Compatibility */}
                    <Card className="p-4 flex flex-col h-full bg-white dark:bg-slate-900">
                        <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-center gap-1.5 text-center">
                            <Activity size={10} className="text-emerald-500" />
                            Compatibility
                        </h3>
                        <div className="flex flex-col gap-2 flex-1">
                            {[
                                { label: 'Balanced', dbKey: 'Balanced (Omnivore)' },
                                { label: 'Pescatarian', dbKey: 'Pescetarian' },
                                { label: 'Vegetarian', dbKey: 'Vegetarian' },
                                { label: 'Vegan', dbKey: 'Vegan' }
                            ].map(({ label, dbKey }) => {
                                const hasDirectTag = recipe.diet?.includes(dbKey);
                                let isSuitable = hasDirectTag;
                                if (!isSuitable && recipe.diet) {
                                    if (label === 'Balanced') {
                                        isSuitable = recipe.diet.includes('Balanced (Omnivore)') || recipe.diet.includes('Pescetarian') || recipe.diet.includes('Vegetarian') || recipe.diet.includes('Vegan');
                                    } else if (label === 'Pescatarian') {
                                        isSuitable = recipe.diet.includes('Pescetarian') || recipe.diet.includes('Vegetarian') || recipe.diet.includes('Vegan');
                                    } else if (label === 'Vegetarian') {
                                        isSuitable = recipe.diet.includes('Vegetarian') || recipe.diet.includes('Vegan');
                                    }
                                }
                                const hasConflict = isSuitable && dietaryConflicts.length > 0;

                                return (
                                    <div
                                        key={label}
                                        className={cn(
                                            "p-2 rounded-xl border text-center transition-all relative flex flex-col justify-center flex-1",
                                            isSuitable
                                                ? (hasConflict ? "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30" : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20")
                                                : "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 opacity-60"
                                        )}
                                    >
                                        <p className={cn(
                                            "text-[8px] font-black uppercase tracking-tighter mb-0.5",
                                            isSuitable
                                                ? (hasConflict ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")
                                                : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {label}
                                        </p>
                                        <p className={cn(
                                            "text-[7px] font-bold uppercase",
                                            isSuitable
                                                ? (hasConflict ? "text-amber-500/60" : "text-emerald-500/60")
                                                : "text-rose-500/60"
                                        )}>
                                            {isSuitable ? (hasConflict ? 'Warn' : 'Yes') : 'No'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Column 4: Dietary Advisory */}
                    <Card className="p-6 flex flex-col h-full bg-white dark:bg-slate-900 border-emerald-500/10 dark:border-emerald-500/20">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                            <Activity size={14} className="text-amber-500" />
                            Clinical Dietary Advisory
                        </h3>
                        <div className="flex-1 space-y-4">
                            {dietaryConflicts.length > 0 ? (
                                <div className="p-5 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 flex flex-col gap-3 shadow-inner shadow-amber-500/5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Allergen/Exclusion Alert</p>
                                    </div>
                                    <p className="text-xs text-amber-500/80 leading-relaxed font-bold">
                                        This laboratory sample contains ingredients flagged in your medical profile:
                                        <span className="block mt-2 text-slate-900 dark:text-white uppercase tracking-tight text-sm font-black italic">
                                            {dietaryConflicts.map(c => c.exclusion).join(', ')}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                <div className="p-5 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-3 shadow-inner shadow-emerald-500/5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Dietary Integrity</p>
                                    </div>
                                    <p className="text-sm text-emerald-500/80 leading-relaxed font-bold italic">
                                        "This recipe aligns with all active clinical exclusions in your profile. No matches for your prohibited items were detected in our ingredient analysis."
                                    </p>
                                </div>
                            )}
                            <div className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sample Reference</p>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight font-medium">
                                    Clinical nutrient values are calculated based on a single sample of <span className="font-bold text-emerald-500 dark:text-emerald-400 underline decoration-dotted">1P</span>.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Content Section: Ingredients & Procedure vs Nutrition */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Ingredients and Procedure */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Lab Ingredients */}
                        <Card className="p-6">
                            <div className="mb-6 space-y-4">
                                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                    <ShoppingBasket size={24} className="text-emerald-500" />
                                    Lab Ingredients
                                </h3>

                                {/* Control Block */}
                                <div className="p-2 gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center">
                                    {/* Edit Mode Toggle */}
                                    <button
                                        onClick={() => {
                                            setIsEditingIngredients(!isEditingIngredients);
                                            setIsReordering(false);
                                            setIsEditingMeasures(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-[10px] uppercase font-black tracking-widest flex-1 justify-center whitespace-nowrap",
                                            isEditingIngredients
                                                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/20"
                                                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-rose-500 hover:border-rose-200"
                                        )}
                                    >
                                        <Diff size={14} /> Add/Remove
                                    </button>

                                    {/* Measure Edit Toggle */}
                                    <button
                                        onClick={() => {
                                            setIsEditingMeasures(!isEditingMeasures);
                                            setIsReordering(false);
                                            setIsEditingIngredients(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-[10px] uppercase font-black tracking-widest flex-1 justify-center whitespace-nowrap",
                                            isEditingMeasures
                                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-500/20"
                                                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-blue-500 hover:border-blue-200"
                                        )}
                                    >
                                        <Scale size={14} /> Adjust
                                    </button>

                                    {/* Reorder Toggle */}
                                    <button
                                        onClick={() => {
                                            setIsReordering(!isReordering);
                                            setIsEditingIngredients(false);
                                            setIsEditingMeasures(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-[10px] uppercase font-black tracking-widest flex-1 justify-center whitespace-nowrap",
                                            isReordering
                                                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-500/20"
                                                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-amber-500 hover:border-amber-200"
                                        )}
                                    >
                                        <ArrowUpDown size={14} /> Sort
                                    </button>

                                    {/* Reset */}
                                    {(isReordering || isEditingIngredients || isEditingMeasures || ingredients.length !== originalIngredients.length || JSON.stringify(ingredients) !== JSON.stringify(originalIngredients)) && (
                                        <button
                                            onClick={resetOrder}
                                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all border border-slate-200 dark:border-slate-700"
                                            title="Reset to Default"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {ingredients.map((ing: any, i) => (
                                    <div
                                        key={ing.id || i}
                                        onClick={() => !isReordering && !isEditingIngredients && !isEditingMeasures && !hiddenIngredientIds.includes(ing.id) && ing.food_item_id && router.push(`/dashboard/foods/${ing.food_item_id}`)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border transition-all group relative overflow-hidden",
                                            hiddenIngredientIds.includes(ing.id)
                                                ? "bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                                                : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-emerald-500/20",
                                            ing.food_item_id && !hiddenIngredientIds.includes(ing.id) && !isReordering && !isEditingIngredients && !isEditingMeasures ? "cursor-pointer" : ""
                                        )}
                                    >
                                        {/* Action Buttons: Reorder OR Remove OR Toggle */}
                                        <div className="shrink-0 z-10">
                                            {isReordering ? (
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={(e) => moveIngredient(i, 'up', e)} disabled={i === 0} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-20"><ArrowUp size={14} /></button>
                                                    <button onClick={(e) => moveIngredient(i, 'down', e)} disabled={i === ingredients.length - 1} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-20"><ArrowDown size={14} /></button>
                                                </div>
                                            ) : isEditingIngredients ? (
                                                <button
                                                    onClick={(e) => removeIngredient(i, e)}
                                                    className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                                                    title="Remove Ingredient"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => toggleIngredient(ing.id, e)}
                                                    className={cn(
                                                        "p-2 rounded-full transition-all",
                                                        hiddenIngredientIds.includes(ing.id) ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-100"
                                                    )}
                                                >
                                                    {hiddenIngredientIds.includes(ing.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            )}
                                        </div>

                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300",
                                            hiddenIngredientIds.includes(ing.id)
                                                ? "bg-slate-100 border-slate-200 grayscale opacity-50"
                                                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 group-hover:scale-105"
                                        )}>
                                            {ing.food_item?.image ? (
                                                <img src={ing.food_item.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Utensils size={16} className="text-slate-400 opacity-40 shadow-sm" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className={cn(
                                                "text-xs font-black capitalize leading-relaxed transition-colors",
                                                hiddenIngredientIds.includes(ing.id) ? "text-slate-400 decoration-slate-300 line-through" : "text-slate-900 dark:text-white"
                                            )}>{ing.base_ingredient || ing.item}</p>

                                            {isEditingMeasures ? (
                                                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        value={ing.quantity || 0}
                                                        onChange={(e) => handleUpdateIngredientQuantity(i, parseFloat(e.target.value) || 0)}
                                                        className="w-16 h-7 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                    <select
                                                        value={ing.measure_label}
                                                        onChange={(e) => handleUpdateIngredientUnit(i, e.target.value)}
                                                        className="h-7 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 focus:ring-1 focus:ring-emerald-500 max-w-[120px]"
                                                    >
                                                        <optgroup label="Standard">
                                                            <option value="g">g</option>
                                                            <option value="oz">oz</option>
                                                            <option value="ml">ml</option>
                                                            <option value="kg">kg</option>
                                                            <option value="lb">lb</option>
                                                        </optgroup>
                                                        {ing.food_item?.portions?.length > 0 && (
                                                            <optgroup label="Measures">
                                                                {ing.food_item.portions.map((p: any, idx: number) => (
                                                                    <option key={idx} value={p.label}>{p.label}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{ing.amount}</p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 pt-0.5">
                                            <p className={cn(
                                                "text-[10px] font-black transition-colors",
                                                hiddenIngredientIds.includes(ing.id) ? "text-slate-300" : "text-slate-400"
                                            )}>{Math.round(ing.weight_g)}g</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button (Only in Edit Mode) */}
                                {isEditingIngredients && (
                                    <button
                                        onClick={() => setShowPicker(true)}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-500 hover:border-emerald-200/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all group"
                                    >
                                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-black uppercase tracking-widest">Add Ingredient</span>
                                    </button>
                                )}
                            </div>
                        </Card>

                        {/* Food Item Picker Modal */}
                        {showPicker && (
                            <FoodItemPicker
                                onSelect={handleAddIngredient}
                                onClose={() => setShowPicker(false)}
                                mode="all"
                            />
                        )}

                        {/* Procedure */}
                        <Card className="p-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic text-amber-500 mb-6">
                                <ChefHat size={24} />
                                Procedure
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-100 dark:before:bg-slate-800 pl-2">
                                {instructions.map((ins, i) => (
                                    <div key={i} className="relative pl-10 space-y-2 group text-left">
                                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 group-hover:border-amber-500 transition-colors shadow-sm">
                                            <span className="text-xs font-black text-slate-400 group-hover:text-amber-500">{ins.step_order}</span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-bold pt-2">
                                            {ins.step_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Nutrient Report */}
                    <div className="lg:col-span-2 space-y-8">


                        {showDetailedNutrients && recipe && (
                            <div className="animate-in slide-in-from-top-4 duration-500">
                                {(() => {
                                    const m = recipe.micronutrients || {};
                                    const getVal = (keys: string[]) => {
                                        for (const k of keys) {
                                            // 1. Try direct match
                                            if (m[k] !== undefined) {
                                                return m[k];
                                            }
                                            // 2. Try fuzzy match
                                            const match = findNutrientMatch(m, k);
                                            if (match) {
                                                return m[match];
                                            }
                                        }
                                        return 0;
                                    };

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

                                    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, breakdownLabels = [], forceRaw = false }: { title: string, items: Record<string, any[]>, icon: any, theme?: string, subtitle?: string, breakdownLabels?: string[], forceRaw?: boolean }) => {
                                        const themes = {
                                            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
                                            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
                                            orange: { bg: "bg-slate-900 border-slate-800", text: "text-orange-400", border: "border-slate-800", itemBorder: "border-orange-900/50" },
                                            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
                                            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
                                            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
                                        };
                                        const t = (themes as any)[theme] || themes.indigo;

                                        return (
                                            <div className={cn("p-6 pt-5 rounded-3xl border bg-gradient-to-br mb-6", t.bg)}>
                                                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                                                {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                    {Object.entries(items).map(([label, keys]) => {
                                                        const val = (label === 'Energy' || label === 'Protein' || label === 'Carbs' || label === 'Fat')
                                                            ? (label === 'Energy' ? (energyUnit === 'kJ' ? (recipe as any).energy_kj : (recipe as any).calories) : (recipe as any)[label.toLowerCase()])
                                                            : getVal(keys as string[]);
                                                        const macroRDAs: Record<string, number> = {
                                                            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                                                            'Protein': dailyTargets.protein,
                                                            'Carbs': dailyTargets.carbs,
                                                            'Fat': dailyTargets.fat
                                                        };
                                                        const rda = userRDAs?.[label] || macroRDAs[label];
                                                        const pct = rda ? Math.round((val / rda) * 100) : null;
                                                        const styles = getNutrientLevelStyles(pct || 0, label);
                                                        const unit = label === 'Energy' ? energyUnit : (label === 'Protein' || label === 'Carbs' || label === 'Fat') ? 'g' : (label === 'Vitamin D') ? 'IU' : (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';
                                                        const hasBreakdown = breakdownLabels.includes(label);

                                                        return (
                                                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>
                                                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                                                <div className="space-y-0.5">
                                                                    {(nutrientDisplayMode === 'percentage' && pct !== null && !forceRaw) ? (
                                                                        <>
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                                                            </div>
                                                                            <p className="text-[9px] font-bold text-slate-400">
                                                                                {val.toFixed(1)}{unit}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-baseline gap-1">
                                                                                <span className="text-lg font-bold">{val.toFixed(1)}</span>
                                                                                <span className={cn("text-[10px] font-bold", (unit === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unit}</span>
                                                                            </div>
                                                                            {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                                    Target: {Math.round(rda)}{unit === 'kcal' ? 'kcal' : unit}
                                                                                </p>
                                                                            )}
                                                                            {nutrientDisplayMode === 'both' && pct !== null && !forceRaw && (
                                                                                <div className={cn("text-[10px] font-black", styles.text)}>{pct}%</div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>

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

                                            <NutrientGrid title="Daily Vitamins" icon={Droplet} theme="blue" subtitle="Water-soluble vitamins (B-Complex & C)" items={{
                                                'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                                                'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                                                'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                                                'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                                                'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                                                'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                                                'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                                                'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                                'Choline': ['Choline', 'choline_mg'],
                                            }} />

                                            <NutrientGrid title="Stored Vitamins" icon={Battery} theme="emerald" subtitle="Fat-soluble storage (A, D, E, K)" breakdownLabels={['Vitamin A', 'Vitamin E']} items={{
                                                'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                                'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                                'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                                'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                                            }} />

                                            <NutrientGrid title="Clinical Markers" icon={Activity} theme="amber" subtitle="Secondary markers for advanced health profile mapping" forceRaw={true} items={{
                                                'Fiber': ['Fiber', 'fiber_g'],
                                                'Sugars': ['Sugars', 'sugars_g'],
                                                'Oxalate': ['Oxalate', 'oxalate_mg'],
                                                'Omega-3': ['Omega-3', 'omega3_g'],
                                                'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                                            }} />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>

                {/* NUTRIENT INFO MODAL */}
                {
                    selectedNutrientInfo && nutrientInfo[selectedNutrientInfo] && (
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
                    )
                }

                {/* NUTRIENT BREAKDOWN MODAL */}
                {
                    breakdownNutrient && (recipe.micronutrients) && (
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
                    )
                }
            </div >
        </div >
    );
}
