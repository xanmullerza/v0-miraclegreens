'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IngredientBuilder, { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';
import { LibraryHeroSearch } from '@/components/recipe/library-hero-search';
import {
    ChefHat, Clock, Users, Save, Camera, Upload, Trash2, Loader2,
    ArrowRight, Plus, ListOrdered, Beaker, X
} from 'lucide-react';
import { parseInstructionsOnly, parseRecipeText } from '@/lib/utils/recipe-parser';
import { downloadAndUploadRecipeImage } from '@/lib/utils/recipe-image-upload';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

interface RecipeFormDialogProps {
    onClose: () => void;
    onSave?: () => void;
    isMix?: boolean;
    initialData?: {
        title?: string;
        source?: string;
        type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
        prepTime?: number;
        servings?: number;
        ingredients_text?: string;
        instructions_text?: string;
        image?: string;
    };
}

export function RecipeFormDialog({ onClose, onSave, isMix: initialIsMix = false, initialData }: RecipeFormDialogProps) {
    const router = useRouter();
    const { user, saveRecipe, loading: authLoading } = useDataPersistence();

    const [title, setTitle] = useState(initialData?.title || '');
    const [source, setSource] = useState(initialData?.source || '');
    const [type, setType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(initialData?.type || 'dinner');
    const [prepTime, setPrepTime] = useState(initialData?.prepTime || 30);
    const [servings, setServings] = useState(initialData?.servings || 4);
    const [diet, setDiet] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [isMix, setIsMix] = useState(initialIsMix);
    const [instructions, setInstructions] = useState<string[]>(
        initialData?.instructions_text 
            ? initialData.instructions_text.split('\n').filter(i => i?.trim?.())
            : ['']
    );
    const [image, setImage] = useState(initialData?.image || '');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [tags, setTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(true);
    const [step, setStep] = useState(1);
    const [recipeUrl, setRecipeUrl] = useState('');
    const [parsingleUrl, setParsingUrl] = useState(false);

    // Process initial ingredients if provided
    useEffect(() => {
        if (initialData?.ingredients_text && ingredients.length === 0) {
            // Parse ingredients text later when builder is ready
            // For now, we'll let the user manually add them or import from the text
        }
    }, [initialData, ingredients.length]);

    const instructionsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const builderRef = useRef<IngredientBuilderHandle>(null);

    const handleImportSelect = (item: any) => {
        if (builderRef.current) {
            builderRef.current.handleAddIngredient(item);
            toast.success(`Imported "${item.common_name || item.name}" from Library`);
        }
    };

    const handleParseRecipeURL = async () => {
        if (!recipeUrl?.trim?.()) {
            toast.error('Please enter a recipe URL');
            return;
        }

        setParsingUrl(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || 'anonymous';

            // Call n8n webhook to parse recipe
            const response = await fetch('https://vitalagreens.app.n8n.cloud/webhook/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: recipeUrl,
                    userId: userId,
                    contentType: 'recipe-url'
                })
            });

            if (!response.ok) throw new Error(`Parse error: ${response.status}`);
            const data = await response.json();

            if (data.recipe) {
                // Populate form with parsed data
                setTitle(data.recipe.title || '');
                setSource(recipeUrl);
                setPrepTime(data.recipe.prep_time || 30);
                setServings(data.recipe.servings || 4);
                setInstructions(
                    (data.recipe.instructions_text || '')
                        .split('\n')
                        .filter((i: string) => i?.trim?.())
                        .filter((i: string) => i) || ['']
                );

                // Download and upload recipe image if available
                if (data.recipe.image_url) {
                    setUploading(true);
                    try {
                        const uploadedImageUrl = await downloadAndUploadRecipeImage(
                            data.recipe.image_url,
                            data.recipe.title || 'Recipe'
                        );
                        if (uploadedImageUrl) {
                            setImage(uploadedImageUrl);
                            toast.success('Recipe image uploaded!');
                        } else {
                            // If download fails, show it as data URL or skip
                            // Just let the user upload manually
                            console.log('Could not auto-upload image, user can upload manually');
                        }
                    } catch (imgError) {
                        console.error('Image upload error:', imgError);
                        // Continue anyway, image is optional
                    } finally {
                        setUploading(false);
                    }
                }
                
                setRecipeUrl('');
                toast.success('Recipe parsed! Fill in the remaining details and ingredients.');
                setStep(2);
                setTimeout(() => {
                    instructionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                toast.error('Could not parse recipe from URL. Try pasting the recipe text directly.');
            }
        } catch (error) {
            console.error('Recipe URL parsing error:', error);
            toast.error('Failed to parse recipe URL. Please try again.');
        } finally {
            setParsingUrl(false);
        }
    };

    const handleNextStep = () => {
        setStep(2);
        setTimeout(() => {
            instructionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    const handleToDetails = () => {
        setStep(3);
        setTimeout(() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                const reader = new FileReader();
                reader.onloadend = () => { setImage(reader.result as string); setUploading(false); };
                reader.readAsDataURL(file);
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('recipes').getPublicUrl(filePath);
            setImage(publicUrl);
            setUploading(false);
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => { setImage(reader.result as string); setUploading(false); };
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

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i?.trim?.()).length === 0) {
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
                difficulty,
                tags,
            };

            await saveRecipe(recipeData, ingredients, instructions);
            toast.success(`${isMix ? 'Mix' : 'Meal'} saved successfully!`);
            onClose();
            onSave?.();
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic animate-pulse">
                    Initializing...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header with Close Button */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {isMix ? 'Add New Mix' : 'Add New Meal'}
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 flex items-center justify-center transition-all"
                >
                    <X size={16} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
                {/* Recipe URL Import */}
                <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40">
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                            <Upload size={12} /> Import from Recipe URL
                        </h3>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                value={recipeUrl}
                                onChange={(e) => setRecipeUrl(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleParseRecipeURL()}
                                placeholder="Paste recipe URL (AllRecipes, BBC Food, etc)..."
                                className="text-xs bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-800/40 focus:border-emerald-400"
                                disabled={parsingleUrl}
                            />
                            <Button
                                onClick={handleParseRecipeURL}
                                disabled={!recipeUrl.trim() || parsingleUrl}
                                className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-10 rounded-lg"
                            >
                                {parsingleUrl ? <Loader2 size={14} className="animate-spin" /> : 'Parse'}
                            </Button>
                        </div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Or manually enter ingredients and instructions below
                        </p>
                    </div>
                </Card>

                {/* Library Search */}
                <LibraryHeroSearch
                    onSelect={handleImportSelect}
                    placeholder="FAST IMPORT LIBRARY INGREDIENTS..."
                />

                <div className="space-y-6">
                    {/* Step 1: Ingredient Builder */}
                    <Card className="p-6 space-y-6">
                        <IngredientBuilder
                            ref={builderRef}
                            ingredients={ingredients}
                            onChange={setIngredients}
                            initialShowPicker={true}
                            onNext={handleNextStep}
                        />
                    </Card>

                    {/* Step 2: Cooking Steps */}
                    {step >= 2 && (
                        <Card className="p-6 space-y-6" ref={instructionsRef}>
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
                            <div className="flex justify-center pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Button onClick={handleToDetails} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl">
                                    Next: Details <ArrowRight size={14} />
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Step 3: Details */}
                    {step >= 3 && (
                        <Card className="p-6 space-y-8" ref={detailsRef}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Title</Label>
                                        <Input className="font-bold text-lg h-12" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isMix ? "e.g. Green Smoothie Base" : "e.g. Grilled Chicken Salad"} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prep Time (min)</Label>
                                            <Input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servings</Label>
                                            <Input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold flex items-center gap-2">
                                                <Beaker size={14} className="text-indigo-500" />
                                                Save as Mix
                                            </Label>
                                            <p className="text-[10px] text-slate-500 font-medium">Makes this available as an ingredient in other recipes.</p>
                                        </div>
                                        <Switch
                                            checked={isMix}
                                            onCheckedChange={setIsMix}
                                            className="data-[state=checked]:bg-indigo-600"
                                        />
                                    </div>

                                    {/* Difficulty Selection */}
                                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty</Label>
                                        <div className="flex gap-2">
                                            {['Easy', 'Medium', 'Hard'].map((diff) => (
                                                <button
                                                    key={diff}
                                                    type="button"
                                                    onClick={() => setDifficulty(diff as any)}
                                                    className={cn(
                                                        "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                        difficulty === diff
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300"
                                                    )}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tags Selection */}
                                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Tags</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {['#Quick', '#Budget', '#Keto', '#Vegan', '#Vegetarian', '#Gluten-Free', '#BatchCook'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
                                                        else setTags([...tags, tag]);
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                                                        tags.includes(tag)
                                                            ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-300"
                                                    )}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
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
                                        Save {isMix ? 'Mix' : 'Meal'}
                                    </Button>
                                </div>

                                <div className="flex flex-col justify-end pt-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-8 space-y-6">
                                    {/* Photo Upload */}
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
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
