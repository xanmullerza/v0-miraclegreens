"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient } from '@/components/recipe/ingredient-builder';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { ChefHat, Clock, Users, Save, Camera, Upload, Trash2, Loader2, Wand2, Sparkles, Zap, ArrowRight, ArrowLeft, Plus, ListOrdered, ChevronUp, ChevronDown, ClipboardList, Heart, Pencil } from 'lucide-react';
import { parseInstructionsOnly, parseRecipeText } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

export default function EditRecipePage() {
    const router = useRouter();
    const { id } = useParams();

    const [title, setTitle] = useState('');
    const [source, setSource] = useState('');
    const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [prepTime, setPrepTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [diet, setDiet] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [image, setImage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showMagicInstructions, setShowMagicInstructions] = useState(false);
    const [magicInstructionsText, setMagicInstructionsText] = useState('');
    const [showAutoImport, setShowAutoImport] = useState(false);
    const [autoImportText, setAutoImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isFavorite, setIsFavorite] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user ?? null);
            checkAdmin(session?.user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
            checkAdmin(session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = (user: any) => {
        if (user) {
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            const userEmail = (user.email || user.user_metadata?.email || '').toLowerCase();
            setIsAdmin(userEmail === adminEmail.toLowerCase() && adminEmail !== '');
        } else {
            setIsAdmin(false);
        }
    };


    useEffect(() => {
        if (id) {
            fetchRecipeData();
        }
    }, [id]);

    const fetchRecipeData = async () => {
        setLoading(true);
        try {
            const recipeId = Array.isArray(id) ? id[0] : id;
            if (!recipeId) throw new Error('No recipe ID provided');

            // Fetch Recipe details
            const { data: recipe, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single();

            if (recipeError) throw recipeError;

            // Fetch Ingredients
            const { data: ingData, error: ingError } = await supabase
                .from('ingredients')
                .select('*, food_item:food_items(*)')
                .eq('recipe_id', recipeId);

            if (ingError) throw ingError;

            // Fetch Instructions
            const { data: insData, error: insError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('step_order', { ascending: true });

            if (insError) throw insError;

            // Initialize State
            setTitle(recipe.title);
            setSource(recipe.source || '');
            setType(recipe.type as any);
            setPrepTime(recipe.prep_time);
            setServings(recipe.servings);
            setDiet(recipe.diet || []);
            setImage(recipe.image || '');
            setIsFavorite(recipe.is_favorite);

            // Map ingredients back to RecipeIngredient format
            const mappedIngredients: RecipeIngredient[] = ingData.map(ing => {
                const food = ing.food_item;
                const totalWeight = ing.weight_g * recipe.servings;
                const totalQty = ing.quantity * recipe.servings;
                const ratio = totalWeight / 100;

                // Get portions from the food_item (JSONB column)
                const portions = food?.portions || [];

                const base_nutrition = food ? {
                    calories: food.energy_kcal,
                    energy_kj: food.energy_kj || (food.energy_kcal * 4.184),
                    protein: food.protein_g,
                    fat: food.fat_g,
                    carbs: food.carbs_g,
                    micronutrients: food.micronutrients || {}
                } : undefined;

                return {
                    food_item_id: ing.food_item_id,
                    food_item_name: ing.item,
                    weight_g: totalWeight, // Builder works with total weights
                    quantity: totalQty,
                    measure_label: ing.measure_label,
                    modifier: ing.modifier,
                    calories: food ? food.energy_kcal * ratio : 0,
                    energy_kj: food ? (food.energy_kj || (food.energy_kcal * 4.184)) * ratio : 0,
                    protein: food ? food.protein_g * ratio : 0,
                    fat: food ? food.fat_g * ratio : 0,
                    carbs: food ? food.carbs_g * ratio : 0,
                    micronutrients: food ? Object.entries(food.micronutrients || {}).reduce((acc, [key, val]) => {
                        acc[key] = (val as number) * ratio;
                        return acc;
                    }, {} as Record<string, number>) : {},
                    base_nutrition,
                    // KEY FIX: Include available_measures from food_item.portions
                    available_measures: portions,
                    // Only set customUnitWeight if NOT using grams and no matching portion exists
                    customUnitWeight: (ing.measure_label !== 'g' && ing.weight_g > 0 && ing.quantity > 0)
                        ? (ing.weight_g / ing.quantity)
                        : undefined,
                };
            });
            setIngredients(mappedIngredients);

            setInstructions(insData.map(ins => ins.step_text));

        } catch (error: any) {
            console.error('Error fetching recipe:', error);
            toast.error(`Failed to load recipe: ${error.message}`);
            router.push('/dashboard/meal-o-matic/meals');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = fileName;

            const { data, error: uploadError } = await supabase.storage
                .from('recipes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
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

            const { data: { publicUrl } } = supabase.storage
                .from('recipes')
                .getPublicUrl(filePath);

            setImage(publicUrl);
            setUploading(false);
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddInstruction = () => {
        setInstructions([...instructions, '']);
    };

    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...instructions];
        updated[index] = value;
        setInstructions(updated);
    };

    const handleRemoveInstruction = (index: number) => {
        setInstructions(instructions.filter((_, i) => i !== index));
    };

    const handleMagicPasteInstructions = () => {
        if (!magicInstructionsText.trim()) return;
        const parsed = parseInstructionsOnly(magicInstructionsText);
        if (instructions.length === 1 && !instructions[0].trim()) {
            setInstructions(parsed);
        } else {
            setInstructions([...instructions, ...parsed]);
        }
        setMagicInstructionsText('');
        setShowMagicInstructions(false);
    };

    const handleAutoImport = async () => {
        if (!autoImportText.trim()) return;
        setIsImporting(true);

        try {
            const parsed = parseRecipeText(autoImportText);

            const parseAmount = (amountStr: string) => {
                const unicodeFractions: Record<string, number> = {
                    '¼': 0.25, '½': 0.5, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
                };
                const rawAmount = amountStr.trim();
                const qtyRegex = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅛⅜⅝⅞]))/;
                const qtyMatch = rawAmount.match(qtyRegex);

                let quantity = 1;
                let unit = 'piece';

                if (qtyMatch) {
                    const val = qtyMatch[1].trim();
                    let handled = false;
                    for (const [char, num] of Object.entries(unicodeFractions)) {
                        if (val.includes(char)) {
                            const parts = val.split(char);
                            const whole = parseFloat(parts[0].trim()) || 0;
                            quantity = whole + num;
                            handled = true;
                            break;
                        }
                    }

                    if (!handled) {
                        if (val.includes('/')) {
                            if (val.includes(' ')) {
                                const [whole, frac] = val.split(' ');
                                const [n, d] = frac.split('/').map(Number);
                                quantity = (Number(whole) || 0) + (n / d);
                            } else {
                                const [n, d] = val.split('/').map(Number);
                                quantity = n / (d || 1);
                            }
                        } else {
                            quantity = Number(val) || 1;
                        }
                    }
                    const unitPart = rawAmount.slice(val.length).trim().replace(/[,:;]$/, '').toLowerCase();
                    if (unitPart) unit = unitPart;
                } else {
                    unit = rawAmount.replace(/[,:;]$/, '').toLowerCase() || 'piece';
                }
                return { quantity, unit };
            };

            if (parsed.title) setTitle(parsed.title);
            setServings(parsed.servings || 4);
            setPrepTime(parsed.prepTime || 30);
            setInstructions(parsed.instructions);

            const rawIngredients: RecipeIngredient[] = [];

            for (const ing of parsed.ingredients) {
                const itemName = ing.item.trim();
                const STOP_WORDS = ['whole', 'large', 'medium', 'small', 'piece', 'unit', 'portion', 'slice', 'chopped', 'diced', 'minced'];
                if (!itemName || itemName.length < 2 || /^\d+$/.test(itemName) || STOP_WORDS.includes(itemName.toLowerCase())) continue;

                const searchQuery = itemName.replace(/[,;:]\s*$/, '').trim();
                let match = null;

                const localResults = await searchLocalFood(searchQuery);
                if (localResults.length > 0) {
                    match = localResults[0];
                } else {
                    const usdaResults = await searchUSDAFood(searchQuery);
                    if (usdaResults.length > 0) {
                        const usdaMatch = usdaResults[0];
                        const measuresArr = usdaMatch.fdcId ? await getUSDAMeasures(usdaMatch.fdcId) : [];
                        const localId = await syncToLocal(usdaMatch, measuresArr, currentUser?.id, isAdmin);

                        if (localId) {
                            match = { ...usdaMatch, id: localId, source: 'local' };
                        } else {
                            match = usdaMatch;
                        }
                    }
                }

                const { quantity, unit } = parseAmount(ing.amount);

                const cleanFoodName = (name: string, existingModifier: string) => {
                    let finalName = name.trim();
                    let finalModifier = existingModifier;
                    if (finalName.toLowerCase().startsWith('eggs, grade a, large')) {
                        finalName = 'Eggs';
                    }
                    const artifacts = [', raw', ', fresh', ', dry', ', dried', ', frozen'];
                    for (const art of artifacts) {
                        if (finalName.toLowerCase().includes(art)) {
                            finalName = finalName.replace(new RegExp(art, 'gi'), '').trim();
                            const cleanArt = art.replace(/, /, '').trim();
                            if (!finalModifier.toLowerCase().includes(cleanArt)) {
                                finalModifier = finalModifier ? `${cleanArt}, ${finalModifier}` : cleanArt;
                            }
                        }
                    }
                    if (finalName.includes(',') && finalName.length > 20) {
                        const parts = finalName.split(',');
                        const secondPart = parts[1].trim().toLowerCase();
                        if (['chopped', 'diced', 'minced', 'boiled', 'cooked', 'unprepared'].includes(secondPart)) {
                            finalName = parts[0].trim();
                        }
                    }
                    return { finalName, finalModifier };
                };

                if (match) {
                    const { finalName, finalModifier } = cleanFoodName(match.name, ing.modifier || '');
                    const isGrams = unit.includes('g') && !unit.includes('cup');
                    const weight = ing.weightG || (isGrams ? quantity : 100);
                    const ratio = weight / 100;

                    rawIngredients.push({
                        food_item_id: match.id || 'temp-id',
                        food_item_name: finalName,
                        weight_g: weight,
                        quantity: quantity,
                        measure_label: unit,
                        modifier: finalModifier,
                        calories: Math.round(match.energy_kcal * ratio),
                        energy_kj: Math.round(match.energy_kj * ratio),
                        protein: Number((match.protein_g * ratio).toFixed(1)),
                        fat: Number((match.fat_g * ratio).toFixed(1)),
                        carbs: Number((match.carbs_g * ratio).toFixed(1)),
                        micronutrients: Object.entries((match as any).micronutrients || {}).reduce((acc, [key, val]) => {
                            acc[key] = (val as number) * ratio;
                            return acc;
                        }, {} as Record<string, number>),
                        customUnitWeight: (weight > 0 && quantity > 0) ? (weight / quantity) : undefined,
                    });
                } else {
                    const { finalName, finalModifier } = cleanFoodName(itemName, ing.modifier || '');
                    rawIngredients.push({
                        food_item_id: 'temp-id',
                        food_item_name: finalName,
                        weight_g: ing.weightG || (unit.includes('g') ? quantity : 0),
                        quantity: quantity,
                        measure_label: unit,
                        modifier: finalModifier,
                        calories: 0,
                        energy_kj: 0,
                        protein: 0,
                        fat: 0,
                        carbs: 0,
                        micronutrients: {},
                        customUnitWeight: (ing.weightG || 0) > 0 && quantity > 0 ? (ing.weightG! / quantity) : undefined,
                    });
                }
            }

            const mergedIngredients: RecipeIngredient[] = [];
            const keyToIndex = new Map<string, number>();

            for (const ing of rawIngredients) {
                const key = ing.food_item_name.toLowerCase().replace(/[,:;]/g, '').trim();
                if (keyToIndex.has(key)) {
                    const idx = keyToIndex.get(key)!;
                    const existing = mergedIngredients[idx];
                    existing.weight_g += ing.weight_g;
                    existing.calories += ing.calories;
                    existing.energy_kj += ing.energy_kj;
                    existing.protein = Number((existing.protein + ing.protein).toFixed(1));
                    existing.fat = Number((existing.fat + ing.fat).toFixed(1));
                    existing.carbs = Number((existing.carbs + ing.carbs).toFixed(1));

                    // Merge micronutrients
                    Object.entries(ing.micronutrients || {}).forEach(([mKey, mVal]) => {
                        existing.micronutrients[mKey] = (existing.micronutrients[mKey] || 0) + (mVal as number);
                    });

                    if (existing.measure_label === ing.measure_label) {
                        existing.quantity += ing.quantity;
                    } else {
                        existing.measure_label = 'g';
                        existing.quantity = existing.weight_g;
                    }
                    if (ing.modifier && existing.modifier !== ing.modifier) {
                        existing.modifier = existing.modifier ? `${existing.modifier}, ${ing.modifier}` : ing.modifier;
                    }
                } else {
                    keyToIndex.set(key, mergedIngredients.length);
                    mergedIngredients.push({ ...ing });
                }
            }

            setIngredients(mergedIngredients);
            setAutoImportText('');
            setShowAutoImport(false);
            toast.success('Recipe imported!');
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to parse recipe.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i.trim()).length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const tempIngredients = ingredients.filter(ing => ing.food_item_id === 'temp-id');
            const updatedIngredients = [...ingredients];

            if (tempIngredients.length > 0) {
                for (const ing of tempIngredients) {
                    const { data: newItem, error: itemError } = await supabase
                        .from('food_items')
                        .insert({
                            name: ing.food_item_name,
                            common_name: ing.food_item_name,
                            energy_kcal: ing.calories / (ing.weight_g / 100 || 1),
                            energy_kj: ing.energy_kj / (ing.weight_g / 100 || 1),
                            protein_g: ing.protein / (ing.weight_g / 100 || 1),
                            carbs_g: ing.carbs / (ing.weight_g / 100 || 1),
                            fat_g: ing.fat / (ing.weight_g / 100 || 1),
                            micronutrients: {}
                        })
                        .select()
                        .single();

                    if (!itemError && newItem) {
                        const idx = updatedIngredients.findIndex(ui => ui === ing);
                        if (idx !== -1) {
                            updatedIngredients[idx] = { ...ing, food_item_id: newItem.id };
                        }
                    }
                }
            }

            const totals = updatedIngredients.reduce(
                (acc, ing) => {
                    const newMicros = { ...acc.micronutrients };
                    Object.entries(ing.micronutrients || {}).forEach(([key, val]) => {
                        const match = findNutrientMatch(newMicros, key) || key;
                        newMicros[match] = (newMicros[match] || 0) + (val as number);
                    });

                    return {
                        calories: acc.calories + ing.calories,
                        energy_kj: acc.energy_kj + ing.energy_kj,
                        protein: acc.protein + ing.protein,
                        fat: acc.fat + ing.fat,
                        carbs: acc.carbs + ing.carbs,
                        micronutrients: newMicros
                    };
                },
                { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> }
            );

            const recipeId = Array.isArray(id) ? id[0] : id;

            // Update Recipe
            const { error: recipeError } = await supabase
                .from('recipes')
                .update({
                    title,
                    type,
                    calories: Math.round(totals.calories / (servings || 1)),
                    energy_kj: Math.round(totals.energy_kj / (servings || 1)),
                    protein: Math.round((totals.protein / (servings || 1)) * 10) / 10,
                    fat: Math.round((totals.fat / (servings || 1)) * 10) / 10,
                    carbs: Math.round((totals.carbs / (servings || 1)) * 10) / 10,
                    diet,
                    prep_time: prepTime,
                    servings,
                    image,
                    source,
                    is_favorite: isFavorite,
                    micronutrients: Object.entries(totals.micronutrients || {}).reduce((acc, [k, v]) => {
                        acc[k] = (v as number) / (servings || 1);
                        return acc;
                    }, {} as Record<string, number>),
                } as any)
                .eq('id', recipeId);

            if (recipeError) throw recipeError;

            // Delete existing ingredients and instructions and replace them
            await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
            await supabase.from('instructions').delete().eq('recipe_id', recipeId);

            const ingredientsData = updatedIngredients.map(ing => ({
                recipe_id: recipeId,
                food_item_id: ing.food_item_id,
                item: ing.food_item_name,
                amount: `${scaleIngredient(`${ing.quantity} ${ing.measure_label}`, 1 / (servings || 1))}${ing.modifier ? ' ' + ing.modifier : ''}`.trim(),
                weight_g: ing.weight_g / (servings || 1),
                quantity: ing.quantity / (servings || 1),
                measure_label: ing.measure_label,
                base_ingredient: ing.food_item_name,
                modifier: ing.modifier,
            }));

            const { error: ingredientsError } = await supabase
                .from('ingredients')
                .insert(ingredientsData);

            if (ingredientsError) throw ingredientsError;

            const instructionsData = instructions
                .filter(stepText => stepText.trim())
                .map((stepText, index) => ({
                    recipe_id: recipeId,
                    step_text: stepText,
                    step_order: index + 1,
                }));

            const { error: instructionsError } = await supabase
                .from('instructions')
                .insert(instructionsData);

            if (instructionsError) throw instructionsError;

            toast.success('Recipe updated successfully!');
            router.push(`/dashboard/meal-o-matic/meals/${recipeId}`);
        } catch (error: any) {
            console.error('Error updating recipe:', error);
            toast.error(`Failed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-violet-500" size={48} />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Loading Recipe...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">
            {/* Top Navigation & Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowAutoImport(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2 px-4 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-violet-500/20"
                    >
                        <Zap size={14} className="text-yellow-300 fill-current" />
                        Quick Import
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Step 1: Core Ingredients */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <Plus className="w-5 h-5 text-violet-500" />
                            Ingredients
                        </h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {ingredients.length} items added
                        </Badge>
                    </div>
                    <IngredientBuilder
                        ingredients={ingredients}
                        onChange={setIngredients}
                    />
                </Card>

                {/* Step 2: Instructions */}
                <Card className="p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <ListOrdered className="w-5 h-5 text-amber-500" />
                            Cooking Steps
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowMagicInstructions(!showMagicInstructions)}
                                className="text-[10px] uppercase font-black tracking-widest gap-2 bg-amber-500/5 text-amber-600 border-amber-500/20"
                            >
                                <Wand2 size={14} /> Paste Steps
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddInstruction}
                                className="text-[10px] uppercase font-black tracking-widest gap-2"
                            >
                                <Plus size={14} /> Add Step
                            </Button>
                        </div>
                    </div>

                    {showMagicInstructions && (
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Paste Method Content Below</p>
                            <textarea
                                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
                                placeholder="Paste multiple steps here..."
                                value={magicInstructionsText}
                                onChange={(e) => setMagicInstructionsText(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" className="text-xs text-slate-400" onClick={() => setShowMagicInstructions(false)}>Cancel</Button>
                                <Button onClick={handleMagicPasteInstructions} className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] font-black uppercase tracking-widest px-8 shadow-lg shadow-amber-500/20">Get Steps</Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {instructions.map((stepText, index) => (
                            <div key={index} className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center font-black text-sm text-slate-400 group-hover:bg-violet-500 group-hover:text-white transition-all cursor-move">
                                    {index + 1}
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={stepText}
                                        onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 focus:border-violet-500/50 rounded-xl p-4 text-sm min-h-[80px] transition-all resize-none"
                                        placeholder={`Explain instruction step ${index + 1}...`}
                                    />
                                    {instructions.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveInstruction(index)}
                                            className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Metadata Section */}
                <Card className="p-8 space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                        <ClipboardList size={20} className="text-violet-500" />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Recipe Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Title</Label>
                                <Input
                                    className="font-bold text-lg h-12 bg-slate-50 dark:bg-slate-950"
                                    placeholder="The Golden Bowl..."
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Clock size={12} /> Prep (min)
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-10 bg-slate-50 dark:bg-slate-950 font-bold"
                                        value={prepTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrepTime(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Users size={12} /> Servings
                                    </Label>
                                    <Input
                                        type="number"
                                        className="h-10 bg-slate-50 dark:bg-slate-950 font-bold"
                                        value={servings}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServings(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meal Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setType(m as any)}
                                            className={cn(
                                                "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                type === m
                                                    ? "bg-violet-500 text-white border-violet-600 shadow-md shadow-violet-500/20"
                                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diet Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Balanced (Omnivore)', 'Pescetarian', 'Vegetarian', 'Vegan'].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => {
                                                if (diet.includes(d)) {
                                                    setDiet(diet.filter(item => item !== d));
                                                } else {
                                                    setDiet([...diet, d]);
                                                }
                                            }}
                                            className={cn(
                                                "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border px-2",
                                                diet.includes(d)
                                                    ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                                            )}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collection</Label>
                                <button
                                    onClick={() => setIsFavorite(!isFavorite)}
                                    className={cn(
                                        "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                                        isFavorite
                                            ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
                                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                                    )}
                                >
                                    <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                                    {isFavorite ? "In My Collection" : "Add to My Collection"}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end pt-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-8 space-y-6">
                            {/* Photo Upload Block */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Camera size={12} /> Recipe Photo
                                </Label>
                                <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-violet-500/50 transition-all flex flex-col items-center justify-center">
                                    {image ? (
                                        <>
                                            <img src={image} alt="Recipe" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button variant="secondary" size="sm" className="gap-2" onClick={() => setImage('')}>
                                                    <Trash2 size={14} /> Remove
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-center p-4 pointer-events-none">
                                                {uploading ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Photo</p>
                                                    </>
                                                )}
                                            </div>
                                            {!uploading && (
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                    onChange={handleImageUpload}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/20 h-16 rounded-2xl font-black uppercase tracking-widest group text-lg"
                                    disabled={saving}
                                    onClick={handleSave}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save className="mr-2 group-hover:scale-125 transition-transform" />}
                                    Update Recipe
                                </Button>
                                <p className="text-center text-[10px] text-slate-400 tracking-tighter uppercase px-4">
                                    Updating this recipe will instantly refresh its nutrition profile across your meal library.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Auto-Import Drawer */}
            <Sheet open={showAutoImport} onOpenChange={setShowAutoImport}>
                <SheetContent side="right" className="w-[600px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0">
                    <div className="h-full flex flex-col">
                        <div className="p-10 bg-violet-500 text-white">
                            <div className="flex items-center gap-4 mb-2">
                                <Zap size={40} className="text-yellow-300 fill-current" />
                                <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-white">Smart Import</SheetTitle>
                            </div>
                            <SheetDescription className="text-violet-50 opacity-80 text-lg">
                                Paste any recipe text (ingredients & steps) below. Our tool will automatically find the nutrition details.
                            </SheetDescription>
                        </div>
                        <div className="flex-1 p-10 flex flex-col gap-6">
                            <div className="flex-1 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Raw Recipe Content</Label>
                                <textarea
                                    className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all resize-none"
                                    placeholder="Paste ingredient list and instructions here..."
                                    value={autoImportText}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAutoImportText(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full h-16 rounded-3xl bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-lg shadow-2xl shadow-violet-600/20"
                                onClick={handleAutoImport}
                                disabled={isImporting}
                            >
                                {isImporting ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-3" />}
                                {isImporting ? 'Saving...' : 'Recalibrate Recipe'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
