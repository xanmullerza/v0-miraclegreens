import { supabase } from '../supabase';
import { Recipe, DietType } from '../data/recipes';
import { scaleIngredient } from './recipe-scaling';
import { inferEquipmentFromRecipe } from './equipment-inference';

interface PlanSettings {
    targetCalories: number;
    diet: DietType;
    numMeals: number; // 3 or 4 or 5 (3 meals + 0/1/2 snacks)
    favoritesOnly?: boolean;
    pantryItems?: any[];
    searchQuery?: string;
    selectedEquipment?: string[];
    selectedExclusions?: string[];
    selectedHealthConditions?: string[];
    showFlavours?: boolean;
    showSupplements?: boolean;
    strictPantry?: boolean;
}

export interface DailyPlan {
    breakfast: Recipe;
    lunch: Recipe;
    dinner: Recipe;
    snacks: Recipe[];
    totalCalories: number;
    totalEnergyKj: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    micronutrients: Record<string, number>;
    phytonutrients: Record<string, string>;
    // Store individual recipe micronutrients keyed by recipe ID for dynamic recalculation
    recipeMicronutrients: Record<string, Record<string, number>>;
    recipePhytonutrients: Record<string, Record<string, string>>;
}

/**
 * Randomly select an item from an array.
 */
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Helper function to calculate nutrition including micronutrients
 */
const calculateNutrition = (ingredients: any[]) => {
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalEnergyKj = 0;
    const micronutrients: Record<string, number> = {};
    const phytonutrients: Record<string, string> = {};

    const result = {
        get calories() { return totalCalories; },
        get energyKj() { return totalEnergyKj; },
        get protein() { return totalProtein; },
        get carbs() { return totalCarbs; },
        get fat() { return totalFat; },
        micronutrients,
        phytonutrients
    };

    for (const ing of ingredients) {
        if (ing.food_items && ing.weight_g) {
            const foodItem = ing.food_items;
            const ratio = ing.weight_g / 100;
            totalCalories += (foodItem.energy_kcal || 0) * ratio;
            totalEnergyKj += (foodItem.energy_kj || 0) * ratio;
            totalProtein += (foodItem.protein_g || 0) * ratio;
            totalCarbs += (foodItem.carbs_g || 0) * ratio;
            totalFat += (foodItem.fat_g || 0) * ratio;

            // Aggregate micronutrients
            if (foodItem.micronutrients && typeof foodItem.micronutrients === 'object') {
                Object.entries(foodItem.micronutrients).forEach(([key, val]) => {
                    if (typeof val === 'number') {
                        micronutrients[key] = (micronutrients[key] || 0) + val * ratio;
                    }
                });
            }

            // Aggregate phytonutrients
            if (foodItem.phytonutrients && typeof foodItem.phytonutrients === 'object') {
                Object.entries(foodItem.phytonutrients).forEach(([key, val]) => {
                    const phytos = result.phytonutrients as Record<string, string>;
                    phytos[key] = val as string;
                });
            }
        }
    }
    return result;
};

/**
 * Get a random recipe of a specific type (for individual meal regeneration).
 * Optionally exclude a specific recipe ID to ensure variety.
 * Returns both the recipe and its calculated micronutrients.
 */
