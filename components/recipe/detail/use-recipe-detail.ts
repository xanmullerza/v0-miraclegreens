'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';
import { isFlavoringIngredient } from '@/lib/services/nutrition';
import { calculateAggregatedNutrition } from '@/lib/utils/nutrition-utils';
import { useSmartMatch } from '@/hooks/use-smart-match';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import type { Recipe, Ingredient, Instruction, CalculatedNutrition } from './types';

interface UseRecipeDetailOptions {
    recipeId: string;
    onBack?: () => void;
    onShare?: (recipe: any) => void;
    onRemix?: (recipe: any, ingredients: any[], instructions: any[]) => void;
}

export function useRecipeDetail({ recipeId, onBack, onShare, onRemix }: UseRecipeDetailOptions) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'recipe' | 'nutrition' | 'related' | 'management' | null>('recipe');
    const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
    const [showTagsDialog, setShowTagsDialog] = useState(false);

    const smartMatch = useSmartMatch();
    const [matchedIngredients, setMatchedIngredients] = useState<Record<string, any>>({});
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
    const [skippedIngredients, setSkippedIngredients] = useState<Record<string, boolean>>({});
    const [acceptedMatches, setAcceptedMatches] = useState<Record<string, boolean>>({});

    // USDA Phase 2 State
    const [usdaResults, setUsdaResults] = useState<Record<string, any[]>>({});
    const [usdaLoading, setUsdaLoading] = useState<Record<string, boolean>>({});
    const [usdaExpanded, setUsdaExpanded] = useState<Record<string, boolean>>({});

    const [portionConflicts, setPortionConflicts] = useState<Record<string, { quantity: number, measure_label: string, itemToAccept: any, isSaving?: boolean }>>({});
    const [customPortions, setCustomPortions] = useState<Record<string, string>>({});
    
    // Phase 4: Two-Step Workflow
    const [mappingStep, setMappingStep] = useState<'FOOD_MATCH' | 'PORTION_MATCH'>('FOOD_MATCH');
    
    // Step 2 State
    const [stepTwoInputs, setStepTwoInputs] = useState<Record<string, { multiplier: string, measure: string, isSaving?: boolean }>>({});
    const [stepTwoSaved, setStepTwoSaved] = useState<Record<string, boolean>>({});

    const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    
    // Nutrition Display Mode
    const [nutritionViewMode, setNutritionViewMode] = useState<'per-serving' | 'total'>('per-serving');
    
    // Threshold state for minerals/vitamins
    const [mineralThreshold, setMineralThreshold] = useState<50 | 75 | 100>(75);
    const [waterSolubleThreshold, setWaterSolubleThreshold] = useState<50 | 75 | 100>(75);
    const [storedVitaminThreshold, setStoredVitaminThreshold] = useState<50 | 75 | 100>(75);

    // User preferences and RDA
    const { profile, nutrientDisplayMode, energyUnit } = useUserPreferences();
    const userRDAs = useRDA(profile?.age ? Number(profile.age) : undefined, profile?.gender, 2000);
    const { setIsActionPanelOpen, setActiveView, setRecipeToRemix, setRecipeToShare, navigateTo } = useActionPanel();
    const { user } = useDataPersistence();
    const [smartMatchRunning, setSmartMatchRunning] = useState(false);
    const isOwner = user && recipe && (recipe as any).user_id === user.id;

    const handleEditClick = () => {
        if (!recipe) return;
        const isEdit = isOwner;

        if (onRemix) {
            onRemix(recipe, ingredients, instructions);
        } else {
            setRecipeToRemix({ recipe, ingredients, instructions, isEdit });
            setActiveView('recipe-builder');
            setIsActionPanelOpen(true);
            toast.info(isEdit ? 'Opening recipe editor...' : 'Remixing recipe...');
        }
    };

    useEffect(() => {
        fetchRecipeDetails();
    }, [recipeId]);

    // Auto-transition to Step 2 once all ingredients are decided
    useEffect(() => {
        if (mappingStep === 'FOOD_MATCH' && ingredients.length > 0 && ingredients.every(i => acceptedMatches[i.id] || skippedIngredients[i.id])) {
            setMappingStep('PORTION_MATCH');
        }
    }, [ingredients, acceptedMatches, skippedIngredients, mappingStep]);

    const fetchRecipeDetails = async () => {
        try {
            setLoading(true);

            if (String(recipeId).startsWith('local-')) {
                const localData = localStorage.getItem('local_recipes');
                if (localData) {
                    const localRecipes: any[] = JSON.parse(localData);
                    const localRecipe = localRecipes.find(r => r.id === recipeId);
                    
                    if (localRecipe) {
                        setRecipe({
                            ...localRecipe,
                            difficulty: localRecipe.difficulty || 'Medium',
                            tags: localRecipe.tags || []
                        });
                        setIngredients(localRecipe.ingredients || []);
                        setInstructions(localRecipe.instructions || []);
                        
                        if (localRecipe.ingredients && localRecipe.ingredients.length > 0) {
                            const initialMatches: Record<string, any> = {};
                            const initialAccepted: Record<string, boolean> = {};
                            const initialStepTwoSaved: Record<string, boolean> = {};
                            
                            localRecipe.ingredients.forEach((ing: any) => {
                                if (ing.food_items || ing.food_item) {
                                    initialMatches[ing.id] = ing.food_items || ing.food_item;
                                    initialAccepted[ing.id] = true;
                                    if (ing.weight_g && ing.weight_g > 0) {
                                        initialStepTwoSaved[ing.id] = true;
                                    }
                                }
                            });
                            
                            setMatchedIngredients(initialMatches);
                            setAcceptedMatches(initialAccepted);
                            setStepTwoSaved(initialStepTwoSaved);
                        }
                    } else {
                        throw new Error('Local recipe not found');
                    }
                } else {
                    throw new Error('No local recipes found');
                }
            } else {
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', recipeId)
                    .single();

                if (recipeError) throw recipeError;

                const { data: ingredientsData, error: ingredientsError } = await supabase
                    .from('ingredients')
                    .select('*, food_items(*)')
                    .eq('recipe_id', recipeId)
                    .order('id', { ascending: true });

                if (ingredientsError) throw ingredientsError;
                setIngredients(ingredientsData || []);

                if (ingredientsData && ingredientsData.length > 0) {
                    const initialMatches: Record<string, any> = {};
                    const initialAccepted: Record<string, boolean> = {};
                    const initialStepTwoSaved: Record<string, boolean> = {};
                    
                    ingredientsData.forEach((ing) => {
                        if (ing.food_items) {
                            initialMatches[ing.id] = ing.food_items;
                            initialAccepted[ing.id] = true;
                            if (ing.weight_g && ing.weight_g > 0) {
                                initialStepTwoSaved[ing.id] = true;
                            }
                        }
                    });
                    
                    setMatchedIngredients(initialMatches);
                    setAcceptedMatches(initialAccepted);
                    setStepTwoSaved(initialStepTwoSaved);
                }

                let aggregatedPhytos: Record<string, string> = {};
                if (ingredientsData && ingredientsData.length > 0) {
                    ingredientsData.forEach((ing) => {
                        const foodPhytos = ing.food_items?.phytonutrients;
                        if (foodPhytos && typeof foodPhytos === 'object') {
                            aggregatedPhytos = { ...aggregatedPhytos, ...foodPhytos };
                        }
                    });
                }

                if (recipeData) {
                    setRecipe({
                        ...recipeData,
                        difficulty: recipeData.difficulty || 'Medium',
                        tags: recipeData.tags || [],
                        phytonutrients: aggregatedPhytos
                    });
                }

                const { data: instructionsData, error: instructionsError } = await supabase
                    .from('instructions')
                    .select('*')
                    .eq('recipe_id', recipeId)
                    .order('step_order', { ascending: true });

                if (instructionsError) throw instructionsError;
                setInstructions(instructionsData || []);
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load recipe details');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!recipe) return;
        const newStatus = !recipe.is_favorite;
        try {
            if (!String(recipe.id).startsWith('local-')) {
                const { error } = await supabase
                    .from('recipes')
                    .update({ is_favorite: newStatus })
                    .eq('id', recipe.id);
                if (error) throw error;
            }
            setRecipe({ ...recipe, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to favourites' : 'Removed from favourites');
        } catch (error: any) {
            toast.error('Failed to update favourite status');
        }
    };

    // Fetch related recipes
    useEffect(() => {
        const fetchRelated = async () => {
            if (!ingredients || ingredients.length === 0) return;

            setLoadingRelated(true);
            try {
                const foodIds = ingredients
                    .map(ing => ing.food_item_id)
                    .filter((id): id is string => !!id && !id.startsWith('raw-'));

                const ingredientNames = ingredients
                    .map(ing => (ing.base_ingredient || ing.item || '').toLowerCase().trim())
                    .filter(name => name.length > 3);

                if (foodIds.length === 0 && ingredientNames.length === 0) {
                    setRelatedRecipes([]);
                    return;
                }

                let overlapDetails: any[] = [];

                if (foodIds.length > 0) {
                    const { data: idMatches } = await supabase
                        .from('ingredients')
                        .select('recipe_id, food_item_id, item, base_ingredient')
                        .in('food_item_id', foodIds)
                        .neq('recipe_id', recipeId)
                        .limit(100);
                    
                    if (idMatches) overlapDetails = [...idMatches];
                }

                if (ingredientNames.length > 0) {
                    const filteredNames = ingredientNames
                        .filter(n => !['salt', 'pepper', 'water', 'oil', 'sugar'].includes(n))
                        .slice(0, 10);

                    if (filteredNames.length > 0) {
                        const { data: nameMatches } = await supabase
                            .from('ingredients')
                            .select('recipe_id, food_item_id, item, base_ingredient')
                            .in('base_ingredient', filteredNames)
                            .neq('recipe_id', recipeId)
                            .limit(100);
                        
                        if (nameMatches) {
                            nameMatches.forEach(nm => {
                                if (!overlapDetails.some(od => od.recipe_id === nm.recipe_id && (od.food_item_id === nm.food_item_id || od.base_ingredient === nm.base_ingredient))) {
                                    overlapDetails.push(nm);
                                }
                            });
                        }
                    }
                }

                const overlapCounts: Record<string, number> = {};
                const sharedItemsMap: Record<string, string[]> = {};

                overlapDetails.forEach(i => {
                    overlapCounts[i.recipe_id] = (overlapCounts[i.recipe_id] || 0) + 1;
                    const itemName = i.base_ingredient || i.item || 'Unknown';
                    if (!sharedItemsMap[i.recipe_id]) sharedItemsMap[i.recipe_id] = [];
                    if (!sharedItemsMap[i.recipe_id].includes(itemName)) {
                        sharedItemsMap[i.recipe_id].push(itemName);
                    }
                });

                const minThreshold = 1;
                const recipeIds = Object.keys(overlapCounts).filter(id => overlapCounts[id] >= minThreshold);

                if (recipeIds.length === 0) {
                    setRelatedRecipes([]);
                    return;
                }

                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, title, image, type, diet, prep_time, calories')
                    .in('id', recipeIds)
                    .limit(12);

                if (recipeError) throw recipeError;

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
        fetchRelated();
    }, [ingredients, recipeId]);

    const processAcceptIngredient = (ing: Ingredient, matchedItem: any) => {
        if (isFlavoringIngredient({ name: ing.base_ingredient || ing.item } as any)) {
            toast.warning(`Tip: "${ing.base_ingredient || ing.item}" is a flavoring and won't significantly impact nutrition calculations.`, { duration: 2000 });
        }
        setMatchedIngredients(prev => ({ ...prev, [ing.id]: matchedItem }));
        setAcceptedMatches(prev => ({ ...prev, [ing.id]: true }));
        setFlippedCards(prev => ({ ...prev, [ing.id]: false }));
    };

    const runSmartMatch = async () => {
        const result = await smartMatch.runMatch(ingredients);
        if (result?.skippedFlavorings && result.skippedFlavorings.length > 0) {
            result.skippedFlavorings.forEach(f => {
                const ing = ingredients.find(i => (i.base_ingredient || i.item) === f);
                if (ing) setSkippedIngredients(prev => ({ ...prev, [ing.id]: true }));
            });
        }
    };

    const finalizeRecipeNutrition = async () => {
        if (!recipe) return;
        
        const allSaved = ingredients.every(ing => stepTwoSaved[ing.id] || skippedIngredients[ing.id]);
        if (!allSaved) {
            toast.error("Please accept/save all ingredient portions before finalizing.");
            return;
        }

        setSmartMatchRunning(true);
        const loadingToastId = toast.loading("Calculating total recipe nutrition...");

        try {
            const { data: updatedIngs, error: fetchErr } = await supabase
                .from('ingredients')
                .select('*, food_items(*)')
                .eq('recipe_id', recipeId);

            if (fetchErr) throw fetchErr;

            const nutrition = calculateAggregatedNutrition(updatedIngs || []);
            
            const servings = recipe?.servings || 1;
            const finalCals = Math.round(nutrition.calories);
            const finalCarbs = Math.round((nutrition.carbs) * 10) / 10;
            const finalFat = Math.round((nutrition.fat) * 10) / 10;
            const finalProtein = Math.round((nutrition.protein) * 10) / 10;
            const finalKj = Math.round(nutrition.energyKj);
            
            const finalMicros = Object.fromEntries(
                Object.entries(nutrition.micronutrients || {}).map(([key, val]) => [key, val])
            );

            const { error: updateError } = await supabase
                .from('recipes')
                .update({
                    calories: finalCals,
                    energy_kj: finalKj,
                    carbs: finalCarbs,
                    fat: finalFat,
                    protein: finalProtein,
                    micronutrients: finalMicros
                })
                .eq('id', recipeId);

            if (updateError) throw updateError;

            toast.success("Recipe nutrition analyzed and saved!", { id: loadingToastId });
            
            await fetchRecipeDetails();
            setActiveSection('nutrition');
            setMappingStep('FOOD_MATCH');
            
        } catch (err: any) {
            console.error("Finalize error:", err);
            toast.error(err.message || "Failed to finalize recipe nutrition", { id: loadingToastId });
        } finally {
            setSmartMatchRunning(false);
        }
    };

    const totalWeight = ingredients.reduce((sum, ing) => sum + (ing.weight_g || 0), 0);

    // Helper to flexibly find nutrient keys
    const findNutrientMatch = (record: Record<string, any>, key: string): string | null => {
        const mKeys = Object.keys(record);
        const kL = key.toLowerCase();
        const exact = mKeys.find(mk => mk.toLowerCase() === kL);
        if (exact) return exact;
        
        if (kL.includes('vitamin')) {
            const vMatch = mKeys.find(mk => mk.toLowerCase().includes('vitamin'));
            if (vMatch) return vMatch;
            const letter = kL.match(/\b([a-z])\b/)?.[1]?.toUpperCase();
            if (letter) {
                const letterMatch = mKeys.find(mk => {
                    const mkL = mk.toLowerCase();
                    return mkL.includes('vitamin') && new RegExp(`\\b${letter}\\b`, 'i').test(mkL);
                });
                if (letterMatch) return letterMatch;
            }
        }
        
        const firstWord = kL.split(' ')[0];
        if (firstWord.length > 3) {
            const partialMatch = mKeys.find(mk => mk.toLowerCase().startsWith(firstWord));
            if (partialMatch) return partialMatch;
        }
        
        return null;
    };

    // Calculate nutrition from current ingredients
    const calculatedNutrition: CalculatedNutrition = ingredients.length > 0 
        ? calculateAggregatedNutrition(ingredients) 
        : { calories: 0, energyKj: 0, protein: 0, carbs: 0, fat: 0, micronutrients: {}, phytonutrients: {} };

    return {
        recipe,
        setRecipe,
        ingredients,
        setIngredients,
        instructions,
        loading,
        isOwner: !!isOwner,
        
        activeSection,
        setActiveSection,
        
        calculatedNutrition,
        nutritionViewMode,
        setNutritionViewMode,
        totalWeight,
        
        mineralThreshold,
        setMineralThreshold,
        waterSolubleThreshold,
        setWaterSolubleThreshold,
        storedVitaminThreshold,
        setStoredVitaminThreshold,
        
        matchedIngredients,
        setMatchedIngredients,
        flippedCards,
        setFlippedCards,
        skippedIngredients,
        setSkippedIngredients,
        acceptedMatches,
        setAcceptedMatches,
        mappingStep,
        setMappingStep,
        stepTwoInputs,
        setStepTwoInputs,
        stepTwoSaved,
        setStepTwoSaved,
        smartMatchRunning,
        
        usdaResults,
        setUsdaResults,
        usdaLoading,
        setUsdaLoading,
        usdaExpanded,
        setUsdaExpanded,
        
        relatedRecipes,
        loadingRelated,
        
        showTagsDialog,
        setShowTagsDialog,
        
        toggleFavorite,
        runSmartMatch,
        finalizeRecipeNutrition,
        processAcceptIngredient,
        handleEditClick,
        fetchRecipeDetails,
        
        findNutrientMatch,
        
        energyUnit,
        nutrientDisplayMode,
        userRDAs,
        profile,
        
        // Smart match instance (for picker modal)
        smartMatch,
        
        onBack,
        onShare,
        onRemix,
        
        // Chatbot context forwarding
        setRecipeToShare,
        navigateTo,
    };
}
