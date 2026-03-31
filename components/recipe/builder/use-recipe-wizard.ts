import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { parseInstructionsOnly, parseRecipeText } from '@/lib/utils/recipe-parser';
import { searchFoodItem, getUSDAMeasures, syncToLocal } from '@/lib/services/nutrition';
import { scaleIngredient } from '@/lib/utils/recipe-scaling';
import { toast } from 'sonner';
import { RecipeIngredient } from './types';

export function useRecipeWizard(defaultType: string = 'dinner', onSaveSuccess?: (id: string) => void) {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [source, setSource] = useState('');
    const [type, setType] = useState(defaultType);
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

    const handleNextStep = () => {
        setStep(2);
    };

    const handleToDetails = () => {
        setStep(3);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('recipes').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('recipes').getPublicUrl(fileName);
            setImage(publicUrl);
            toast.success("Image uploaded!");
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        } finally {
            setUploading(false);
        }
    };

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
                } else quantity = Number(val) || 1;
            }
            unit = rawAmount.slice(val.length).trim().replace(/[,:;]$/, '').toLowerCase() || 'piece';
        } else {
            unit = rawAmount.replace(/[,:;]$/, '').toLowerCase() || 'piece';
        }
        return { quantity, unit };
    };

    const cleanFoodName = (name: string, existingModifier: string) => {
        let finalName = name.trim();
        let finalModifier = existingModifier;
        if (finalName.toLowerCase().startsWith('eggs, grade a, large')) finalName = 'Eggs';
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
        return { finalName, finalModifier };
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

            const rawIngredients: RecipeIngredient[] = [];
            for (const ing of parsed.ingredients) {
                const itemName = ing.item.trim();
                if (!itemName || itemName.length < 2 || /^\d+$/.test(itemName)) continue;

                const searchQuery = itemName.replace(/[,;:]\s*$/, '').trim();
                const allResults = await searchFoodItem(searchQuery);
                let match = null;

                if (allResults.length > 0) {
                    const foundMatch = allResults[0];
                    if (foundMatch.source === 'local') match = foundMatch;
                    else {
                        const measuresArr = foundMatch.fdcId ? await getUSDAMeasures(foundMatch.fdcId) : [];
                        const localId = await syncToLocal(foundMatch, measuresArr, currentUser?.id, isAdmin);
                        match = localId ? { ...foundMatch, id: localId, source: 'local' } : foundMatch;
                    }
                }

                const { quantity, unit } = parseAmount(ing.amount);
                const { finalName, finalModifier } = cleanFoodName(match ? match.name : itemName, ing.modifier || '');
                const isGrams = unit.includes('g') && !unit.includes('cup');
                const weight = ing.weightG || (isGrams ? quantity : 100);
                const ratio = weight / 100;

                if (match) {
                    const base_nutrition = {
                        calories: match.energy_kcal,
                        energy_kj: match.energy_kj || (match.energy_kcal * 4.184),
                        protein: match.protein_g, fat: match.fat_g, carbs: match.carbs_g,
                        micronutrients: (match as any).micronutrients || {}
                    };
                    rawIngredients.push({
                        food_item_id: match.id || 'temp-id',
                        food_item_name: finalName,
                        weight_g: weight, quantity, measure_label: unit, modifier: finalModifier,
                        calories: base_nutrition.calories * ratio,
                        energy_kj: base_nutrition.energy_kj * ratio,
                        protein: base_nutrition.protein * ratio,
                        fat: base_nutrition.fat * ratio,
                        carbs: base_nutrition.carbs * ratio,
                        micronutrients: Object.entries(base_nutrition.micronutrients).reduce((acc, [k, v]) => { acc[k] = (v as number) * ratio; return acc; }, {} as Record<string, number>),
                        base_nutrition,
                    });
                } else {
                    rawIngredients.push({
                        food_item_id: 'temp-id',
                        food_item_name: finalName,
                        weight_g: ing.weightG || (unit.includes('g') ? quantity : 0),
                        quantity, measure_label: unit, modifier: finalModifier,
                        calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {},
                    });
                }
            }

            // Merging logic
            const merged: RecipeIngredient[] = [];
            const keyMap = new Map<string, number>();
            for (const ing of rawIngredients) {
                const key = ing.food_item_name.toLowerCase().replace(/[,:;]/g, '').trim();
                const idx = keyMap.get(key);
                if (idx !== undefined) {
                    const existing = merged[idx];
                    existing.weight_g += ing.weight_g;
                    existing.calories += ing.calories;
                    existing.energy_kj += ing.energy_kj;
                    existing.protein = Number((existing.protein + ing.protein).toFixed(1));
                    existing.fat = Number((existing.fat + ing.fat).toFixed(1));
                    existing.carbs = Number((existing.carbs + ing.carbs).toFixed(1));
                    Object.entries(ing.micronutrients || {}).forEach(([k, v]) => { existing.micronutrients[k] = (existing.micronutrients[k] || 0) + v; });
                    if (existing.measure_label === ing.measure_label) existing.quantity += ing.quantity;
                    else { existing.measure_label = 'g'; existing.quantity = existing.weight_g; }
                } else {
                    keyMap.set(key, merged.length);
                    merged.push({ ...ing });
                }
            }
            setIngredients(merged);
            setAutoImportText('');
            setShowAutoImport(false);
            setStep(3);
            toast.success('Recipe imported successfully!');
        } catch (error) { toast.error('Import failed.'); }
        finally { setIsImporting(false); }
    };

    const handleSave = async () => {
        if (!title || ingredients.length === 0 || instructions.filter(i => i.trim()).length === 0) {
            toast.error('Please fill in required fields');
            return;
        }
        setSaving(true);
        try {
            const updatedIngredients = [...ingredients];
            for (let i = 0; i < updatedIngredients.length; i++) {
                const ing = updatedIngredients[i];
                if (ing.food_item_id === 'temp-id') {
                    const { data: newItem } = await supabase.from('food_items').insert({
                        name: ing.food_item_name, common_name: ing.food_item_name,
                        energy_kcal: ing.calories, energy_kj: ing.energy_kj,
                        protein_g: ing.protein, carbs_g: ing.carbs, fat_g: ing.fat,
                        micronutrients: {}, portions: []
                    }).select().single();
                    if (newItem) updatedIngredients[i] = { ...ing, food_item_id: newItem.id };
                }
            }

            const recipeId = `recipe-${Date.now()}`;
            const totals = updatedIngredients.reduce((acc, ing) => {
                const newM = { ...acc.micronutrients };
                Object.entries(ing.micronutrients || {}).forEach(([k, v]) => {
                    const match = findNutrientMatch(newM, k) || k;
                    newM[match] = (newM[match] || 0) + (v as number);
                });
                return {
                    calories: acc.calories + ing.calories, energy_kj: acc.energy_kj + ing.energy_kj,
                    protein: acc.protein + ing.protein, fat: acc.fat + ing.fat, carbs: acc.carbs + ing.carbs,
                    micronutrients: newM
                };
            }, { calories: 0, energy_kj: 0, protein: 0, fat: 0, carbs: 0, micronutrients: {} as Record<string, number> });

            const s = servings || 1;
            const { error: rErr } = await supabase.from('recipes').insert({
                id: recipeId, title, type, calories: Math.round(totals.calories / s), energy_kj: Math.round(totals.energy_kj / s),
                protein: Number((totals.protein / s).toFixed(1)), fat: Number((totals.fat / s).toFixed(1)), carbs: Number((totals.carbs / s).toFixed(1)),
                diet, prep_time: prepTime, servings: s, image, source, is_favorite: isFavorite,
                micronutrients: Object.entries(totals.micronutrients).reduce((acc, [k, v]) => { acc[k] = v / s; return acc; }, {} as Record<string, number>)
            });
            if (rErr) throw rErr;

            await supabase.from('ingredients').insert(updatedIngredients.map(ing => ({
                recipe_id: recipeId, food_item_id: ing.food_item_id, item: ing.food_item_name,
                amount: `${scaleIngredient(`${ing.quantity} ${ing.measure_label}`, 1 / s)}${ing.modifier ? ' ' + ing.modifier : ''}`.trim(),
                weight_g: ing.weight_g / s, quantity: ing.quantity / s, measure_label: ing.measure_label,
                base_ingredient: ing.food_item_name, modifier: ing.modifier,
            })));

            await supabase.from('instructions').insert(instructions.filter(t => t.trim()).map((t, idx) => ({
                recipe_id: recipeId, step_text: t, step_order: idx + 1
            })));

            toast.success('Recipe created!');
            if (onSaveSuccess) onSaveSuccess(recipeId);
            else router.push('/recipes');
        } catch (error: any) { toast.error(`Save failed: ${error.message}`); }
        finally { setSaving(false); }
    };

    return {
        title, setTitle, source, setSource, type, setType, prepTime, setPrepTime,
        servings, setServings, diet, setDiet, ingredients, setIngredients,
        instructions, setInstructions, image, setImage, saving, uploading,
        showMagicInstructions, setShowMagicInstructions, magicInstructionsText, setMagicInstructionsText,
        showAutoImport, setShowAutoImport, autoImportText, setAutoImportText, isImporting,
        step, setStep, isFavorite, setIsFavorite, startMode, setStartMode,
        instructionsMode, setInstructionsMode, currentUser, isAdmin,
        handleNextStep, handleToDetails, handleImageUpload, handleAutoImport, handleSave
    };
}