export const getRandomRecipeByType = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    diet: DietType,
    excludeId?: string,
    favoritesOnly?: boolean,
    searchQuery?: string,
    options: {
        equipment?: string[],
        exclusions?: string[],
        healthConditions?: string[],
        showFlavours?: boolean,
        showSupplements?: boolean
    } = {}
): Promise<{ recipe: Recipe; micronutrients: Record<string, number> } | null> => {
    let query = supabase
        .from('recipes')
        .select(`
            *,
            ingredients (
                *,
                food_items (*)
            ),
            instructions (*)
        `)
        .eq('type', mealType);

    if (favoritesOnly) {
        query = query.eq('is_favorite', true);
    }

    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data: recipesData, error } = await query;

    if (error || !recipesData || recipesData.length === 0) {
        return null;
    }

    // Transform and filter
    const recipesWithMicro: { recipe: Recipe; micronutrients: Record<string, number> }[] = recipesData
        .filter((r: any) => {
            // 1. Diet Filter
            if (diet === 'anything') return true;
            if (diet === 'pescatarian') {
                return r.diet.includes('pescatarian') || r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            if (diet === 'vegetarian') {
                return r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            return r.diet.includes(diet);
        })
        .filter((r: any) => {
            // 2. Health Conditions Filter
            if (options.healthConditions && options.healthConditions.length > 0) {
                return options.healthConditions.some(hc => 
                    r.diet.map((d: string) => d.toLowerCase()).includes(hc.toLowerCase())
                );
            }
            return true;
        })
        .filter((r: any) => {
            // 3. Exclusions Filter (Ingredient names + Recipe Title/Type)
            if (options.exclusions && options.exclusions.length > 0) {
                const title = (r.title || '').toLowerCase();
                const type = (r.type || '').toLowerCase();
                
                // If title or type contains excluded word, reject immediately
                const hasExcludedTitle = options.exclusions.some(exc => 
                    title.includes(exc.toLowerCase()) || type.includes(exc.toLowerCase())
                );
                if (hasExcludedTitle) return false;

                // Check ingredients
                return !r.ingredients.some((ing: any) => {
                    const category = ing.food_items?.category?.toLowerCase() || '';
                    if (!options.showFlavours && category === 'flavour') return false;
                    if (!options.showSupplements && category === 'supplements') return false;

                    const name = (ing.item || '').toLowerCase();
                    return options.exclusions?.some(exc => name.includes(exc.toLowerCase()));
                });
            }
            return true;
        })
        .filter((r: any) => {
            // 4. Equipment Filter
            if (options.equipment && options.equipment.length > 0) {
                const inferred = inferEquipmentFromRecipe(
                    r.ingredients.map((ing: any) => ({
                        food_item_name: ing.item,
                        modifier: ing.modifier,
                        cooking_state: ing.cooking_state
                    })),
                    r.instructions.map((i: any) => i.step_text)
                );
                
                // If recipe requires something NOT in user's equipment, reject
                return inferred.every(e => options.equipment?.includes(e));
            }
            return true;
        })
        .filter((r: any) => r.id !== excludeId) // Exclude current recipe
        .map((r: any) => {
            const calculatedNutrition = calculateNutrition(r.ingredients);

            return {
                recipe: {
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    calories: calculatedNutrition.calories || r.calories || 0,
                    energyKj: calculatedNutrition.energyKj || r.energy_kj || 0,
                    protein: calculatedNutrition.protein || r.protein || 0,
                    carbs: calculatedNutrition.carbs || r.carbs || 0,
                    fat: calculatedNutrition.fat || r.fat || 0,
                    diet: r.diet,
                    image: r.image,
                    prepTime: r.prep_time,
                    ingredients: r.ingredients.map((i: any) => ({
                        item: i.item,
                        amount: i.amount,
                        isMiracleProduct: i.is_miracle_product,
                        baseIngredient: i.base_ingredient,
                        food_item_id: i.food_item_id,
                        weightG: i.weight_g,
                        measureLabel: i.measure_label,
                        category: i.food_items?.category?.toLowerCase() || ''
                    })),
                    instructions: r.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text),
                    servings: r.servings || 1,
                    originalServings: r.servings || 1,
                    micronutrients: calculatedNutrition.micronutrients,
                    phytonutrients: calculatedNutrition.phytonutrients
                },
                micronutrients: calculatedNutrition.micronutrients
            };
        });

    if (recipesWithMicro.length === 0) return null;
    return getRandom(recipesWithMicro);
};

/**
 * Generates a single day meal plan trying to hit the calorie target.
 * Now Async to fetch from Supabase.
 */
