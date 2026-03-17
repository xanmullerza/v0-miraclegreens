// This file will house the extracted Recipe Details view
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    ChefHat,
    Clock,
    Activity,
    Layers,
    Gem,
    Droplet,
    Battery,
    X,
    ChevronDown,
    Pencil,
    Plus,
    Minus,
    Trash2,
    BookOpen,
    Star,
    ShoppingCart,
    ShoppingBasket,
    Lightbulb,
    Scale,
    Dna,
    ChevronUp,
    UtensilsCrossed
} from 'lucide-react';

import { useHeaderActions } from '@/lib/context/header-actions-context';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import NutrientExportModal from '@/components/recipe/nutrient-export-modal';
import { calculateRecipeNutrition, calculateIndividualTargets, CalculatedNutrition, findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

import { findSpiceFactor, isSpice, getSpiceMeasures } from '@/lib/utils/spice-conversion';
import { CookingState } from '@/lib/utils/cooking-states';
import { searchLocalFood } from '@/lib/services/nutrition';
import { DidYouKnow } from '@/components/DidYouKnow';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-card shadow-xl rounded-[2.5rem] border border-border overflow-hidden", className)}>
        {children}
    </div>
);

// We export the interfaces so they can be reused if needed
export interface Ingredient {
    id: string;
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

export interface Instruction {
    step_text: string;
    step_order: number;
}

export interface Recipe {
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
    calculated_nutrition?: CalculatedNutrition;
    user_id?: string;
    is_curated?: boolean;
}

interface RecipeDetailsProps {
    recipeId: string;
    // Optional callbacks for when it's embedded in a modal/pane
    onClose?: () => void;
    // Standalone mode means it's rendering as a full page
    isStandalone?: boolean;
}

export default function RecipeDetails({ recipeId, onClose, isStandalone = false }: RecipeDetailsProps) {
    const router = useRouter();
    // In standalone mode, we might want to interact with the URL search params,
    // but for the embedded version we should avoid strict URL dependencies if possible.

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [originalIngredients, setOriginalIngredients] = useState<Ingredient[]>([]); 
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hiddenIngredientIds, setHiddenIngredientIds] = useState<string[]>([]);
    
    const [showPicker, setShowPicker] = useState(false);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'recipe' | 'nutrition' | 'related' | 'management' | null>('recipe');
    const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
    const [manualServings, setManualServings] = useState<number | null>(null);
    
    // We conditionally call these hooks. If it's pure embedding, we might not want to touch the header.
    const { setCustomSegmentLabel } = useHeaderActions();
    const { deleteRecipe } = useDataPersistence();

    useEffect(() => {
        if (isStandalone && recipe?.title) {
            setCustomSegmentLabel(recipe.title);
        }
        return () => {
            if (isStandalone) setCustomSegmentLabel(null);
        };
    }, [recipe?.title, setCustomSegmentLabel, isStandalone]);

    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [calculatedTotals, setCalculatedTotals] = useState<CalculatedNutrition | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [totalWeight, setTotalWeight] = useState(0);
    const { profile, nutrientDisplayMode, energyUnit, dailyTargets } = useUserPreferences();
    const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(['main-user']);

    // ... [Rest of the logic from page.tsx, omitting searchParams dependent logic for now or making it conditional] ...

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

                const { data: ingData, error: ingError } = await supabase
                    .from('ingredients')
                    .select('recipe_id, food_item_id')
                    .in('food_item_id', foodIds)
                    .neq('recipe_id', recipeId)
                    .limit(50);

                if (ingError) throw ingError;

                const sharedFoodNames: Record<string, string> = {};
                ingredients.forEach(ing => {
                    if (ing.food_item_id) {
                        sharedFoodNames[ing.food_item_id] = ing.food_item?.common_name || ing.food_item?.name || ing.base_ingredient || 'Unknown';
                    }
                });

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

