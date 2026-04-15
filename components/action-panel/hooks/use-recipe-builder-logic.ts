import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RecipeIngredient } from '@/components/recipe/builder/types';
import { IngredientBuilderHandle } from '@/components/recipe/builder/types';

export function useRecipeBuilderLogic({
    onSaveSuccess
}: {
    onSaveSuccess?: (recipeData: any, ingredients: RecipeIngredient[], instructions: string[]) => Promise<void>;
}) {
    const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeType, setRecipeType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement'>('dinner');
    const [recipePrepTime, setRecipePrepTime] = useState(30);
    const [recipeCookTime, setRecipeCookTime] = useState(0);
    const [recipeServings, setRecipeServings] = useState(4);
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
    const [recipeInstructions, setRecipeInstructions] = useState<string[]>(['']);
    const [recipeImage, setRecipeImage] = useState('');
    const [recipeSaving, setRecipeSaving] = useState(false);
    const [recipeUploading, setRecipeUploading] = useState(false);
    const [recipeStep, setRecipeStep] = useState(1);
    const [isMix, setIsMix] = useState(false);
    const [isRemix, setIsRemix] = useState(false);
    const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);

    const builderRef = useRef<IngredientBuilderHandle>(null);

    const handleManualRecipeCreation = () => {
        setShowRecipeBuilder(true);
        setRecipeStep(1);
        setRecipeTitle('');
        setRecipeType('dinner');
        setRecipePrepTime(30);
        setRecipeCookTime(0);
        setRecipeServings(4);
        setRecipeIngredients([]);
        setRecipeInstructions(['']);
        setRecipeImage('');
        setIsMix(false);
        setIsRemix(false);
        setEditingRecipeId(null);
    };

    const handleRecipeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setRecipeUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `user-uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('recipes')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw new Error("Upload Failed");

            const { data: { publicUrl } } = supabase.storage
                .from('recipes')
                .getPublicUrl(filePath);

            setRecipeImage(publicUrl);
        } catch (err: any) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRecipeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } finally {
            setRecipeUploading(false);
        }
    };

    const handleSaveRecipe = async (forceIsMix?: boolean, forceIsRemix?: boolean) => {
        const finalIsMix = forceIsMix !== undefined ? forceIsMix : isMix;
        const finalIsRemix = forceIsRemix !== undefined ? forceIsRemix : isRemix;

        if (!recipeTitle || recipeIngredients.length === 0 || recipeInstructions.filter(i => i.trim()).length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        setRecipeSaving(true);
        try {
            const totals = recipeIngredients.reduce((acc, ing) => {
                const multiplier = (ing.weight_g || 0) / 100;
                const newMicros = { ...acc.micronutrients };
                Object.entries(ing.micronutrients || {}).forEach(([key, val]) => {
                    newMicros[key] = (newMicros[key] || 0) + (val as number) * multiplier;
                });
                return {
                    calories: acc.calories + ((ing.calories || 0) * multiplier),
                    energy_kj: acc.energy_kj + ((ing.energy_kj || 0) * multiplier),
                    protein: acc.protein + ((ing.protein || 0) * multiplier),
                    fat: acc.fat + ((ing.fat || 0) * multiplier),
                    carbs: acc.carbs + ((ing.carbs || 0) * multiplier),
                    micronutrients: newMicros,
                };
            }, { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> });

            const recipeData = {
                title: recipeTitle,
                type: recipeType,
                calories: Math.round(totals.calories),
                energy_kj: Math.round(totals.energy_kj),
                protein: Math.round(totals.protein * 10) / 10,
                carbs: Math.round(totals.carbs * 10) / 10,
                fat: Math.round(totals.fat * 10) / 10,
                micronutrients: totals.micronutrients,
                prep_time: recipePrepTime,
                cook_time: recipeCookTime,
                servings: recipeServings,
                image: recipeImage,
                source: 'manual',
                is_favorite: true,
                is_mix: finalIsMix,
                is_remix: finalIsRemix,
                id: editingRecipeId || undefined
            };

            if (onSaveSuccess) {
                await onSaveSuccess(recipeData, recipeIngredients, recipeInstructions);
            }
            
            setShowRecipeBuilder(false);
            setEditingRecipeId(null);
        } catch (error: any) {
            toast.error(`Failed to save: ${error.message}`);
        } finally {
            setRecipeSaving(false);
        }
    };

    const handleAddInstruction = () => setRecipeInstructions([...recipeInstructions, '']);
    const handleUpdateInstruction = (index: number, value: string) => {
        const updated = [...recipeInstructions];
        updated[index] = value;
        setRecipeInstructions(updated);
    };
    const handleRemoveInstruction = (index: number) => setRecipeInstructions(recipeInstructions.filter((_, i) => i !== index));

    const resetBuilder = () => {
        setShowRecipeBuilder(false);
        setRecipeTitle('');
        setRecipeType('dinner');
        setRecipePrepTime(30);
        setRecipeCookTime(0);
        setRecipeServings(4);
        setRecipeIngredients([]);
        setRecipeInstructions(['']);
        setRecipeImage('');
        setRecipeStep(1);
        setIsMix(false);
        setIsRemix(false);
        setEditingRecipeId(null);
    };

    return {
        showRecipeBuilder, setShowRecipeBuilder,
        recipeTitle, setRecipeTitle,
        recipeType, setRecipeType,
        recipePrepTime, setRecipePrepTime,
        recipeCookTime, setRecipeCookTime,
        recipeServings, setRecipeServings,
        recipeIngredients, setRecipeIngredients,
        recipeInstructions, setRecipeInstructions,
        recipeImage, setRecipeImage,
        recipeSaving, setRecipeSaving,
        recipeUploading, setRecipeUploading,
        recipeStep, setRecipeStep,
        isMix, setIsMix,
        isRemix, setIsRemix,
        editingRecipeId, setEditingRecipeId,
        builderRef,
        handleManualRecipeCreation,
        handleRecipeImageUpload,
        handleSaveRecipe,
        handleAddInstruction,
        handleUpdateInstruction,
        handleRemoveInstruction,
        resetBuilder
    };
}
