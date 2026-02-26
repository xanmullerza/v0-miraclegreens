"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import IngredientBuilder, { RecipeIngredient } from '@/components/recipe/ingredient-builder';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { ChefHat, Clock, Users, Save, Camera, Upload, Trash2, Loader2, Wand2, Sparkles, Zap, ArrowRight, ArrowLeft, Plus, ListOrdered, ChevronUp, ChevronDown, ClipboardList, Heart, Library, Scale, Database, Calendar } from 'lucide-react';
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

const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode, className?: string }>(({ children, className }, ref) => (
    <div ref={ref} className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
));
Card.displayName = "Card";

export default function RecipeBuilderPage() {
    const router = useRouter();

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
    const [uploading, setUploading] = useState(false);
    const [showMagicInstructions, setShowMagicInstructions] = useState(false);
    const [magicInstructionsText, setMagicInstructionsText] = useState('');
    const [showAutoImport, setShowAutoImport] = useState(false);
    const [autoImportText, setAutoImportText] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [step, setStep] = useState(1);
    const [isFavorite, setIsFavorite] = useState(true);
    const [isStarted, setIsStarted] = useState(true);
    const [startMode, setStartMode] = useState<'none' | 'smart' | 'magic' | 'manual'>('none');
    const [instructionsMode, setInstructionsMode] = useState<'none' | 'magic' | 'manual'>('none');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    React.useEffect(() => {
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


    const instructionsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);

    const handleNextStep = () => {
        setStep(2);
        setTimeout(() => {
            instructionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleToDetails = () => {
        setStep(3);
        setTimeout(() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
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

                    const base_nutrition = {
                        calories: match.energy_kcal,
                        energy_kj: match.energy_kj || (match.energy_kcal * 4.184),
                        protein: match.protein_g,
                        fat: match.fat_g,
                        carbs: match.carbs_g,
                        micronutrients: (match as any).micronutrients || {}
                    };

                    rawIngredients.push({
                        food_item_id: match.id || 'temp-id',
                        food_item_name: finalName,
                        weight_g: weight,
                        quantity: quantity,
                        measure_label: unit,
                        modifier: finalModifier,
                        calories: match.energy_kcal * ratio,
                        energy_kj: (match.energy_kj || (match.energy_kcal * 4.184)) * ratio,
                        protein: match.protein_g * ratio,
                        fat: match.fat_g * ratio,
                        carbs: match.carbs_g * ratio,
                        micronutrients: Object.entries(base_nutrition.micronutrients).reduce((acc, [key, val]) => {
                            acc[key] = (val as number) * ratio;
                            return acc;
                        }, {} as Record<string, number>),
                        base_nutrition,
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
            setStep(3);
            alert('Recipe imported!');
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to parse recipe.');
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
                            energy_kcal: ing.calories,
                            energy_kj: ing.energy_kj,
                            protein_g: ing.protein,
                            carbs_g: ing.carbs,
                            fat_g: ing.fat,
                            micronutrients: {},
                            portions: (ing.measure_label && ing.measure_label !== 'g' && ing.measure_label !== 'kg' && ing.measure_label !== 'ml' && ing.weight_g > 0 && ing.quantity > 0)
                                ? [{ label: ing.measure_label, weight_g: ing.weight_g / ing.quantity }]
                                : []
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

            const recipeId = `recipe-${Date.now()}`;
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
                    source,
                    is_favorite: isFavorite,
                    micronutrients: Object.entries(totals.micronutrients || {}).reduce((acc, [k, v]) => {
                        acc[k] = (v as number) / (servings || 1);
                        return acc;
                    }, {} as Record<string, number>),
                });

            if (recipeError) throw recipeError;

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

            alert('Recipe created successfully!');
            router.push('/dashboard/ingredients/meals');
        } catch (error: any) {
            console.error('Error creating recipe:', error);
            alert(`Failed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };
    /* Welcome screen removed for unified builder experience */

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">
            {/* Back Button - Hidden as breadcrumbs are sufficient */}
            {/* <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
            >
                <ArrowLeft size={14} /> Back to Admin
            </button> */}

            {/* Sub-Hero Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Protocol Builder</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Clinical Nuance & Precision Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowAutoImport(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-lg shadow-violet-500/20 group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-all">
                            <Database className="w-3 h-3" />
                        </div>
                        <span>Smart Protocol Import</span>
                    </Button>
                    <Button
                        onClick={() => router.push('/admin')}
                        variant="outline"
                        className="h-12 border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                </div>
            </div>

            {/* Sub-Hero Actions - Hidden as handled by initialization screen */}
            {/* <div className="flex justify-start">
                <Button
                    onClick={() => setShowAutoImport(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-sm group"
                >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
                        <Database className="w-4 h-4" />
                    </div>
                    <span>Smart Import From URL / Text</span>
                </Button>
            </div> */}

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
                        initialShowPicker={startMode === 'manual'}
                        initialShowMagicPaste={startMode === 'magic'}
                        onNext={handleNextStep}
                    />
                </Card>

                {/* Step 2: Instructions */}
                {step >= 2 && (
                    <Card className="p-8 space-y-6" ref={instructionsRef}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-3">
                                <ListOrdered className="w-5 h-5 text-amber-500" />
                                Cooking Steps
                            </h3>
                            {instructionsMode !== 'none' && (
                                <div className="flex gap-2">
                                    {instructionsMode === 'magic' ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowMagicInstructions(!showMagicInstructions)}
                                            className="text-[10px] uppercase font-black tracking-widest gap-2 bg-amber-500/5 text-amber-600 border-amber-500/20"
                                        >
                                            <Wand2 size={14} /> Paste Steps
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddInstruction}
                                            className="text-[10px] uppercase font-black tracking-widest gap-2"
                                        >
                                            <Plus size={14} /> Add Step
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {instructionsMode === 'none' ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-8 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="text-center space-y-2">
                                    <h4 className="text-xl font-black uppercase tracking-tighter">Define the Method</h4>
                                    <p className="text-sm font-medium text-slate-500">Choose how to document the clinical preparation steps</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setInstructionsMode('magic');
                                            setShowMagicInstructions(true);
                                        }}
                                        className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                            <Wand2 size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-xs uppercase tracking-widest mb-1">Magic Paste</div>
                                            <div className="text-[10px] text-slate-500 font-bold leading-tight">Paste full text instructions for automated parsing</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setInstructionsMode('manual')}
                                        className="p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 transition-all group flex flex-col items-center gap-4 w-64 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                            <Plus size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-black text-xs uppercase tracking-widest mb-1">Manual Build</div>
                                            <div className="text-[10px] text-slate-500 font-bold leading-tight">Add cooking steps precisely one by one</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500/50 rounded-xl p-4 text-sm min-h-[80px] transition-all resize-none"
                                                    placeholder={`Explain instruction step ${index + 1}...`}
                                                />
                                                {instructions.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveInstruction(index)}
                                                        className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        onClick={handleToDetails}
                                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-amber-500/20"
                                    >
                                        Next: Recipe Details <ArrowRight size={14} />
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card>
                )}

                {/* Metadata Section */}
                {step >= 3 && (
                    <Card className="p-8 space-y-8" ref={detailsRef}>
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
                                        {isFavorite ? "Added to My Meals" : "Add to My Meals"}
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
                                        Save Recipe
                                    </Button>
                                    <p className="text-center text-[10px] text-slate-400 tracking-tighter uppercase px-4">
                                        By saving, this recipe and its nutrition data will be added to your recipe box.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
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
                                {isImporting ? 'Saving...' : 'Create Recipe'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
