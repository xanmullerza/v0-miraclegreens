import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePantry } from '@/hooks/use-pantry';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { useRDA } from '@/hooks/use-rda';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import { mergeQuantityStrings, stripZeroEntries, buildQuantityString } from '@/components/tracker/pantry/pantry-types';
import { FoodItem, ActiveFoodSection, FoodDetailContextType } from './types';

export function useFoodDetail(): FoodDetailContextType {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    
    // External states & hooks
    const { quantities, updateQuantity, addToPantry: dbAddToPantry } = usePantry();
    const { addItem: addShoppingListItem } = useShoppingList();
    const { nutrientDisplayMode, profile, energyUnit, dailyTargets } = useUserPreferences();
    const { setCustomSegmentLabel } = useHeaderActions();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        2000
    );

    // Internal states
    const [food, setFood] = useState<FoodItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(1);
    const [selectedPortion, setSelectedPortion] = useState<{ label: string, weight_g: number } | null>(null);
    const [activeSection, setActiveSection] = useState<ActiveFoodSection>('facts');
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [showAdvancedNutrition, setShowAdvancedNutrition] = useState(false);
    const [managementSubView, setManagementSubView] = useState<'pantry' | 'shopping' | null>(null);

    // Permissions & User
    const [isAdmin, setIsAdmin] = useState(false);

    // Recipes
    const [foodRecipes, setFoodRecipes] = useState<any[]>([]);
    const [recipesLoading, setRecipesLoading] = useState(false);

    // Quick Add
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

    // Edit block states
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editNutrientText, setEditNutrientText] = useState('');
    const [editServingText, setEditServingText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // ─── Header label sync ──────────────────────────────────────────
    useEffect(() => {
        if (food?.name) {
            setCustomSegmentLabel(food.name);
        }
        return () => setCustomSegmentLabel(null);
    }, [food?.name, setCustomSegmentLabel]);

    // ─── Auth ──────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const email = session?.user?.email ?? null;
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const email = session?.user?.email ?? null;
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        return () => subscription.unsubscribe();
    }, []);

    // ─── Core loading ──────────────────────────────────────────
    const fetchFoodDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Priority 1: Check if it's a personal pantry item
            const { data: pantryData } = await supabase
                .from('pantry_items')
                .select('*, scanned_products(*), food_items(*)')
                .eq('id', id)
                .maybeSingle();

            if (pantryData) {
                const baseItem = pantryData.food_items || pantryData.scanned_products;
                if (baseItem) {
                    const spNutrition = pantryData.scanned_products?.nutrition || {};
                    const nutrition = {
                        energy_kcal: spNutrition.energy || baseItem.energy_kcal || 0,
                        energy_kj: spNutrition.energy_kj || baseItem.energy_kj || 0,
                        protein_g: spNutrition.protein || baseItem.protein_g || 0,
                        carbs_g: spNutrition.carbs || baseItem.carbs_g || 0,
                        fat_g: spNutrition.fat || baseItem.fat_g || 0,
                    };

                    setFood({
                        ...baseItem,
                        id: baseItem.id,
                        pantry_id: pantryData.id,
                        name: pantryData.name || baseItem.name || 'Unknown Item',
                        common_name: pantryData.name || baseItem.common_name || baseItem.name,
                        ...nutrition,
                        micronutrients: baseItem.micronutrients || {},
                        details: baseItem.details,
                        portions: baseItem.portions,
                        is_favorite: baseItem.is_favorite
                    } as any);
                    return;
                }
            }

            // Priority 2: Standard Food Item
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            const fetchedFood = data;
            if (fetchedFood && quantities[fetchedFood.id]) {
                fetchedFood.quantity = quantities[fetchedFood.id];
                fetchedFood.is_in_pantry = true;
            }

            setFood(fetchedFood);
            setSelectedPortion(null);
            setAmount(100);
        } catch (error: any) {
            console.error('Error fetching food:', error);
            toast.error('Failed to load ingredient profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFoodDetails();
    }, [id]);

    useEffect(() => {
        const loadMeasures = async () => {
            if (!food?.id) return;
            try {
                const measures = await fetchFoodMeasures(food.id);
                setFood(prev => prev ? { ...prev, portions: measures } : null);
            } catch (error) {
                console.error('Error fetching measures:', error);
            }
        };
        loadMeasures();
    }, [food?.id]);

    // ─── Recipes ──────────────────────────────────────────
    useEffect(() => {
        if (activeSection !== 'recipes' || !food?.id) return;
        const fetchRecipes = async () => {
            setRecipesLoading(true);
            try {
                const { data: ingRows } = await supabase
                    .from('ingredients')
                    .select('recipe_id')
                    .eq('food_item_id', food.id);
                const recipeIds = [...new Set((ingRows || []).map((r: any) => r.recipe_id))].filter(Boolean);
                if (recipeIds.length === 0) { setFoodRecipes([]); return; }
                const { data: recipes } = await supabase
                    .from('recipes')
                    .select('id, title, type, image')
                    .in('id', recipeIds);
                setFoodRecipes(recipes || []);
            } catch (e) {
                console.error('Error fetching recipes for food', e);
            } finally {
                setRecipesLoading(false);
            }
        };
        fetchRecipes();
    }, [activeSection, food?.id]);

    // ─── Actions ─────────────────────────────────────────
    const toggleFavorite = async () => {
        if (!food) return;
        const newStatus = !food.is_favorite;
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: newStatus } as any)
                .eq('id', food.id);

            if (error) throw error;
            setFood({ ...food, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to favorites' : 'Removed from favorites');
        } catch (error: any) {
            toast.error('Failed to update favorite status');
        }
    };

    const handleDelete = async () => {
        if (!food || !window.confirm(`Are you sure you want to delete "${food.name}"?`)) return;

        try {
            if (food.id.startsWith('food-')) {
                const localData = localStorage.getItem('local_foods');
                if (localData) {
                    const localFoods = JSON.parse(localData).filter((f: any) => f.id !== food.id);
                    localStorage.setItem('local_foods', JSON.stringify(localFoods));
                }
                toast.success('Food item removed locally');
            } else {
                const { error } = await supabase.from('food_items').delete().eq('id', food.id);
                if (error) throw error;
                toast.success('Food item deleted successfully');
            }
            router.back();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete food item');
        }
    };

    const handleQuickAdd = async () => {
        if (!food) return;

        const quantityString = buildQuantityString(quickAddQty, selectedPortion, quickAddWeight, quickAddUnit);

        if (quickAddMode === 'pantry') {
            try {
                const currentQty = quantities[food.id] || food.quantity || '';
                if (currentQty) {
                    const merged = mergeQuantityStrings(currentQty, quantityString);
                    const cleaned = stripZeroEntries(merged);
                    await updateQuantity(food.id, cleaned);
                } else {
                    await dbAddToPantry(food as any, quantityString);
                }
                setFood(prev => prev ? { ...prev, is_in_pantry: true, quantity: quantities[food.id] || quantityString } : null);
                toast.success(`Added to pantry: ${quantityString}`);
            } catch (error) {
                toast.error('Failed to update pantry');
            }
        } else {
            await addShoppingListItem({
                name: food.name,
                quantity: quantityString,
                food_item_id: food.id,
                category: food.category
            });
            toast.success(`Added to groceries`);
        }
        setActiveSection(null);
        setQuickAddQty('1');
        setQuickAddWeight('');
    };

    // ─── Edit Mode ─────────────────────────────────────────
    const handleEditStart = () => {
        try {
            if (!food) return;
            setEditName(food.name || '');
            setEditCommonName(food.common_name || '');
            setEditCategory(food.category || 'General');
            setEditImage(food.image || '');

            let nutrientText = `Calories: ${food.energy_kcal || 0}kcal\n`;
            nutrientText += `Protein: ${food.protein_g || 0}g\n`;
            nutrientText += `Carbs: ${food.carbs_g || 0}g\n`;
            nutrientText += `Fat: ${food.fat_g || 0}g\n`;
            if (food.micronutrients && typeof food.micronutrients === 'object') {
                Object.entries(food.micronutrients).forEach(([name, val]) => {
                    if (val && typeof val === 'number' && val > 0) nutrientText += `${name}: ${val}mg\n`;
                });
            }
            setEditNutrientText(nutrientText);

            const servingText = (food.portions || []).map(p => `1 ${p.label} = ${p.weight_g}g`).join('\n');
            setEditServingText(servingText);

            setIsEditing(true);
        } catch (e: any) {
            console.error('Error starting edit:', e);
            toast.error('Failed to open edit dialog: ' + e.message);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-items')
                .getPublicUrl(fileName);

            setEditImage(publicUrl);
            toast.success('Image uploaded successfully');
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            toast.error('Storage upload failed, using local preview');
        } finally {
            setUploading(false);
        }
    };

    const handleEditSave = async () => {
        if (!food) return;

        setSaveLoading(true);
        try {
            const { parseNutritionText, parseMeasures } = await import('@/lib/utils/nutrition-parser');
            const parsedNutrients = parseNutritionText(editNutrientText);
            const parsedPortions = parseMeasures(editServingText);

            const updatedData = {
                name: editName,
                common_name: editCommonName,
                category: editCategory,
                image: editImage,
                energy_kcal: parsedNutrients.energy_kcal || 0,
                energy_kj: (parsedNutrients.energy_kcal || 0) * 4.184,
                protein_g: parsedNutrients.protein_g || 0,
                carbs_g: parsedNutrients.carbs_g || 0,
                fat_g: parsedNutrients.fat_g || 0,
                micronutrients: parsedNutrients.micronutrients || {},
                portions: parsedPortions
            };

            const { error } = await supabase
                .from('food_items')
                .update(updatedData as any)
                .eq('id', food.id);

            if (error) throw error;

            setFood({
                ...food,
                ...updatedData
            } as any);

            setIsEditing(false);
            toast.success('Ingredient profile updated successfully');
        } catch (error) {
            console.error('Error updating food:', error);
            toast.error('Failed to update ingredient profile');
        } finally {
            setSaveLoading(false);
        }
    };

    return {
        food,
        loading,
        id,
        isAdmin,
        energyUnit,
        nutrientDisplayMode,
        dailyTargets,
        userRDAs,
        amount,
        setAmount,
        selectedPortion,
        setSelectedPortion,
        activeSection,
        setActiveSection,
        quickAddQty,
        setQuickAddQty,
        quickAddWeight,
        setQuickAddWeight,
        quickAddUnit,
        setQuickAddUnit,
        quickAddMode,
        setQuickAddMode,
        handleQuickAdd,
        foodRecipes,
        recipesLoading,
        breakdownNutrient,
        setBreakdownNutrient,
        showAdvancedNutrition,
        setShowAdvancedNutrition,
        managementSubView,
        setManagementSubView,
        toggleFavorite,
        handleDelete,
        fetchFoodDetails,
        isEditing,
        setIsEditing,
        editName,
        setEditName,
        editCommonName,
        setEditCommonName,
        editCategory,
        setEditCategory,
        editImage,
        setEditImage,
        editNutrientText,
        setEditNutrientText,
        editServingText,
        setEditServingText,
        uploading,
        saveLoading,
        handleEditStart,
        handleImageUpload,
        handleEditSave
    };
}
