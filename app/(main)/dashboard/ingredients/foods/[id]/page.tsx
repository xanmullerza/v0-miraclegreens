'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchFoodMeasures } from '@/lib/utils/nutrition-calculator';
import {
    Heart,
    ArrowLeft,
    Beef,
    Zap,
    Gem,
    Droplet,
    Battery,
    Activity,
    Edit2,
    Plus,
    Trash2,
    X,
    Loader2,
    Share2,
    Star,
    Upload,
    Camera,
    Save,
    ChevronDown,
    Layers,
    BookOpen,
    Globe,
    Lightbulb,
    ShieldCheck,
    Beaker,
    Scale,
    Dna,
    Pencil,
    LayoutGrid,
    UtensilsCrossed,
    ShoppingCart,
    ShoppingBasket,
    Search,
    Filter
} from 'lucide-react';
import { useSearch } from '@/lib/context/search-context';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import { CATEGORIES } from '@/components/ingredients/foods-view';
import { FOOD_DETAILS } from '@/lib/data/food-details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn, formatFoodName } from '@/lib/utils';
import { toast } from 'sonner';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';
import { DidYouKnow } from '@/components/DidYouKnow';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from '@/components/ui/page-container';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    micronutrients: Record<string, number>;
    phytonutrients?: Record<string, string>;
    category: string;
    is_favorite?: boolean;
    quantity?: string;
    is_in_pantry?: boolean;
    details?: import('@/lib/data/food-details').FoodDetail;
    portions?: { label: string; weight_g: number }[];
}

