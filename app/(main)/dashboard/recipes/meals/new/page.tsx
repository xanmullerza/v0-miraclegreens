"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import IngredientBuilder, { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';
import { LibraryHeroSearch } from '@/components/recipe/library-hero-search';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { ChefHat, Clock, Users, Save, Camera, Upload, Trash2, Loader2, Wand2, Sparkles, Zap, ArrowRight, ArrowLeft, Plus, ListOrdered, ChevronUp, ChevronDown, ClipboardList, Heart, Library, Scale, Database, Calendar, Beaker } from 'lucide-react';
import { parseInstructionsOnly, parseRecipeText } from '@/lib/utils/recipe-parser';
import { searchLocalFood, searchUSDAFood, getUSDAMeasures, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { supabase } from '@/lib/supabase';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { toast } from 'sonner';


const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode, className?: string }>(({ children, className }, ref) => (
    <div ref={ref} className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
));
Card.displayName = "Card";

function UserRecipeBuilder() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const recipeIdToEdit = searchParams.get('edit');
    const { user, saveRecipe, getRecipe, loading: authLoading } = useDataPersistence();

    const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [source, setSource] = useState('');
    const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('dinner');
    const [prepTime, setPrepTime] = useState(30);
    const [servings, setServings] = useState(4);
    const [diet, setDiet] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [isMix, setIsMix] = useState(false);
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
    const [startMode, setStartMode] = useState<'none' | 'smart' | 'magic' | 'manual'>('none');
    const [instructionsMode, setInstructionsMode] = useState<'none' | 'magic' | 'manual'>('none');
    const [loadingRecipe, setLoadingRecipe] = useState(false);

    const instructionsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const builderRef = useRef<IngredientBuilderHandle>(null);

    // Initial state from URL
    useEffect(() => {
        if (searchParams.get('is_mix') === 'true') {
            setIsMix(true);
        }
    }, [searchParams]);

    // Load recipe if editing
    useEffect(() => {
        if (recipeIdToEdit) {
            const loadRecipe = async () => {
                setLoadingRecipe(true);
                try {
                    const recipe = await getRecipe(recipeIdToEdit);
                    if (recipe) {
                        setEditingRecipeId(recipe.id);
                        setTitle(recipe.title);
                        setSource(recipe.source || '');
                        setType(recipe.type as any);
                        setPrepTime(recipe.prep_time);
                        setServings(recipe.servings);
                        setDiet(recipe.diet || []);
                        setImage(recipe.image || '');
                        setIsFavorite(recipe.is_favorite);
                        setIsMix(recipe.is_mix || false);

                        // Map ingredients
                        if (recipe.ingredients) {
                            const mappedIngs: RecipeIngredient[] = recipe.ingredients.map((ing: any) => {
                                const food = ing.food_item;
                                // DB stores per-serving, Builder needs total
                                const servs = recipe.servings || 1;
                                const totalWeight = (ing.weight_g || 0) * servs;
                                const totalQty = (ing.quantity || 0) * servs;
                                const ratio = totalWeight / 100;

                                return {
                                    food_item_id: ing.food_item_id,
                                    food_item_name: ing.item || ing.food_item_name || 'Ingredient',
                                    weight_g: totalWeight,
                                    quantity: totalQty,
                                    measure_label: ing.measure_label,
                                    modifier: ing.modifier,
                                    calories: (food?.energy_kcal || 0) * ratio,
                                    energy_kj: (food?.energy_kj || (food?.energy_kcal || 0) * 4.184) * ratio,
                                    protein: (food?.protein_g || 0) * ratio,
                                    fat: (food?.fat_g || 0) * ratio,
                                    carbs: (food?.carbs_g || 0) * ratio,
                                    micronutrients: food?.micronutrients ? Object.entries(food.micronutrients).reduce((acc, [k, v]) => {
                                        acc[k] = (Number(v) || 0) * ratio;
                                        return acc;
                                    }, {} as Record<string, number>) : {},
                                    base_nutrition: {
                                        calories: food?.energy_kcal || 0,
                                        energy_kj: food?.energy_kj || (food?.energy_kcal || 0) * 4.184,
                                        protein: food?.protein_g || 0,
                                        fat: food?.fat_g || 0,
                                        carbs: food?.carbs_g || 0,
                                        micronutrients: food?.micronutrients || {},
                                        phytonutrients: food?.phytonutrients || {}
                                    }
                                };
                            });
                            setIngredients(mappedIngs);
                        }

                        // Map instructions
                        if (recipe.instructions) {
                            const sortedInst = [...recipe.instructions].sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
                            setInstructions(sortedInst.map((i: any) => i.step_text));
                        }

                        setStep(3); // Jump to details view if editing
                    }
                } catch (error) {
                    console.error("Failed to load recipe for editing", error);
                    toast.error("Failed to load recipe for editing");
                } finally {
                    setLoadingRecipe(false);
                }
            };
            loadRecipe();
        }
    }, [recipeIdToEdit]);

    const handleImportSelect = (item: any) => {
        if (builderRef.current) {
            builderRef.current.handleAddIngredient(item);
            toast.success(`Imported "${item.name}" from Library`);
        }
    };

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
                // Fallback to data URL if upload fails (e.g. bucket missing)
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImage(reader.result as string);
                    setUploading(false);
                };
                reader.readAsDataURL(file);
                return;
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

    const handleAddInstruction = () => setInstructions([...instructions, '']);
    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...instructions];
        updated[index] = value;
        setInstructions(updated);
    };
    const handleRemoveInstruction = (index: number) => setInstructions(instructions.filter((_, i) => i !== index));

    const handleMagicPasteInstructions = () => {
        if (!magicInstructionsText.trim()) return;
        const parsed = parseInstructionsOnly(magicInstructionsText);
        setInstructions(prev => prev.length === 1 && !prev[0].trim() ? parsed : [...prev, ...parsed]);
        setShowMagicInstructions(false);
    };

    const handleAutoImport = async () => {
        if (!autoImportText.trim()) return;
        setIsImporting(true);
        try {
            const parsed = parseRecipeText(autoImportText);
            if (parsed.title) setTitle(parsed.title);
            setServings(parsed.servings || 4);
            setPrepTime(parsed.prepTime || 30);
            setInstructions(parsed.instructions);
            // ... (Ingredient parsing logic similar to admin builder)
            // For now, simpler notification
            toast.success('Protocol layout imported! Review and calibrate ingredients below.');
            setShowAutoImport(false);
            setStep(3);
        } catch (error) {
            toast.error('Failed to parse recipe.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i.trim()).length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const totals = ingredients.reduce((acc, ing) => ({
                calories: acc.calories + ing.calories,
                energy_kj: acc.energy_kj + ing.energy_kj,
                protein: acc.protein + ing.protein,
                fat: acc.fat + ing.fat,
                carbs: acc.carbs + ing.carbs,
            }), { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0 });

            const recipeData = {
                title,
                type,
                calories: Math.round(totals.calories / (servings || 1)),
                protein: Math.round((totals.protein / (servings || 1)) * 10) / 10,
                carbs: Math.round((totals.carbs / (servings || 1)) * 10) / 10,
                fat: Math.round((totals.fat / (servings || 1)) * 10) / 10,
                diet,
                prep_time: prepTime,
                servings,
                image,
                source,
                is_favorite: isFavorite,
                is_mix: isMix,
                id: editingRecipeId || undefined
            };

            await saveRecipe(recipeData, ingredients, instructions);
            toast.success(`${isMix ? 'Mix' : 'Protocol'} saved successfully!`);
            router.push(`/dashboard/ingredients/${isMix ? 'mixes' : 'recipes'}`);
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loadingRecipe || authLoading) {
        return (
            <div className="max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic animate-pulse">
                    Initializing Protocol Workspace...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">

            <LibraryHeroSearch
                onSelect={handleImportSelect}
                placeholder="FAST IMPORT LIBRARY INGREDIENTS..."
            />

            <div className="space-y-8">
                <Card className="p-8 space-y-6">
                    <IngredientBuilder
                        ref={builderRef}
                        ingredients={ingredients}
                        onChange={setIngredients}
                        initialShowPicker={!recipeIdToEdit}
                        onNext={handleNextStep}
                    />
                </Card>

                {step >= 2 && (
                    <Card className="p-8 space-y-6" ref={instructionsRef}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-3">
                                <ListOrdered className="w-5 h-5 text-amber-500" />
                                Cooking Steps
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddInstruction}
                                className="text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                <Plus size={14} /> Add Step
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {instructions.map((stepText, index) => (
                                <div key={index} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center font-black text-sm text-slate-400">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={stepText}
                                            onChange={(e) => handleUpdateInstruction(index, e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500/50 rounded-xl p-4 text-sm min-h-[80px] transition-all resize-none"
                                            placeholder={`Step ${index + 1}...`}
                                        />
                                        <button onClick={() => handleRemoveInstruction(index)} className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                            <Button onClick={handleToDetails} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl">Next: Recipe Details <ArrowRight size={14} /></Button>
                        </div>
                    </Card>
                )}

                {step >= 3 && (
                    <Card className="p-8 space-y-8" ref={detailsRef}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Title</Label>
                                <Input className="font-bold text-lg h-12" value={title} onChange={(e) => setTitle(e.target.value)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} />
                                    <Input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold flex items-center gap-2">
                                            <Beaker size={14} className="text-indigo-500" />
                                            Save as Mix
                                        </Label>
                                        <p className="text-[10px] text-slate-500 font-medium">Makes this item available as an ingredient in other recipes.</p>
                                    </div>
                                    <Switch
                                        checked={isMix}
                                        onCheckedChange={setIsMix}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                </div>

                                <Button
                                    className={cn(
                                        "w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all",
                                        isMix ? "bg-indigo-600 hover:bg-indigo-700" : "bg-violet-600 hover:bg-violet-700"
                                    )}
                                    disabled={saving}
                                    onClick={handleSave}
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                                    Save {isMix ? 'Mix' : 'Protocol'}
                                </Button>
                            </div>

                            <div className="flex flex-col justify-end pt-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-8 space-y-6">
                                {/* Photo Upload Block */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Camera size={12} /> Recipe Photo
                                    </Label>
                                    <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-violet-500/50 transition-all">
                                        {image ? (
                                            <div className="w-full h-full relative">
                                                <img src={image} alt="Recipe" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" className="gap-2" onClick={() => setImage('')}>
                                                        <Trash2 size={14} /> Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                <div className="text-center p-4">
                                                    {uploading ? (
                                                        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Upload Photo</p>
                                                        </>
                                                    )}
                                                </div>
                                                {!uploading && (
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                )}
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 tracking-tighter uppercase px-4 pt-2">
                                        Optional: Add a visual reference for this {isMix ? 'mix' : 'protocol'}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            <Sheet open={showAutoImport} onOpenChange={setShowAutoImport}>
                <SheetContent side="right" className="w-[600px]">
                    <SheetHeader><SheetTitle>Smart Import</SheetTitle></SheetHeader>
                    <div className="p-6 space-y-4">
                        <textarea className="w-full h-80 p-4 border rounded-xl" value={autoImportText} onChange={(e) => setAutoImportText(e.target.value)} />
                        <Button className="w-full h-12" onClick={handleAutoImport} disabled={isImporting}>Import</Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div >
    );
}

export default function UserRecipeBuilderPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        }>
            <UserRecipeBuilder />
        </Suspense>
    );
}
