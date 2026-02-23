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
    FlaskConical,
    History,
    ArrowRight
} from 'lucide-react';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { useSearch } from '@/lib/context/search-context';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import NutrientExportModal from '@/components/recipe/nutrient-export-modal';
import { calculateRecipeNutrition, calculateIndividualTargets, CalculatedNutrition, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
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
import { PageContainer } from '@/components/ui/page-container';

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
    user_id?: string;
    is_curated?: boolean;
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
    const { searchQuery, setSearchQuery } = useSearch();
    const { setCustomSegmentLabel } = useHeaderActions();
    const { deleteRecipe } = useDataPersistence();

    // Update header label when recipe loads
    useEffect(() => {
        if (recipe?.title) {
            setCustomSegmentLabel(recipe.title);
        }
        return () => setCustomSegmentLabel(null);
    }, [recipe?.title, setCustomSegmentLabel]);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [expandedBreakdownSections, setExpandedBreakdownSections] = useState<Record<string, boolean>>({});
    const [calculatedTotals, setCalculatedTotals] = useState<CalculatedNutrition | null>(null);
    const [phytoSources, setPhytoSources] = useState<Record<string, { description: string; sources: string[] }>>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    const { profile, nutrientDisplayMode, energyUnit, dailyTargets } = useUserPreferences();
    const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

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

    // FETCH RELATED MEALS logic
    useEffect(() => {
        const fetchRelated = async () => {
            if (!ingredients || ingredients.length === 0) return;

            setLoadingRelated(true);
            try {
                const foodIds = ingredients
                    .map(ing => ing.food_item_id)
                    .filter((id): id is string => !!id);

                if (foodIds.length === 0) {
                    setRelatedRecipes([]);
                    return;
                }

                // Query ingredients table for other recipes using these food items
                const { data: ingData, error: ingError } = await supabase
                    .from('ingredients')
                    .select('recipe_id, food_item_id')
                    .in('food_item_id', foodIds)
                    .neq('recipe_id', id as string)
                    .limit(50);

                if (ingError) throw ingError;

                // Create a mapping of food_item_id to its names for the current recipe
                const sharedFoodNames: Record<string, string> = {};
                ingredients.forEach(ing => {
                    if (ing.food_item_id) {
                        sharedFoodNames[ing.food_item_id] = ing.food_item?.common_name || ing.food_item?.name || ing.base_ingredient || 'Unknown';
                    }
                });

                // Count overlaps and track which ingredients are shared
                const overlapCounts: Record<string, number> = {};
                const sharedItemsMap: Record<string, string[]> = {};

                ingData.forEach(i => {
                    overlapCounts[i.recipe_id] = (overlapCounts[i.recipe_id] || 0) + 1;
                    if (i.food_item_id && sharedFoodNames[i.food_item_id]) {
                        if (!sharedItemsMap[i.recipe_id]) sharedItemsMap[i.recipe_id] = [];
                        if (!sharedItemsMap[i.recipe_id].includes(sharedFoodNames[i.food_item_id])) {
                            sharedItemsMap[i.recipe_id].push(sharedFoodNames[i.food_item_id]);
                        }
                    }
                });

                const recipeIds = Object.keys(overlapCounts);

                if (recipeIds.length === 0) {
                    setRelatedRecipes([]);
                    return;
                }

                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, title, image, type, diet, prep_time, calories')
                    .in('id', recipeIds);

                if (recipeError) throw recipeError;

                // Sort by overlap count (descending)
                const sortedRecipes = (recipeData || [])
                    .map(r => ({
                        ...r,
                        overlapMatch: overlapCounts[r.id],
                        sharedItems: sharedItemsMap[r.id] || []
                    }))
                    .sort((a, b) => b.overlapMatch - a.overlapMatch)
                    .slice(0, 6);

                setRelatedRecipes(sortedRecipes as any);
            } catch (error) {
                console.error("Error fetching related recipes:", error);
            } finally {
                setLoadingRelated(false);
            }
        };

        if (!loading && ingredients.length > 0) {
            fetchRelated();
        }
    }, [ingredients, id, loading]);

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
            const recipeIdStr = String(id);

            if (recipeIdStr.startsWith('local-')) {
                // LOAD FROM LOCAL STORAGE
                const localData = localStorage.getItem('local_recipes');
                if (!localData) throw new Error('Local recipe not found');

                const localRecipes: any[] = JSON.parse(localData);
                const localRecipe = localRecipes.find(r => r.id === recipeIdStr);

                if (!localRecipe) throw new Error('Local recipe not found');

                setRecipe(localRecipe);
                const fetchedIngredients = (localRecipe.ingredients || []).map((ing: any) => ({
                    ...ing,
                    item: ing.item || ing.food_item_name || ing.base_ingredient || 'Ingredient'
                }));
                setIngredients(fetchedIngredients);
                setOriginalIngredients(fetchedIngredients);

                const fetchedInstructions = (localRecipe.instructions || []).map((inst: any, idx: number) => {
                    if (typeof inst === 'string') {
                        return { step_text: inst, step_order: idx + 1 };
                    }
                    return inst;
                });
                setInstructions(fetchedInstructions);

                // Calculate live micronutrients
                if (localRecipe.ingredients?.length > 0) {
                    const calculated = calculateRecipeNutrition(
                        localRecipe.ingredients.map((ing: any) => {
                            // If food_item missing, reconstruct it from base_nutrition or flattened fields
                            const foodItem = ing.food_item || {
                                id: ing.food_item_id,
                                name: ing.food_item_name,
                                energy_kcal: ing.base_nutrition?.calories || 0,
                                energy_kj: ing.base_nutrition?.energy_kj,
                                protein_g: ing.base_nutrition?.protein || 0,
                                fat_g: ing.base_nutrition?.fat || 0,
                                carbs_g: ing.base_nutrition?.carbs || 0,
                                micronutrients: ing.base_nutrition?.micronutrients || {},
                                phytonutrients: ing.base_nutrition?.phytonutrients || {}
                            };

                            return {
                                food_item: foodItem,
                                weight_g: ing.weight_g || 0,
                                cooking_state: ing.cooking_state
                            };
                        })
                    );
                    setCalculatedTotals(calculated);
                }
            } else {
                // LOAD FROM SUPABASE
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (recipeError) throw recipeError;

                const { data: ingData, error: ingError } = await supabase
                    .from('ingredients')
                    .select('*, food_item:food_items(*)')
                    .eq('recipe_id', id);

                if (ingError) throw ingError;

                const fetchedIngredients = ingData || [];
                setIngredients(fetchedIngredients);
                setOriginalIngredients(fetchedIngredients);

                if (fetchedIngredients.length > 0) {
                    const calculated = calculateRecipeNutrition(
                        fetchedIngredients.map(ing => ({
                            food_item: ing.food_item,
                            weight_g: ing.weight_g || 0,
                            cooking_state: ing.cooking_state
                        }))
                    );

                    setCalculatedTotals(calculated);
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

                const { data: insData, error: insError } = await supabase
                    .from('instructions')
                    .select('*')
                    .eq('recipe_id', id)
                    .order('step_order', { ascending: true });

                if (insError) throw insError;
                setInstructions(insData || []);
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load meal details');
            router.push('/dashboard/library/meals');
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

    const toggleFavorite = () => {
        if (!recipe) return;
        setRecipe({ ...recipe, is_favorite: !recipe.is_favorite });
        toast.success(recipe.is_favorite ? "Removed from favorites" : "Added to favorites");
    };

    const getVal = (keys: string[]) => {
        if (!calculatedTotals) return 0;
        const m = calculatedTotals.micronutrients || {};
        let baseVal = 0;

        for (const k of keys) {
            let val = 0;
            if (k === 'energy_kcal') {
                if (energyUnit === 'kJ') val = calculatedTotals.energy_kj || (calculatedTotals.calories * 4.184);
                else val = calculatedTotals.calories;
            }
            else if (k === 'energy_kj') {
                if (energyUnit === 'kcal') val = calculatedTotals.calories;
                else val = calculatedTotals.energy_kj || (calculatedTotals.calories * 4.184);
            }
            else if (k === 'Energy' || k === 'Calories' || k === 'calories') {
                if (energyUnit === 'kJ') val = calculatedTotals.energy_kj || (calculatedTotals.calories * 4.184);
                else val = calculatedTotals.calories;
            }
            else if (k === 'protein_g') val = calculatedTotals.protein || 0;
            else if (k === 'carbs_g') val = calculatedTotals.carbs || 0;
            else if (k === 'fat_g') val = calculatedTotals.fat || 0;
            else {
                if (m[k] !== undefined) val = m[k];
                else {
                    const match = findNutrientMatch(m, k);
                    if (match) val = m[match];
                }
            }

            if (val > 0) {
                baseVal = val;
                break;
            }
        }

        // Extra Fallback for Fat: Try to sum constituents if total is 0
        if (baseVal === 0 && (keys.includes('fat_g') || keys.includes('Fat'))) {
            const sat = (m['Saturated Fat'] || 0) as number;
            const mono = (m['Monounsaturated Fat'] || 0) as number;
            const poly = (m['Polyunsaturated Fat'] || 0) as number;
            const trans = (m['Trans Fat'] || 0) as number;
            const sum = sat + mono + poly + trans;
            if (sum > 0) baseVal = sum;
        }

        return baseVal * currentScalingFactor;
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
                        const m = calculatedTotals?.micronutrients || {};

                        if (title === 'Biological Ratios') {
                            const k1 = findNutrientMatch(m, keys[0]);
                            const k2 = findNutrientMatch(m, keys[1]);
                            const v1 = (k1 ? m[k1] : 0) as number;
                            const v2 = (k2 ? m[k2] : 0) as number;
                            val = v2 > 0 ? v1 / v2 : 0;
                            unitStr = ' to 1';
                        } else {
                            val = getVal(keys as string[]);
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
                                        (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';
                        }

                        // Adjust RDA based on scaling factor too? No, usually RDA is for the user's DAILY intake.
                        // But wait, the percentage here should be "what % of my DAILY NEEDS does this SCALED PORTION provide?"
                        // So yes, pct = val / rda. `val` already includes currentScalingFactor.
                        const pct = rda ? Math.round((val / rda) * 100) : 0;
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

                        const hasBreakdown = breakdownLabels.includes(label);

                        return (
                            <div key={label} onClick={() => router.push(`/dashboard/workshop/nutridex/${encodeURIComponent(label)}`)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <p className={cn(
                                    "text-[9px] font-black truncate mb-1 whitespace-nowrap overflow-hidden transition-colors",
                                    title === 'Biological Ratios' ? 'text-slate-400 dark:text-slate-500' : 'uppercase text-foreground/60'
                                )}>
                                    {label}
                                </p>
                                <div className="space-y-0.5">
                                    {(nutrientDisplayMode === 'percentage' && !forceRaw) ? (
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
                                                <span className={cn("text-lg font-bold", title === 'Biological Ratios' ? styles.text : "")}>{val.toFixed(1)}</span>
                                                <span className={cn("text-[10px] font-bold", (unitStr === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitStr}</span>
                                            </div>
                                            {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                    Target: {Math.round(rda)}{unitStr}
                                                </p>
                                            )}
                                            {ratioTarget && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                    Ideal: {ratioTarget}
                                                </p>
                                            )}
                                            {nutrientDisplayMode === 'both' && pct > 0 && !forceRaw && (
                                                <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
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

    const handleDelete = async () => {
        if (!recipe) return;
        if (confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
            try {
                await deleteRecipe(recipe.id);
                toast.success("Recipe deleted successfully");
                router.push('/dashboard/library/meals');
            } catch (error) {
                toast.error("Failed to delete recipe");
            }
        }
    };

    const handleEdit = () => {
        if (!recipe) return;
        router.push(`/dashboard/library/meals/new?edit=${recipe.id}`);
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
        <PageContainer maxWidth="max-w-7xl">
            <div className="w-full space-y-10 animate-in fade-in duration-700 pb-32 px-4">
                <div className="max-w-7xl mx-auto space-y-8">
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

                    {/* Main Content Grid - Ingredients + Nutrition */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Ingredients & Instructions */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* ═══ INGREDIENTS SECTION ═══ */}
                            <Card className="p-6 lg:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Layers className="text-emerald-500" size={20} />
                                        <h2 className="text-lg font-black uppercase tracking-wider">Ingredients</h2>
                                    </div>
                                    <button
                                        onClick={resetOrder}
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1"
                                        title="Reset to original recipe"
                                    >
                                        <RotateCcw size={12} /> Reset
                                    </button>
                                </div>

                                {ingredients.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm font-bold">No ingredients in this recipe</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {ingredients.map((ing, index) => (
                                            <div
                                                key={ing.id || index}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, index)}
                                                onDragOver={(e) => onDragOver(e, index)}
                                                onDrop={(e) => onDrop(e, index)}
                                                className={cn(
                                                    "group flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                                    hiddenIngredientIds.includes(ing.id)
                                                        ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-50"
                                                        : "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-400"
                                                )}
                                            >
                                                {/* Drag Handle */}
                                                <button
                                                    className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Drag to reorder"
                                                >
                                                    <GripVertical size={14} />
                                                </button>

                                                {/* Toggle Visibility */}
                                                <button
                                                    onClick={(e) => toggleIngredient(ing.id, e)}
                                                    className={cn(
                                                        "flex-shrink-0 transition-colors",
                                                        hiddenIngredientIds.includes(ing.id)
                                                            ? "text-slate-400 hover:text-slate-600"
                                                            : "text-emerald-500 hover:text-emerald-600"
                                                    )}
                                                    title={hiddenIngredientIds.includes(ing.id) ? "Show" : "Hide"}
                                                >
                                                    {hiddenIngredientIds.includes(ing.id) ? (
                                                        <EyeOff size={16} />
                                                    ) : (
                                                        <Eye size={16} />
                                                    )}
                                                </button>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {ing.item}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {ing.food_item?.energy_kcal ? `${(ing.weight_g / 100 * ing.food_item.energy_kcal).toFixed(0)} kcal` : 'No data'}
                                                    </p>
                                                </div>

                                                {/* Amount Display */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-black text-slate-900 dark:text-white">
                                                        {ing.quantity?.toFixed(2) || ing.weight_g}
                                                    </p>
                                                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                                                        {ing.measure_label || 'g'}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <button
                                                    onClick={(e) => removeIngredient(index, e)}
                                                    className="text-rose-400 hover:text-rose-600 transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Ingredient Button */}
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm transition-all"
                                >
                                    <Plus size={16} className="inline mr-2" />
                                    Add Ingredient
                                </button>
                            </Card>

                            {/* ═══ INSTRUCTIONS SECTION ═══ */}
                            {instructions.length > 0 && (
                                <Card className="p-6 lg:p-8 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="text-emerald-500" size={20} />
                                        <h2 className="text-lg font-black uppercase tracking-wider">Instructions</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {instructions.map((inst, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center text-sm">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                                                    {inst.step_text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Right Column - Related Meals & Sidebar Content */}
                        <div className="space-y-6">
                            {(relatedRecipes.length > 0 || loadingRelated) && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                <ChefHat size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[10px] uppercase italic text-slate-900 dark:text-white leading-none mb-1">Related Meals</h3>
                                                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">Shared items</p>
                                            </div>
                                        </div>
                                    </div>

                                    {loadingRelated ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div key={i} className="aspect-[4/5] rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {relatedRecipes.map((meal) => (
                                                <a
                                                    key={meal.id}
                                                    href={`/dashboard/library/meals/${meal.id}`}
                                                    className="group relative flex flex-col items-center text-center gap-2 p-3 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all duration-500 shadow-sm shadow-slate-200/50 dark:shadow-none hover:-translate-y-1"
                                                >
                                                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-700 relative">
                                                        {meal.image ? (
                                                            <img src={meal.image} className="w-full h-full object-cover" alt={meal.title} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                                <ChefHat size={20} className="opacity-10" />
                                                            </div>
                                                        )}

                                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-600 text-white rounded-md shadow-lg z-[100] font-black text-[7px] uppercase tracking-wider">
                                                            {(meal as any).overlapMatch} Shared
                                                        </div>
                                                    </div>

                                                    <h4 className="font-black text-[9px] uppercase italic text-slate-900 dark:text-white line-clamp-1">
                                                        {meal.title}
                                                    </h4>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nutritional Profile Section */}
                    <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                        <div className="pb-4">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 italic flex items-center gap-2">
                                <Activity size={18} />
                                Nutritional Profile
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Comprehensive biological analysis of this meal</p>
                        </div>

                        <NutrientGrid title="Macronutrients" icon={Zap} theme="orange" subtitle="Detailed breakdown of energy and macro density" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                            'Energy': ['Energy', 'energy_kcal', 'Calories', 'calories'],
                            'Protein': ['Protein', 'protein_g', 'protein'],
                            'Carbs': ['Carbohydrates', 'carbs_g', 'carbs'],
                            'Fat': ['Fat', 'fat_g', 'fat']
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

                        <div className="pt-12 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6 font-display">
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                                <Dna size={18} />
                                Advanced Bio-Markers
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

                    </div>

                    {/* Breakdown Overlay */}
                    {breakdownNutrient && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setBreakdownNutrient(null)} />
                            <Card className="relative w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">
                                            {breakdownNutrient} <span className="text-emerald-500">Breakdown</span>
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Analysis Report</p>
                                    </div>
                                    <button onClick={() => setBreakdownNutrient(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total {breakdownNutrient}</p>
                                            <p className="text-2xl font-black text-emerald-500">
                                                {getVal([breakdownNutrient, ...(NUTRIENT_BREAKDOWNS[breakdownNutrient]?.map(b => b.label) || [])]).toFixed(1)}
                                                <span className="text-xs ml-1 text-slate-400">
                                                    {NUTRIENT_BREAKDOWNS[breakdownNutrient]?.[0]?.unit || (breakdownNutrient === 'Protein' || breakdownNutrient === 'Carbs' || breakdownNutrient === 'Fat' ? 'g' : 'mg')}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Component Count</p>
                                            <p className="text-2xl font-black text-white">
                                                {NUTRIENT_BREAKDOWNS[breakdownNutrient]?.length || 0}
                                                <span className="text-xs ml-2 text-slate-400">Markers</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {NUTRIENT_BREAKDOWNS[breakdownNutrient]?.map((sub) => {
                                            const subVal = getVal(sub.keys);
                                            const totalVal = getVal([breakdownNutrient, ...(NUTRIENT_BREAKDOWNS[breakdownNutrient]?.map(b => b.label) || [])]);
                                            const pctOfTotal = totalVal > 0 ? (subVal / totalVal) * 100 : 0;

                                            if (sub.hiddenByDefault && subVal === 0) return null;

                                            return (
                                                <div key={sub.label} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/30 transition-all group">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-2 h-2 rounded-full", subVal > 0 ? "bg-emerald-500" : "bg-slate-700")} />
                                                            <span className="text-xs font-black text-white uppercase tracking-wider">{sub.label}</span>
                                                            {sub.isEssential && (
                                                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[7px] px-1 font-black">Essential</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-black text-emerald-500">{subVal.toFixed(2)} {sub.unit}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500/50 rounded-full transition-all duration-1000"
                                                            style={{ width: `${Math.min(100, pctOfTotal)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-1.5">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Contribution</p>
                                                        <p className="text-[9px] font-black text-emerald-500/70">{pctOfTotal.toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                                        COMPONENT ANALYSIS REPRESENTS THE CALCULATED BIOLOGICAL COMPOSITION BASED ON AGGREGATED INGREDIENT DATA.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* DidYouKnow Section */}
                    {recipe && (
                        <DidYouKnow
                            phytonutrients={recipe.phytonutrients}
                            foodName={recipe.title}
                            className="py-10 border-t border-slate-100 dark:border-slate-800 mt-10"
                        />
                    )}
                </div>

                {/* Modals */}
                {showPicker && <FoodItemPicker onSelect={handleAddIngredient} onClose={() => setShowPicker(false)} />}
                {showExportModal && calculatedTotals && <NutrientExportModal isOpen={showExportModal} nutrition={calculatedTotals} recipeName={recipe?.title || 'Recipe'} totalWeight={totalWeight} onClose={() => setShowExportModal(false)} />}
            </div>
        </PageContainer>
    );
}