export default function FoodDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [food, setFood] = useState<FoodItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);
    const [amount, setAmount] = useState(1);
    const [selectedPortion, setSelectedPortion] = useState<{ label: string, weight_g: number } | null>(null);

    // ... edit states ...
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editNutrientText, setEditNutrientText] = useState('');
    const [editServingText, setEditServingText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddQty, setQuickAddQty] = useState('1');
    const [quickAddWeight, setQuickAddWeight] = useState('');
    const [quickAddUnit, setQuickAddUnit] = useState('g');
    const [quickAddMode, setQuickAddMode] = useState<'pantry' | 'shopping'>('pantry');

    const { nutrientDisplayMode, profile, energyUnit, dailyTargets } = useUserPreferences();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        2000 // Standard reference
    );

    // --- Navigation / Pillbox State ---
    const { searchQuery, setSearchQuery, setIsFocused, activeSearchId, setActiveSearchId } = useSearch();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Header Actions
    const { setCustomSegmentLabel } = useHeaderActions();

    // Update header label when food loads
    useEffect(() => {
        if (food?.name) {
            setCustomSegmentLabel(food.name);
        }
        return () => setCustomSegmentLabel(null);
    }, [food?.name, setCustomSegmentLabel]);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user ?? null;
            setUser(u);
            const email = u?.email ?? null;
            setCurrentUserEmail(email);

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            const email = u?.email ?? null;
            setCurrentUserEmail(email);

            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (id) {
            fetchFoodDetails();
        }
    }, [id]);

    // Fetch measures when food loads
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

    // Fetch measures when food loads
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

    const fetchFoodDetails = async () => {
        setLoading(true);
        try {
            // Priority 1: Check if it's a personal pantry item
            const { data: pantryData, error: pantryError } = await supabase
                .from('pantry_items')
                .select('*, scanned_products(*), food_items(*)')
                .eq('id', id)
                .maybeSingle();

            if (pantryData) {
                // Determine the nutritional source
                const baseItem = pantryData.food_items || pantryData.scanned_products;

                if (baseItem) {
                    // Normalize the nutrition object
                    const spNutrition = pantryData.scanned_products?.nutrition || {};
                    const nutrition = {
                        energy_kcal: spNutrition.energy || baseItem.energy_kcal || 0,
                        energy_kj: spNutrition.energy_kj || baseItem.energy_kj || 0,
                        protein_g: spNutrition.protein || baseItem.protein_g || 0,
                        carbs_g: spNutrition.carbs || baseItem.carbs_g || 0,
                        fat_g: spNutrition.fat || baseItem.fat_g || 0,
                    };

                    setFood({
                        // Spread the base properties first
                        ...baseItem,

                        // Override with specific pantry instance details
                        id: baseItem.id, // Use the UNDERLYING food ID for consistency in other lookups
                        pantry_id: pantryData.id, // Keep a ref to the pantry wrapper

                        // Ensure name is correct (custom name > scanned name > food name)
                        name: pantryData.name || baseItem.name || 'Unknown Item',
                        common_name: pantryData.name || baseItem.common_name || baseItem.name,

                        // Merge nutrition
                        ...nutrition,
                        micronutrients: baseItem.micronutrients || {},

                        // Ensure relations exist
                        details: baseItem.details,
                        portions: baseItem.portions,
                        is_favorite: baseItem.is_favorite // Use the base item's favorited status
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

            // Merge in locally-stored quantities (persists without login)
            try {
                const savedQuantities = localStorage.getItem('pantry_quantities');
                if (savedQuantities && fetchedFood) {
                    const quantities: Record<string, string> = JSON.parse(savedQuantities);
                    if (quantities[fetchedFood.id]) {
                        fetchedFood.quantity = quantities[fetchedFood.id];
                        fetchedFood.is_in_pantry = true;
                    }
                }
            } catch (e) {
                console.error('Failed to load saved quantities', e);
            }

            setFood(fetchedFood);

            // Set default measurement to 100g
            setSelectedPortion(null);
            setAmount(100);
        } catch (error: any) {
            console.error('Error fetching food:', error);
            toast.error('Failed to load ingredient profile');
        } finally {
            setLoading(false);
        }
    };

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
                // Local Deletion
                const localData = localStorage.getItem('local_foods');
                if (localData) {
                    const localFoods = JSON.parse(localData).filter((f: any) => f.id !== food.id);
                    localStorage.setItem('local_foods', JSON.stringify(localFoods));
                }
                toast.success('Food item removed locally');
            } else {
                // Cloud Deletion
                const { error } = await supabase.from('food_items').delete().eq('id', food.id);
                if (error) throw error;
                toast.success('Food item deleted successfully');
            }
            router.back();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Failed to delete food item');
        }
    };

    const handleQuickAdd = async () => {
        if (!food) return;

        const quantityString = quickAddWeight ? `${quickAddQty} x ${quickAddWeight}${quickAddUnit}` : quickAddQty;

        if (quickAddMode === 'pantry') {
            try {
                // Update UI
                setFood(prev => prev ? { ...prev, is_in_pantry: true, quantity: quantityString } : null);

                // Persist to localStorage
                const saved = localStorage.getItem('pantry_quantities');
                const quantities: Record<string, string> = saved ? JSON.parse(saved) : {};
                quantities[food.id] = quantityString;
                localStorage.setItem('pantry_quantities', JSON.stringify(quantities));

                // Update DB
                const { error } = await supabase.from('food_items').update({ is_in_pantry: true } as any).eq('id', food.id);
                if (error) throw error;

                toast.success(`Added to pantry with ${quantityString}`);
            } catch (error) {
                toast.error('Failed to update pantry');
            }
        } else {
            const currentList = JSON.parse(localStorage.getItem('vitala_shopping_manual_items') || '[]');
            const newItem = {
                id: `manual-${Date.now()}`,
                name: food.name,
                quantity: quantityString,
                unit: '',
                checked: false,
                source: 'manual'
            };
            localStorage.setItem('vitala_shopping_manual_items', JSON.stringify([...currentList, newItem]));
            toast.success(`Added to groceries`);
        }
        setShowQuickAdd(false);
        setQuickAddQty('1');
        setQuickAddWeight('');
    };

    const handleEditStart = () => {
        if (!food) return;
        setEditName(food.name);
        setEditCommonName(food.common_name || '');
        setEditCategory(food.category || 'General');
        setEditImage(food.image || '');

        // Generate initial text for nutrients
        let nutrientText = `Calories: ${food.energy_kcal}\n`;
        nutrientText += `Protein: ${food.protein_g}g\n`;
        nutrientText += `Carbs: ${food.carbs_g}g\n`;
        nutrientText += `Fat: ${food.fat_g}g\n`;
        if (food.micronutrients) {
            Object.entries(food.micronutrients).forEach(([name, val]) => {
                if (val > 0) nutrientText += `${name}: ${val}\n`;
            });
        }
        setEditNutrientText(nutrientText);

        // Generate initial text for servings
        const servingText = (food.portions || []).map(p => `1 ${p.label} = ${p.weight_g}g`).join('\n');
        setEditServingText(servingText);

        setIsEditing(true);
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
            // Parse nutrient and serving text
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
            });

            setIsEditing(false);
            toast.success('Ingredient profile updated successfully');
        } catch (error) {
            console.error('Error updating food:', error);
            toast.error('Failed to update ingredient profile');
        } finally {
            setSaveLoading(false);
        }
    };

    const getVal = (keys: string[]) => {
        if (!food) return 0;
        const m = food.micronutrients || {};
        let baseVal = 0;

        // 1. Try to find a non-zero value in any of the provided keys
        for (const k of keys) {
            let val = 0;
            if (k === 'energy_kcal') {
                if (energyUnit === 'kJ' && food.energy_kj) val = food.energy_kj;
                else val = food.energy_kcal || 0;
            }
            else if (k === 'energy_kj') {
                if (energyUnit === 'kcal' && food.energy_kcal) val = food.energy_kcal;
                else val = food.energy_kj || 0;
            }
            else if (k === 'Energy' || k === 'Calories' || k === 'calories') {
                if (energyUnit === 'kJ') val = food.energy_kj || (food.energy_kcal ? food.energy_kcal * 4.184 : 0);
                else val = food.energy_kcal || (food.energy_kj ? food.energy_kj / 4.184 : 0);
            }
            else if (k === 'protein_g') val = food.protein_g || 0;
            else if (k === 'carbs_g') val = food.carbs_g || 0;
            else if (k === 'fat_g') val = food.fat_g || 0;
            else {
                // Try direct match
                if (m[k] !== undefined) val = m[k];
                // Try smart fuzzy match if direct fails
                else {
                    const match = findNutrientMatch(m, k);
                    if (match) val = m[match];
                }
            }

            if (val > 0) {
                baseVal = val;
                break;
            }
        }

        // 2. Extra Fallback for Fat: Try to sum constituents if total is 0
        if (baseVal === 0 && (keys.includes('fat_g') || keys.includes('Fat'))) {
            const sat = m['Saturated Fat'] || 0;
            const mono = m['Monounsaturated Fat'] || 0;
            const poly = m['Polyunsaturated Fat'] || 0;
            const trans = m['Trans Fat'] || 0;
            const sum = sat + mono + poly + trans;
            if (sum > 0) baseVal = sum;
        }

        // 3. Special Fallback for Energy: Calculate from macros if Energy/Calories is missing or 0
        if (baseVal === 0 && keys.some(k => k.toLowerCase().includes('energy') || k.toLowerCase().includes('calorie'))) {
            const p = food.protein_g || 0;
            const c = food.carbs_g || 0;
            const f = food.fat_g || 0;
            if (p > 0 || c > 0 || f > 0) {
                const kcal = (p * 4) + (c * 4) + (f * 9);
                baseVal = energyUnit === 'kJ' ? kcal * 4.184 : kcal;
            }
        }

        const currentWeight = selectedPortion ? (amount * selectedPortion.weight_g) : amount;
        return (baseVal * currentWeight) / 100;
    };

    const NUTRIENT_BREAKDOWNS: Record<string, any[]> = {
        'Vitamin A': [
            { label: 'Retinol', keys: ['Retinol', 'retinol_ug'], unit: 'µg' },
            { label: 'Alpha-carotene', keys: ['Alpha-carotene', 'alpha_carotene_ug'], unit: 'µg' },
            { label: 'Beta-carotene', keys: ['Beta-carotene', 'beta_carotene_ug'], unit: 'µg' },
            { label: 'Beta-cryptoxanthin', keys: ['Beta-cryptoxanthin', 'beta_cryptoxanthin_ug'], unit: 'µg' },
            { label: 'Lutein + Zeaxanthin', keys: ['Lutein + Zeaxanthin', 'Lutein+Zeaxanthin', 'lutein_zeaxanthin_ug'], unit: 'µg' },
            { label: 'Lycopene', keys: ['Lycopene', 'lycopene_ug'], unit: 'µg' },
        ],
        'Vitamin E': [
            { label: 'Alpha-tocopherol', keys: ['Alpha-tocopherol', 'Vitamin E', 'alpha_tocopherol_mg'], unit: 'mg' },
            { label: 'Beta-tocopherol', keys: ['Beta-tocopherol', 'beta_tocopherol_mg'], unit: 'mg' },
            { label: 'Delta-tocopherol', keys: ['Delta-tocopherol', 'delta_tocopherol_mg'], unit: 'mg' },
            { label: 'Gamma-tocopherol', keys: ['Gamma-tocopherol', 'gamma_tocopherol_mg'], unit: 'mg' },
        ],
        'Protein': [
            { label: 'Histidine', keys: ['Histidine', 'histidine_g'], unit: 'g', isEssential: true },
            { label: 'Isoleucine', keys: ['Isoleucine', 'isoleucine_g'], unit: 'g', isEssential: true },
            { label: 'Leucine', keys: ['Leucine', 'leucine_g'], unit: 'g', isEssential: true },
            { label: 'Lysine', keys: ['Lysine', 'lysine_g'], unit: 'g', isEssential: true },
            { label: 'Methionine', keys: ['Methionine', 'methionine_g'], unit: 'g', isEssential: true },
            { label: 'Phenylalanine', keys: ['Phenylalanine', 'phenylalanine_g'], unit: 'g', isEssential: true },
            { label: 'Threonine', keys: ['Threonine', 'threonine_g'], unit: 'g', isEssential: true },
            { label: 'Tryptophan', keys: ['Tryptophan', 'tryptophan_g'], unit: 'g', isEssential: true },
            { label: 'Valine', keys: ['Valine', 'valine_g'], unit: 'g', isEssential: true },
        ],
        'Carbs': [
            { label: 'Fiber', keys: ['Fiber', 'fiber_g'], unit: 'g' },
            { label: 'Starch', keys: ['Starch', 'starch_g'], unit: 'g' },
            { label: 'Sugars', keys: ['Sugars', 'sugars_g'], unit: 'g' },
        ],
        'Fat': [
            { label: 'Saturated Fat', keys: ['Saturated Fat'], unit: 'g' },
            { label: 'Monounsaturated', keys: ['Monounsaturated Fat'], unit: 'g' },
            { label: 'Polyunsaturated', keys: ['Polyunsaturated Fat'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3'], unit: 'g', isExpandable: true },
            { label: 'ALA', keys: ['ALA', 'alpha_linolenic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'EPA', keys: ['EPA', 'eicosapentaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'DHA', keys: ['DHA', 'docosahexaenoic_acid_g'], unit: 'g', hiddenByDefault: true },
            { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
            { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
            { label: 'Cholesterol', keys: ['Cholesterol'], unit: 'mg' },
        ],
    };

    const NutrientGrid = ({ title, items, icon: Icon, theme = 'indigo', subtitle, breakdownLabels = [], forceRaw = false }: { title: string, items: Record<string, any[]>, icon: any, theme?: string, subtitle?: string, breakdownLabels?: string[], forceRaw?: boolean }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            orange: { bg: "bg-slate-900 border-slate-800", text: "text-orange-400", border: "border-slate-800", itemBorder: "border-orange-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
        };
        const t = (themes as any)[theme] || themes.indigo;

        return (
            <div className={cn("p-6 pt-5 rounded-3xl border bg-gradient-to-br mb-6", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-[10px]", t.text)}><Icon className="h-4 w-4" /> {title}</h4>
                {subtitle && <p className={cn("text-[9px] text-slate-400 mb-4 border-b pb-2 transition-colors", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(items).map(([label, keys]) => {
                        let val = 0;
                        let rda = null;
                        let unitStr = '';
                        const m = food?.micronutrients || {};

                        if (title === 'Biological Ratios') {
                            const k1 = findNutrientMatch(m, keys[0]);
                            const k2 = findNutrientMatch(m, keys[1]);
                            const v1 = k1 ? m[k1] : 0;
                            const v2 = k2 ? m[k2] : 0;
                            val = v2 > 0 ? v1 / v2 : 0;
                            unitStr = ' to 1';
                        } else {
                            val = getVal(keys as string[]);
                            const macroRDAs: Record<string, number> = {
                                'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                                'Protein': dailyTargets.protein,
                                'Carbs': dailyTargets.carbs,
                                'Fat': dailyTargets.fat
                            };
                            rda = userRDAs?.[label] || macroRDAs[label];
                            unitStr = (label === 'Energy') ? energyUnit :
                                (label === 'Protein' || label === 'Carbs' || label === 'Fat' || label === 'Fiber' || label === 'Sugars' || label === 'Starch' || label === 'Omega-3' || label === 'Omega-6') ? 'g' :
                                    (label === 'Vitamin D') ? 'IU' :
                                        (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg')) ? 'µg' : 'mg';
                        }

                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                        let styles = getNutrientLevelStyles(pct || 0, label);

                        if (title === 'Biological Ratios') {
                            let ratioStatus: 'good' | 'fair' | 'poor' = 'good';
                            if (label === 'Sodium & Potassium') ratioStatus = val <= 1.0 ? 'good' : val <= 2.0 ? 'fair' : 'poor';
                            if (label === 'Zinc & Copper') ratioStatus = (val >= 8 && val <= 12) ? 'good' : (val >= 5 && val <= 15) ? 'fair' : 'poor';
                            if (label === 'Omega 3 to 6 ratio') ratioStatus = val <= 4.0 ? 'good' : val <= 10.0 ? 'fair' : 'poor';
                            if (label === 'Calcium & Magnesium') ratioStatus = (val >= 1.7 && val <= 2.5) ? 'good' : (val >= 1.5 && val <= 3.0) ? 'fair' : 'poor';
                            if (label === 'Calcium & Phosphorus') ratioStatus = (val >= 1.0 && val <= 2.0) ? 'good' : (val >= 0.8 && val <= 2.5) ? 'fair' : 'poor';

                            styles = ratioStatus === 'good' ? { text: "text-emerald-500", borderLight: "border-emerald-500/30", fade: "bg-emerald-500/5", textFill: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" } :
                                ratioStatus === 'fair' ? { text: "text-amber-500", borderLight: "border-amber-500/30", fade: "bg-amber-500/5", textFill: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500" } :
                                    { text: "text-rose-500", borderLight: "border-rose-500/30", fade: "bg-rose-500/5", textFill: "text-rose-500", bg: "bg-rose-500", border: "border-rose-500" };
                        }

                        const ratioTarget = title === 'Biological Ratios' ? (
                            label === 'Sodium & Potassium' ? 'Under 1 to 1' :
                                label === 'Zinc & Copper' ? '8 to 1 - 12 to 1' :
                                    label === 'Omega 3 to 6 ratio' ? 'Under 4 to 1' :
                                        label === 'Calcium & Magnesium' ? '1.7 to 1 - 2.5 to 1' :
                                            label === 'Calcium & Phosphorus' ? '1 to 1 - 2 to 1' : null
                        ) : null;

                        const labelColor = title === 'Biological Ratios' ? (
                            label === 'Sodium:Potassium' ? 'text-blue-400' :
                                label === 'Zinc:Copper' ? 'text-orange-400' :
                                    label === 'Omega 6:3 Ratio' ? 'text-indigo-400' :
                                        label === 'Calcium:Magnesium' ? 'text-violet-400' :
                                            label === 'Calcium:Phosphorus' ? 'text-cyan-400' : 'text-foreground/60'
                        ) : 'text-foreground/60';

                        const hasBreakdown = breakdownLabels.includes(label);

                        return (
                            <div key={label} onClick={() => router.push(`/dashboard/workshop/nutridex/${encodeURIComponent(label)}`)} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <p className={cn(
                                    "text-[9px] font-black truncate mb-1 whitespace-nowrap overflow-hidden transition-colors",
                                    title === 'Biological Ratios' ? 'text-slate-400 dark:text-slate-500' : 'uppercase text-foreground/60'
                                )}>
                                    {label}
                                </p>
                                <div className="space-y-0.5">
                                    {(nutrientDisplayMode === 'percentage' && !forceRaw) ? (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400">
                                                {val.toFixed(1)}{unitStr}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-lg font-bold", title === 'Biological Ratios' ? styles.text : "")}>{val.toFixed(1)}</span>
                                                <span className={cn("text-[10px] font-bold", (unitStr === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitStr}</span>
                                            </div>
                                            {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                    Target: {Math.round(rda)}{unitStr}
                                                </p>
                                            )}
                                            {ratioTarget && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                    Ideal: {ratioTarget}
                                                </p>
                                            )}
                                            {nutrientDisplayMode === 'both' && pct > 0 && !forceRaw && (
                                                <div className={cn("text-[10px] font-black mt-1", styles.text)}>{pct}%</div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {hasBreakdown && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBreakdownNutrient(label); }}
                                        className="absolute top-2 right-2 p-1 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 opacity-40 group-hover:opacity-100 hover:bg-orange-200 dark:hover:bg-orange-800 transition-all border border-orange-200/50 dark:border-orange-700/50"
                                    >
                                        <Layers className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Scanning Bio-Reference...</p>
            </div>
        );
    }

    if (!food) return null;

    return (
        <PageContainer maxWidth="max-w-6xl">
            <div className="space-y-8 pb-20 animate-in fade-in duration-700">
                {/* NEW Main Header Section (Image + Name + Description) */}
                <div className="flex flex-row items-end gap-6 animate-in slide-in-from-top-4 duration-700 pb-1">
                    {/* Left Side: Image (Inline with Text) */}
                    <div className="w-24 h-24 lg:w-24 lg:h-24 shrink-0">
                        <Card className="w-full h-full relative p-1 bg-white dark:bg-slate-900 border-none group overflow-hidden rounded-2xl">
                            <div className="w-full h-full rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                {food.image ? (
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <Beef size={24} className="opacity-10" />
                                    </div>
                                )}
                                <div className="absolute top-1 left-1 flex flex-col gap-1">
                                    {food.protein_g > 15 && (
                                        <Badge className="bg-red-600/90 text-white border-none text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 backdrop-blur-md shadow-xl w-fit">
                                            HP
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Side: Text Content + Actions */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex items-start gap-3 justify-between">
                            <h1 className="text-2xl lg:text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.9] flex-1">
                                <span className="text-emerald-500">{formatFoodName(food.common_name || food.name)}</span>
                            </h1>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8 rounded-xl transition-all", showQuickAdd ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10")}
                                    onClick={() => {
                                        if (showQuickAdd) {
                                            setShowQuickAdd(false);
                                        } else {
                                            setShowQuickAdd(true);
                                            setQuickAddQty('1');
                                            setQuickAddWeight('');
                                        }
                                    }}
                                    title="Add to Pantry or Groceries"
                                >
                                    <Plus size={16} />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8 rounded-xl transition-all", food.is_favorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                                    onClick={toggleFavorite}
                                    title="Favorite"
                                >
                                    <Heart size={16} fill={food.is_favorite ? "currentColor" : "none"} />
                                </Button>

                                {/* Admin Edit */}
                                {currentUserEmail?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase() && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => router.push(`/dashboard/ingredients/foods/new?edit=${food.id}`)}
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        title="Edit Food"
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                )}

                                {(food.id.startsWith('food-') || isAdmin) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleDelete}
                                        className="h-8 w-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                                        title="Delete Food"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Description - Styled as Subtext */}
                        {(food.details || FOOD_DETAILS[food.id]) && (
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed max-w-2xl">
                                {(food.details || FOOD_DETAILS[food.id]).description}
                                {food.quantity && (
                                    <span className="ml-3 text-emerald-500">
                                        In Stock: {food.quantity}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Add Panel */}
                {showQuickAdd && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 animate-in slide-in-from-top duration-300 rounded-2xl">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                    <ShoppingBasket size={24} className="text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Quick Action</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{food?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex-1 md:flex-none">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantity</Label>
                                    <Input
                                        type="number"
                                        value={quickAddQty}
                                        onChange={(e) => setQuickAddQty(e.target.value)}
                                        className="w-20 text-center"
                                    />
                                </div>

                                {food?.portions && food.portions.length > 0 && !selectedPortion ? (
                                    <div className="flex-1 md:flex-none">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Serving</Label>
                                        <select
                                            onChange={(e) => {
                                                const portion = food.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
                                                }
                                            }}
                                            className="w-auto px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            <option value="">Select a serving...</option>
                                            {food.portions?.map((p: any) => (
                                                <option key={p.label} value={p.label}>
                                                    {p.label} ({p.weight_g}g)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : selectedPortion ? (
                                    <div className="flex-1 md:flex-none">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Serving</Label>
                                        <select
                                            value={selectedPortion.label}
                                            onChange={(e) => {
                                                const portion = food?.portions?.find((p: any) => p.label === e.target.value);
                                                if (portion) {
                                                    setSelectedPortion(portion);
                                                }
                                            }}
                                            className="w-auto px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                        >
                                            {food?.portions?.map((p: any) => (
                                                <option key={p.label} value={p.label}>
                                                    {p.label} ({p.weight_g}g)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 md:flex-none">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Weight</Label>
                                            <Input
                                                type="number"
                                                value={quickAddWeight}
                                                onChange={(e) => setQuickAddWeight(e.target.value)}
                                                placeholder="e.g. 100"
                                                className="w-20 text-center"
                                            />
                                        </div>

                                        <div className="flex-1 md:flex-none">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Unit</Label>
                                            <select
                                                value={quickAddUnit}
                                                onChange={(e) => setQuickAddUnit(e.target.value)}
                                                className="w-20 px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                            >
                                                <option value="g">g</option>
                                                <option value="ml">ml</option>
                                                <option value="oz">oz</option>
                                                <option value="lb">lb</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {food?.portions && food.portions.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (selectedPortion) {
                                                setSelectedPortion(null);
                                                setQuickAddWeight(`${selectedPortion.weight_g}`);
                                                setQuickAddUnit('g');
                                            } else {
                                                setSelectedPortion(food?.portions?.[0] || null);
                                            }
                                        }}
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors whitespace-nowrap self-end mb-0.5"
                                    >
                                        {selectedPortion ? 'Use Weight' : 'Use Serving'}
                                    </button>
                                )}

                                <div className="flex-1 md:flex-none">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Destination</Label>
                                    <select
                                        value={quickAddMode}
                                        onChange={(e) => setQuickAddMode(e.target.value as 'pantry' | 'shopping')}
                                        className="w-auto px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="pantry">Pantry</option>
                                        <option value="shopping">Groceries</option>
                                    </select>
                                </div>

                                <Button
                                    onClick={handleQuickAdd}
                                    className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] h-10"
                                >
                                    <Plus size={16} />
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group/amount transition-all hover:border-emerald-500/50 shrink-0">
                        <div className="flex items-center">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-16 bg-transparent text-lg font-black italic text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center border-r border-slate-100 dark:border-slate-800"
                            />

                            <div className="relative group/select pl-3 pr-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1.5 pr-2 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400 outline-none hover:text-emerald-500 transition-colors">
                                        {selectedPortion?.label || 'Gram (g)'}
                                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover/select:text-emerald-500" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-2 min-w-[140px] shadow-2xl animate-in zoom-in-95 duration-200"
                                    >
                                        <DropdownMenuItem
                                            className="text-[10px] font-black uppercase tracking-tighter rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-500 focus:text-white dark:focus:bg-emerald-600 transition-all text-slate-500 dark:text-slate-400"
                                            onClick={() => {
                                                setSelectedPortion(null);
                                                if (amount === 1) setAmount(100);
                                            }}
                                        >
                                            Gram (g)
                                        </DropdownMenuItem>
                                        {food?.portions?.map(p => (
                                            <DropdownMenuItem
                                                key={p.label}
                                                className="text-[10px] font-black uppercase tracking-tighter rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-500 focus:text-white dark:focus:bg-emerald-600 transition-all text-slate-500 dark:text-slate-400"
                                                onClick={() => {
                                                    setSelectedPortion(p);
                                                    if (amount >= 10) setAmount(1);
                                                }}
                                            >
                                                {p.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nutrient Grids - Removed Hero Wrapper */}
                <div className="space-y-6">
                    <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-500 italic flex items-center gap-2">
                            <Activity size={18} />
                            Essential Nutrients
                        </h3>
                    </div>





                    <NutrientGrid title="Macronutrients" icon={Zap} theme="orange" subtitle="Detailed breakdown of energy and macro density" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
                        'Energy': ['Energy', 'energy_kcal', 'Calories', 'calories'],
                        'Protein': ['Protein', 'protein_g', 'protein'],
                        'Carbs': ['Carbohydrates', 'carbs_g', 'carbs'],
                        'Fat': ['Fat', 'fat_g', 'fat']
                    }} />

                    <NutrientGrid title="Electrolytes" icon={Zap} theme="indigo" subtitle="Essential minerals for cellular hydration and nerve signal transmission" items={{
                        'Sodium': ['Sodium', 'sodium_mg'],
                        'Potassium': ['Potassium', 'potassium_mg'],
                        'Magnesium': ['Magnesium', 'magnesium_mg'],
                        'Calcium': ['Calcium', 'calcium_mg'],
                        'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                    }} />

                    <NutrientGrid title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential minerals for energy and immune support" items={{
                        'Iron': ['Iron', 'iron_mg'],
                        'Zinc': ['Zinc', 'zinc_mg'],
                        'Copper': ['Copper', 'copper_mg'],
                        'Manganese': ['Manganese', 'manganese_mg'],
                        'Selenium': ['Selenium', 'selenium_ug']
                    }} />

                    <NutrientGrid title="Water-Soluble Vitamins" icon={Droplet} theme="blue" subtitle="Daily vitamins for a healthy mind and body" items={{
                        'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                        'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                        'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                        'B5 (Pantothenic Acid)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                        'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                        'B7 (Biotin)': ['Biotin', 'biotin_ug'],
                        'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                        'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                        'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                        'Choline': ['Choline', 'choline_mg'],
                    }} />

                    <NutrientGrid title="Fat-Soluble Vitamins" icon={Battery} theme="emerald" subtitle="Stored vitamins for long-term vitality" breakdownLabels={['Vitamin A', 'Vitamin E']} items={{
                        'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                        'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                        'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                        'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                    }} />

                    <div className="pt-12 pb-2 border-b border-slate-100 dark:border-slate-800 mb-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-amber-500 italic flex items-center gap-2">
                            <Dna size={18} />
                            Advanced Nutrition
                        </h3>
                    </div>

                    <NutrientGrid title="Extra Markers" icon={Activity} theme="amber" subtitle="Extra health markers worth tracking" forceRaw={true} items={{
                        'Fiber': ['Fiber', 'fiber_g'],
                        'Sugars': ['Sugars', 'sugars_g'],
                        'Oxalate': ['Oxalate', 'oxalate_mg'],
                        'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                    }} />

                    <NutrientGrid title="Biological Ratios" icon={Dna} theme="amber" subtitle="Key nutrient balances for a healthy body" items={{
                        'Sodium & Potassium': ['Sodium', 'Potassium'],
                        'Zinc & Copper': ['Zinc', 'Copper'],
                        'Omega 3 to 6 ratio': ['Omega-6', 'Omega-3'],
                        'Calcium & Magnesium': ['Calcium', 'Magnesium'],
                        'Calcium & Phosphorus': ['Calcium', 'Phosphorus'],
                    }} />

                    <DidYouKnow
                        phytonutrients={food.phytonutrients}
                        foodName={food.common_name || food.name}
                        className="py-4"
                    />

                </div>

                {/* Know Your Food Section */}
                {
                    (food.details || FOOD_DETAILS[food.id]) && (() => {
                        const details = food.details || FOOD_DETAILS[food.id];
                        return (
                            <div className="space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 mb-8 font-display">
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-purple-500 italic flex items-center gap-2">
                                        <Search size={18} />
                                        Know Your Food
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Producers */}
                                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                            <ShoppingBasket size={14} /> Top Producers
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                                            {details.producers}
                                        </p>
                                    </Card>

                                    {/* Facts */}
                                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest text-[10px]">
                                            <Lightbulb size={14} /> Culinary Facts & Uses
                                        </div>
                                        <ul className="space-y-3">
                                            {details.facts.map((fact: string, i: number) => (
                                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-purple-500 font-bold mt-1">✨</span>
                                                    <span className="leading-snug font-medium italic">{fact}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>

                                    {/* History */}
                                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest text-[10px]">
                                            <Globe size={14} /> Origin & History
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {details.history}
                                        </p>
                                    </Card>

                                    {/* Benefits */}
                                    <Card className="p-8 bg-slate-50/80 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">
                                            <ShieldCheck size={14} /> Key Benefits
                                        </div>
                                        <ul className="space-y-3">
                                            {details.benefits.map((benefit: string, i: number) => (
                                                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="text-blue-500 font-bold mt-1">•</span>
                                                    <span className="leading-snug font-medium">{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </div>
                            </div>
                        );
                    })()
                }

                {/* NUTRIENT BREAKDOWN MODAL */}
                {
                    breakdownNutrient && (food.micronutrients) && (
                        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setBreakdownNutrient(null)}>
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setBreakdownNutrient(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-current/10",
                                        breakdownNutrient === 'Protein' ? "bg-red-100 text-red-600" :
                                            breakdownNutrient === 'Carbs' ? "bg-amber-100 text-amber-600" :
                                                breakdownNutrient === 'Fat' ? "bg-orange-100 text-orange-600" :
                                                    "bg-emerald-100 text-emerald-600"
                                    )}>
                                        <Layers className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">{breakdownNutrient}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Breakdown</p>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {(() => {
                                        const items = NUTRIENT_BREAKDOWNS[breakdownNutrient] || [];
                                        return items.map((item, idx) => {
                                            const val = getVal(item.keys);
                                            return (
                                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">
                                                                {item.label}
                                                                {item.isEssential && <span className="ml-2 text-[8px] px-2 py-0.5 bg-emerald-500 text-white rounded-md uppercase font-black">Essential</span>}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-sm text-slate-900 dark:text-white tabular-nums">{val.toFixed(2)}</span>
                                                            <span className="ml-1 text-[10px] font-bold text-slate-400 uppercase">{item.unit === 'µg' ? 'µg' : item.unit}</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar for constituent */}
                                                    {(() => {
                                                        const rda = userRDAs?.[item.label];
                                                        if (!rda || val === 0) return null;
                                                        const pct = Math.min(100, Math.round((val / rda) * 100));
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full transition-all duration-1000 bg-emerald-500"
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest opacity-40">
                                                                    <span>Target Progress</span>
                                                                    <span>{pct}% of {rda.toFixed(1)}{item.unit === 'µg' ? 'µg' : item.unit}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Values represent a customized {amount}g sample volume</p>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* EDIT MODAL */}
                {
                    isEditing && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="w-full max-w-md">
                                <Card className="bg-white dark:bg-slate-900 p-8 space-y-6 shadow-2xl border-emerald-500/20">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Edit Ingredient Details</h3>
                                        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name (Scientific)</Label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold h-12 rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</Label>
                                            <Input
                                                value={editCommonName}
                                                onChange={(e) => setEditCommonName(e.target.value)}
                                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12 rounded-xl"
                                                placeholder="e.g. Garden Pea"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Biological Category</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {CATEGORIES.map(category => (
                                                    <button
                                                        key={category}
                                                        onClick={() => setEditCategory(category)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                            editCategory === category
                                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        )}
                                                    >
                                                        {category}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Display Image</Label>
                                            <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group/upload flex items-center justify-center">
                                                {editImage ? (
                                                    <>
                                                        <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button variant="secondary" size="sm" className="gap-2" onClick={() => setEditImage('')}>
                                                                <X size={14} /> Remove
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center p-4">
                                                        {uploading ? (
                                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <>
                                                                <Camera size={24} className="text-slate-400 mx-auto mb-2" />
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload Profile Image</p>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                    onChange={handleImageUpload}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nutrients per 100g</Label>
                                            <textarea
                                                value={editNutrientText}
                                                onChange={(e) => setEditNutrientText(e.target.value)}
                                                className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                                placeholder="Paste nutrition data here..."
                                            />
                                            <p className="text-[9px] text-slate-400">Format: "Protein: 10g" or paste from USDA</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Serving Sizes</Label>
                                            <textarea
                                                value={editServingText}
                                                onChange={(e) => setEditServingText(e.target.value)}
                                                className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                                placeholder="1 cup = 240g&#10;1 large = 150g"
                                            />
                                            <p className="text-[9px] text-slate-400">Format: "1 cup = 240g"</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]" onClick={() => setIsEditing(false)}>
                                            Discard
                                        </Button>
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 gap-2"
                                            onClick={handleEditSave}
                                            disabled={saveLoading}
                                        >
                                            {saveLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                            Save Profile
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )
                }
            </div>
        </PageContainer>
    );
}
