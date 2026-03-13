'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader2, Activity, UtensilsCrossed, ShoppingBasket, Layers, Zap, Gem, Droplet, Battery, Dna, ChevronUp, ChevronDown, Sparkles, Check, RefreshCw, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Recipe {
    id: string;
    title: string;
    image: string | null;
    type: string;
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    cook_time: number;
    servings: number;
    diet: string[];
    is_favorite: boolean;
    source?: string;
    micronutrients?: Record<string, number>;
    phytonutrients?: Record<string, string>;
}

interface Ingredient {
    id: string;
    item: string;
    amount: string;
    base_ingredient: string;
    weight_g: number;
    food_item_id?: string;
}

interface Instruction {
    step_text: string;
    step_order: number;
}

interface ChatbotRecipeDetailProps {
    recipeId: string;
    onBack: () => void;
}

export function ChatbotRecipeDetail({ recipeId, onBack }: ChatbotRecipeDetailProps) {
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'recipe' | 'nutrition' | 'related' | 'management' | null>('recipe');
    const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);

    // Smart Match State
    const [smartMatchRunning, setSmartMatchRunning] = useState(false);
    const [matchedIngredients, setMatchedIngredients] = useState<Record<string, any>>({});
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
    const [acceptedMatches, setAcceptedMatches] = useState<Record<string, boolean>>({});

    const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        fetchRecipeDetails();
    }, [recipeId]);

    const fetchRecipeDetails = async () => {
        try {
            setLoading(true);

            // Fetch recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single();

            if (recipeError) throw recipeError;

            // Fetch ingredients with full food item data
            const { data: ingredientsData, error: ingredientsError } = await supabase
                .from('ingredients')
                .select('*, food_items(*)')
                .eq('recipe_id', recipeId)
                .order('id', { ascending: true });

            if (ingredientsError) throw ingredientsError;
            setIngredients(ingredientsData || []);

            // Calculate phytonutrients from ingredients
            let aggregatedPhytos: Record<string, string> = {};
            if (ingredientsData && ingredientsData.length > 0) {
                ingredientsData.forEach((ing) => {
                    const foodPhytos = ing.food_items?.phytonutrients;
                    if (foodPhytos && typeof foodPhytos === 'object') {
                        aggregatedPhytos = { ...aggregatedPhytos, ...foodPhytos };
                    }
                });
            }

            // Set recipe with aggregated phytonutrients
            if (recipeData) {
                setRecipe({
                    ...recipeData,
                    phytonutrients: aggregatedPhytos
                });
            }

            // Fetch instructions
            const { data: instructionsData, error: instructionsError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('step_order', { ascending: true });

            if (instructionsError) throw instructionsError;
            setInstructions(instructionsData || []);
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
                // 1. Collect both Food IDs and Ingredient Names for matching
                const foodIds = ingredients
                    .map(ing => ing.food_item_id)
                    .filter((id): id is string => !!id && !id.startsWith('raw-'));

                const ingredientNames = ingredients
                    .map(ing => (ing.base_ingredient || ing.item || '').toLowerCase().trim())
                    .filter(name => name.length > 3); // Avoid very short words like "oil", "salt"

                if (foodIds.length === 0 && ingredientNames.length === 0) {
                    setRelatedRecipes([]);
                    return;
                }

                // 2. Query for matches
                let overlapDetails: any[] = [];

                // Try ID matching (reliable)
                if (foodIds.length > 0) {
                    const { data: idMatches } = await supabase
                        .from('ingredients')
                        .select('recipe_id, food_item_id, item, base_ingredient')
                        .in('food_item_id', foodIds)
                        .neq('recipe_id', recipeId)
                        .limit(100);
                    
                    if (idMatches) overlapDetails = [...idMatches];
                }

                // Try Name matching (fallback for imported/unknown items)
                if (ingredientNames.length > 0) {
                    // Only use top ingredients to avoid too many generic matches (like salt/pepper)
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
                                // Add if not already found via food_item_id
                                if (!overlapDetails.some(od => od.recipe_id === nm.recipe_id && (od.food_item_id === nm.food_item_id || od.base_ingredient === nm.base_ingredient))) {
                                    overlapDetails.push(nm);
                                }
                            });
                        }
                    }
                }

                // 3. Process counts and find recipes
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

                // Filter by minimum threshold (requested 1 for testing, ultimately 3)
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

                // 4. Sort by overlap count (descending)
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

    // --- Smart Match Logic ---
    const runSmartMatch = async () => {
        if (smartMatchRunning || ingredients.length === 0) return;
        setSmartMatchRunning(true);
        toast.loading("Analyzing ingredients with Smart Match...", { id: 'smart-match' });

        try {
            const newMatches: Record<string, any> = {};
            const newFlipped: Record<string, boolean> = {};

            // Helper to clean ingredient name - keeps food-form words (thighs, breasts, etc.)
            const extractCoreName = (name: string) => {
                let cleaned = name.toLowerCase().trim();
                
                // Remove anything in parentheses first
                cleaned = cleaned.replace(/\s*\(.*?\)/g, '').trim();
                
                // Multi-pass leading cleanup (run twice so e.g. "small bunch of" all gets stripped)
                for (let i = 0; i < 2; i++) {
                    cleaned = cleaned.replace(/^[\d\/\.\-]+\s*(x\s+)?/g, '').trim();
                    cleaned = cleaned.replace(/^(tbsp|tsp|cups?|ml|g|kg|oz|lb|liters?|bunch|handful|pinch|dash|cans?|cloves?|sprigs?|leaves?|stalks?)\s+/gi, '').trim();
                    cleaned = cleaned.replace(/^of\s+/gi, '').trim();
                    cleaned = cleaned.replace(/^(small|large|medium|big|thin|thick)\s+/gi, '').trim();
                    cleaned = cleaned.replace(/^(organic|fresh|frozen|canned|diced|chopped|sliced|minced|peeled|roasted|cooked|raw|grated|finely|roughly|thinly|rinsed|pitted|separated|skin-on|bone-in|boneless|skinless)\s*,?\s*/gi, '').trim();
                }
                
                // Remove trailing non-food descriptors (sprigs, stalks, leaves, cloves only)
                cleaned = cleaned.replace(/\s+(sprigs?|stalks?|leaves?|cloves?|bunch|bunches)\s*$/gi, '').trim();
                
                // Remove trailing prep descriptions
                cleaned = cleaned.replace(/\s+(finely|roughly|thinly|sliced|diced|chopped|minced|grated|peeled|rinsed|separated|to serve|to taste|and leaves|stalks and leaves).*$/gi, '').trim();
                
                // Handle commas: try to find the most food-like segment
                if (cleaned.includes(',')) {
                    const parts = cleaned.split(',').map(p => p.trim()).filter(p => p.length > 1);
                    const descriptorPattern = /^(skin-on|bone-in|boneless|skinless|dried|fresh|raw|cooked|chopped|diced|sliced|minced|grated|peeled|whole|ground|crushed|smoked|roasted|canned|frozen|organic|rinsed|pitted|grade|unprepared)/i;
                    const foodPart = parts.find(p => !descriptorPattern.test(p));
                    cleaned = foodPart || parts[parts.length - 1] || cleaned;
                    cleaned = cleaned.trim();
                }
                
                // Final cleanup
                cleaned = cleaned.replace(/\s+(sprigs?|stalks?|leaves?|cloves?)\s*$/gi, '').trim();
                
                return cleaned;
            };
            
            // De-pluralize: simple trailing 's' removal for search fallback
            const dePluralize = (term: string) => {
                if (term.endsWith('ies')) return term.slice(0, -3) + 'y'; // berries -> berry
                if (term.endsWith('ves')) return term.slice(0, -3) + 'f'; // leaves -> leaf
                if (term.endsWith('es') && !term.endsWith('ses')) return term.slice(0, -2); // tomatoes -> tomato
                if (term.endsWith('s') && !term.endsWith('ss')) return term.slice(0, -1); // thighs -> thigh
                return term;
            };
            
            // Search helper: tries name then common_name
            const searchFood = async (term: string) => {
                const { data: nameData, error: nameError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, protein_g, carbs_g, fat_g')
                    .ilike('name', `%${term}%`)
                    .limit(3);
                
                if (!nameError && nameData && nameData.length > 0) return nameData;
                
                const { data: commonData, error: commonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, protein_g, carbs_g, fat_g')
                    .ilike('common_name', `%${term}%`)
                    .limit(3);
                
                if (!commonError && commonData && commonData.length > 0) return commonData;
                return null;
            };

            for (const ing of ingredients) {
                const searchTermRaw = ing.base_ingredient || ing.item;
                const searchTerm = extractCoreName(searchTermRaw);
                
                if (!searchTerm || searchTerm.length < 2) continue;

                // Tiered search: try specific term first, then de-pluralized, then single-word fallback
                let matchData = await searchFood(searchTerm);
                
                // If no match, try de-pluralized version (e.g. "chicken thighs" -> "chicken thigh")
                if (!matchData) {
                    const singular = dePluralize(searchTerm);
                    if (singular !== searchTerm) {
                        matchData = await searchFood(singular);
                    }
                }
                
                // If still no match, try just the last word (e.g. "cherry tomatoes" -> "tomatoes" -> "tomato")
                if (!matchData && searchTerm.includes(' ')) {
                    const words = searchTerm.split(' ');
                    // Try each word from longest combo to shortest
                    for (let w = words.length - 1; w >= 0; w--) {
                        const subTerm = words.slice(w).join(' ');
                        matchData = await searchFood(subTerm);
                        if (!matchData) {
                            const subSingular = dePluralize(subTerm);
                            if (subSingular !== subTerm) matchData = await searchFood(subSingular);
                        }
                        if (matchData) break;
                    }
                }

                if (matchData && matchData.length > 0) {
                    const match = matchData[0];
                    newMatches[ing.id] = match;
                    newFlipped[ing.id] = true; // Auto-flip to show the match
                }
            }

            const matchCount = Object.keys(newMatches).length;
            if (matchCount > 0) {
                setMatchedIngredients(newMatches);
                setFlippedCards(newFlipped);
                toast.success(`Smart Match found ${matchCount} corresponding food items!`, { id: 'smart-match' });
            } else {
                toast.error("Smart Match couldn't find any direct mappings. You may need to add these items to your database.", { id: 'smart-match' });
            }

        } catch (error) {
            console.error('Error during Smart Match:', error);
            toast.error("An error occurred while running Smart Match.", { id: 'smart-match' });
        } finally {
            setSmartMatchRunning(false);
        }
    };

    const totalWeight = ingredients.reduce((sum, ing) => sum + (ing.weight_g || 0), 0);

    // Simplified NutrientGrid for chatbot
    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, isRatios = false }: { title: string, items: Record<string, any[]>, icon: any, theme?: string, subtitle?: string, isRatios?: boolean }) => {
        const themes = {
            indigo: { text: "text-indigo-400" },
            rose: { text: "text-rose-400" },
            orange: { text: "text-orange-400" },
            emerald: { text: "text-emerald-400" },
            blue: { text: "text-blue-400" },
            amber: { text: "text-amber-400" }
        };
        const t = (themes as any)[theme] || themes.indigo;

        const micronutrients = recipe?.micronutrients || {};

        const getNutrientValue = (keys: string[]): number => {
            for (const key of keys) {
                const lowerKey = key.toLowerCase();
                for (const [dbKey, value] of Object.entries(micronutrients)) {
                    if (dbKey.toLowerCase().includes(lowerKey) || lowerKey.includes(dbKey.toLowerCase())) {
                        return value as number;
                    }
                }
                if (key === 'Energy' || key === 'energy_kcal' || key === 'Calories' || key === 'calories') return recipe?.calories || 0;
                if (key === 'Protein' || key === 'protein_g' || key === 'protein') return recipe?.protein || 0;
                if (key === 'Carbohydrates' || key === 'carbs_g' || key === 'carbs') return recipe?.carbs || 0;
                if (key === 'Fat' || key === 'fat_g' || key === 'fat') return recipe?.fat || 0;
            }
            return 0;
        };

        return (
            <div className={cn("p-4 pt-3 rounded-2xl border bg-gradient-to-br mb-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700")}>
                <h4 className={cn("font-bold flex items-center gap-2 mb-1 uppercase tracking-wider text-xs", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                {subtitle && <p className="text-[9px] text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">{subtitle}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(items).map(([label, keys]) => {
                        let val = 0;
                        let unitStr = '';

                        if (isRatios && (keys as string[]).length === 2) {
                            const v1 = getNutrientValue([(keys as string[])[0]]);
                            const v2 = getNutrientValue([(keys as string[])[1]]);
                            val = v2 > 0 ? v1 / v2 : 0;
                            unitStr = ' to 1';
                        } else {
                            val = getNutrientValue(keys as string[]);
                            unitStr = (label === 'Energy') ? 'kcal' :
                                (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars') ? 'g' :
                                    (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K') ? 'µg' : 'mg';
                        }

                        return (
                            <div key={label} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 mb-1 truncate">{label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{val.toFixed(isRatios ? 2 : 1)}</span>
                                    <span className="text-[9px] font-semibold text-slate-400">{unitStr}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <p className="text-sm text-slate-500">Loading recipe...</p>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
                <p className="text-slate-500 text-center">Recipe not found</p>
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-slate-900">
            {/* Header with back button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                    title="Back"
                >
                    <ArrowLeft size={18} />
                </button>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white flex-1 text-center px-2 truncate">
                    {recipe.title}
                </h2>
                <button
                    onClick={toggleFavorite}
                    className="p-1.5 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-rose-500"
                >
                    <Heart
                        size={18}
                        className={recipe.is_favorite ? 'fill-rose-500 text-rose-500' : ''}
                    />
                </button>
            </div>

            {/* Recipe Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Image and Action Buttons */}
                <div className="flex gap-3">
                    {/* Square Image */}
                    {recipe.image && (
                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Action Buttons Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        {[
                            { key: 'recipe' as const, label: 'Recipe', icon: Layers, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'nutrition' as const, label: 'Nutrition', icon: Activity, color: 'text-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/30' },
                            { key: 'related' as const, label: 'Related', icon: UtensilsCrossed, color: 'text-amber-500', activeBg: 'bg-amber-500/10 border-amber-500/30' },
                            { key: 'management' as const, label: 'Management', icon: ShoppingBasket, color: 'text-blue-500', activeBg: 'bg-blue-500/10 border-blue-500/30' },
                        ].map(({ key, label, icon: Icon, color, activeBg }) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(prev => prev === key ? null : key)}
                                className={cn(
                                    'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all',
                                    activeSection === key
                                        ? `${activeBg} ${color}`
                                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                )}
                            >
                                <Icon size={14} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats - Only show when recipe section is active */}
                {activeSection === 'recipe' && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Prep Time</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {recipe.prep_time > 0 ? `${recipe.prep_time} min` : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Servings</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{recipe.servings} servings</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Cook Time</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {recipe.cook_time > 0 ? `${recipe.cook_time} min` : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Weight</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(totalWeight)} g</p>
                        </div>
                    </div>
                )}

                {/* Content Sections */}
                {activeSection === 'recipe' && (
                    <>
                        {/* Nutritional Info */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                                Nutritional Info (per serving)
                            </p>
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Calories</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.calories)} kcal</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Protein</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.protein * 10) / 10}g</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Fat</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.fat * 10) / 10}g</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Carbs</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(recipe.carbs * 10) / 10}g</p>
                                </div>
                            </div>
                        </div>

                        {/* Diet Labels */}
                        {recipe.diet && recipe.diet.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recipe.diet.map(d => (
                                    <span key={d} className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                                        {d}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Ingredients */}
                        {ingredients.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
                                    Ingredients ({ingredients.length})
                                </h3>
                                <ul className="space-y-2">
                                    {ingredients.map((ing, idx) => (
                                        <li key={ing.id || idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="text-slate-400 dark:text-slate-500 font-medium shrink-0">•</span>
                                            <span>
                                                <span className="font-medium">{ing.base_ingredient || ing.item}</span> - {ing.amount}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Instructions */}
                        {instructions.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
                                    Instructions
                                </h3>
                                <ol className="space-y-3">
                                    {instructions.map((inst, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm">
                                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                {inst.step_order || idx + 1}
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-300 pt-0.5">
                                                {inst.step_text}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* Source */}
                        {recipe.source && recipe.source !== 'pasted-content' && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <span className="font-medium">Source:</span> {recipe.source}
                            </div>
                        )}
                    </>
                )}

                {activeSection === 'nutrition' && (recipe.calories > 0 ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="pb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 italic flex items-center gap-2">
                                <Activity size={16} />
                                Nutritional Profile
                            </h3>
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Comprehensive analysis of nutrition</p>
                        </div>

                        <NutrientGrid 
                            title="Macronutrients" 
                            icon={Zap} 
                            theme="orange" 
                            subtitle="Energy and macro breakdown" 
                            items={{
                                'Energy': ['Energy', 'energy_kcal', 'Calories', 'calories'],
                                'Protein': ['Protein', 'protein_g', 'protein'],
                                'Carbs': ['Carbohydrates', 'carbs_g', 'carbs'],
                                'Fat': ['Fat', 'fat_g', 'fat']
                            }} 
                        />

                        <NutrientGrid 
                            title="Electrolytes" 
                            icon={Zap} 
                            theme="indigo" 
                            subtitle="Essential minerals for hydration" 
                            items={{
                                'Sodium': ['Sodium', 'sodium_mg'],
                                'Potassium': ['Potassium', 'potassium_mg'],
                                'Magnesium': ['Magnesium', 'magnesium_mg'],
                                'Calcium': ['Calcium', 'calcium_mg'],
                                'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                            }} 
                        />

                        <NutrientGrid 
                            title="Trace Minerals" 
                            icon={Gem} 
                            theme="rose" 
                            subtitle="Essential minerals for energy support" 
                            items={{
                                'Iron': ['Iron', 'iron_mg'],
                                'Zinc': ['Zinc', 'zinc_mg'],
                                'Copper': ['Copper', 'copper_mg'],
                                'Manganese': ['Manganese', 'manganese_mg'],
                                'Selenium': ['Selenium', 'selenium_ug']
                            }} 
                        />

                        <NutrientGrid 
                            title="Water-Soluble Vitamins" 
                            icon={Droplet} 
                            theme="blue" 
                            subtitle="Daily vitamins for health" 
                            items={{
                                'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                                'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                                'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                                'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                                'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                                'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                                'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                                'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                                'Choline': ['Choline', 'choline_mg']
                            }} 
                        />

                        <NutrientGrid 
                            title="Fat-Soluble Vitamins" 
                            icon={Battery} 
                            theme="emerald" 
                            subtitle="Stored vitamins for long-term vitality" 
                            items={{
                                'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                'Vitamin K': ['Vitamin K', 'vitamin_k_ug']
                            }} 
                        />

                        {/* Advanced Nutrition Toggle */}
                        <button
                            onClick={() => setShowAdvancedNutrition(prev => !prev)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700/50 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-[9px] font-bold uppercase tracking-wider"
                        >
                            <Dna size={13} />
                            {showAdvancedNutrition ? 'Hide' : 'Show'} Advanced Bio-Markers
                            {showAdvancedNutrition ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {showAdvancedNutrition && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <NutrientGrid 
                                    title="Extra Markers" 
                                    icon={Activity} 
                                    theme="amber" 
                                    subtitle="Additional health markers" 
                                    items={{
                                        'Fiber': ['Fiber', 'fiber_g'],
                                        'Sugars': ['Sugars', 'sugars_g'],
                                        'Oxalate': ['Oxalate', 'oxalate_mg'],
                                        'Cholesterol': ['Cholesterol', 'cholesterol_mg']
                                    }} 
                                />

                                <NutrientGrid 
                                    title="Biological Ratios" 
                                    icon={Dna} 
                                    theme="amber" 
                                    subtitle="Key nutrient balances for a healthy body" 
                                    isRatios={true}
                                    items={{
                                        'Sodium & Potassium': ['Sodium', 'Potassium'],
                                        'Zinc & Copper': ['Zinc', 'Copper'],
                                        'Omega 3 to 6 ratio': ['Omega-6', 'Omega-3'],
                                        'Calcium & Magnesium': ['Calcium', 'Magnesium'],
                                        'Calcium & Phosphorus': ['Calcium', 'Phosphorus']
                                    }} 
                                />

                                {/* Phytonutrients */}
                                {recipe?.phytonutrients && Object.keys(recipe.phytonutrients).length > 0 && (
                                    <div className="p-4 pt-3 rounded-2xl border bg-gradient-to-br mb-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                                        <h4 className="font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-sm text-green-500"><Dna className="h-4 w-4" /> Phytonutrients</h4>
                                        <p className="text-[10px] text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Plant compounds for enhanced nutrition</p>
                                        <div className="space-y-2">
                                            {Object.entries(recipe.phytonutrients).map(([name, description]) => (
                                                <div key={name} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                    <p className="text-[11px] font-semibold text-green-600 dark:text-green-400 mb-1">{name}</p>
                                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* No Data Explainer */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={64} className="text-indigo-500" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                    <Sparkles size={18} className="text-indigo-500 animate-pulse" />
                                    Smart Match
                                </h3>
                                <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 mb-4 leading-relaxed">
                                    This recipe hasn't been analyzed yet. We can use our Smart Match technology to map these ingredients to our nutrition database and calculate the exact macro and micro nutrients tailored to your body.
                                </p>
                                <button
                                    onClick={runSmartMatch}
                                    disabled={smartMatchRunning}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {smartMatchRunning ? (
                                        <><Loader2 size={16} className="animate-spin" /> Analyzing Ingredients...</>
                                    ) : (
                                        <><Zap size={16} className="fill-current" /> Run Smart Match</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Ingredients to Match */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Layers size={14} /> Ingredient Mapping
                                </h4>
                                {Object.keys(matchedIngredients).length > 0 && (
                                    <button 
                                        onClick={() => {
                                            const newAccepted = { ...acceptedMatches };
                                            const newFlipped = { ...flippedCards };
                                            Object.keys(matchedIngredients).forEach(id => {
                                                newAccepted[id] = true;
                                                newFlipped[id] = false;
                                            });
                                            setAcceptedMatches(newAccepted);
                                            setFlippedCards(newFlipped);
                                            toast.success(`Accepted ${Object.keys(matchedIngredients).length} ingredient matches`);
                                        }}
                                        className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Accept All
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-3">
                                {ingredients.map((ing) => {
                                    const isMatched = !!matchedIngredients[ing.id];
                                    const isFlipped = !!flippedCards[ing.id];
                                    const isAccepted = !!acceptedMatches[ing.id];
                                    
                                    return (
                                        <div key={ing.id} className="relative h-[80px] w-full [perspective:1000px] group">
                                            <div 
                                                className={cn(
                                                    "w-full h-full transition-all duration-500 [transform-style:preserve-3d]",
                                                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                                                )}
                                            >
                                                {/* Front (Original Ingredient) */}
                                                <div className={cn(
                                                    "absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl p-3 flex items-center justify-between border transition-colors",
                                                    isMatched && !isAccepted ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800" :
                                                    isAccepted ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" :
                                                    "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                )}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                            isAccepted ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600" :
                                                            "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                                        )}>
                                                            {isAccepted ? <Check size={18} /> : <UtensilsCrossed size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate max-w-[180px]">
                                                                {ing.base_ingredient || ing.item}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium">
                                                                {ing.amount} {ing.weight_g ? `(${ing.weight_g}g)` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {isMatched && !isAccepted && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({ ...prev, [ing.id]: true })); }}
                                                            className="p-2 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full transition-colors"
                                                            title="Review Match"
                                                        >
                                                            <RefreshCw size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Back (Matched Food Item) */}
                                                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl p-3 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between shadow-sm shadow-indigo-100 dark:shadow-none">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                                            <Activity size={18} className="text-indigo-500" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300 truncate max-w-[150px]">
                                                                    {matchedIngredients[ing.id]?.name || 'Match'}
                                                                </p>
                                                                <span className="text-[8px] h-4 px-1 py-0 rounded border bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400">
                                                                    LOCAL DB
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-0.5 max-w-[180px] truncate">
                                                                Match for: "{ing.base_ingredient || ing.item}"
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setFlippedCards(prev => ({ ...prev, [ing.id]: false })); }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                                            title="Go Back"
                                                        >
                                                            <ArrowLeft size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { 
                                                                setAcceptedMatches(prev => ({ ...prev, [ing.id]: true }));
                                                                setFlippedCards(prev => ({ ...prev, [ing.id]: false }));
                                                            }}
                                                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                                        >
                                                            Accept
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {activeSection === 'related' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {(relatedRecipes.length > 0 || loadingRelated) ? (
                            <div className="space-y-4">
                                <div className="pb-2">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 italic flex items-center gap-2">
                                        Related Meals
                                    </h3>
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Recipes with shared ingredients</p>
                                </div>

                                {loadingRelated ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {relatedRecipes.map((meal) => (
                                            <a
                                                key={meal.id}
                                                href={`/dashboard/library/meals/${meal.id}`}
                                                className="group flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                            >
                                                <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex-shrink-0">
                                                    {meal.image ? (
                                                        <img src={meal.image} className="w-full h-full object-cover" alt={meal.title} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800">
                                                            <Layers size={14} className="opacity-20" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                                                        {meal.title}
                                                    </h4>
                                                    <div className="mt-1 inline-block px-2 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-bold uppercase tracking-wider">
                                                        {(meal as any).overlapMatch} Shared
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 font-semibold py-6 text-center">No related meals found.</p>
                        )}
                    </div>
                )}

                {activeSection === 'management' && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Management options</p>
                    </div>
                )}
            </div>
        </div>
    );
}
