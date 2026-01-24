"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient } from '@/components/recipe/ingredient-builder';
import { ChefHat, Clock, Users, Save, Camera, Upload, Trash2, Loader2, Wand2, Sparkles, Zap, ArrowRight, ArrowLeft, Plus, ListOrdered } from 'lucide-react';
import { Header } from '@/components/header';
import { parseInstructionsOnly, parseRecipeText } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures } from '@/lib/services/nutrition';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function CreateRecipePage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [prepTime, setPrepTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [diet, setDiet] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [image, setImage] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showMagicInstructions, setShowMagicInstructions] = useState(false);
    const [magicInstructionsText, setMagicInstructionsText] = useState('');
    const [showAutoImport, setShowAutoImport] = useState(false);
    const [autoImportText, setAutoImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [step, setStep] = useState(1);

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
        // If we only have one empty instruction, replace it. Otherwise append.
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

            // 1. Basic Info
            if (parsed.title) setTitle(parsed.title);
            setServings(parsed.servings || 4);
            setPrepTime(parsed.prepTime || 30);
            setInstructions(parsed.instructions);

            // 2. Ingredients - This is more complex because we need nutrition data
            const rawIngredients: RecipeIngredient[] = [];

            for (const ing of parsed.ingredients) {
                const itemName = ing.item.trim();
                const STOP_WORDS = ['whole', 'large', 'medium', 'small', 'piece', 'unit', 'portion', 'slice', 'chopped', 'diced', 'minced'];
                if (!itemName || itemName.length < 2 || /^\d+$/.test(itemName) || STOP_WORDS.includes(itemName.toLowerCase())) continue;

                // Try to find nutrition data
                const searchQuery = itemName.replace(/[,;:]\s*$/, '').trim();
                let match = null;

                // Local search first
                const localResults = await searchLocalFood(searchQuery);
                if (localResults.length > 0) {
                    match = localResults[0];
                } else {
                    // USDA search
                    const usdaResults = await searchUSDAFood(searchQuery);
                    if (usdaResults.length > 0) {
                        match = usdaResults[0];
                    }
                }

                const { quantity, unit } = parseAmount(ing.amount);

                const cleanFoodName = (name: string, existingModifier: string) => {
                    let finalName = name.trim();
                    let finalModifier = existingModifier;

                    // 1. Handle common verbose USDA "Eggs" pattern
                    if (finalName.toLowerCase().startsWith('eggs, grade a, large')) {
                        finalName = 'Eggs';
                    }

                    // 2. Generic cleaning for trailing artifacts
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

                    // 3. Remove trailing verbose list fragments if name is still long
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

                    // Calculate nutrients (simplified for now, using 100g base if gram-based)
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
                        customUnitWeight: (weight > 0 && quantity > 0) ? (weight / quantity) : undefined,
                    });
                } else {
                    // Placeholder ingredient if no match found
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
                        customUnitWeight: (ing.weightG || 0) > 0 && quantity > 0 ? (ing.weightG! / quantity) : undefined,
                    });
                }
            }

            // Combine duplicates (e.g. Moringa Powder listed twice)
            const mergedIngredients: RecipeIngredient[] = [];
            const keyToIndex = new Map<string, number>();

            for (const ing of rawIngredients) {
                const key = ing.food_item_name.toLowerCase().replace(/[,:;]/g, '').trim();
                if (keyToIndex.has(key)) {
                    const idx = keyToIndex.get(key)!;
                    const existing = mergedIngredients[idx];

                    // Sum up weight and nutrition
                    existing.weight_g += ing.weight_g;
                    existing.calories += ing.calories;
                    existing.energy_kj += ing.energy_kj;
                    existing.protein = Number((existing.protein + ing.protein).toFixed(1));
                    existing.fat = Number((existing.fat + ing.fat).toFixed(1));
                    existing.carbs = Number((existing.carbs + ing.carbs).toFixed(1));

                    // If units match, sum quantity. If not, switch to grams as final unit.
                    if (existing.measure_label === ing.measure_label) {
                        existing.quantity += ing.quantity;
                    } else {
                        existing.measure_label = 'g';
                        existing.quantity = existing.weight_g;
                    }

                    // Append modifier if different
                    if (ing.modifier && existing.modifier !== ing.modifier) {
                        existing.modifier = existing.modifier ? `${existing.modifier}, ${ing.modifier}` : ing.modifier;
                    }
                } else {
                    keyToIndex.set(key, mergedIngredients.length);
                    mergedIngredients.push({ ...ing });
                }
            }

            setIngredients(mergedIngredients);

            // 3. Image - One shot "add a picture"
            // We'll use a high-quality placeholder based on the title
            const keywords = title.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 3).join(',');
            setImage(`https://loremflickr.com/1200/800/${encodeURIComponent(keywords || 'healthy,food')},recipe/all`);

            // Cleanup
            setAutoImportText('');
            setShowAutoImport(false);
            alert('Recipe imported! We have matched ingredients and added a placeholder image.');
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to parse recipe. Please check the format.');
        } finally {
            setIsImporting(false);
        }
    };

    const toggleDiet = (dietType: string) => {
        setDiet(prev =>
            prev.includes(dietType)
                ? prev.filter(d => d !== dietType)
                : [...prev, dietType]
        );
    };

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i.trim()).length === 0) {
            alert('Please fill in all required fields');
            return;
        }

        setSaving(true);

        try {
            // Calculate total nutrition
            const totals = ingredients.reduce(
                (acc, ing) => ({
                    calories: acc.calories + ing.calories,
                    energy_kj: acc.energy_kj + ing.energy_kj,
                    protein: acc.protein + ing.protein,
                    fat: acc.fat + ing.fat,
                    carbs: acc.carbs + ing.carbs,
                }),
                { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 }
            );

            // Generate recipe ID
            const recipeId = `recipe-${Date.now()}`;

            // Create recipe record
            // Note: energy_kj is included, but requires the DB column to exist.
            // If the insert fails due to missing column, we'll catch it.
            const { error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    id: recipeId,
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
                });

            if (recipeError) {
                console.error('Recipe insert error:', recipeError);
                throw new Error(`Recipes error: ${recipeError.message}`);
            }

            // Insert ingredients - Normalize to 1 serving for the database
            const ingredientsData = ingredients.map(ing => {
                const normalizedQty = ing.quantity / (servings || 1);
                const normalizedWeight = ing.weight_g / (servings || 1);

                // Scale the textual amount string to match 1 serving
                const originalAmount = `${ing.quantity} ${ing.measure_label || 'g'}`.trim();
                const normalizedAmount = scaleIngredient(originalAmount, 1 / (servings || 1));

                return {
                    recipe_id: recipeId,
                    food_item_id: ing.food_item_id === 'temp-id' ? null : ing.food_item_id,
                    item: ing.food_item_name,
                    amount: `${normalizedAmount}${ing.modifier ? ' ' + ing.modifier : ''}`.trim(),
                    weight_g: normalizedWeight,
                    quantity: normalizedQty,
                    measure_label: ing.measure_label,
                    base_ingredient: ing.food_item_name,
                    modifier: ing.modifier,
                };
            });

            const { error: ingredientsError } = await supabase
                .from('ingredients')
                .insert(ingredientsData);

            if (ingredientsError) {
                throw new Error(`Ingredients error: ${ingredientsError.message}`);
            }

            // Optional: Save new measures to the global database if they don't exist
            // This allows the system to "learn" that "1 cup spinach = 30g"
            const newMeasures = ingredients
                .filter(ing => ing.food_item_id !== 'temp-id' && ing.measure_label && ing.measure_label !== 'g' && ing.quantity > 0 && ing.weight_g > 0)
                .map(ing => ({
                    food_item_id: ing.food_item_id,
                    label: ing.measure_label.toLowerCase().trim(),
                    weight_g: ing.weight_g / ing.quantity // Calculate unit weight
                }));

            if (newMeasures.length > 0) {
                // Use upsert to avoid errors if it already exists, but key collision might block insert
                // The unique constraint is likely (food_item_id, label)
                await supabase
                    .from('food_measures')
                    .upsert(newMeasures, { onConflict: 'food_item_id, label', ignoreDuplicates: true })
                    .then(({ error }) => {
                        if (error) console.warn("Auto-save measures warning:", error.message);
                    });
            }

            // Insert instructions
            const instructionsData = instructions
                .filter(step => step.trim())
                .map((step, index) => ({
                    recipe_id: recipeId,
                    step_text: step,
                    step_order: index + 1,
                }));

            const { error: instructionsError } = await supabase
                .from('instructions')
                .insert(instructionsData);

            if (instructionsError) {
                throw new Error(`Instructions error: ${instructionsError.message}`);
            }

            // Success!
            alert('Recipe created successfully!');
            router.push('/plan');
        } catch (error: any) {
            console.error('Error creating recipe:', error);
            alert(`Failed to create recipe: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-2">
                        <ChefHat className="w-8 h-8 text-green-600" />
                        <h1 className="text-3xl font-bold text-foreground">Create New Recipe</h1>
                    </div>
                    <p className="text-muted-foreground max-w-lg mb-4">
                        Build your recipe with precise nutrition tracking using our food database
                    </p>
                    <Button
                        onClick={() => setShowAutoImport(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-md group transition-all"
                    >
                        <Zap className="w-4 h-4 mr-2 text-yellow-300 group-hover:scale-125 transition-transform" />
                        One-Shot Auto Import
                    </Button>
                </div>

                <div className="space-y-6">
                    {step === 1 ? (
                        <>
                            {/* Step 1 Content: The Recipe */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <IngredientBuilder
                                    ingredients={ingredients}
                                    onChange={setIngredients}
                                />
                            </div>

                            <div className="bg-card rounded-xl shadow-sm p-6 space-y-4 text-foreground">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <ListOrdered className="w-5 h-5 text-amber-500" />
                                        Instructions
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowMagicInstructions(!showMagicInstructions)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-md group transition-all px-3 h-10 rounded-lg flex items-center justify-center gap-2 w-40 text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                                        >
                                            <Wand2 className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                                            Magic Paste
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddInstruction}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none shadow-md group transition-all px-3 h-10 rounded-lg flex items-center justify-center gap-2 w-40 text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                                        >
                                            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                            Add Instruction
                                        </button>
                                    </div>
                                </div>

                                {showMagicInstructions && (
                                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/40 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Paste Full Method Below</span>
                                        </div>
                                        <textarea
                                            value={magicInstructionsText}
                                            onChange={(e) => setMagicInstructionsText(e.target.value)}
                                            placeholder="Paste multiple steps here... We'll automatically split them by line numbers or paragraphs."
                                            className="w-full h-32 p-4 text-sm border border-slate-800 bg-slate-950/60 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-3 placeholder:text-slate-600"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowMagicInstructions(false)}
                                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleMagicPasteInstructions}
                                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-200 hover:bg-amber-600 active:scale-95 transition-all"
                                            >
                                                Break Into Steps
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {instructions.map((step, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                                                {index + 1}
                                            </div>
                                            <textarea
                                                value={step}
                                                onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                                placeholder={`Step ${index + 1}...`}
                                                className="flex-1 px-4 py-2 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                                rows={2}
                                            />
                                            {instructions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveInstruction(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className="px-6 py-3 bg-background/50 text-foreground rounded-lg hover:bg-muted transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (ingredients.length === 0) {
                                            alert("Please add at least one ingredient first");
                                            return;
                                        }
                                        setStep(2);
                                        window.scrollTo(0, 0);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Next: Add Basic Details
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step 2 Content: Identity & Metadata */}
                            <div className="bg-card rounded-xl shadow-sm p-6 space-y-4 text-foreground">
                                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                                {/* Meal Type moved to Quick Facts */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Recipe Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Grilled Chicken with Roasted Vegetables"
                                        className="w-full px-4 py-2 bg-background/50 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="pt-4 border-t border-border/50">
                                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                                        Recipe Photo
                                    </label>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="hidden">
                                            <input
                                                type="file"
                                                id="recipe-image-upload"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                        <div
                                            className="relative group w-full md:w-64 aspect-video md:aspect-square rounded-xl border-2 border-dashed border-border/20 overflow-hidden bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-all"
                                            onClick={() => document.getElementById('recipe-image-upload')?.click()}
                                        >
                                            {image ? (
                                                <>
                                                    <img src={image} alt="Recipe Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            className="p-2 bg-white rounded-full text-foreground hover:bg-green-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                document.getElementById('recipe-image-upload')?.click();
                                                            }}
                                                        >
                                                            <Camera size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setImage('');
                                                            }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-2 text-muted-foreground group-hover:text-green-600 transition-colors">
                                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                                    </div>
                                                    <p className="text-xs font-bold text-muted-foreground group-hover:text-green-700">Add Photo</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Adding a photo makes your recipe more engaging. Upload a clear, bright picture of the finished dish for best results.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('recipe-image-upload')?.click()}
                                                disabled={uploading}
                                                className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition"
                                            >
                                                <Upload size={16} />
                                                {uploading ? 'Processing...' : (image ? 'Change Picture' : 'Select File')}
                                            </button>

                                            <div className="pt-2">
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                                                    Or Image URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={image.startsWith('data:') ? '' : image}
                                                    onChange={(e) => setImage(e.target.value)}
                                                    placeholder="https://images.unsplash.com/..."
                                                    className="w-full px-3 py-1.5 text-sm bg-background/50 text-foreground rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                                        Dietary Suitability *
                                    </label>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {[
                                            { id: 'balanced', label: 'Balanced (Omnivore)', tags: [] },
                                            { id: 'vegetarian', label: 'Vegetarian', tags: ['vegetarian'] },
                                            { id: 'vegan', label: 'Vegan', tags: ['vegan', 'vegetarian'] }
                                        ].map(option => {
                                            const isSelected = option.id === 'balanced'
                                                ? (!diet.includes('vegan') && !diet.includes('vegetarian'))
                                                : (option.id === 'vegan' ? diet.includes('vegan') : (diet.includes('vegetarian') && !diet.includes('vegan')));

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const others = diet.filter(d => d !== 'vegan' && d !== 'vegetarian');
                                                        setDiet([...others, ...option.tags]);
                                                    }}
                                                    className={`p-3 rounded-lg border-2 text-sm font-bold transition flex items-center justify-center text-center ${isSelected
                                                        ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Additional Tags (Optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['gluten-free', 'dairy-free', 'low-carb', 'nut-free', 'high-protein'].map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleDiet(tag)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${diet.includes(tag)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Facts */}
                            <div className="bg-card rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    Quick Facts
                                </h2>

                                <div className="mb-8">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                                        Meal Type *
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['breakfast', 'lunch', 'dinner', 'snack'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setType(m as any)}
                                                className={`p-3 rounded-xl border-2 text-sm font-bold transition flex items-center justify-center text-center capitalize ${type === m
                                                        ? 'border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                                        : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-muted/30 p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-600">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                                Prep Time (min)
                                            </label>
                                            <input
                                                type="number"
                                                value={prepTime}
                                                onChange={(e) => setPrepTime(Number(e.target.value))}
                                                className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                                                Yield / Servings
                                            </label>
                                            <input
                                                type="number"
                                                value={servings}
                                                onChange={(e) => setServings(Number(e.target.value))}
                                                className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        window.scrollTo(0, 0);
                                    }}
                                    className="px-6 py-3 bg-background/50 text-foreground rounded-lg hover:bg-muted transition flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Recipe
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : 'Save Recipe'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Auto Import Sheet */}
            <Sheet open={showAutoImport} onOpenChange={setShowAutoImport}>
                <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full p-6">
                    <SheetHeader className="flex-shrink-0">
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            Magic Auto-Import
                        </SheetTitle>
                        <SheetDescription>
                            Paste a full recipe (Title, Ingredients, and Instructions) and we'll structured it for you using AI-powered matching.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 min-h-0 py-6 overflow-hidden flex flex-col">
                        <div className="flex-1 flex flex-col min-h-0">
                            <Textarea
                                placeholder="Paste the full recipe text here (Title, Ingredients, and Instructions)..."
                                className="flex-1 font-mono text-sm resize-none bg-slate-950/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-200 placeholder:text-slate-500 p-4 rounded-xl"
                                value={autoImportText}
                                onChange={(e) => setAutoImportText(e.target.value)}
                            />
                        </div>
                    </div>

                    <SheetFooter className="flex-shrink-0">
                        <Button
                            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            onClick={handleAutoImport}
                            disabled={isImporting || !autoImportText.trim()}
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Analyzing Recipe...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Import Magic
                                </>
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

