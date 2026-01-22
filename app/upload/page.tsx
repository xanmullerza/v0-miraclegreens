
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Search,
    Save,
    ArrowRight,
    Check,
    AlertCircle,
    Loader2,
    ChefHat,
    Scale,
    Clock,
    Beef,
    Utensils,
    Leaf,
    X,
    Image as ImageIcon,
    Camera,
    Upload
} from 'lucide-react';
import {
    searchLocalFood,
    searchUSDAFood,
    getUSDAMeasures,
    syncToLocal,
    FoodItemMatch,
    FoodMeasure
} from '@/lib/services/nutrition';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Recipe, Ingredient, MealType, DietType } from '@/lib/data/recipes';
import { parseRecipeText, parseIngredientsOnly, parseInstructionsOnly } from '@/lib/utils/recipe-parser';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Sparkles, Zap } from 'lucide-react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;

// Simplified UI Components for the uploader
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

// Helper to handle pluralization of units
const pluralizeUnit = (qty: number, unit: string): string => {
    if (qty <= 1 || !unit) return unit;
    const lower = unit.toLowerCase();
    const commonUnits = ['cup', 'tablespoon', 'teaspoon', 'ounce', 'pound', 'gram', 'kilogram', 'liter', 'milliliter', 'clove', 'pinch', 'dash', 'slice', 'can', 'bottle', 'package'];

    if (commonUnits.includes(lower)) {
        return unit + 's';
    }
    if (lower === 'inch') return unit + 'es';
    if (lower === 'box') return unit + 'es';

    return unit;
};

// Helper to handle "1/2", "1.5", etc.
const evaluateAmount = (amt: string): number => {
    if (!amt) return 1;

    // Pre-clean internal "or" artifacts (e.g. "1 or 2" -> "1.5" or just "1") 
    // but here we specifically want to handle "2 tspor" cases if they leak in
    let normalized = amt.toLowerCase().replace(/or\b/g, '').trim();

    // Handle unicode fractions
    const unicodeFractions: Record<string, number> = {
        '¼': 0.25, '½': 0.5, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
    };

    for (const [char, val] of Object.entries(unicodeFractions)) {
        if (normalized.includes(char)) {
            const parts = normalized.split(char);
            const whole = parseFloat(parts[0].trim()) || 0;
            return whole + val;
        }
    }

    // Extract numerical part from the start of the string
    const match = normalized.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))/);
    if (!match) return 1;

    const val = match[1].trim();
    if (val.includes('/')) {
        if (val.includes(' ')) {
            const [whole, fraction] = val.split(' ');
            const [num, den] = fraction.split('/').map(n => parseFloat(n.trim()));
            return parseFloat(whole) + (num / den);
        }
        const [num, den] = val.split('/').map(n => parseFloat(n.trim()));
        if (den && !isNaN(num)) return num / den;
    }
    return parseFloat(val) || 1;
};

export default function RecipeUploaderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <RecipeUploaderContent />
        </Suspense>
    );
}

function RecipeUploaderContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get('edit');

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [mealType, setMealType] = useState<MealType>('breakfast');
    const [diet, setDiet] = useState<DietType[]>(['anything']);
    const [prepTime, setPrepTime] = useState(15);
    const [servings, setServings] = useState(1);
    const [image, setImage] = useState('');

    const [ingredients, setIngredients] = useState<(Ingredient & {
        matchedFood?: FoodItemMatch,
        selectedMeasure?: FoodMeasure,
        availableMeasures?: FoodMeasure[],
        parsedGrams?: number // The grams parsed from the original text, never overwritten
    })[]>([
        { item: '', amount: '', weightG: 0, isMiracleProduct: false }
    ]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [magicPaste, setMagicPaste] = useState('');
    const [showMagicPaste, setShowMagicPaste] = useState(false);
    const [importMode, setImportMode] = useState<'none' | 'manual' | 'guided'>(editId ? 'manual' : 'none');
    const [wizardStep, setWizardStep] = useState(1);
    const [isWizardProcessing, setIsWizardProcessing] = useState(false);
    const [wizardProcessedData, setWizardProcessedData] = useState<any>(null);
    const { energyUnit } = useUserPreferences();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Generate a unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = fileName; // Upload to root of 'recipes' bucket

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from('recipes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // If it fails because bucket doesn't exist, fallback to Base64 but warn
                if (uploadError.message.includes('bucket not found')) {
                    console.warn("Storage bucket 'recipes' not found. Falling back to local preview. Please create the bucket in Supabase.");
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImage(reader.result as string);
                        setUploading(false);
                    };
                    reader.readAsDataURL(file);
                    return;
                }
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('recipes')
                .getPublicUrl(filePath);

            setImage(publicUrl);
            setUploading(false);
        } catch (err: any) {
            console.error("Upload error:", err);
            alert(`Error uploading image: ${err.message}. Falling back to preview.`);

            // Fallback to Base64 so the user isn't blocked
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    // Load existing recipe for editing
    useEffect(() => {
        if (editId) {
            loadRecipe(editId);
        }
    }, [editId]);

    const loadRecipe = async (id: string) => {
        setLoading(true);
        try {
            const { data: recipe, error } = await supabase
                .from('recipes')
                .select(`
                    *,
                    ingredients (
                        *,
                        food_items (*)
                    ),
                    instructions (*)
                `)
                .eq('id', id)
                .single();

            if (error || !recipe) throw error || new Error('Recipe not found');

            setTitle(recipe.title);
            setMealType(recipe.type as MealType);
            setDiet(recipe.diet as DietType[]);
            setPrepTime(recipe.prep_time);
            setServings(recipe.servings || 1);
            setImage(recipe.image || '');

            setInstructions(recipe.instructions.sort((a: any, b: any) => a.step_order - b.step_order).map((i: any) => i.step_text));

            // Hydrate ingredients
            const hydratedIngs = recipe.ingredients.map((ing: any) => ({
                item: ing.item,
                amount: ing.amount,
                weightG: ing.weight_g,
                isMiracleProduct: ing.is_miracle_product,
                baseIngredient: ing.base_ingredient,
                matchedFood: ing.food_items ? {
                    id: ing.food_items.id,
                    name: ing.food_items.name,
                    energy_kcal: ing.food_items.energy_kcal,
                    energy_kj: ing.food_items.energy_kj,
                    protein_g: ing.food_items.protein_g,
                    carbs_g: ing.food_items.carbs_g,
                    fat_g: ing.food_items.fat_g,
                    micronutrients: ing.food_items.micronutrients,
                    source: 'local' as const
                } : undefined,
                selectedMeasure: ing.measure_label ? { label: ing.measure_label, weight_g: 0 } : undefined
            }));
            setIngredients(hydratedIngs);

        } catch (err) {
            console.error('Error loading recipe:', err);
            alert('Could not load recipe for editing');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDetails = (text: string) => {
        setIsWizardProcessing(true);
        try {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) return;

            // Parse title if missing
            if (!title) setTitle(lines[0]);

            let s = 1;
            let t = 0;
            let foundAny = false;

            lines.forEach(line => {
                const lower = line.toLowerCase();
                // Servings
                const servMatch = line.match(/(?:makes|servings|serves|yield|yields|yield:)\s*:?\s*(\d+)/i) ||
                    line.match(/(\d+)\s*(?:servings|serves|portions)/i);
                if (servMatch) {
                    s = parseInt(servMatch[1]);
                    foundAny = true;
                }

                // Time (sum all found durations)
                const timeMatches = line.matchAll(/(\d+)\s*(?:min|minute|minutes|hour|hours|hr|hrs|h)\b/gi);
                for (const match of timeMatches) {
                    let val = parseInt(match[1]);
                    const unit = match[0].toLowerCase();
                    if (unit.includes('hour') || unit.includes('hr') || unit.endsWith('h')) val *= 60;
                    t += val;
                    foundAny = true;
                }
            });

            if (foundAny) {
                setServings(s);
                setPrepTime(t);
            }

            setWizardProcessedData(true);
        } catch (err) {
            console.error("Wizard Parse Error:", err);
        } finally {
            setIsWizardProcessing(false);
        }
    };

    const handleQuickIngredients = async (text: string) => {
        setIsWizardProcessing(true);
        try {
            const parsed = parseIngredientsOnly(text);
            const newIngs = parsed.map(ing => ({
                item: ing.item,
                amount: ing.amount,
                weightG: ing.weightG || 0,
                parsedGrams: ing.weightG, // Store original parsed grams separately
                isMiracleProduct: false
            }));
            setIngredients(newIngs);

            // Auto-match attempt
            await autoMatchAll(newIngs);

            setWizardProcessedData(true);
        } catch (err) {
            console.error("Wizard Ing Error:", err);
        } finally {
            setIsWizardProcessing(false);
        }
    };

    const handleQuickInstructions = (text: string) => {
        setIsWizardProcessing(true);
        try {
            const parsed = parseInstructionsOnly(text);
            setInstructions(parsed);
            setWizardProcessedData(true);
        } finally {
            setIsWizardProcessing(false);
        }
    };

    const handleMagicImport = () => {
        if (!magicPaste.trim()) return;

        // If we are on Step 1, try to get everything
        if (step === 1) {
            const parsed = parseRecipeText(magicPaste);
            setTitle(parsed.title);
            setServings(parsed.servings);
            const newIngs = parsed.ingredients.map(ing => ({
                item: ing.item,
                amount: ing.amount,
                weightG: ing.weightG || 0,
                parsedGrams: ing.weightG, // Store original parsed grams
                isMiracleProduct: false
            }));
            setIngredients(newIngs);
            setInstructions(parsed.instructions);
            setStep(2);
        } else if (step === 2) {
            handleQuickIngredients(magicPaste);
        } else if (step === 3) {
            handleQuickInstructions(magicPaste);
        }

        setShowMagicPaste(false);
        setMagicPaste("");
    };

    const autoMatchAll = async (targetIngs?: any[]) => {
        setLoading(true);
        const listToProcess = targetIngs || ingredients;
        const newIngs = [...listToProcess];

        for (let i = 0; i < newIngs.length; i++) {
            const ing = newIngs[i];
            if (ing.matchedFood || !ing.item || ing.item.length < 2) continue;

            try {
                // Two-Step: Split by parenthesis to get a cleaner search name
                const parenIndex = ing.item.indexOf('(');
                let coreName = parenIndex !== -1 ? ing.item.substring(0, parenIndex).trim() : ing.item;
                const hints = parenIndex !== -1 ? ing.item.substring(parenIndex).toLowerCase() : "";

                // Clean core name of trailing commas or special chars
                coreName = coreName.replace(/[,;:]\s*$/, '').trim();

                let local = await searchLocalFood(coreName);
                let usda = await searchUSDAFood(coreName);

                // Fallback: If no results for core name, try full item
                if (local.length === 0 && usda.length === 0 && coreName !== ing.item) {
                    local = await searchLocalFood(ing.item);
                    usda = await searchUSDAFood(ing.item);
                }

                const combined = [...local, ...usda];

                if (combined.length > 0) {
                    // Smart Selection: Find result that has the most word matches with the query
                    const queryWords = coreName.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                    let bestMatch = combined[0];
                    let maxMatches = 0;

                    for (const cand of combined) {
                        const candName = cand.name.toLowerCase();
                        let matches = 0;
                        queryWords.forEach((word: string) => {
                            if (candName.includes(word)) matches++;
                        });
                        // Bonus for exact core name match or starting with it
                        if (candName.startsWith(coreName.toLowerCase())) matches += 2;
                        if (candName === coreName.toLowerCase()) matches += 5;

                        if (matches > maxMatches) {
                            maxMatches = matches;
                            bestMatch = cand;
                        }
                    }

                    const best = bestMatch;

                    let foodMeasures: FoodMeasure[] = [];
                    if (best.source === 'usda' && best.fdcId) {
                        foodMeasures = await getUSDAMeasures(best.fdcId);
                    } else if (best.id) {
                        const { data } = await supabase.from('food_measures').select('label, weight_g').eq('food_item_id', best.id);
                        foodMeasures = (data || []).map(m => ({ label: m.label, weight_g: m.weight_g }));
                    }

                    newIngs[i].matchedFood = best;

                    if (foodMeasures.length > 0) {
                        const amountLower = ing.amount.toLowerCase();
                        const searchSpace = amountLower + " " + hints + " " + ing.item.toLowerCase();

                        // Try to find a measure that matches the unit in the amount string OR Hints
                        const matchedMeasure = foodMeasures.find(m => {
                            const labelLower = m.label.toLowerCase();
                            const singular = labelLower.replace(/s$/, '');
                            const amountLowerArr = amountLower.split(' ');
                            const amountUnit = amountLowerArr.pop() || '';

                            return searchSpace.includes(labelLower) ||
                                searchSpace.includes(singular) ||
                                labelLower.includes(amountUnit) ||
                                (amountUnit.length > 1 && labelLower.startsWith(amountUnit));
                        }) || foodMeasures[0];

                        newIngs[i].availableMeasures = foodMeasures;
                        newIngs[i].selectedMeasure = matchedMeasure;

                        // Use parsed grams from the text if available (e.g. "2 tbsp (30g)")
                        // Otherwise calculate from the measure
                        const hasParsedGrams = (ing as any).parsedGrams && (ing as any).parsedGrams > 0;

                        if (hasParsedGrams) {
                            // Trust the grams from the recipe text
                            newIngs[i].weightG = (ing as any).parsedGrams;
                            newIngs[i].parsedGrams = (ing as any).parsedGrams;
                        } else if (!ing.weightG) {
                            const amountStr = ing.amount.toLowerCase();
                            const qty = evaluateAmount(ing.amount);

                            if (amountStr.match(/\d+\s*(?:g|gram|grams|ml)/)) {
                                newIngs[i].weightG = qty;
                                newIngs[i].selectedMeasure = foodMeasures.find(m => m.label.toLowerCase() === 'g') || matchedMeasure;
                            } else if (amountStr.match(/\d+\s*(?:kg|kilogram|kilograms)/)) {
                                newIngs[i].weightG = qty * 1000;
                            } else {
                                newIngs[i].weightG = qty * (matchedMeasure.weight_g || 1);

                                // Update the text to be pluralized if needed
                                const pluralizedLabel = pluralizeUnit(qty, matchedMeasure.label);
                                newIngs[i].amount = `${qty} ${pluralizedLabel}`;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Auto-match failed for ${ing.item}:`, err);
            }
        }

        setIngredients(newIngs);
        setLoading(false);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItemMatch[]>([]);
    const [activeIngredientIndex, setActiveIngredientIndex] = useState<number | null>(null);
    const [searching, setSearching] = useState(false);
    const [measures, setMeasures] = useState<FoodMeasure[]>([]);

    // Add/Remove dynamic rows
    const addIngredient = () => setIngredients([...ingredients, { item: '', amount: '', weightG: 0, isMiracleProduct: false }]);
    const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));

    const addInstruction = () => setInstructions([...instructions, '']);
    const removeInstruction = (idx: number) => setInstructions(instructions.filter((_, i) => i !== idx));

    // Search logic with simple debounce
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (debouncedQuery) {
                performSearch(debouncedQuery);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [debouncedQuery]);

    const performSearch = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // First search local
            const local = await searchLocalFood(query);
            // Then search USDA
            const usda = await searchUSDAFood(query);
            setSearchResults([...local, ...usda]);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearching(false);
        }
    };
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setDebouncedQuery(query);
    };

    const selectFood = async (food: FoodItemMatch) => {
        if (activeIngredientIndex === null) return;

        setLoading(true);
        let foodMeasures: FoodMeasure[] = [];

        if (food.source === 'usda' && food.fdcId) {
            foodMeasures = await getUSDAMeasures(food.fdcId);
        } else if (food.id) {
            // Fetch local measures
            const { data } = await supabase.from('food_measures').select('label, weight_g').eq('food_item_id', food.id);
            foodMeasures = (data || []).map(m => ({ label: m.label, weight_g: m.weight_g }));
        }

        setMeasures(foodMeasures);

        const newIngs = [...ingredients];
        const currentIng = newIngs[activeIngredientIndex];

        // Auto-detect weight from amount string (e.g., "200g", "0.5kg", "100 grams")
        let autoWeight = 0;
        const amountStr = (currentIng.amount || "").toLowerCase().trim();

        if (amountStr.match(/\d+\s*(?:kg|kilogram|kilograms)/)) {
            autoWeight = parseFloat(amountStr) * 1000;
        } else if (amountStr.match(/\d+\s*(?:g|gram|grams|ml)/)) {
            autoWeight = parseFloat(amountStr);
        }

        // If we found a weight in the string (like "90g"), 
        // keep that as the base reality.
        newIngs[activeIngredientIndex] = {
            ...currentIng,
            matchedFood: food,
            baseIngredient: food.name,
            weightG: autoWeight || currentIng.weightG,
            availableMeasures: foodMeasures
        };
        setIngredients(newIngs);
        setLoading(false);
    };

    const selectMeasure = (measure: FoodMeasure) => {
        if (activeIngredientIndex === null) return;
        const newIngs = [...ingredients];
        const ing = newIngs[activeIngredientIndex];

        // If amount contains 'g', it's a fixed weight override. 
        // Dont multiply by the measure weight again.
        let weightG = 0;
        const amountStr = (ing.amount || "").toLowerCase();
        const qtyValue = evaluateAmount(ing.amount);
        const pluralizedLabel = pluralizeUnit(qtyValue, measure.label);
        const newAmount = `${qtyValue} ${pluralizedLabel}`;

        if (amountStr.match(/\d+\s*(?:g|gram|grams|ml)/) && !amountStr.includes('/')) {
            // It's a manual weight like "90g". Just use it.
            weightG = parseFloat(amountStr);
        } else if (amountStr.match(/\d+\s*(?:kg|kilogram|kilograms)/) && !amountStr.includes('/')) {
            // It's a manual weight like "1.5kg".
            weightG = parseFloat(amountStr) * 1000;
        } else {
            // It's a quantity like "1/2" or "2". Multiply by measure.
            weightG = qtyValue * measure.weight_g;
        }

        newIngs[activeIngredientIndex] = {
            ...ing,
            amount: newAmount,
            selectedMeasure: measure,
            weightG: weightG
        };
        setIngredients(newIngs);
    };

    const calculateTotalNutrition = () => {
        let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, micronutrients: {} as Record<string, number> };
        ingredients.forEach(ing => {
            if (ing.matchedFood && ing.weightG) {
                const ratio = ing.weightG / 100;
                totals.calories += (ing.matchedFood.energy_kcal || 0) * ratio;
                totals.protein += (ing.matchedFood.protein_g || 0) * ratio;
                totals.carbs += (ing.matchedFood.carbs_g || 0) * ratio;
                totals.fat += (ing.matchedFood.fat_g || 0) * ratio;

                // Aggregate micronutrients
                if (ing.matchedFood.micronutrients) {
                    Object.entries(ing.matchedFood.micronutrients).forEach(([key, val]) => {
                        totals.micronutrients[key] = (totals.micronutrients[key] || 0) + val * ratio;
                    });
                }
            }
        });
        return totals;
    };

    const saveRecipe = async () => {
        setLoading(true);
        try {
            // 1. Ensure all foods are synced to local and organic measures are saved
            const ingredientData = [];
            for (const ing of ingredients) {
                if (!ing.matchedFood) continue;

                // Organic measurement logic:
                // If we have an amount like "2 tsp" and a weight like "9g"
                // We should add a measure for "tsp" with weight_g = 4.5
                const currentMeasures = [...(ing.availableMeasures || [])];

                // Extract unit label from amount string
                // e.g. "2 tsp (9g)" -> look for the unit after the quantity
                const qtyVal = evaluateAmount(ing.amount);
                const unitPart = ing.amount.replace(/^[\d\s¼½¾⅛⅜⅝⅞/.]+/, '').split('(')[0].trim().toLowerCase();
                const unitLabel = unitPart.match(/[a-z]+/)?.[0] || unitPart;

                // Only add if it's not a direct gram measurement itself
                if (unitLabel && !['g', 'gram', 'grams', 'ml', 'kcal', 'cal'].includes(unitLabel) && ing.weightG && qtyVal > 0) {
                    const unitWeight = ing.weightG / qtyVal;
                    // Check if we already have this measure
                    const existingIdx = currentMeasures.findIndex(m => m.label.toLowerCase() === unitLabel);
                    if (existingIdx !== -1) {
                        // Update existing measure with this recipe's weight (more specific data)
                        currentMeasures[existingIdx].weight_g = unitWeight;
                    } else {
                        currentMeasures.push({ label: unitLabel, weight_g: unitWeight });
                    }
                }

                // Sync to local to preserve organic growth of measurement data library
                const syncedId = await syncToLocal(ing.matchedFood, currentMeasures);
                const foodItemId = syncedId || ing.matchedFood.id;

                ingredientData.push({
                    item: ing.item,
                    amount: ing.amount,
                    food_item_id: foodItemId,
                    measure_label: ing.selectedMeasure?.label || unitLabel,
                    weight_g: ing.weightG,
                    base_ingredient: ing.baseIngredient
                });
            }

            const { calories, protein, carbs, fat } = calculateTotalNutrition();

            const recipeId = editId || title.toLowerCase().replace(/\s+/g, '-');

            // 2. Upsert Recipe
            const { error: recipeError } = await supabase.from('recipes').upsert({
                id: recipeId,
                title,
                type: mealType,
                diet,
                calories: Math.round(calories / servings),
                protein: Math.round(protein / servings),
                carbs: Math.round(carbs / servings),
                fat: Math.round(fat / servings),
                image,
                prep_time: prepTime,
                servings: servings
            });

            if (recipeError) throw recipeError;

            // 3. Clear and Re-insert Ingredients
            await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
            const { error: ingError } = await supabase.from('ingredients').insert(
                ingredientData.map(i => ({ ...i, recipe_id: recipeId }))
            );

            if (ingError) throw ingError;

            // 4. Clear and Re-insert Instructions
            await supabase.from('instructions').delete().eq('recipe_id', recipeId);
            const { error: instError } = await supabase.from('instructions').insert(
                instructions.map((text, idx) => ({
                    recipe_id: recipeId,
                    step_text: text,
                    step_order: idx + 1
                }))
            );

            if (instError) throw instError;

            alert(editId ? 'Recipe updated successfully!' : 'Recipe uploaded successfully!');
            router.push('/upload');
        } catch (err: any) {
            console.error('Save Error:', err);
            alert(`Error saving recipe: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <ChefHat size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Recipe Uploader</h1>
                            <p className="text-slate-500">Create smart recipes with automated nutrition analysis.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                        {[1, 2, 3, 4].map(s => (
                            <button
                                key={s}
                                onClick={() => setStep(s)}
                                className={cn(
                                    "px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap",
                                    step === s ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "bg-white text-slate-600 border border-slate-200"
                                )}
                            >
                                Step {s}: {s === 1 ? 'Details' : s === 2 ? 'Ingredients' : s === 3 ? 'Instructions' : 'Review'}
                            </button>
                        ))}
                    </div>

                    <Card className="p-8 min-h-[500px] flex flex-col justify-center">
                        {importMode === 'none' && (
                            <div className="text-center py-12 space-y-12 animate-in fade-in zoom-in duration-700">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900">How would you like to start?</h2>
                                    <p className="text-slate-500 text-lg max-w-xl mx-auto">Upload your masterpiece with our smart wizard or take full manual control.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                                    <button
                                        onClick={() => {
                                            setImportMode('guided');
                                            setWizardStep(1);
                                        }}
                                        className="group relative p-10 rounded-[2.5rem] border-4 border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-500 transition-all text-left space-y-6 shadow-xl shadow-emerald-100/20 active:scale-95"
                                    >
                                        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 rotate-6 group-hover:rotate-0 transition-all duration-500">
                                            <Sparkles size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">Magic Wizard</h3>
                                            <p className="text-slate-600 leading-relaxed font-medium">The fastest way. Paste blocks of text and our AI-Lite parser separates everything for you step-by-step.</p>
                                        </div>
                                        <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-100 transition-opacity">
                                            <Wand2 size={40} className="text-emerald-300" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setImportMode('manual')}
                                        className="group relative p-10 rounded-[2.5rem] border-4 border-slate-100 bg-white hover:border-emerald-500 transition-all text-left space-y-6 shadow-xl shadow-slate-100/50 active:scale-95"
                                    >
                                        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-300 -rotate-6 group-hover:rotate-0 transition-all duration-500">
                                            <Plus size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">Manual Entry</h3>
                                            <p className="text-slate-600 leading-relaxed font-medium">For the purists. Build your recipe from scratch, field by field, with total precision and no automated parsing.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {importMode === 'guided' && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col h-full">
                                {/* Wizard Stepper */}
                                <div className="flex justify-between items-center mb-16 px-4">
                                    {[1, 2, 3, 4].map(s => (
                                        <div key={s} className="flex flex-col items-center gap-3 relative z-10">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-500 shadow-lg",
                                                wizardStep === s ? "bg-emerald-600 text-white scale-110 shadow-emerald-200" :
                                                    wizardStep > s ? "bg-emerald-100 text-emerald-600 shadow-none" : "bg-slate-100 text-slate-400 shadow-none"
                                            )}>
                                                {wizardStep > s ? <Check size={24} strokeWidth={3} /> : s}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] uppercase font-black tracking-[0.2em] transition-colors",
                                                wizardStep >= s ? "text-emerald-700" : "text-slate-400"
                                            )}>
                                                {s === 1 ? 'Name' : s === 2 ? 'Details' : s === 3 ? 'Ingredients' : 'Directions'}
                                            </span>
                                        </div>
                                    ))}
                                    {/* Bridge Line */}
                                    <div className="absolute top-[8.5rem] left-[15%] right-[15%] h-1 bg-slate-100 -z-0 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-600 transition-all duration-700 ease-in-out"
                                            style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex-grow flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8 pb-12">
                                    {wizardStep === 1 && (
                                        <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="text-center space-y-3">
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">What is this masterpiece called?</h2>
                                                <p className="text-slate-500 text-lg">Just type or paste the recipe title below.</p>
                                            </div>
                                            <Textarea
                                                className="min-h-[120px] text-3xl font-black text-center border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-50 focus:border-emerald-500 rounded-3xl p-6 shadow-inner"
                                                placeholder="e.g. Garlic & Herb Smoked Salmon"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                autoFocus
                                            />
                                            <Button
                                                onClick={() => setWizardStep(2)}
                                                disabled={!title}
                                                className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 mt-4 transition-all hover:scale-[1.02] active:scale-95 flex gap-3"
                                            >
                                                Next: Paste Details <ArrowRight size={24} strokeWidth={3} />
                                            </Button>
                                        </div>
                                    )}

                                    {wizardStep === 2 && (
                                        <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="text-center space-y-3">
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Set the foundation.</h2>
                                                <p className="text-slate-500 text-lg">Paste the part with <span className="font-bold text-emerald-600">Servings</span> and <span className="font-bold text-emerald-600">Time</span>.</p>
                                            </div>
                                            {!wizardProcessedData ? (
                                                <div className="w-full space-y-6">
                                                    <Textarea
                                                        className="min-h-[150px] text-xl font-bold text-center border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-50 focus:border-emerald-500 rounded-3xl p-6 shadow-inner"
                                                        placeholder="e.g. Serves 4 | 20 mins prep | 40 mins cook"
                                                        value={magicPaste}
                                                        onChange={(e) => setMagicPaste(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        onClick={() => handleQuickDetails(magicPaste)}
                                                        disabled={isWizardProcessing || !magicPaste.trim()}
                                                        className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 transition-all hover:scale-[1.02] flex gap-3"
                                                    >
                                                        {isWizardProcessing ? "Analyzing..." : "Process Details"} <Wand2 size={24} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="bg-emerald-50 p-8 rounded-[2rem] border-4 border-emerald-100 text-center space-y-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Servings</span>
                                                            <div className="text-5xl font-black text-emerald-900">{servings}</div>
                                                        </div>
                                                        <div className="bg-emerald-50 p-8 rounded-[2rem] border-4 border-emerald-100 text-center space-y-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Minutes</span>
                                                            <div className="text-5xl font-black text-emerald-900">{prepTime}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <Button
                                                            onClick={() => {
                                                                setWizardStep(3);
                                                                setWizardProcessedData(null);
                                                                setMagicPaste("");
                                                            }}
                                                            className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 transition-all hover:scale-[1.02] flex gap-3"
                                                        >
                                                            Looks Good - On to Ingredients <ArrowRight size={24} />
                                                        </Button>
                                                        <Button variant="ghost" className="text-slate-400 font-bold" onClick={() => setWizardProcessedData(null)}>
                                                            Not right? Re-paste text
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {wizardStep === 3 && (
                                        <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="text-center space-y-3">
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">The secret sauce.</h2>
                                                <p className="text-slate-500 text-lg">Paste your <span className="font-bold text-emerald-600">Ingredients list</span> here.</p>
                                            </div>
                                            {!wizardProcessedData ? (
                                                <div className="w-full space-y-6">
                                                    <Textarea
                                                        className="min-h-[250px] text-lg font-medium border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-50 focus:border-emerald-500 rounded-3xl p-6 shadow-inner font-mono"
                                                        placeholder="Paste ingredients here..."
                                                        value={magicPaste}
                                                        onChange={(e) => setMagicPaste(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        onClick={() => handleQuickIngredients(magicPaste)}
                                                        disabled={isWizardProcessing || !magicPaste.trim()}
                                                        className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 transition-all hover:scale-[1.02] flex gap-3"
                                                    >
                                                        {isWizardProcessing ? "Feeding the AI..." : "Extract & Match Ingredients"} <Zap size={24} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
                                                    <div className="max-h-[400px] overflow-y-auto space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                                                        {ingredients.length > 0 ? ingredients.map((ing, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-900 dark:text-slate-100">{ing.item}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{ing.amount || 'as needed'}</span>
                                                                        {(ing.weightG ?? 0) > 0 && (
                                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black">
                                                                                {Math.round(ing.weightG || 0)}G
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {ing.matchedFood ? (
                                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">✓ Matched</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-slate-400">? No Match</Badge>
                                                                    )}
                                                                    <button onClick={() => removeIngredient(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="p-8 text-center text-slate-400 font-bold">No ingredients found. Try re-pasting?</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <Button
                                                            onClick={() => {
                                                                setWizardStep(4);
                                                                setWizardProcessedData(null);
                                                                setMagicPaste("");
                                                            }}
                                                            disabled={ingredients.length === 0}
                                                            className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 transition-all hover:scale-[1.02] flex gap-3"
                                                        >
                                                            Ingredients Confirmed <ArrowRight size={24} />
                                                        </Button>
                                                        <Button variant="ghost" className="text-slate-400 font-bold" onClick={() => setWizardProcessedData(null)}>
                                                            Missing something? Re-paste list
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {wizardStep === 4 && (
                                        <div className="w-full space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="text-center space-y-3">
                                                <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Final touch: Directions.</h2>
                                                <p className="text-slate-500 text-lg">Paste the <span className="font-bold text-emerald-600">Cooking steps</span> below.</p>
                                            </div>
                                            {!wizardProcessedData ? (
                                                <div className="w-full space-y-6">
                                                    <Textarea
                                                        className="min-h-[250px] text-lg font-medium border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/20 text-slate-900 dark:text-emerald-50 focus:border-emerald-500 rounded-3xl p-6 shadow-inner"
                                                        placeholder="1. Preheat oven... 2. Mix ingredients..."
                                                        value={magicPaste}
                                                        onChange={(e) => setMagicPaste(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        onClick={() => handleQuickInstructions(magicPaste)}
                                                        disabled={isWizardProcessing || !magicPaste.trim()}
                                                        className="w-full h-20 text-xl font-black bg-emerald-600 hover:bg-emerald-700 rounded-3xl shadow-xl shadow-emerald-200/50 transition-all hover:scale-[1.02] flex gap-3"
                                                    >
                                                        {isWizardProcessing ? "Analyzing Steps..." : "Process Instructions"} <Sparkles size={24} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
                                                    <div className="max-h-[400px] overflow-y-auto space-y-4 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                                                        {instructions.map((step, idx) => (
                                                            <div key={idx} className="flex gap-4 items-start">
                                                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-1">
                                                                    {idx + 1}
                                                                </div>
                                                                <p className="text-slate-700 font-medium leading-relaxed">{step}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <Button
                                                            onClick={() => {
                                                                setImportMode('manual');
                                                                setStep(2); // Show the final analysis dashboard
                                                            }}
                                                            className="w-full h-24 text-2xl font-black bg-slate-900 hover:bg-black text-white rounded-[2rem] shadow-2xl shadow-slate-300 transition-all hover:scale-[1.02] flex gap-3"
                                                        >
                                                            Finalize Masterpiece <ChefHat size={32} />
                                                        </Button>
                                                        <Button variant="ghost" className="text-slate-400 font-bold" onClick={() => setWizardProcessedData(null)}>
                                                            Not right? Re-paste steps
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-8 flex justify-between items-center text-slate-400 border-t border-slate-50">
                                    <button onClick={() => setImportMode('none')} className="font-bold hover:text-slate-600 flex items-center gap-1">
                                        <ArrowRight className="rotate-180" size={16} /> Cancel Wizard
                                    </button>
                                    <p className="text-xs uppercase font-black tracking-widest">Step {wizardStep} of 4</p>
                                </div>
                            </div>
                        )}

                        {importMode === 'manual' && step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <Label htmlFor="title">Recipe Title</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-emerald-600 h-7 text-xs font-bold gap-1 hover:bg-emerald-50"
                                                onClick={() => setShowMagicPaste(!showMagicPaste)}
                                            >
                                                <Wand2 size={12} />
                                                {showMagicPaste ? "Hide Magic Paste" : "Magic Import"}
                                            </Button>
                                        </div>

                                        {showMagicPaste ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <Textarea
                                                    placeholder="Paste your whole recipe here (Title, Ingredients, Instructions...)"
                                                    className="min-h-[200px] text-sm font-mono bg-slate-50 border-emerald-100 focus:border-emerald-500"
                                                    value={magicPaste}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMagicPaste(e.target.value)}
                                                />
                                                <Button
                                                    onClick={() => handleQuickDetails(magicPaste)}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 py-6 mb-2"
                                                    disabled={!magicPaste.trim()}
                                                >
                                                    <Sparkles size={18} />
                                                    Quick Detail Import
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleMagicImport}
                                                    className="w-full text-slate-400 text-[10px] hover:text-emerald-600"
                                                    disabled={!magicPaste.trim()}
                                                >
                                                    Try Full Recipe Scan Instead
                                                </Button>
                                            </div>
                                        ) : (
                                            <Input
                                                id="title"
                                                placeholder="e.g., Avocado Toast with Poached Egg"
                                                value={title}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                                className="text-lg py-6"
                                            />
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="mealType">Meal Type</Label>
                                                <select
                                                    id="mealType"
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                                                    value={mealType}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMealType(e.target.value as MealType)}
                                                >
                                                    <option value="breakfast">Breakfast</option>
                                                    <option value="lunch">Lunch</option>
                                                    <option value="dinner">Dinner</option>
                                                    <option value="snack">Snack</option>
                                                </select>
                                            </div>
                                            <div>
                                                <Label htmlFor="prepTime">Prep Time (min)</Label>
                                                <Input
                                                    id="prepTime"
                                                    type="number"
                                                    value={prepTime}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrepTime(parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Diet Type</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {['anything', 'vegetarian', 'vegan'].map(d => (
                                                    <button
                                                        key={d}
                                                        type="button"
                                                        onClick={() => {
                                                            if (d === 'anything') setDiet(['anything']);
                                                            else {
                                                                const filtered = diet.filter(x => x !== 'anything');
                                                                if (filtered.includes(d as any)) {
                                                                    const next = filtered.filter(x => x !== d);
                                                                    setDiet(next.length ? next : ['anything']);
                                                                } else {
                                                                    setDiet([...filtered, d as DietType]);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                                                            diet.includes(d as any)
                                                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                                        )}
                                                    >
                                                        {d.charAt(0) + d.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="image">Recipe Photo</Label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="file"
                                                        id="image-upload"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs font-bold gap-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                                                        onClick={() => document.getElementById('image-upload')?.click()}
                                                        disabled={uploading}
                                                    >
                                                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                        Upload Picture
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="relative group aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center transition-all hover:border-emerald-200">
                                                {image ? (
                                                    <>
                                                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-8 rounded-full"
                                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                            >
                                                                Change Photo
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-8 rounded-full"
                                                                onClick={() => setImage('')}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div
                                                        className="cursor-pointer flex flex-col items-center gap-3 text-slate-400 group-hover:text-emerald-500 transition-colors"
                                                        onClick={() => document.getElementById('image-upload')?.click()}
                                                    >
                                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                                            <Camera size={32} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="font-bold text-sm">Add a recipe photo</p>
                                                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">PNG, JPG or WEBP</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="imageUrl" className="text-[10px] uppercase font-black text-slate-400">Or use a web URL</Label>
                                                <Input
                                                    id="imageUrl"
                                                    placeholder="https://images.unsplash.com/..."
                                                    value={image.startsWith('data:') ? 'Local file selected' : image}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImage(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="servings">Servings</Label>
                                            <Input
                                                id="servings"
                                                type="number"
                                                value={servings}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServings(parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Next: Ingredients <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                                        <Scale size={20} className="text-emerald-500" />
                                        Analyze Ingredients
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-slate-500 italic hidden md:block mr-2">Match items to the food database for precision logic.</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-emerald-600 h-9 text-xs font-bold gap-1 hover:bg-emerald-50 border border-emerald-100"
                                            onClick={() => setShowMagicPaste(!showMagicPaste)}
                                        >
                                            <Wand2 size={14} />
                                            {showMagicPaste ? "Hide Magic Paste" : "Magic Import"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 border-emerald-600 text-white font-bold hover:bg-emerald-700 gap-2 h-9"
                                            onClick={() => autoMatchAll()}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                            Smart Match All
                                        </Button>
                                    </div>
                                </div>

                                {showMagicPaste && (
                                    <div className="mb-8 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="text-emerald-500" size={18} />
                                            <h3 className="font-bold text-emerald-800 text-sm uppercase tracking-wider">Magic Recipe Import</h3>
                                        </div>
                                        <Textarea
                                            placeholder="Paste your whole recipe here... Our AI-lite parser will try to extract ingredients even if they are on separate lines."
                                            className="min-h-[150px] text-sm font-mono bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-900 focus:border-emerald-500 text-foreground"
                                            value={magicPaste}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMagicPaste(e.target.value)}
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                onClick={() => handleQuickIngredients(magicPaste)}
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2"
                                                disabled={!magicPaste.trim()}
                                            >
                                                <Zap size={14} />
                                                Process & Auto-Match Ingredients
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {ingredients.map((ing, idx) => (
                                        <div key={idx} className="group relative bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-100 dark:hover:border-emerald-900">
                                            {/* Ingredient Inputs */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-5 space-y-1.5">
                                                    <Label className="text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Ingredient Item</Label>
                                                    <Input
                                                        value={ing.item}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const newIngs = [...ingredients];
                                                            newIngs[idx].item = e.target.value;
                                                            setIngredients(newIngs);
                                                        }}
                                                        placeholder="e.g. Whole wheat bread"
                                                        className="text-lg font-bold rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 bg-white dark:bg-slate-900"
                                                    />
                                                </div>

                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label className="text-[12px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Qty/Unit</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={ing.amount}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                const newIngs = [...ingredients];
                                                                newIngs[idx].amount = e.target.value;
                                                                // Recalculate weight if measure selected
                                                                if (newIngs[idx].selectedMeasure) {
                                                                    const qty = evaluateAmount(e.target.value);
                                                                    newIngs[idx].weightG = qty * newIngs[idx].selectedMeasure!.weight_g;
                                                                }
                                                                setIngredients(newIngs);
                                                            }}
                                                            placeholder="e.g. 2"
                                                            className="text-lg font-bold rounded-xl border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20 bg-white dark:bg-slate-900"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-1.5">
                                                    <Label className="text-[12px] font-black uppercase tracking-wider text-primary">Weight (g)</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            type="number"
                                                            value={ing.weightG || ''}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                const newIngs = [...ingredients];
                                                                newIngs[idx].weightG = parseFloat(e.target.value) || 0;
                                                                setIngredients(newIngs);
                                                            }}
                                                            placeholder="0"
                                                            className={cn(
                                                                "text-lg rounded-xl focus:border-primary font-black",
                                                                ing.parsedGrams
                                                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                                                                    : "border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary"
                                                            )}
                                                        />
                                                        <span className="absolute right-3 top-3 text-[10px] font-black text-primary/40 group-hover:text-primary transition-colors">G</span>
                                                    </div>
                                                    {ing.parsedGrams && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 font-black uppercase tracking-wider">
                                                                PARSED: {ing.parsedGrams}g
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="md:col-span-3 flex items-end pb-0.5 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className={cn(
                                                            "shrink-0 transition-all h-10 w-10",
                                                            ing.isMiracleProduct ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100" : "bg-white text-slate-400 border-slate-200"
                                                        )}
                                                        onClick={() => {
                                                            const newIngs = [...ingredients];
                                                            newIngs[idx].isMiracleProduct = !ing.isMiracleProduct;
                                                            setIngredients(newIngs);
                                                        }}
                                                        title="Mark as Miracle Product"
                                                    >
                                                        <Leaf size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "flex-grow transition-all h-10",
                                                            ing.matchedFood ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" : "border-slate-200 text-slate-600"
                                                        )}
                                                        onClick={() => {
                                                            // Clear previous context
                                                            setSearchResults([]);
                                                            setMeasures([]);
                                                            setSearchQuery(ing.item || ing.amount);

                                                            setActiveIngredientIndex(idx);
                                                            performSearch(ing.item || ing.amount);
                                                        }}
                                                    >
                                                        {ing.matchedFood ? <Check size={16} className="mr-2" /> : <Search size={16} className="mr-2" />}
                                                        {ing.matchedFood ? "Matched" : "Match Food"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeIngredient(idx)}
                                                        className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Remove Ingredient"
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {ing.matchedFood && (
                                                <div className="mt-4 p-6 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-900/50 shadow-inner">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-emerald-200 dark:shadow-none">
                                                                <Check size={28} strokeWidth={4} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[12px] font-black text-emerald-600/50 uppercase tracking-[0.2em]">Matched Recipe Item</span>
                                                                <span className="text-3xl font-black text-emerald-900 dark:text-emerald-300 tracking-tighter uppercase leading-none">
                                                                    {ing.matchedFood.name}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6 bg-white dark:bg-slate-900 px-8 py-4 rounded-3xl border-2 border-emerald-100 dark:border-emerald-800 shadow-sm">
                                                            <span className="text-5xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                                                                {Math.round(ing.weightG || 0)}
                                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest leading-none">G</span>
                                                            </span>
                                                            {ing.selectedMeasure && (
                                                                <Badge className="bg-emerald-600 text-white border-none font-black text-xs px-3 py-1.5 rounded-xl uppercase">
                                                                    {ing.selectedMeasure.label}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Measure Selection Chips moved inside this pretty container */}
                                                    {activeIngredientIndex === idx && measures.length > 0 && (
                                                        <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 pt-4 border-t border-emerald-100/50 dark:border-emerald-800/50">
                                                            {measures.map((m, mi) => (
                                                                <button
                                                                    key={mi}
                                                                    onClick={() => selectMeasure(m)}
                                                                    className={cn(
                                                                        "px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-full transition-all border-2",
                                                                        ing.selectedMeasure?.label === m.label
                                                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                                                                            : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500"
                                                                    )}
                                                                >
                                                                    {m.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={addIngredient}
                                    className="mt-6 w-full py-6 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-all font-medium"
                                >
                                    <Plus size={20} className="mr-2" /> Add Ingredient
                                </Button>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                    <Button onClick={() => setStep(3)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Next: Instructions <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Utensils size={20} className="text-emerald-500" />
                                        <h2 className="text-xl font-semibold text-slate-800">Cooking Instructions</h2>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-600 h-7 text-xs font-bold gap-1 hover:bg-emerald-50"
                                        onClick={() => setShowMagicPaste(!showMagicPaste)}
                                    >
                                        <Wand2 size={12} />
                                        {showMagicPaste ? "Hide Magic Paste" : "Magic Import"}
                                    </Button>
                                </div>

                                {showMagicPaste && (
                                    <div className="mb-6 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="text-emerald-500" size={18} />
                                            <h3 className="font-bold text-emerald-800 text-sm uppercase tracking-wider">Paste All Directions</h3>
                                        </div>
                                        <Textarea
                                            placeholder="Paste the cooking steps here. We will split them into individual steps automatically."
                                            className="min-h-[150px] text-sm font-mono bg-white border-emerald-200 focus:border-emerald-500"
                                            value={magicPaste}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMagicPaste(e.target.value)}
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                onClick={() => handleQuickInstructions(magicPaste)}
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2"
                                                disabled={!magicPaste.trim()}
                                            >
                                                <Zap size={14} />
                                                Process Instructions
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {instructions.map((text, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 mt-1">
                                                {idx + 1}
                                            </div>
                                            <textarea
                                                className="flex-grow min-h-[100px] p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all resize-none"
                                                placeholder="e.g., Mash the avocado in a small bowl with lemon juice and salt..."
                                                value={text}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                    const next = [...instructions];
                                                    next[idx] = e.target.value;
                                                    setInstructions(next);
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeInstruction(idx)} className="mt-1 text-slate-400 hover:text-red-500">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={addInstruction}
                                    className="w-full py-4 border-dashed border-2 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600 transition-all"
                                >
                                    <Plus size={18} className="mr-2" /> Add Step
                                </Button>

                                <div className="pt-8 border-t border-slate-100 flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                    <Button onClick={() => setStep(4)} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                                        Review Nutrition <ArrowRight className="ml-2" size={18} />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Recipe Analysis Summary</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                            <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-xs mb-4">Calculated Totals (Per Serving)</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Energy', val: calculateTotalNutrition().calories / servings, unit: 'kcal' },
                                                    { label: 'Energy (KJ)', val: (calculateTotalNutrition().calories / servings) * 4.184, unit: 'kJ' },
                                                    { label: 'Protein', val: calculateTotalNutrition().protein / servings, unit: 'g' },
                                                    { label: 'Carbs', val: calculateTotalNutrition().carbs / servings, unit: 'g' },
                                                    { label: 'Fat', val: calculateTotalNutrition().fat / servings, unit: 'g' },
                                                ].map(m => (
                                                    <div key={m.label} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50">
                                                        <p className="text-xs text-slate-400 font-medium mb-1">{m.label}</p>
                                                        <p className="text-xl font-bold text-slate-800">{Math.round(m.val)}{m.unit}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-4 pt-6 mt-6 border-t border-emerald-100">
                                                <h3 className="text-emerald-800 font-bold text-sm uppercase">Key Micronutrients</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(calculateTotalNutrition().micronutrients).slice(0, 24).map(([key, val]) => (
                                                        <div key={key} className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-xs flex justify-between gap-3 min-w-[120px]">
                                                            <span className="text-slate-500">{key}</span>
                                                            <span className="font-bold text-slate-800">{Math.round(val / servings * 10) / 10}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800">Structure Overview</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Title Match</span>
                                                    <span className={title ? "text-emerald-600" : "text-red-500"}>
                                                        {title ? <Check size={18} /> : "Missing Title"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Ingredients Mapped</span>
                                                    <span className="text-slate-800 font-bold">
                                                        {ingredients.filter(i => i.matchedFood).length} / {ingredients.length}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Instructions Count</span>
                                                    <span className="text-slate-800 font-bold">
                                                        {instructions.filter(i => i.trim()).length} Steps
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xl shadow-slate-200/50">
                                            <img src={image || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80'} alt="Recipe" className="w-full h-full object-cover" />
                                        </div>
                                        <Button onClick={saveRecipe} disabled={loading} className="w-full py-8 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                            Finalize & Upload
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-slate-100 flex justify-start">
                                    <Button variant="ghost" onClick={() => setStep(3)}>Back to Steps</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </main >

            {/* Slide-over for matching ingredients */}
            {
                activeIngredientIndex !== null && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveIngredientIndex(null)} />
                        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Match Ingredient</h3>
                                    <p className="text-sm text-slate-500 italic">Searching for "{searchQuery || ingredients[activeIngredientIndex].item}"</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setActiveIngredientIndex(null)}>
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <Input
                                        className="pl-10 h-12"
                                        placeholder="Search global food database..."
                                        value={searchQuery}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                                    />
                                </div>

                                {searching ? (
                                    <div className="flex flex-col items-center py-12 text-slate-400">
                                        <Loader2 className="animate-spin mb-2" />
                                        Searching...
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {searchResults.map((f, i) => (
                                            <button
                                                key={i}
                                                onClick={() => selectFood(f)}
                                                className={cn(
                                                    "w-full text-left p-4 rounded-xl border transition-all hover:shadow-md",
                                                    ingredients[activeIngredientIndex].matchedFood?.name === f.name
                                                        ? "border-emerald-500 bg-emerald-50"
                                                        : "border-slate-100 bg-white hover:border-emerald-200"
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-800 line-clamp-1">{f.name}</span>
                                                    <Badge variant="outline" className={f.source === 'local' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}>
                                                        {f.source.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-4 text-xs text-slate-500">
                                                    <span>
                                                        {energyUnit === 'kJ'
                                                            ? Math.round(f.energy_kcal * CAL_TO_KJ)
                                                            : Math.round(f.energy_kcal)} {energyUnit}
                                                    </span>
                                                    <span>P: {Math.round(f.protein_g)}g</span>
                                                    <span>C: {Math.round(f.carbs_g)}g</span>
                                                    <span>F: {Math.round(f.fat_g)}g</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {measures.length > 0 && ingredients[activeIngredientIndex].matchedFood && (
                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Scale size={18} className="text-emerald-500" />
                                            Pick a Conversion Measure
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {measures.map((m, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => selectMeasure(m)}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-sm transition-all",
                                                        ingredients[activeIngredientIndex].selectedMeasure?.label === m.label
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                                                    )}
                                                >
                                                    {m.label} ({m.weight_g}g)
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100">
                                <Button
                                    className="w-full py-6 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => setActiveIngredientIndex(null)}
                                    disabled={!ingredients[activeIngredientIndex].matchedFood}
                                >
                                    Confirm Match
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <Footer />
        </div >
    );
}