                const sortedRecipes = (recipeData || [])
                    .map(r => ({
                        ...r,
                        overlapMatch: overlapCounts[r.id],
                        sharedItems: sharedItemsMap[r.id] || []
                    }))
                    .sort((a, b) => (b as any).overlapMatch - (a as any).overlapMatch)
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
    }, [ingredients, recipeId, loading]);

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
        return [mainUserAsMember, ...(profile.familyMembers || [])];
    }, [profile]);

    const calculations = React.useMemo(() => {
        if (selectedMemberIds.length === 0) return { totalServings: 1, maxTDEE: 2000, memberPortions: {} as Record<string, number>, currentSinglePortionCalories: 2000 };

        const selectedPeople = allPeople.filter(p => selectedMemberIds.includes(p.id));

        const tdees = selectedPeople.map(p => ({
            id: p.id,
            tdee: calculateIndividualTargets(p as any).energy
        }));

        const maxTDEE = Math.max(...tdees.map(t => t.tdee));

        const memberPortions: Record<string, number> = {};
        tdees.forEach(t => {
            memberPortions[t.id] = t.tdee / maxTDEE;
        });

        const totalServings = Object.values(memberPortions).reduce((sum, val) => sum + val, 0);

        return { totalServings, maxTDEE, memberPortions };
    }, [selectedMemberIds, allPeople]);

    const displayServings = manualServings ?? calculations.totalServings;
    const currentScalingFactor = React.useMemo(() => {
        if (!recipe?.servings || displayServings === 0) return 1;
        return displayServings / recipe.servings;
    }, [displayServings, recipe?.servings]);

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
    }, [recipeId]);

    const fetchRecipeDetails = async () => {
        setLoading(true);
        try {
            const recipeIdStr = String(recipeId);

            if (recipeIdStr.startsWith('local-')) {
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

                if (localRecipe.ingredients?.length > 0) {
                    const calculated = calculateRecipeNutrition(
                        localRecipe.ingredients.map((ing: any) => {
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
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', recipeId)
                    .single();

                if (recipeError) throw recipeError;

                const { data: ingData, error: ingError } = await supabase
                    .from('ingredients')
                    .select('*, food_item:food_items(*)')
                    .eq('recipe_id', recipeId);

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
                    .eq('recipe_id', recipeId)
                    .order('step_order', { ascending: true });

                if (insError) throw insError;
                setInstructions(insData || []);
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load meal details');
            if (isStandalone) {
                 router.push('/dashboard/library/meals');
            } else if (onClose) {
                 onClose();
            }
        } finally {
            setLoading(false);
        }
    };

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
            energy_kj: calculated.calories * 4.184, 
            protein: calculated.protein,
            carbs: calculated.carbs,
            fat: calculated.fat,
            micronutrients: calculated.micronutrients
        }) : null);

        const weight = activeIngredients.reduce((sum, ing) => sum + (ing.weight_g || 0), 0);
        setTotalWeight(weight);

    }, [ingredients, hiddenIngredientIds]);

    useEffect(() => {
        if (currentUserId && originalIngredients.length > 0) {
            const savedData = localStorage.getItem(`recipe_customization_${currentUserId}_${recipeId}`);
            if (savedData) {
                try {
                    const savedIngredients = JSON.parse(savedData);
                    const mergedIngredients = savedIngredients.map((savedIng: Ingredient) => {
                        const original = originalIngredients.find(o => o.id === savedIng.id);
                        return original ? { ...original, ...savedIng } : savedIng;
                    });
                    setIngredients(mergedIngredients);
                } catch (e) {
                    console.error("Failed to parse saved ingredient customization", e);
                    setIngredients(originalIngredients);
                }
            } else {
                setIngredients(originalIngredients);
            }
        } else if (originalIngredients.length > 0 && !currentUserId) {
            setIngredients(originalIngredients);
        }
    }, [currentUserId, originalIngredients, recipeId]);

    const saveCustomization = (newIngs: Ingredient[]) => {
        if (currentUserId) {
            localStorage.setItem(`recipe_customization_${currentUserId}_${recipeId}`, JSON.stringify(newIngs));
        }
    };

    const toggleFavorite = async () => {
        if (!recipe) return;
        const newStatus = !recipe.is_favorite;
        try {
            if (!String(recipe.id).startsWith('local-')) {
                const { error } = await supabase
                    .from('recipes')
                    .update({ is_favorite: newStatus } as any)
                    .eq('id', recipe.id);
                if (error) throw error;
            }
            setRecipe({ ...recipe, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to favourites' : 'Removed from favourites');
        } catch (error: any) {
            toast.error('Failed to update favourite status');
        }
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
            indigo: { bg: "bg-card border-border", text: "text-indigo-600 dark:text-indigo-400", border: "border-border", itemBorder: "border-indigo-500/20" },
            rose: { bg: "bg-card border-border", text: "text-rose-600 dark:text-rose-400", border: "border-border", itemBorder: "border-rose-500/20" },
            orange: { bg: "bg-card border-border", text: "text-orange-600 dark:text-orange-400", border: "border-border", itemBorder: "border-orange-500/20" },
            emerald: { bg: "bg-card border-border", text: "text-emerald-600 dark:text-emerald-400", border: "border-border", itemBorder: "border-emerald-500/20" },
            blue: { bg: "bg-card border-border", text: "text-blue-600 dark:text-blue-400", border: "border-border", itemBorder: "border-blue-500/20" },
            amber: { bg: "bg-card border-border", text: "text-amber-600 dark:text-amber-400", border: "border-border", itemBorder: "border-amber-500/20" }
        };
        const t = (themes as any)[theme] || themes.indigo;

        return (
            <div className={cn("p-6 pt-5 rounded-3xl border mb-6", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                {subtitle && <p className={cn("text-[9px] text-muted-foreground mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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
                            <div key={label} onClick={() => router.push(`/dashboard/widgets/nutridex/${encodeURIComponent(label)}`)} className={cn("p-4 rounded-2xl border bg-card cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <p className={cn(
                                    "text-[9px] font-black truncate mb-1 whitespace-nowrap overflow-hidden transition-colors",
                                    title === 'Biological Ratios' ? 'text-muted-foreground' : 'uppercase text-foreground/60'
                                )}>
                                    {label}
                                </p>
                                <div className="space-y-0.5">
                                    {(nutrientDisplayMode === 'percentage' && !forceRaw) ? (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground">
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
                                                <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
                                                    Target: {Math.round(rda)}{unitStr}
                                                </p>
                                            )}
                                            {ratioTarget && (
                                                <p className="text-[9px] font-bold text-muted-foreground mt-0.5">
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
                if (isStandalone) {
                     router.push('/dashboard/library/meals');
                } else if (onClose) {
                    onClose();
                }
            } catch (error) {
                toast.error("Failed to delete recipe");
            }
        }
    };

    const handleEdit = () => {
        if (!recipe) return;
        // Edit functionality still routes to the standalone edit page as it's complex
        router.push(`/dashboard/library/meals/new?edit=${recipe.id}`);
    };

    // If it's embedded, provide a close button. If standalone, we don't need one.
    const containerClasses = isStandalone
        ? "space-y-8 pb-20 animate-in fade-in duration-700" 
        : "h-full w-full overflow-y-auto custom-scrollbar p-6 space-y-8 pb-24 relative bg-slate-50/50 dark:bg-slate-900/50";

    return (
        <div className={containerClasses}>
            {/* Embedded Close Button */}
            {!isStandalone && onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md z-50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            )}

            {loading ? (
                <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="animate-pulse text-emerald-500" size={32} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipe...</p>
                </div>
            ) : !recipe ? (
                <div className="h-full flex items-center justify-center text-slate-400">Recipe not found</div>
            ) : (
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="space-y-3 pt-4">
                        <h1 className="text-xl font-black tracking-tighter uppercase italic leading-tight mb-3 text-center">
                            <span className="text-emerald-500">{recipe.title}</span>
                        </h1>

                        <div className="flex flex-col lg:flex-row items-center gap-4">
                            <div className="w-24 h-24 shrink-0 mx-auto lg:mx-0">
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

                            <div className="flex-1 flex flex-col gap-2 w-full">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-1.5">
                                    {[
                                        { key: 'recipe' as const, label: 'Recipe', icon: Layers, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                                        { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                                        { key: 'related' as const, label: 'Related', icon: UtensilsCrossed, color: 'text-amber-500', activeBg: 'bg-amber-500/10 border-amber-500/30' },
                                        { key: 'management' as const, label: 'Options', icon: ShoppingBasket, color: 'text-blue-500', activeBg: 'bg-blue-500/10 border-blue-500/30' },
                                    ].map(({ key, label, icon: Icon, color, activeBg }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveSection(prev => prev === key ? null : key)}
                                            className={cn(
                                                'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all justify-center lg:justify-start',
                                                activeSection === key
                                                    ? `${activeBg} ${color}`
                                                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                            )}
                                        >
                                            <Icon size={11} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    {activeSection === 'recipe' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-emerald-500/50" />
                                    <span className="text-sm font-black italic text-slate-900 dark:text-white">{recipe.prep_time}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">min</span>
                                </div>

                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-black italic text-slate-900 dark:text-white min-w-[20px] text-center">{Number(displayServings.toFixed(1))}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">serving{displayServings !== 1 ? 's' : ''}</span>
                                    <button
                                        onClick={() => setManualServings(prev => (prev ?? calculations.totalServings) + 1)}
                                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
                                    >
                                        <Plus size={12} />
                                    </button>
                                    <button
                                        onClick={() => setManualServings(prev => Math.max(1, (prev ?? calculations.totalServings) - 1))}
                                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
                                    >
                                        <Minus size={12} />
                                    </button>
                                </div>

                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

                                <span className="text-sm font-black italic text-emerald-500">{totalWeight.toFixed(0)}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 -ml-2.5">g</span>
                            </div>

                            <Card className="p-5 lg:p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Layers className="text-emerald-500" size={20} />
                                        <h2 className="text-lg font-black uppercase tracking-wider">Ingredients</h2>
                                    </div>
                                </div>

                                {ingredients.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <p className="text-sm font-bold">No ingredients in this recipe</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {ingredients.map((ing, index) => (
                                            <div
                                                key={ing.id || index}
                                                className="flex items-center gap-4 p-4 rounded-2xl border bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-800/30"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                        {ing.item}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        {ing.food_item?.energy_kcal ? `${(ing.weight_g / 100 * ing.food_item.energy_kcal).toFixed(0)} kcal` : 'No data'}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                                        {ing.quantity ? Number(ing.quantity.toFixed(2)) : ing.weight_g}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                        {ing.measure_label || 'g'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {instructions.length > 0 && (
                                <Card className="p-5 lg:p-8 space-y-6">
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
                    )}

                    {activeSection === 'nutrition' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <NutrientGrid title="Macronutrients" icon={Activity} theme="orange" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                                'Energy': ['Energy', 'energy_kcal', 'Calories', 'calories'],
                                'Protein': ['Protein', 'protein_g', 'protein'],
                                'Carbs': ['Carbohydrates', 'carbs_g', 'carbs'],
                                'Fat': ['Fat', 'fat_g', 'fat']
                            }} />

                            <NutrientGrid title="Electrolytes" icon={Activity} theme="indigo" items={{
                                'Sodium': ['Sodium', 'sodium_mg'],
                                'Potassium': ['Potassium', 'potassium_mg'],
                                'Magnesium': ['Magnesium', 'magnesium_mg'],
                                'Calcium': ['Calcium', 'calcium_mg'],
                                'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                            }} />

                            {showAdvancedNutrition && (
                                <>
                                    <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" items={{
                                        'Iron': ['Iron', 'iron_mg'],
                                        'Zinc': ['Zinc', 'zinc_mg'],
                                        'Copper': ['Copper', 'copper_mg'],
                                        'Manganese': ['Manganese', 'manganese_mg'],
                                        'Selenium': ['Selenium', 'selenium_ug']
                                    }} />

                                    <NutrientGrid title="Vitamins" icon={Droplet} theme="blue" items={{
                                        'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                        'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                        'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                        'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                    }} />
                                </>
                            )}

                             <button
                                onClick={() => setShowAdvancedNutrition(prev => !prev)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/50 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <Dna size={14} />
                                {showAdvancedNutrition ? 'Hide' : 'Show'} Advanced Bio-Markers
                                {showAdvancedNutrition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    )}
                    
                    {activeSection === 'related' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                             {relatedRecipes.length > 0 ? (
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
                            ) : (
                                <p className="text-sm text-slate-400 font-bold py-6 text-center">No related meals found.</p>
                            )}
                         </div>
                    )}

                    {activeSection === 'management' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <button
                                onClick={toggleFavorite}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group text-left',
                                    recipe.is_favorite
                                        ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/60 dark:hover:bg-amber-900/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/30'
                                )}
                            >
                                <div className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg',
                                    recipe.is_favorite ? 'bg-amber-400 shadow-amber-400/20' : 'bg-slate-200 dark:bg-slate-700 shadow-slate-200/20'
                                )}>
                                    <Star size={16} className={recipe.is_favorite ? 'text-white fill-white' : 'text-slate-500 dark:text-slate-300'} />
                                </div>
                                <div className="flex-1">
                                    <p className={cn('text-xs font-black uppercase tracking-[0.15em]', recipe.is_favorite ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300')}>
                                        {recipe.is_favorite ? 'Remove from Favourites' : 'Add to Favourites'}
                                    </p>
                                </div>
                            </button>

                            {(isAdmin || recipe.user_id === currentUserId || String(recipe.id).startsWith('local-')) && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group text-left"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                            <Pencil size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors">Edit</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group text-left"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                                            <Trash2 size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 group-hover:text-rose-500 transition-colors">Delete</p>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