export const generateDailyPlan = async (settings: PlanSettings): Promise<DailyPlan> => {
    const { 
        favoritesOnly, 
        targetCalories, 
        diet, 
        numMeals, 
        selectedEquipment, 
        selectedExclusions, 
        selectedHealthConditions,
        showFlavours = false,
        showSupplements = false,
        strictPantry = false
    } = settings;

    // Fetch recipes from Supabase
    let query = supabase
        .from('recipes')
        .select(`
            *,
            ingredients (
                *,
                food_items (*)
            ),
            instructions (*)
        `);

    if (favoritesOnly) {
        query = query.eq('is_favorite', true);
    }

    if (settings.searchQuery) {
        query = query.ilike('title', `%${settings.searchQuery}%`);
    }

    const { data: recipesData, error } = await query;

    if (error || !recipesData) {
        console.error('Error fetching recipes:', error);
        throw new Error('Failed to fetch recipes');
    }

    // Transform Supabase data to match Recipe interface
    const recipeMicronutrients: Record<string, Record<string, number>> = {};
    const recipePhytonutrients: Record<string, Record<string, string>> = {};

    const allRecipes: Recipe[] = recipesData
        .filter((r: any) => {
            // 1. Diet Filter
            if (diet === 'anything') return true;
            if (diet === 'pescatarian') {
                return r.diet.includes('pescatarian') || r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            if (diet === 'vegetarian') {
                return r.diet.includes('vegetarian') || r.diet.includes('vegan');
            }
            return r.diet.includes(diet);
        })
        .filter((r: any) => {
            // 2. Health Conditions Filter
            if (selectedHealthConditions && selectedHealthConditions.length > 0) {
                return selectedHealthConditions.some(hc => 
                    r.diet.map((d: string) => d.toLowerCase()).includes(hc.toLowerCase())
                );
            }
            return true;
        })
        .filter((r: any) => {
            // 3. Exclusions Filter (Ingredient names + Recipe Title/Type)
            if (selectedExclusions && selectedExclusions.length > 0) {
                const title = (r.title || '').toLowerCase();
                const type = (r.type || '').toLowerCase();
                
                // If title or type contains excluded word, reject immediately
                const hasExcludedTitle = selectedExclusions.some(exc => 
                    title.includes(exc.toLowerCase()) || type.includes(exc.toLowerCase())
                );
                if (hasExcludedTitle) return false;

                // Check ingredients
                return !r.ingredients.some((ing: any) => {
                    const category = ing.food_items?.category?.toLowerCase() || '';
                    if (!showFlavours && category === 'flavour') return false;
                    if (!showSupplements && category === 'supplements') return false;

                    const name = (ing.item || '').toLowerCase();
                    return selectedExclusions?.some(exc => name.includes(exc.toLowerCase()));
                });
            }
            return true;
        })
        .filter((r: any) => {
            // 4. Equipment Filter
            if (selectedEquipment && selectedEquipment.length > 0) {
                const inferred = inferEquipmentFromRecipe(
                    r.ingredients.map((ing: any) => ({
                        food_item_name: ing.item,
                        modifier: ing.modifier,
                        cooking_state: ing.cooking_state
                    })),
                    r.instructions.map((i: any) => i.step_text)
                );
                
                // If recipe requires something NOT in user's equipment, reject
                return inferred.every(e => selectedEquipment?.includes(e));
            }
            return true;
        })
        .map((r: any) => {
            const calculatedNutrition = calculateNutrition(r.ingredients);

            // Store micronutrients keyed by recipe ID
            recipeMicronutrients[r.id] = calculatedNutrition.micronutrients;
            recipePhytonutrients[r.id] = calculatedNutrition.phytonutrients;

            return {
                id: r.id,
                title: r.title,
                type: r.type,
                calories: calculatedNutrition.calories || r.calories || 0,
                energyKj: calculatedNutrition.energyKj || r.energy_kj || 0,
                protein: calculatedNutrition.protein || r.protein || 0,
                carbs: calculatedNutrition.carbs || r.carbs || 0,
                fat: calculatedNutrition.fat || r.fat || 0,
                diet: r.diet,
                image: r.image,
                prepTime: r.prep_time,
                ingredients: r.ingredients.map((i: any) => ({
                    item: i.item,
                    amount: i.amount,
                    isMiracleProduct: i.is_miracle_product,
                    baseIngredient: i.base_ingredient,
                    food_item_id: i.food_item_id,
                    weightG: i.weight_g,
                    measureLabel: i.measure_label,
                    category: i.food_items?.category?.toLowerCase() || ''
                })),
                instructions: r.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text),
                servings: r.servings || 1,
                originalServings: r.servings || 1
            };
        });

    // Get candidates
    const breakfastOpts = allRecipes.filter(r => r.type === 'breakfast');
    const lunchOpts = allRecipes.filter(r => r.type === 'lunch');
    const dinnerOpts = allRecipes.filter(r => r.type === 'dinner');
    const snackOpts = allRecipes.filter(r => r.type === 'snack');

    if (!breakfastOpts.length || !lunchOpts.length || !dinnerOpts.length) {
        throw new Error('Insufficient recipes for the selected criteria.');
    }

    const aggregateMicronutrients = (recipeIds: string[]): Record<string, number> => {
        const result: Record<string, number> = {};
        recipeIds.forEach(id => {
            const micro = recipeMicronutrients[id];
            if (micro) {
                Object.entries(micro).forEach(([key, val]) => {
                    result[key] = (result[key] || 0) + val;
                });
            }
        });
        return result;
    };

    const aggregatePhytonutrients = (recipeIds: string[]): Record<string, string> => {
        const result: Record<string, string> = {};
        recipeIds.forEach(id => {
            const phytos = recipePhytonutrients[id];
            if (phytos) {
                Object.entries(phytos).forEach(([key, val]) => {
                    result[key] = val;
                });
            }
        });
        return result;
    };

    let bestPlan: DailyPlan | null = null;
    let maxMatchScore = -1;

    // Pantry lookup for scoring
    const pantryIds = new Set(settings.pantryItems?.map(f => f.food_item_id || f.id) || []);
    const pantryNames = new Set<string>();
    settings.pantryItems?.forEach(f => {
        const names = [f.name, f.common_name].filter(Boolean);
        names.forEach(n => {
            const lcn = n.toLowerCase().trim();
            pantryNames.add(lcn);
            if (lcn.endsWith('s')) pantryNames.add(lcn.replace(/s$/, ''));
            else pantryNames.add(lcn + 's');
        });
    });

    const calculateMatchScore = (recipe: Recipe, showFlavours: boolean, showSupplements: boolean) => {
        const ings = recipe.ingredients || [];
        if (ings.length === 0) return 1.0; 
        
        let matches = 0;
        let requiredTotal = 0;

        ings.forEach(ing => {
            const category = (ing as any).category || '';
            if (!showFlavours && category === 'flavour') return;
            if (!showSupplements && category === 'supplements') return;

            requiredTotal++;

            const isMatch = (ing.food_item_id && pantryIds.has(ing.food_item_id)) ||
                (ing.baseIngredient && pantryNames.has(ing.baseIngredient.toLowerCase().trim())) ||
                (ing.item && pantryNames.has(ing.item.toLowerCase().trim()));
            if (isMatch) matches++;
        });
        
        return requiredTotal > 0 ? matches / requiredTotal : 1.0;
    };

    for (let i = 0; i < 50; i++) {
        const b = getRandom(breakfastOpts);
        const l = getRandom(lunchOpts);
        const d = getRandom(dinnerOpts);

        const snacks: Recipe[] = [];
        const numSnacks = Math.max(0, numMeals - 3);

        for (let j = 0; j < numSnacks; j++) {
            if (snackOpts.length > 0) {
                snacks.push(getRandom(snackOpts));
            }
        }

        const bMatch = calculateMatchScore(b, showFlavours, showSupplements);
        const lMatch = calculateMatchScore(l, showFlavours, showSupplements);
        const dMatch = calculateMatchScore(d, showFlavours, showSupplements);
        const sMatch = snacks.length ? snacks.reduce((acc, s) => acc + calculateMatchScore(s, showFlavours, showSupplements), 0) / snacks.length : 1.0;

        const currentPantryScore = (bMatch + lMatch + dMatch + (numSnacks > 0 ? sMatch : 0)) / (3 + (numSnacks > 0 ? 1 : 0));

        // If strict pantry is on, ALL recipes must be 100% matched
        if (strictPantry && (bMatch < 1 || lMatch < 1 || dMatch < 1 || (numSnacks > 0 && sMatch < 1))) {
            continue;
        }

        const totalCalories = b.calories + l.calories + d.calories + snacks.reduce((acc, s) => acc + s.calories, 0);
        const totalEnergyKj = (b.energyKj || 0) + (l.energyKj || 0) + (d.energyKj || 0) + snacks.reduce((acc, s) => acc + (s.energyKj || 0), 0);
        const allRecipeIds = [b.id, l.id, d.id, ...snacks.map(s => s.id)];
        const aggregatedMicro = aggregateMicronutrients(allRecipeIds);

        const planRecipeMicros: Record<string, Record<string, number>> = {};
        const planRecipePhytos: Record<string, Record<string, string>> = {};
        allRecipeIds.forEach(id => {
            planRecipeMicros[id] = recipeMicronutrients[id] || {};
            planRecipePhytos[id] = recipePhytonutrients[id] || {};
        });

        const currentPlan: DailyPlan = {
            breakfast: b,
            lunch: l,
            dinner: d,
            snacks,
            totalCalories,
            totalEnergyKj,
            macros: {
                protein: b.protein + l.protein + d.protein + snacks.reduce((acc, s) => acc + s.protein, 0),
                carbs: b.carbs + l.carbs + d.carbs + snacks.reduce((acc, s) => acc + s.carbs, 0),
                fat: b.fat + l.fat + d.fat + snacks.reduce((acc, s) => acc + s.fat, 0),
            },
            micronutrients: aggregatedMicro,
            phytonutrients: aggregatePhytonutrients(allRecipeIds),
            recipeMicronutrients: planRecipeMicros,
            recipePhytonutrients: planRecipePhytos
        };

        const diff = Math.abs(targetCalories - totalCalories);
        const calScore = 1 - Math.min(1, diff / targetCalories);

        const finalScore = settings.pantryItems ? (currentPantryScore * 0.7 + calScore * 0.3) : calScore;

        if (finalScore > maxMatchScore) {
            maxMatchScore = finalScore;
            bestPlan = currentPlan;
        }

        if (finalScore > 0.98) break;
    }

    if (!bestPlan) {
        // Fallback or retry with less strict rules if needed
        throw new Error('Could not generate a suitable plan with current filters.');
    }

    return bestPlan;
};

