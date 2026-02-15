'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
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
    Trash2,
    GripVertical,
    Download,
    Beaker,
    Dna,
    ChevronUp,
    LayoutGrid,
    Search,
    UtensilsCrossed,
    Filter,
    BookOpen,
    Bot,
    FlaskConical
} from 'lucide-react';
import { useSearch } from '@/lib/context/search-context';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import NutrientExportModal from '@/components/recipe/nutrient-export-modal';
import { calculateRecipeNutrition, calculateIndividualTargets, CalculatedNutrition, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

import { findSpiceFactor, SpiceState, isSpice, getSpiceMeasures, getSpiceStates } from '@/lib/utils/spice-conversion';
import { COOKING_STATES, CookingState, StateFactor } from '@/lib/utils/cooking-states';
import { searchLocalFood } from '@/lib/services/nutrition';
import { DidYouKnow } from '@/components/DidYouKnow';

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
    cooking_state?: CookingState;
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
    phytonutrients?: Record<string, string>;
    calculated_nutrition?: import('@/lib/utils/nutrition-calculator').CalculatedNutrition;
}

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]); // To support reset
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hiddenIngredientIds, setHiddenIngredientIds] = useState<string[]>([]);
    const [isReordering, setIsReordering] = useState(false);
    const [isEditingIngredients, setIsEditingIngredients] = useState(false); // Add/Remove mode
    const [isEditingMeasures, setIsEditingMeasures] = useState(false); // Edit Measures mode
    const [isToggling, setIsToggling] = useState(true); // Default mode: Visibility
    const [showPicker, setShowPicker] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null); // For DND
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetailedNutrients, setShowDetailedNutrients] = useState(true);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});
    const [calculatedTotals, setCalculatedTotals] = useState<CalculatedNutrition | null>(null);
    const [phytoSources, setPhytoSources] = useState<Record<string, { description: string; sources: string[] }>>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    const { profile, nutrientDisplayMode, energyUnit, dailyTargets } = useUserPreferences();

    // SMART PORTION CONTROL STATE
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    useEffect(() => {
        // Default to selecting the current user on load
        setSelectedMemberIds(['main-user']);
    }, []);

    // HANDLE SPICE LAB RETURN
    useEffect(() => {
        const newFoodId = searchParams.get('newFoodId');
        const swapId = searchParams.get('swapId');

        if (newFoodId && swapId && ingredients.length > 0) {
            const performSwap = async () => {
                try {
                    // Fetch the new food
                    const { data: food, error: foodError } = await supabase
                        .from('food_items')
                        .select('*')
                        .eq('id', newFoodId)
                        .single();

                    if (foodError) throw foodError;

                    const oldIng = ingredients.find(i => i.id === swapId);
                    if (!oldIng || !food) return;

                    toast.success(`Swapped spice with Lab version: ${food.name}`);

                    // Calculate new values
                    const weightFactor = (oldIng.weight_g || 0) / 100;
                    const updatedIng = {
                        ...oldIng,
                        food_item_id: food.id,
                        food_item: food, // For UI display
                        base_ingredient: food.name,
                        calories: Math.round(food.energy_kcal * weightFactor),
                        energy_kj: Math.round((food.energy_kj || 0) * weightFactor),
                        protein: food.protein_g * weightFactor,
                        fat: food.fat_g * weightFactor,
                        carbs: food.carbs_g * weightFactor,
                        micronutrients: Object.entries(food.micronutrients || {}).reduce((acc, [key, val]) => {
                            acc[key] = (val as number) * weightFactor;
                            return acc;
                        }, {} as Record<string, number>)
                    };

                    // Update local state
                    setIngredients(prev => prev.map(i => i.id === swapId ? updatedIng : i));

                    // Update Database
                    const { error: updateError } = await supabase
                        .from('recipe_ingredients')
                        .update({
                            food_item_id: food.id,
                            base_ingredient: food.name,
                            calories: updatedIng.calories,
                            energy_kj: updatedIng.energy_kj,
                            protein: updatedIng.protein,
                            fat: updatedIng.fat,
                            carbs: updatedIng.carbs,
                            micronutrients: updatedIng.micronutrients
                        })
                        .eq('id', swapId);

                    if (updateError) throw updateError;

                    // Clean URL
                    router.replace(pathname);
                } catch (err: any) {
                    console.error("Error swapping spice:", err);
                    toast.error(`Failed to swap spice: ${err.message}`);
                }
            };
            performSwap();
        }
    }, [searchParams, ingredients, pathname, id, router]);

    const allPeople = React.useMemo(() => {
        const mainUserAsMember = {
            id: 'main-user',
            name: profile.name || 'Me',
            gender: profile.gender || 'female',
            age: Number(profile.age) || 30,
            weight: Number(profile.weight) || 70,
            height: Number(profile.height) || 170,
            activityLevel: profile.activityLevel || 'sedentary',
            goal: profile.goal || 'maintain',
            nutrientStrategy: profile.nutrientStrategy || 'balanced'
        };
        // Map family members to valid structure if needed
        return [mainUserAsMember, ...(profile.familyMembers || [])];
    }, [profile]);

    const calculations = React.useMemo(() => {
        if (selectedMemberIds.length === 0) return { totalServings: 1, maxTDEE: 2000, memberPortions: {} as Record<string, number>, currentSinglePortionCalories: 2000 };

        const selectedPeople = allPeople.filter(p => selectedMemberIds.includes(p.id));

        // Calculate TDEE for each selected person
        const tdees = selectedPeople.map(p => ({
            id: p.id,
            tdee: calculateIndividualTargets(p as any).energy
        }));

        const maxTDEE = Math.max(...tdees.map(t => t.tdee));

        // Calculate portion ratio relative to max TDEE
        const memberPortions: Record<string, number> = {};
        tdees.forEach(t => {
            memberPortions[t.id] = t.tdee / maxTDEE;
        });

        const totalServings = Object.values(memberPortions).reduce((sum, val) => sum + val, 0);

        return { totalServings, maxTDEE, memberPortions };
    }, [selectedMemberIds, allPeople]);

    // Derived Scaling Factor
    const currentScalingFactor = React.useMemo(() => {
        if (!recipe?.servings || calculations.totalServings === 0) return 1;
        // Logic: 
        // We need 'calculations.totalServings' number of "Big Servings".
        // The original recipe creates 'recipe.servings' number of "Original Servings".
        // Crucial Assumption: 1 "Big Serving" calculated here ~= 1 "Original Serving" if the original recipe is a standard meal.
        // If the recipe is small (e.g. cookies), this logic holds: I need 1.5 cookies.
        // If the recipe is a full meal (2000kcal), I need 1.5 full meals.
        // So:
        return calculations.totalServings / recipe.servings;
    }, [calculations.totalServings, recipe?.servings]);

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
                        weight_g: ing.weight_g || 0,
                        cooking_state: ing.cooking_state
                    }))
                );

                setCalculatedTotals(calculated);

                // Build phytonutrient source map: which ingredient contributes which phytonutrient
                const sourcesMap: Record<string, { description: string; sources: string[] }> = {};
                for (const ing of fetchedIngredients) {
                    const fi = ing.food_item;
                    if (fi?.phytonutrients && typeof fi.phytonutrients === 'object') {
                        const foodName = fi.common_name || fi.name || 'Unknown';
                        Object.entries(fi.phytonutrients).forEach(([phytoName, desc]) => {
                            if (!sourcesMap[phytoName]) {
                                sourcesMap[phytoName] = { description: desc as string, sources: [] };
                            }
                            if (!sourcesMap[phytoName].sources.includes(foodName)) {
                                sourcesMap[phytoName].sources.push(foodName);
                            }
                        });
                    }
                }
                setPhytoSources(sourcesMap);

                // Use the fresh calculation for the entire display
                setRecipe({
                    ...recipeData,
                    calories: calculated.calories,
                    protein: calculated.protein,
                    carbs: calculated.carbs,
                    fat: calculated.fat,
                    micronutrients: calculated.micronutrients,
                    phytonutrients: calculated.phytonutrients
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
            toast.error('Failed to load meal details');
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
                weight_g: ing.weight_g || 0,
                cooking_state: ing.cooking_state
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

        // Calculate total weight for export normalization
        const weight = activeIngredients.reduce((sum, ing) => sum + (ing.weight_g || 0), 0);
        setTotalWeight(weight);

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
        const currentUnit = (ing.measure_label || 'g').toLowerCase().trim();

        if (['g', 'ml', 'gram', 'grams'].includes(currentUnit)) {
            unitWeight = 1;
        } else if (['kg', 'kilogram'].includes(currentUnit)) {
            unitWeight = 1000;
        } else if (['oz', 'ounce'].includes(currentUnit)) {
            unitWeight = 28.35;
        } else if (['lb', 'pound'].includes(currentUnit)) {
            unitWeight = 453.59;
        } else {
            // Check standard portions
            let portion = food?.portions?.find((p: any) => p.label.toLowerCase() === currentUnit);

            // Check spice density
            if (!portion && isSpice(food?.name || ing.item)) {
                const spiceMeasures = getSpiceMeasures(food?.name || ing.item, ing.cooking_state);
                portion = spiceMeasures.find(m => m.label.toLowerCase() === currentUnit);
            }

            if (portion) {
                unitWeight = portion.weight_g;
            } else {
                // Fallback: derived from current state if valid
                if (ing.quantity && ing.quantity > 0 && ing.weight_g > 0) {
                    unitWeight = ing.weight_g / ing.quantity;
                } else {
                    unitWeight = 1; // standard fallback
                }
            }
        }

        const newWeight = newQty * unitWeight;

        updated[index] = {
            ...ing,
            quantity: newQty,
            weight_g: newWeight,
            amount: `${newQty} ${ing.measure_label || 'g'}`
        };

        setIngredients(updated);
        saveCustomization(updated);
    };

    const handleUpdateIngredientUnit = (index: number, newUnit: string) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const food = ing.food_item;

        const newUnitLower = newUnit.toLowerCase().trim();
        const oldWeight = ing.weight_g;

        // Calculate unit weight for NEW unit
        let unitWeight = 1;

        if (['g', 'ml', 'gram', 'grams', 'ml'].includes(newUnitLower)) {
            unitWeight = 1;
        } else if (['kg', 'kilogram'].includes(newUnitLower)) {
            unitWeight = 1000;
        } else if (['oz', 'ounce'].includes(newUnitLower)) {
            unitWeight = 28.35;
        } else if (['lb', 'pound'].includes(newUnitLower)) {
            unitWeight = 453.59;
        } else {
            // Priority 1: Direct portion match
            let portion = food?.portions?.find((p: any) => p.label === newUnit || p.label.toLowerCase() === newUnitLower);

            // Priority 2: Spice density lookup
            if (!portion && isSpice(food?.name || ing.item)) {
                const spiceMeasures = getSpiceMeasures(food?.name || ing.item, ing.cooking_state);
                portion = spiceMeasures.find(m => m.label.toLowerCase() === newUnitLower);
            }

            if (portion) {
                unitWeight = portion.weight_g;
            }
        }

        // Maintain mass constant, calculate new quantity
        const newQty = unitWeight > 0 ? oldWeight / unitWeight : 1;

        updated[index] = {
            ...ing,
            measure_label: newUnit,
            quantity: Number(newQty.toFixed(3)),
            weight_g: oldWeight,
            amount: `${Number(newQty.toFixed(3))} ${newUnit}`
        };

        setIngredients(updated);
        saveCustomization(updated);
    };

    const handleUpdateIngredientState = async (index: number, newState: CookingState) => {
        const updated = [...ingredients];
        const ing = updated[index];
        const food = ing.food_item;

        // 1. DIRECT MATCH LOGIC
        // If user selects 'boiled', look for 'Kale, Boiled' or 'Kale, Cooked'
        if (newState === 'raw' || newState === 'boiled' || newState === 'fried' || newState === 'roasted') {
            const baseName = (food?.common_name || food?.name || '').split(',')[0].trim();
            try {
                // Broad search for the base name
                const matches = await searchLocalFood(baseName);

                const directMatch = matches.find((m: any) => {
                    const itemName = m.name.toLowerCase();
                    const commonName = (m.common_name || '').toLowerCase();
                    const b = baseName.toLowerCase();
                    const firstWord = b.split(' ')[0];

                    const hasBase = itemName.includes(firstWord) || commonName.includes(firstWord);

                    if (!hasBase) return false;

                    if (newState === 'raw') {
                        // Raw must NOT contain cooked/boiled/fried/roasted
                        const isCooked = ['cooked', 'boiled', 'fried', 'roasted'].some(s => itemName.includes(s));
                        if (isCooked) return false;
                        return itemName.includes('raw') || itemName.includes('fresh') || itemName === b || itemName === firstWord;
                    }

                    if (newState === 'boiled') {
                        return itemName.includes('cooked') || itemName.includes('boiled');
                    }

                    return itemName.includes(newState.toLowerCase());
                });

                if (directMatch) {
                    toast.success(`Matched to stored profile`, {
                        description: `Using ${directMatch.name}`,
                        duration: 3000
                    });

                    // We swap the food item but keep the quantity/unit
                    // The weight_g will be recalculated based on the NEW food's portions
                    const newFood = { ...directMatch, portions: directMatch.portions };

                    // Recalculate weight for current unit
                    let newWeight = ing.weight_g;
                    const currentUnit = (ing.measure_label || 'g').toLowerCase();
                    const quantity = ing.quantity || 1;

                    // 1. HARD OVERRIDE FOR GRAMS
                    if (currentUnit === 'g' || currentUnit === 'gram' || currentUnit === 'grams') {
                        newWeight = quantity;
                    } else {
                        // 2. Robust portion matching logic
                        const normalize = (s: string) => {
                            return s.toLowerCase()
                                .replace(/,/g, ' ')
                                .replace(/\b(chopped|shredded|sliced|diced|minced|cut|pieces|raw|cooked|boiled|fried|roasted)\b/g, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                        };
                        const nUnit = normalize(currentUnit);
                        const baseUnits = ['cup', 'tbsp', 'tsp', 'g', 'oz', 'leaf', 'bunch', 'piece', 'item'];
                        const foundBase = baseUnits.find(bu => nUnit.startsWith(bu));

                        const portion = newFood.portions?.find((p: any) => {
                            const l = p.label.toLowerCase();
                            const nL = normalize(l);

                            // Strict match for short units (g, oz)
                            if (currentUnit.length <= 2) {
                                return l === currentUnit || nL === nUnit;
                            }

                            if (l === currentUnit || nL === nUnit) return true;
                            if (foundBase && nL.startsWith(foundBase)) return true;
                            return l.includes(currentUnit) || currentUnit.includes(l) || nL.includes(nUnit) || nUnit.includes(nL);
                        });

                        if (portion) {
                            newWeight = quantity * portion.weight_g;
                        }
                    }

                    updated[index] = {
                        ...ing,
                        food_item: newFood,
                        food_item_id: newFood.id,
                        weight_g: newWeight,
                        cooking_state: 'stored' // Set to stored since we have the direct data
                    };

                    setIngredients(updated);
                    saveCustomization(updated);
                    return;
                }
            } catch (err) {
                console.error("Direct match search failed:", err);
            }
        }

        // 1b. AS STORED SELECTION
        // If user manually selects 'stored', we don't swap items, we just stop scaling
        if (newState === 'stored') {
            updated[index] = { ...ing, cooking_state: 'stored' };
            setIngredients(updated);
            saveCustomization(updated);
            return;
        }

        // 2. SPICE LOGIC (Existing)
        const isSpice = food?.category === 'Flavour' || findSpiceFactor(food?.name || '').name !== 'Generic';

        if (isSpice && (newState === 'ground' || newState === 'whole')) {
            const factor = findSpiceFactor(food.name);
            const currentUnit = ing.measure_label || 'g';
            const isVolume = ['tsp', 'teaspoon', 'tbsp', 'tablespoon', 'cup'].some(unit => currentUnit.toLowerCase().includes(unit));

            if (isVolume) {
                // Determine densities
                const dWhole = factor.gPerTspWhole || 2.5; // g per tsp
                const dGround = factor.gPerTspGround || 2.3; // g per tsp

                // Map unit to tsp equivalent for relative density calculation
                let unitToTsp = 1;
                if (currentUnit.toLowerCase().includes('tbsp')) unitToTsp = 3;
                if (currentUnit.toLowerCase().includes('cup')) unitToTsp = 48;

                const currentQty = ing.quantity || 1;
                const currentMass = currentQty * (ing.cooking_state === 'ground' ? dGround : dWhole) * unitToTsp;

                // New quantity $Q = \text{Mass} / (\text{NewDensity} \times \text{UnitToTsp})$
                const newDensity = (newState === 'ground' ? dGround : dWhole);
                const newQty = currentMass / (newDensity * unitToTsp);

                updated[index] = {
                    ...ing,
                    cooking_state: newState,
                    quantity: Number(newQty.toFixed(2)),
                    weight_g: Number(currentMass.toFixed(2)),
                    amount: `${Number(newQty.toFixed(2))} ${currentUnit}`
                };

                setIngredients(updated);
                saveCustomization(updated);
                toast.info(`Adjusted measure for ${newState} state`, { duration: 2000 });
                return;
            }
        }

        // Generic state change
        updated[index] = {
            ...ing,
            cooking_state: newState
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
        if (window.confirm("Are you sure? This will reset the recipe to its default state. All your customizations (added items, quantity changes, etc.) will be lost.")) {
            setIngredients(originalIngredients);
            setHiddenIngredientIds([]);
            if (currentUserId) {
                localStorage.removeItem(`recipe_customization_${currentUserId}_${id}`);
                // Legacy cleanup
                localStorage.removeItem(`recipe_order_${currentUserId}_${id}`);
                toast.info("Recipe restored to original state");
            }
        }
    };

    // Drag and Drop Handlers
    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Optional: Set ghost image if needed, but default is usually fine
    };

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move";
    };

    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();

    const mealTabs = [
        { id: 'browse', label: 'All Meals', icon: BookOpen, color: 'text-yellow-500', bg: 'bg-yellow-500/10', path: '/dashboard/library/recipes?tab=browse' },
        { id: 'mealplanner', label: 'Meal-O-Matic', icon: Bot, color: 'text-yellow-500', bg: 'bg-yellow-500/10', path: '/dashboard/library/recipes?tab=mealplanner' },
        { id: 'mixlab', label: 'Mix Lab', icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-500/10', path: '/dashboard/library/recipes?tab=mixlab' },
    ];

    const renderTabGroup = (tabsList: typeof mealTabs, sectionLabel: string, sectionColor: string, showHomeButton = false) => (
        <div className="space-y-3 w-full">
            {sectionLabel && <p className={cn("text-[9px] font-black uppercase tracking-widest", sectionColor)}>{sectionLabel}</p>}
            <div className={cn(
                "flex items-center p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden w-full md:max-w-[800px] mx-auto xl:mx-0"
            )}>
                {/* Left side - Home Button area */}
                <div className={cn("flex-shrink-0 flex items-center justify-start transition-all duration-500", isSearchExpanded ? "w-0" : "w-12")}>
                    {showHomeButton && !isSearchExpanded && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center w-12 h-12 rounded-[1.5rem] text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all flex-shrink-0"
                            title="Back to Dashboard"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    )}
                </div>

                {/* Center - Tabs area */}
                <div className={cn("flex items-center justify-center overflow-hidden transition-all duration-500", isSearchExpanded ? "w-0 flex-none opacity-0" : "flex-1 opacity-100")}>
                    <div className="flex items-center gap-4 overflow-hidden py-1">
                        {tabsList.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = false;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => router.push(tab.path)}
                                    className={cn(
                                        "flex items-center gap-3 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-500 whitespace-nowrap group flex-shrink-0",
                                        isActive
                                            ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                        "px-4 md:px-5"
                                    )}
                                >
                                    <Icon size={15} className={cn(
                                        "transition-transform duration-500 group-hover:scale-110",
                                        isActive ? tab.color : "text-slate-400"
                                    )} />
                                    <span className={cn(
                                        "transition-all duration-300 overflow-hidden hidden md:block",
                                        isSearchExpanded ? "w-0 opacity-0" : "w-auto opacity-100"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right side - Search area */}
                <div className={cn(
                    "flex items-center justify-end transition-all duration-500",
                    isSearchExpanded ? "flex-1 pl-2" : "w-12"
                )}>
                    <div className={cn(
                        "flex items-center transition-all duration-500 overflow-hidden",
                        isSearchExpanded ? "flex-1 opacity-100" : "w-0 opacity-0"
                    )}>
                        <input
                            type="text"
                            autoFocus
                            placeholder={`Search meals...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    router.push(`/dashboard/meals?q=${searchQuery}`);
                                }
                            }}
                            onFocus={() => {
                                setIsFocused(true);
                                setActiveSearchId('meals-bar');
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    if (activeSearchId === 'meals-bar') setActiveSearchId(null);
                                }, 200);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest h-12 rounded-[1.5rem] px-6 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (isSearchExpanded) setSearchQuery('');
                            setIsSearchExpanded(!isSearchExpanded);
                        }}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-[1.5rem] transition-all flex-shrink-0",
                            isSearchExpanded
                                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                                : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-50"
                        )}
                        title="Search"
                    >
                        {isSearchExpanded ? <X size={18} /> : <Search size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );

    const onDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

        const updated = [...ingredients];
        const [movedItem] = updated.splice(draggedItemIndex, 1);
        updated.splice(dropIndex, 0, movedItem);

        setIngredients(updated);
        saveCustomization(updated);
        setDraggedItemIndex(null);
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
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Meal Databank...</p>
            </div>
        );
    }

    if (!recipe) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32">
            {/* Navigation Header - Edit Button for Admins */}


            <div className="space-y-8">
                {/* Main Header Section (Image + Name) - Matching Food Page */}
                <div className="flex flex-row items-end gap-6 animate-in slide-in-from-top-4 duration-700 pb-1">
                    {/* Left Side: Image (Small, Inline) */}
                    <div className="w-24 h-24 lg:w-24 lg:h-24 shrink-0">
                        <Card className="w-full h-full relative p-1 bg-white dark:bg-slate-900 border-none group overflow-hidden rounded-2xl">
                            <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                {recipe.image ? (
                                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <ChefHat size={24} className="opacity-10" />
                                    </div>
                                )}
                                <div className="absolute top-1 left-1">
                                    <Badge className="bg-emerald-600/90 text-white border-none text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 backdrop-blur-md shadow-xl w-fit">
                                        {recipe.type}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Side: Text Content */}
                    <div className="flex-1 flex flex-col">
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic leading-[0.85] mb-2">
                            <span className="text-emerald-500">{recipe.title}</span>
                        </h1>
                        <div className="flex items-center gap-3 flex-wrap">
                            {recipe.source && (
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Source: {recipe.source}</span>
                            )}
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1">
                                <Clock size={10} /> {recipe.prep_time}m
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Hub */}
                <div className="flex flex-col gap-6 items-start w-full">
                    {renderTabGroup(mealTabs, "🍽️ Meals & Recipes", "text-slate-500", true)}
                </div>

                {/* Controls Row - Like Food Page's Amount/Measure Row */}
                <div className="flex flex-col gap-4 items-start w-full">
                    <div className="flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Servings Input (Mirrors Food Page's Amount Input) */}
                        <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group/amount transition-all hover:border-emerald-500/50 shrink-0">
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={calculations.totalServings.toFixed(1)}
                                    readOnly
                                    className="w-16 bg-transparent text-lg font-black italic text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center border-r border-slate-100 dark:border-slate-800"
                                />
                                <div className="relative group/select pl-3 pr-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-1.5 pr-2 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400 outline-none hover:text-emerald-500 transition-colors">
                                            Servings
                                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover/select:text-emerald-500" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-2 min-w-[160px] shadow-2xl animate-in zoom-in-95 duration-200"
                                        >
                                            <DropdownMenuItem
                                                className="text-[10px] font-black uppercase tracking-tighter rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-500 focus:text-white dark:focus:bg-emerald-600 transition-all text-slate-500 dark:text-slate-400"
                                                onClick={() => setSelectedMemberIds(allPeople.map(p => p.id))}
                                            >
                                                Full Family ({allPeople.length})
                                            </DropdownMenuItem>
                                            {allPeople.map(person => (
                                                <DropdownMenuItem
                                                    key={person.id}
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-tighter rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-500 focus:text-white dark:focus:bg-emerald-600 transition-all",
                                                        selectedMemberIds.includes(person.id) ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"
                                                    )}
                                                    onClick={() => {
                                                        if (selectedMemberIds.includes(person.id)) {
                                                            setSelectedMemberIds(prev => prev.filter(pid => pid !== person.id));
                                                        } else {
                                                            setSelectedMemberIds(prev => [...prev, person.id]);
                                                        }
                                                    }}
                                                >
                                                    {selectedMemberIds.includes(person.id) ? '✓ ' : ''}{person.name || (person as any).nickname || 'User'}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuItem
                                                className="text-[10px] font-black uppercase tracking-tighter rounded-xl px-4 py-2.5 cursor-pointer focus:bg-rose-500 focus:text-white transition-all text-slate-400"
                                                onClick={() => setSelectedMemberIds([])}
                                            >
                                                Clear All
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>




                    </div>

                    {/* Scaling Factor Indicator */}
                    {currentScalingFactor !== 1 && (
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                            <Scale size={12} />
                            Scaled to {(currentScalingFactor * 100).toFixed(0)}% · Based on {calculations.maxTDEE.toFixed(0)} {energyUnit}
                        </div>
                    )}
                </div>

                {/* Ingredients Section - Full Width Horizontal Layout */}
                <Card className="p-6">
                    <div className="mb-6 space-y-4">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                            <ShoppingBasket size={24} className="text-emerald-500" />
                            Ingredients
                        </h3>


                        {/* Control Block */}
                        <div className="p-2 gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center">

                            {/* Show/Hide Toggle */}
                            <button
                                onClick={() => {
                                    setIsToggling(!isToggling);
                                    setIsEditingIngredients(false);
                                    setIsReordering(false);
                                    setIsEditingMeasures(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-[10px] uppercase font-black tracking-widest flex-1 justify-center whitespace-nowrap",
                                    isToggling
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20"
                                        : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-emerald-500 hover:border-emerald-200"
                                )}
                            >
                                <Eye size={14} /> Show/Hide
                            </button>

                            {/* Edit Mode Toggle */}
                            <button
                                onClick={() => {
                                    setIsEditingIngredients(!isEditingIngredients);
                                    setIsReordering(false);
                                    setIsEditingMeasures(false);
                                    setIsToggling(false);
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
                                    setIsToggling(false);
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
                                    setIsToggling(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-[10px] uppercase font-black tracking-widest flex-1 justify-center whitespace-nowrap",
                                    isReordering
                                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-500/20"
                                        : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-amber-500 hover:border-amber-200"
                                )}
                            >
                                <GripVertical size={14} /> Sort
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {ingredients.map((ing: any, i) => (
                            <div
                                key={ing.id || i}
                                draggable={isReordering}
                                onDragStart={(e) => isReordering && onDragStart(e, i)}
                                onDragOver={(e) => isReordering && onDragOver(e, i)}
                                onDrop={(e) => isReordering && onDrop(e, i)}
                                onClick={() => !isReordering && !isEditingIngredients && !isEditingMeasures && !isToggling && !hiddenIngredientIds.includes(ing.id) && ing.food_item_id && router.push(`/dashboard/library/foods/${ing.food_item_id}`)}
                                className={cn(
                                    "flex flex-col items-center text-center p-4 rounded-2xl border transition-all group relative overflow-hidden",
                                    hiddenIngredientIds.includes(ing.id)
                                        ? "bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                                        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 hover:shadow-md",
                                    ing.food_item_id && !hiddenIngredientIds.includes(ing.id) && !isReordering && !isEditingIngredients && !isEditingMeasures && !isToggling ? "cursor-pointer" : "",
                                    isReordering ? "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/50" : ""
                                )}
                            >
                                {/* Action Buttons: Reorder OR Remove OR Toggle */}
                                {(isReordering || isEditingIngredients || isToggling) && (
                                    <div className="absolute top-2 right-2 z-10">
                                        {isReordering ? (
                                            <div className="p-1.5 text-slate-400 group-hover:text-amber-500 transition-colors">
                                                <GripVertical size={16} />
                                            </div>
                                        ) : isEditingIngredients ? (
                                            <button
                                                onClick={(e) => removeIngredient(i, e)}
                                                className="p-1.5 rounded-full bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                                                title="Remove Ingredient"
                                            >
                                                <Minus size={14} />
                                            </button>
                                        ) : isToggling ? (
                                            <button
                                                onClick={(e) => toggleIngredient(ing.id, e)}
                                                className={cn(
                                                    "p-1.5 rounded-full transition-all",
                                                    hiddenIngredientIds.includes(ing.id) ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-100"
                                                )}
                                            >
                                                {hiddenIngredientIds.includes(ing.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        ) : null}
                                    </div>
                                )}

                                <div className={cn(
                                    "w-14 h-14 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 mb-2",
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
                                <div className="w-full min-w-0">
                                    <p className={cn(
                                        "text-[11px] font-black capitalize leading-tight transition-colors line-clamp-2",
                                        hiddenIngredientIds.includes(ing.id) ? "text-slate-400 decoration-slate-300 line-through" : "text-slate-900 dark:text-white"
                                    )}>{ing.base_ingredient || ing.item}</p>
                                    {isSpice(ing.food_item?.name || ing.base_ingredient || ing.item) && (ing.food_item_id || ing.food_item?.id) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const fid = ing.food_item_id || ing.food_item?.id;
                                                const returnUrl = encodeURIComponent(window.location.pathname);
                                                router.push(`/dashboard/spice-converter?foodId=${fid}&returnTo=${returnUrl}&swapId=${ing.id}`);
                                            }}
                                            className="p-1 text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 dark:bg-amber-900/20 rounded-lg mt-1"
                                            title="Calibrate in Spice Lab"
                                        >
                                            <Beaker size={12} />
                                        </button>
                                    )}

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
                                                className="h-7 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 focus:ring-1 focus:ring-emerald-500 max-w-[90px]"
                                            >
                                                <optgroup label="Standard">
                                                    <option value="g">g</option>
                                                    <option value="kg">kg</option>
                                                    <option value="ml">ml</option>
                                                    <option value="oz">oz</option>
                                                    <option value="lb">lb</option>
                                                </optgroup>
                                                {(() => {
                                                    const measures = [...(ing.food_item?.portions || [])];
                                                    if (isSpice(ing.food_item?.name || ing.item)) {
                                                        const spiceMeasures = getSpiceMeasures(ing.food_item?.name || ing.item, ing.cooking_state);
                                                        spiceMeasures.forEach(sm => {
                                                            if (!measures.some(m => m.label.toLowerCase() === sm.label.toLowerCase())) {
                                                                measures.push(sm);
                                                            }
                                                        });
                                                    }
                                                    if (measures.length === 0) return null;
                                                    return (
                                                        <optgroup label="Measures">
                                                            {measures.map((p: any, idx: number) => (
                                                                <option key={idx} value={p.label}>{p.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    );
                                                })()}
                                            </select>

                                            <select
                                                value={ing.cooking_state || 'raw'}
                                                onChange={(e) => handleUpdateIngredientState(i, e.target.value as CookingState)}
                                                className="h-7 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 border-none rounded-lg px-2 focus:ring-1 focus:ring-amber-500 max-w-[80px] text-amber-600 dark:text-amber-400"
                                            >
                                                {Object.entries(COOKING_STATES).filter(([key]) => {
                                                    const allowed = getSpiceStates(ing.food_item?.name || ing.item);
                                                    if (allowed) return allowed.includes(key);
                                                    return !['ground', 'dried', 'whole'].includes(key);
                                                }).map(([key, state]) => {
                                                    const s = state as StateFactor;
                                                    let label = s.label;
                                                    if (key === 'stored') {
                                                        const name = (ing.food_item?.name || '').toLowerCase();
                                                        const isCooked = name.includes('cooked') || name.includes('boiled') || name.includes('roasted') || name.includes('fried');
                                                        const source = (ing.food_item?.source || 'USDA').toUpperCase();
                                                        label = isCooked ? `Cooked (${source})` : `Raw (${source})`;
                                                    }
                                                    return <option key={key} value={key}>{label}</option>
                                                })}
                                            </select>
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                            {/* Smart Portion Scaling Display */}
                                            {ing.quantity && ing.measure_label
                                                ? `${(ing.quantity * currentScalingFactor).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${ing.measure_label}`
                                                : (ing.amount ? `${ing.amount}` : '')}
                                        </p>
                                    )}
                                    <p className={cn(
                                        "text-[10px] font-black transition-colors mt-1",
                                        hiddenIngredientIds.includes(ing.id) ? "text-slate-300" : "text-emerald-500"
                                    )}>{Math.round((ing.weight_g || 0) * currentScalingFactor)}g</p>
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

                        {/* Reset Button (Visible if customizations exist) */}
                        {(ingredients.length !== originalIngredients.length || JSON.stringify(ingredients) !== JSON.stringify(originalIngredients) || hiddenIngredientIds.length > 0) && (
                            <div className="pt-2">
                                <button
                                    onClick={resetOrder}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest group"
                                    title="Reset to Default"
                                >
                                    <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                                    Reset Meal Defaults
                                </button>
                            </div>
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

                {/* Directions */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic text-amber-500">
                            <ChefHat size={24} />
                            Directions
                        </h3>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 gap-2 flex items-center">
                                <Clock size={12} /> {recipe.prep_time}m
                            </Badge>
                            <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 gap-2 flex items-center">
                                <Users size={12} /> {recipe.servings}P
                            </Badge>
                        </div>
                    </div>
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
                                    { label: 'Omega-3', keys: ['Omega-3'], unit: 'g', isExpandable: true },
                                    { label: 'ALA', keys: ['ALA', 'alpha_linolenic_acid_g'], unit: 'g', hiddenByDefault: true },
                                    { label: 'EPA', keys: ['EPA', 'eicosapentaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
                                    { label: 'DHA', keys: ['DHA', 'docosahexaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
                                    { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
                                    { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
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
                                                let val = 0;
                                                let rda = null;
                                                let unitStr = '';
                                                const m = recipe.micronutrients || {};

                                                if (title === 'Biological Ratios') {
                                                    const k1 = findNutrientMatch(m, keys[0]);
                                                    const k2 = findNutrientMatch(m, keys[1]);
                                                    const v1 = k1 ? m[k1] : 0;
                                                    const v2 = k2 ? m[k2] : 0;
                                                    val = v2 > 0 ? v1 / v2 : 0;
                                                    unitStr = ' to 1';
                                                } else {
                                                    val = (label === 'Energy' || label === 'Protein' || label === 'Carbs' || label === 'Fat')
                                                        ? (label === 'Energy' ? (energyUnit === 'kJ' ? (recipe as any).energy_kj : (recipe as any).calories) : (recipe as any)[label.toLowerCase()])
                                                        : getVal(keys as string[]);
                                                    const macroRDAs: Record<string, number> = {
                                                        'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                                                        'Protein': dailyTargets.protein,
                                                        'Carbs': dailyTargets.carbs,
                                                        'Fat': dailyTargets.fat
                                                    };
                                                    rda = userRDAs?.[label] || macroRDAs[label];
                                                    unitStr = (label === 'Energy') ? energyUnit :
                                                        (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars' || label === 'Starch' || label === 'Omega-3' || label === 'Omega-6') ? 'g' :
                                                            (label === 'Vitamin D') ? 'IU' :
                                                                (label.includes('Folate') || label.includes('Selenium') || label.includes('Iodine') || label.includes('B12') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';
                                                }

                                                const pct = rda ? Math.round((val / rda) * 100) : null;
                                                let styles = getNutrientLevelStyles(pct || 0, label);

                                                if (title === 'Biological Ratios') {
                                                    let ratioStatus: 'good' | 'fair' | 'poor' = 'good';
                                                    if (label === 'Sodium & Potassium') ratioStatus = val <= 1.0 ? 'good' : val <= 2.0 ? 'fair' : 'poor';
                                                    if (label === 'Zinc & Copper') ratioStatus = (val >= 8 && val <= 12) ? 'good' : (val >= 5 && val <= 15) ? 'fair' : 'poor';
                                                    if (label === 'Omega 3 to 6 ratio') ratioStatus = val <= 4.0 ? 'good' : val <= 10.0 ? 'fair' : 'poor';
                                                    if (label === 'Calcium & Magnesium') ratioStatus = (val >= 1.7 && val <= 2.5) ? 'good' : (val >= 1.5 && val <= 3.0) ? 'fair' : 'poor';
                                                    if (label === 'Calcium & Phosphorus') ratioStatus = (val >= 1.0 && val <= 2.0) ? 'good' : (val >= 0.8 && val <= 2.5) ? 'fair' : 'poor';

                                                    styles = ratioStatus === 'good' ? { text: "text-emerald-500", borderLight: "border-emerald-500/30", fade: "bg-emerald-500/5", textFill: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" } :
                                                        ratioStatus === 'fair' ? { text: "text-amber-500", borderLight: "border-amber-500/30", fade: "bg-amber-500/5", textFill: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500" } :
                                                            { text: "text-rose-500", borderLight: "border-rose-500/30", fade: "bg-rose-500/5", textFill: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500" };
                                                }

                                                const ratioTarget = title === 'Biological Ratios' ? (
                                                    label === 'Sodium & Potassium' ? 'Under 1 to 1' :
                                                        label === 'Zinc & Copper' ? '8 to 1 - 12 to 1' :
                                                            label === 'Omega 3 to 6 ratio' ? 'Under 4 to 1' :
                                                                label === 'Calcium & Magnesium' ? '1.7 to 1 - 2.5 to 1' :
                                                                    label === 'Calcium & Phosphorus' ? '1 to 1 - 2 to 1' : null
                                                ) : null;

                                                const labelColor = title === 'Biological Ratios' ? (
                                                    label === 'Sodium:Potassium' ? 'text-blue-400' :
                                                        label === 'Zinc:Copper' ? 'text-orange-400' :
                                                            label === 'Omega 6:3 Ratio' ? 'text-indigo-400' :
                                                                label === 'Calcium:Magnesium' ? 'text-violet-400' :
                                                                    label === 'Calcium:Phosphorus' ? 'text-cyan-400' : 'text-foreground/60'
                                                ) : 'text-foreground/60';

                                                const hasBreakdown = breakdownLabels.includes(label);

                                                return (
                                                    <div key={label} onClick={() => router.push(`/dashboard/library/nutrients/${encodeURIComponent(label)}`)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct !== null ? `${styles.borderLight} ${styles.fade}` : "")}>>
                                                        <p className={cn(
                                                            "text-[9px] font-black truncate mb-1 whitespace-nowrap overflow-hidden transition-colors",
                                                            title === 'Biological Ratios' ? 'text-slate-400 dark:text-slate-500' : 'uppercase text-foreground/60'
                                                        )}>
                                                            {label}
                                                        </p>
                                                        <div className="space-y-0.5">
                                                            {(nutrientDisplayMode === 'percentage' && pct !== null && !forceRaw) ? (
                                                                <>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                                                    </div>
                                                                    <p className="text-[9px] font-bold text-slate-400">
                                                                        {val.toFixed(1)}{unitStr}
                                                                    </p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className={cn("text-lg font-extrabold tracking-tight", title === 'Biological Ratios' ? styles.text : "")}>
                                                                            {val >= 10 ? val.toFixed(0) : (val >= 1 ? val.toFixed(1) : val.toFixed(2))}
                                                                        </span>
                                                                        <span className={cn("text-[10px] font-bold", (unitStr === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitStr}</span>
                                                                    </div>
                                                                    {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                            Target: {Math.round(rda)}{unitStr === 'kcal' ? 'kcal' : unitStr}
                                                                        </p>
                                                                    )}
                                                                    {ratioTarget && (
                                                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                                            Ideal: {ratioTarget}
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
                                    <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6">
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 italic flex items-center gap-2">
                                            <Activity size={18} />
                                            Essential Nutrients
                                        </h3>
                                    </div>

                                    <NutrientGrid title="Macronutrients" icon={Zap} theme="orange" subtitle="Detailed breakdown of energy and macro density" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                                        'Energy': ['calories'],
                                        'Protein': ['protein'],
                                        'Carbs': ['carbs'],
                                        'Fat': ['fat']
                                    }} />

                                    <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Essential minerals for cellular hydration and nerve signal transmission" items={{
                                        'Sodium': ['Sodium', 'sodium_mg'],
                                        'Potassium': ['Potassium', 'potassium_mg'],
                                        'Magnesium': ['Magnesium', 'magnesium_mg'],
                                        'Calcium': ['Calcium', 'calcium_mg'],
                                        'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                    }} />

                                    <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential minerals for energy and immune support" items={{
                                        'Iron': ['Iron', 'iron_mg'],
                                        'Zinc': ['Zinc', 'zinc_mg'],
                                        'Copper': ['Copper', 'copper_mg'],
                                        'Manganese': ['Manganese', 'manganese_mg'],
                                        'Selenium': ['Selenium', 'selenium_ug']
                                    }} />

                                    <NutrientGrid title="Water-Soluble Vitamins" icon={Droplet} theme="blue" subtitle="Daily vitamins for a healthy mind and body" items={{
                                        'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                                        'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                                        'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                                        'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                                        'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                                        'B7 (Biotin)': ['Biotin', 'biotin_ug'],
                                        'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                                        'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                                        'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                        'Choline': ['Choline', 'choline_mg'],
                                    }} />

                                    <NutrientGrid title="Fat-Soluble Vitamins" icon={Battery} theme="emerald" subtitle="Stored vitamins for long-term vitality" breakdownLabels={['Vitamin A', 'Vitamin E']} items={{
                                        'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                        'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                        'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                        'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                                    }} />

                                    <div className="pt-12 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6">
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                                            <Dna size={18} />
                                            Advanced Nutrition
                                        </h3>
                                    </div>

                                    <NutrientGrid title="Extra Markers" icon={Activity} theme="amber" subtitle="Extra health markers worth tracking" forceRaw={true} items={{
                                        'Fiber': ['Fiber', 'fiber_g'],
                                        'Sugars': ['Sugars', 'sugars_g'],
                                        'Oxalate': ['Oxalate', 'oxalate_mg'],
                                        'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                                    }} />

                                    <NutrientGrid title="Biological Ratios" icon={Dna} theme="amber" subtitle="Key nutrient balances for a healthy body" items={{
                                        'Sodium & Potassium': ['Sodium', 'Potassium'],
                                        'Zinc & Copper': ['Zinc', 'Copper'],
                                        'Omega 3 to 6 ratio': ['Omega-6', 'Omega-3'],
                                        'Calcium & Magnesium': ['Calcium', 'Magnesium'],
                                        'Calcium & Phosphorus': ['Calcium', 'Phosphorus'],
                                    }} />

                                    {Object.keys(phytoSources).length > 0 && (
                                        <DidYouKnow
                                            phytonutrientsWithSources={phytoSources}
                                            className="animate-in slide-in-from-right-4 duration-700 mt-8"
                                        />
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}




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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Breakdown</p>
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
                                                        "p-5 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-1 duration-200",
                                                        isZero ? "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", isZero ? "bg-slate-300" : "bg-emerald-500")} />
                                                            <div>
                                                                <span className={cn("font-black text-sm", isZero ? "text-slate-400" : "text-slate-900 dark:text-white uppercase tracking-tight")}>{label}</span>
                                                                {isEssential && <span className="ml-2 text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-md">Essential</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className={cn("text-xl font-black tabular-nums", isZero ? "text-slate-300" : "")}>
                                                                {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">{unit === 'µg' ? 'µg' : unit}</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar for constituent */}
                                                    {(() => {
                                                        const rda = userRDAs?.[label];
                                                        if (!rda || isZero) return null;
                                                        const pct = Math.min(100, Math.round((val / rda) * 100));
                                                        return (
                                                            <div className="space-y-1 mt-3">
                                                                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={cn("h-full transition-all duration-1000",
                                                                            breakdownNutrient === 'Protein' ? "bg-red-500" :
                                                                                breakdownNutrient === 'Carbs' ? "bg-amber-500" :
                                                                                    breakdownNutrient === 'Fat' ? "bg-orange-500" :
                                                                                        "bg-emerald-500"
                                                                        )}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                                                    <span>Target Progress</span>
                                                                    <span>{pct}% of {rda.toFixed(1)}{unit === 'µg' ? 'µg' : unit}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* NUTRIENT EXPORT MODAL */}
                {calculatedTotals && (
                    <NutrientExportModal
                        isOpen={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        nutrition={calculatedTotals}
                        recipeName={recipe.title}
                        totalWeight={totalWeight}
                    />
                )}
            </div>
        </div>
    );
}
