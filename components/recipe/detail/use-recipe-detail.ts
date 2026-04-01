'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useRDA } from '@/hooks/use-rda';
import { isFlavoringIngredient, searchFoodItem } from '@/lib/services/nutrition';
import { calculateAggregatedNutrition } from '@/lib/utils/nutrition-utils';
import { parseRecipeAmount, extractCoreName } from '@/lib/utils/parsing-utils';
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
    const [mappingStep, setMappingStep] = useState<'FOOD_MATCH' | 'INGREDIENT_REVIEW' | 'PORTION_MATCH'>('FOOD_MATCH');
    
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
    const { setIsActionPanelOpen, setActiveView, setRecipeToRemix, setRecipeToShare, navigateTo, setSmartMatchPicker, setSmartMatchPortion, setIngredientMatch } = useActionPanel();
    const { user } = useDataPersistence();
    const [smartMatchRunning, setSmartMatchRunning] = useState(false);
    
    // --- Smart Match Picker Handlers ---
    const handleSmartMatchPickerSelect = async (foodItem: any) => {
        if (smartMatch.queue.length === 0) return;
        const currentItem = smartMatch.queue[smartMatch.currentIdx];
        const newMatches = { ...matchedIngredients, [currentItem.ingredient.id]: foodItem };
        const newFlipped = { ...flippedCards, [currentItem.ingredient.id]: true };

        const nextIdx = smartMatch.currentIdx + 1;
        if (nextIdx < smartMatch.queue.length) {
            smartMatch.setCurrentIdx(nextIdx);
            smartMatch.setResults(smartMatch.queue[nextIdx].results);
            setMatchedIngredients(newMatches);
            setFlippedCards(newFlipped);
            toast.success(`✓ Matched "${foodItem.name}" - showing next ingredient`, { duration: 2000 });
        } else {
            setMatchedIngredients(newMatches);
            setFlippedCards(newFlipped);
            smartMatch.setShowPicker(false);
            smartMatch.reset();
            setSmartMatchPicker(null);
            toast.success(`Smart Match completed! All ${smartMatch.queue.length} ingredients matched.`, { id: 'smart-match' });
        }
    };

    const handleSmartMatchSkip = () => {
        const currentItem = smartMatch.queue[smartMatch.currentIdx];
        const newSkipped = { ...skippedIngredients, [currentItem.ingredient.id]: true };
        setSkippedIngredients(newSkipped);

        const nextIdx = smartMatch.currentIdx + 1;
        const name = currentItem.ingredient.base_ingredient || currentItem.ingredient.item;

        if (nextIdx < smartMatch.queue.length) {
            smartMatch.setCurrentIdx(nextIdx);
            smartMatch.setResults(smartMatch.queue[nextIdx].results);
            toast.info(`⊘ Skipped "${name}" - showing next ingredient`, { duration: 2000 });
        } else {
            const matchedCount = Object.keys(matchedIngredients).length;
            const skippedCount = Object.keys(newSkipped).length;
            smartMatch.setShowPicker(false);
            smartMatch.reset();
            setSmartMatchPicker(null);
            toast.success(`Smart Match completed: ${matchedCount} matched, ${skippedCount} skipped`, { id: 'smart-match', duration: 3000 });
        }
    };

    const handleSmartMatchDelete = async () => {
        const currentItem = smartMatch.queue[smartMatch.currentIdx];
        if (!currentItem) return;
        
        if (confirm(`Are you sure you want to permanently delete "${currentItem.ingredient.base_ingredient || currentItem.ingredient.item}" from this recipe?`)) {
            await deleteIngredient(currentItem.ingredient.id);
            
            // Advance queue
            const nextIdx = smartMatch.currentIdx + 1;
            if (nextIdx < smartMatch.queue.length) {
                smartMatch.setCurrentIdx(nextIdx);
                smartMatch.setResults(smartMatch.queue[nextIdx].results);
            } else {
                smartMatch.setShowPicker(false);
                smartMatch.reset();
                setSmartMatchPicker(null);
            }
        }
    };

    // Sync smart match picker state → sidebar
    useEffect(() => {
        if (smartMatch.showPicker && smartMatch.queue.length > 0) {
            const currentItem = smartMatch.queue[smartMatch.currentIdx];
            if (!currentItem) return;
            setSmartMatchPicker({
                initialSearchQuery: currentItem.ingredient.base_ingredient || currentItem.ingredient.item || '',
                initialResults: smartMatch.results,
                onSelect: handleSmartMatchPickerSelect,
                onSkip: handleSmartMatchSkip,
                onDelete: handleSmartMatchDelete,
                onClose: () => { smartMatch.reset(); setSmartMatchPicker(null); },
            });
            navigateTo('smart-match-picker');
        } else {
            // picker closed — don't clear context here, let goBack handle navigation
        }
    }, [smartMatch.showPicker, smartMatch.currentIdx, smartMatch.results]);

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

    // Initialize stepTwoInputs with original quantities when ingredients load
    useEffect(() => {
        if (ingredients.length > 0 && Object.keys(stepTwoInputs).length === 0) {
            const initialized: Record<string, { multiplier: string; measure: string }> = {};
            ingredients.forEach(ing => {
                const { quantity } = parseRecipeAmount(ing.amount, ing.item);
                initialized[ing.id] = {
                    multiplier: String(Math.round(quantity * 100) / 100),
                    measure: ''
                };
            });
            setStepTwoInputs(initialized);
        }
    }, [ingredients]);

    // Auto-transition to review once all ingredients are decided (matched or skipped)
    useEffect(() => {
        if (mappingStep === 'FOOD_MATCH' && ingredients.length > 0 && ingredients.every(i => acceptedMatches[i.id] || skippedIngredients[i.id])) {
            setMappingStep('INGREDIENT_REVIEW');
        }
    }, [ingredients, acceptedMatches, skippedIngredients, mappingStep]);

    // Auto-transition from review to portions once all ingredients are accepted
    useEffect(() => {
        if (mappingStep === 'INGREDIENT_REVIEW' && ingredients.length > 0) {
            // Only proceed if all matched ingredients have verified food items
            const allVerified = ingredients.every(ing => {
                // Skipped ingredients are OK
                if (skippedIngredients[ing.id]) return true;
                // Matched ingredients must have a food item
                return matchedIngredients[ing.id]?.id;
            });
            if (allVerified) {
                setMappingStep('PORTION_MATCH');
            }
        }
    }, [mappingStep, ingredients, matchedIngredients, skippedIngredients]);

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
                    .select('*, food_items(*, food_measures(id, label, weight_g))')
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
                            // Map food_measures to portions for compatibility with component
                            const foodItem = {
                                ...ing.food_items,
                                portions: ing.food_items?.food_measures || []
                            };
                            initialMatches[ing.id] = foodItem;
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

    const runAutoMatch = async () => {
        setSmartMatchRunning(true);
        const loadingToastId = toast.loading("Auto-matching ingredients...");
        
        try {
            const autoMatched: Record<string, any> = {};
            const unmatchable: typeof ingredients = [];
            const autoSkipped: string[] = [];

            for (const ing of ingredients) {
                const ingName = ing.base_ingredient || ing.item;
                
                // Auto-skip flavorings
                if (isFlavoringIngredient({ name: ingName } as any)) {
                    autoSkipped.push(ing.id);
                    continue;
                }

                // Search for first match
                const searchTerm = extractCoreName(ingName);
                if (!searchTerm || searchTerm.length < 2) {
                    unmatchable.push(ing);
                    continue;
                }

                const results = await searchFoodItem(searchTerm);
                
                if (results && results.length > 0) {
                    // Auto-accept first result (highest confidence)
                    autoMatched[ing.id] = results[0];
                    setAcceptedMatches(prev => ({ ...prev, [ing.id]: true }));
                } else {
                    // No match found - needs manual selection
                    unmatchable.push(ing);
                }
            }

            // Update matched ingredients
            setMatchedIngredients(prev => ({ ...prev, ...autoMatched }));

            // Mark auto-skipped flavorings
            autoSkipped.forEach(id => {
                setSkippedIngredients(prev => ({ ...prev, [id]: true }));
            });

            toast.dismiss(loadingToastId);

            // Show dialog for unmatchable items if any
            if (unmatchable.length > 0) {
                const unmatchableForDialog = unmatchable.map(ing => ({
                    id: ing.id,
                    item: ing.item,
                    base_ingredient: ing.base_ingredient,
                    amount: ing.amount
                }));

                setIngredientMatch({
                    unmatchedIngredients: unmatchableForDialog,
                    onComplete: () => {
                        setIngredientMatch(null);
                        // Transition to REVIEW step (not directly to portions)
                        setMappingStep('INGREDIENT_REVIEW');
                    },
                    onMatched: (ingId: string, foodItem: any) => {
                        setMatchedIngredients(prev => ({ ...prev, [ingId]: foodItem }));
                        setAcceptedMatches(prev => ({ ...prev, [ingId]: true }));
                    }
                });
                navigateTo('ingredient-match');
                toast.success(`Auto-matched ${Object.keys(autoMatched).length} ingredients. ${unmatchable.length} need manual selection.`, { duration: 2000 });
            } else {
                toast.success(`✓ Successfully auto-matched all ${Object.keys(autoMatched).length} ingredients!`, { id: loadingToastId });
                // No unmatchable items - proceed to review
                setMappingStep('INGREDIENT_REVIEW');
            }
        } catch (err: any) {
            console.error('Auto-match error:', err);
            toast.error('Auto-match failed');
        } finally {
            setSmartMatchRunning(false);
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

    // --- Portion Matching Handlers ---
    const handlePortionInputChange = (ingId: string, field: 'multiplier' | 'measure', value: string) => {
        setStepTwoInputs(prev => ({
            ...prev,
            [ingId]: { ...(prev[ingId] || { multiplier: '', measure: '' }), [field]: value }
        }));
    };

    const handlePortionSave = async (ingId: string) => {
        const inputs = stepTwoInputs[ingId];
        if (!inputs) return;

        if (!inputs.multiplier || isNaN(Number(inputs.multiplier))) {
            toast.error('Please enter a valid multiplier');
            return;
        }
        if (!inputs.measure) {
            toast.error('Please select a unit/measure');
            return;
        }

        setStepTwoInputs(prev => ({ ...prev, [ingId]: { ...prev[ingId], isSaving: true } }));
        try {
            let unitWeight = 0;
            if (!isNaN(Number(inputs.measure))) unitWeight = Number(inputs.measure);
            else if (['g', 'gram', 'grams'].includes(inputs.measure)) unitWeight = 1;
            else if (['oz', 'ounce', 'ounces'].includes(inputs.measure)) unitWeight = 28.3495;
            else if (['lb', 'lbs', 'pound', 'pounds'].includes(inputs.measure)) unitWeight = 453.592;
            else if (['ml', 'milliliters'].includes(inputs.measure)) unitWeight = 1;
            else throw new Error(`Cannot parse unit weight for measure: ${inputs.measure}`);

            const totalWeight = Math.round(Number(inputs.multiplier) * unitWeight * 10) / 10;
            const dbItem = matchedIngredients[ingId];

            if (!String(recipeId).startsWith('local-')) {
                const { error: ingError } = await supabase
                    .from('ingredients')
                    .update({ food_item_id: dbItem.id, weight_g: totalWeight })
                    .eq('id', ingId);

                if (ingError) throw ingError;
            }

            setIngredients(prev => prev.map(p => p.id === ingId ? { ...p, weight_g: totalWeight, food_item_id: dbItem.id } : p));
            setStepTwoSaved(prev => ({ ...prev, [ingId]: true }));
            toast.success('Saved!', { duration: 1500 });
        } catch (err: any) {
            console.error('Save step two error:', err);
            toast.error(err.message || 'Failed to save mapping');
        } finally {
            setStepTwoInputs(prev => ({ ...prev, [ingId]: { ...prev[ingId], isSaving: false } }));
        }
    };

    // Sync portion matching state → sidebar
    useEffect(() => {
        if (mappingStep === 'PORTION_MATCH' && ingredients.length > 0 && recipe) {
            setSmartMatchPortion({
                ingredients,
                matchedIngredients,
                skippedIngredients,
                stepTwoInputs,
                stepTwoSaved,
                recipe,
                onInputChange: handlePortionInputChange,
                onSave: handlePortionSave,
                onBack: () => setMappingStep('FOOD_MATCH'),
                onFinalize: finalizeRecipeNutrition,
                onSkipIngredients: (ingIds: string[]) => {
                    const newSkipped = { ...skippedIngredients };
                    ingIds.forEach(id => {
                        newSkipped[id] = true;
                    });
                    setSkippedIngredients(newSkipped);
                },
            });
            navigateTo('portion-match-picker');
        }
    }, [mappingStep, ingredients, matchedIngredients, skippedIngredients, stepTwoInputs, stepTwoSaved, recipe]);

    const deleteIngredient = async (ingredientId: string) => {
        try {
            if (!String(recipeId).startsWith('local-')) {
                const { error } = await supabase
                    .from('ingredients')
                    .delete()
                    .eq('id', ingredientId);
                if (error) throw error;
            }
            setIngredients(prev => prev.filter(i => i.id !== ingredientId));
            toast.success('Ingredient removed from recipe');
        } catch (error: any) {
            console.error('Error deleting ingredient:', error);
            toast.error('Failed to remove ingredient');
        }
    };

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
        runAutoMatch,
        finalizeRecipeNutrition,
        processAcceptIngredient,
        handleEditClick,
        fetchRecipeDetails,
        deleteIngredient,
        
        findNutrientMatch,
        
        energyUnit,
        nutrientDisplayMode,
        userRDAs,
        profile,
        
        // Smart match instance (for picker modal)
        smartMatch,
        handleSmartMatchPickerSelect,
        handleSmartMatchSkip,
        handleSmartMatchDelete,
        
        // Portion matching
        handlePortionInputChange,
        handlePortionSave,
        
        onBack,
        onShare,
        onRemix,
        
        // Chatbot context forwarding
        setRecipeToShare,
        navigateTo,
    };
}
