"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

    const instructionsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);

    // Load recipe if editing
    useEffect(() => {
        if (recipeIdToEdit) {
            const loadRecipe = async () => {
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

                        // Map ingredients
                        if (recipe.ingredients) {
                            const mappedIngs: RecipeIngredient[] = recipe.ingredients.map((ing: any) => ({
                                food_item_id: ing.food_item_id,
                                food_item_name: ing.item || ing.food_item_name || 'Ingredient',
                                weight_g: ing.weight_g,
                                quantity: ing.quantity,
                                measure_label: ing.measure_label,
                                modifier: ing.modifier,
                                calories: ing.calories || 0,
                                energy_kj: ing.energy_kj || 0,
                                protein: ing.protein || 0,
                                fat: ing.fat || 0,
                                carbs: ing.carbs || 0,
                                micronutrients: ing.micronutrients || {},
                                base_nutrition: ing.base_nutrition || {
                                    calories: ing.food_item?.energy_kcal || 0,
                                    energy_kj: ing.food_item?.energy_kj || 0,
                                    protein: ing.food_item?.protein_g || 0,
                                    fat: ing.food_item?.fat_g || 0,
                                    carbs: ing.food_item?.carbs_g || 0,
                                    micronutrients: ing.food_item?.micronutrients || {},
                                    phytonutrients: ing.food_item?.phytonutrients || {}
                                }
                            }));
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
                }
            };
            loadRecipe();
        }
    }, [recipeIdToEdit]);

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
        // ... (Simpler image upload or keep existing)
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        // For now, use reader as placeholder if storage bucket not ready, or implement full upload
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setUploading(false);
        };
        reader.readAsDataURL(file);
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
                id: editingRecipeId || undefined
            };

            await saveRecipe(recipeData, ingredients, instructions);
            toast.success('Protocol saved successfully!');
            router.push('/dashboard/library/recipes');
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Protocol Builder</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{user ? 'Cloud Sync Enabled' : 'Local Storage Mode'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowAutoImport(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-lg shadow-violet-500/20"
                    >
                        <Database className="w-3 h-3" />
                        <span>Smart Protocol Import</span>
                    </Button>
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="h-12 border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                <Card className="p-8 space-y-6">
                    <IngredientBuilder
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
                                        <button onClick={() => handleRemoveInstruction(index)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
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
                                <Button className="w-full bg-violet-600 h-16 rounded-2xl font-black uppercase tracking-widest" disabled={saving} onClick={handleSave}>
                                    {saving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Save Protocol
                                </Button>
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
        </div>
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