export interface ShoppingItem {
    name: string;
    amounts: string[];
    isMiracleProduct: boolean;
    food_item_id?: string;
    totalWeightG: number;
}

export const generateShoppingList = (plan: DailyPlan): ShoppingItem[] => {
    const getScaledIngredients = (recipe: Recipe) => {
        const factor = recipe.servings || 1;
        return recipe.ingredients.map(ing => {
            const scaledAmount = scaleIngredient(ing.amount, factor);
            const fullAmount = (ing.measureLabel && !ing.amount.toLowerCase().includes(ing.measureLabel.toLowerCase()))
                ? `${scaledAmount} ${ing.measureLabel}`
                : scaledAmount;
            return {
                ...ing,
                amount: fullAmount
            };
        });
    };

    const allIngredients = [
        ...getScaledIngredients(plan.breakfast),
        ...getScaledIngredients(plan.lunch),
        ...getScaledIngredients(plan.dinner),
        ...plan.snacks.flatMap(s => getScaledIngredients(s))
    ];

    const itemMap = new Map<string, ShoppingItem>();

    allIngredients.forEach(ing => {
        const shoppingName = ing.baseIngredient || ing.item;
        const factor = 1; // already scaled above
        const ingWeightG = (ing.weightG || 0);

        const existing = itemMap.get(shoppingName);
        if (existing) {
            existing.amounts.push(ing.amount);
            existing.totalWeightG += ingWeightG;
            // Keep the first food_item_id we find
            if (!existing.food_item_id && ing.food_item_id) {
                existing.food_item_id = ing.food_item_id;
            }
        } else {
            itemMap.set(shoppingName, {
                name: shoppingName,
                amounts: [ing.amount],
                isMiracleProduct: ing.isMiracleProduct || false,
                food_item_id: ing.food_item_id,
                totalWeightG: ingWeightG
            });
        }
    });

    return Array.from(itemMap.values()).sort((a, b) => {
        if (a.isMiracleProduct && !b.isMiracleProduct) return -1;
        if (!a.isMiracleProduct && b.isMiracleProduct) return 1;
        return a.name.localeCompare(b.name);
    });
};
