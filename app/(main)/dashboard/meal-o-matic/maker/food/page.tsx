'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    Plus,
    Trash2,
    Sparkles,
    Scale,
    Beef,
    Zap,
    Utensils,
    Activity,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Info,
    Camera,
    Upload,
    Loader2,
    Library,
    ChefHat,
    ArrowRight,
    Search,
    X,
    Leaf,
    ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { parseNutritionText, parseMeasures } from '@/lib/utils/nutrition-parser';
import { searchUSDAFood } from '@/lib/services/nutrition';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import { HeroSearch } from '@/components/ui/hero-search';
import { useUserPreferences } from '@/lib/context/user-preferences-context';


const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const ALL_CLINICAL_MARKERS = [
    'Ash', 'Water', 'Fiber', 'Alcohol', 'Protein', 'Fat', 'Saturated Fat', 'Monounsaturated Fat',
    'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Starch', 'Sugars', 'Glucose', 'Fructose',
    'Sucrose', 'Lactose', 'Maltose', 'Allulose', 'Galactose', 'Sugar Alcohol', 'Vitamin A',
    'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)',
    'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)',
    'Choline', 'Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin', 'Alpha-tocopherol',
    'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol', 'Calcium', 'Iron', 'Magnesium',
    'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine',
    'Chromium', 'Fluoride', 'Molybdenum', 'Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid',
    'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine',
    'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine', 'Oxalate', 'Omega-3',
    'Omega-6', 'Caffeine', 'Lycopene', 'Phytosterol', 'Beta-Hydroxybutyrate', 'Lutein + Zeaxanthin'
];

const CATEGORIZED_MARKERS: Record<string, string[]> = {
    'Proximate': ['Ash', 'Water', 'Fiber', 'Alcohol', 'Protein', 'Fat', 'Carbohydrates'],
    'Carbohydrates': ['Starch', 'Sugars', 'Glucose', 'Fructose', 'Sucrose', 'Lactose', 'Maltose', 'Allulose', 'Galactose', 'Sugar Alcohol'],
    'Vitamins': ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline', 'Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin'],
    'Vitamin E Derivatives': ['Alpha-tocopherol', 'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol'],
    'Minerals': ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Chromium', 'Fluoride', 'Molybdenum'],
    'Amino Acids': ['Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'],
    'Lipids & Others': ['Saturated Fat', 'Monounsaturated Fat', 'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Omega-3', 'Omega-6', 'Phytosterol', 'Oxalate', 'Caffeine', 'Lycopene', 'Beta-Hydroxybutyrate', 'Lutein + Zeaxanthin']
};

export default function AddFoodPage() {
    return (
        <Suspense fallback={
            <div className="max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic animate-pulse">
                    Initializing Food Workspace...
                </p>
            </div>
        }>
            <FoodItemCreatorContent />
        </Suspense>
    );
}

export function FoodItemCreatorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const foodIdToEdit = searchParams.get('edit');
    const { energyUnit } = useUserPreferences();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingFood, setLoadingFood] = useState(false);
    const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchTimeoutRef = useMemo(() => ({ current: null as NodeJS.Timeout | null }), []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);


    // State for the food item
    const [name, setName] = useState('');
    const [commonName, setCommonName] = useState('');
    const [energyKcal, setEnergyKcal] = useState<string>('');
    const [energyKj, setEnergyKj] = useState<string>('');
    const [protein, setProtein] = useState<string>('');
    const [carbs, setCarbs] = useState<string>('');
    const [fat, setFat] = useState<string>('');
    const [source, setSource] = useState<string>('manual');
    const [micronutrients, setMicronutrients] = useState<Record<string, string>>({});
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);

    const [servingText, setServingText] = useState('');
    const [nutrientText, setNutrientText] = useState('');
    const [showParser, setShowParser] = useState(true);
    const [showImportPicker, setShowImportPicker] = useState(false);

    // Panel modes: null = show buttons, 'paste' = show textarea, 'add' = show manual form
    const [infoMode, setInfoMode] = useState<'write' | 'paste' | 'upload' | null>(null);

    // Manual serving entries: array of { name, weight_g }
    const [manualServings, setManualServings] = useState<{ name: string; weight_g: string }[]>([
        { name: 'Gram', weight_g: '1' },
        { name: 'Kilogram', weight_g: '1000' }
    ]);

    // Manual nutrient entries: array of { nutrient, value }
    const [manualNutrients, setManualNutrients] = useState<{ nutrient: string; value: string }[]>([]);

    // State for temporary add nutrient input
    const [newNutrient, setNewNutrient] = useState({ nutrient: '', value: '' });

    // Sync manual entries into text strings for the existing parser
    const syncManualToText = () => {
        // Build serving text from manual entries
        const manualServingLines = manualServings
            .filter(s => s.name.trim() && s.weight_g.trim())
            .map(s => `1 ${s.name.trim()} = ${s.weight_g.trim()}g`);
        const combinedServingText = [servingText, ...manualServingLines].filter(Boolean).join('\n');

        // Build nutrient text from manual entries - include existing list AND temporary new one
        const manualNutrientLines = [...manualNutrients, newNutrient]
            .filter(n => n.nutrient.trim() && n.value.trim())
            .map(n => `${n.nutrient} ${n.value}`);
        const combinedNutrientText = [nutrientText, ...manualNutrientLines].filter(Boolean).join('\n');

        return { combinedServingText, combinedNutrientText };
    };


    const integrity = useMemo(() => {
        const present = ALL_CLINICAL_MARKERS.filter((m: string) => {
            // Check top-level macros first
            if (m === 'Protein') return protein !== '';
            if (m === 'Fat') return fat !== '';
            if (m === 'Carbohydrates' || m === 'Carbs') return carbs !== '';

            // Check for any defined value including '0'
            const val = micronutrients[m];
            return val !== undefined && val !== '';
        });
        const missing = ALL_CLINICAL_MARKERS.filter((m: string) => !present.includes(m));
        return {
            score: present.length,
            total: ALL_CLINICAL_MARKERS.length,
            missing,
            percent: Math.round((present.length / ALL_CLINICAL_MARKERS.length) * 100)
        };
    }, [micronutrients, protein, fat, carbs]);


    const [category, setCategory] = useState('General');

    const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

    // Load food item if editing
    useEffect(() => {
        if (foodIdToEdit) {
            const loadFood = async () => {
                setLoadingFood(true);
                try {
                    const { data: food, error } = await supabase
                        .from('food_items')
                        .select('*')
                        .eq('id', foodIdToEdit)
                        .single();

                    if (error) throw error;
                    if (food) {
                        // Populate all form fields with the loaded food data
                        setEditingFoodId(food.id);
                        setName(food.name);
                        setCommonName(food.common_name || '');
                        setEnergyKcal(food.energy_kcal?.toString() || '');
                        setEnergyKj(food.energy_kj?.toString() || '');
                        setProtein(food.protein_g?.toString() || '');
                        setFat(food.fat_g?.toString() || '');
                        setCarbs(food.carbs_g?.toString() || '');
                        setSource(food.source || 'manual');
                        setCategory(food.category || 'General');
                        setImage(food.image || '');

                        // Set micronutrients
                        if (food.micronutrients) {
                            const micros: Record<string, string> = {};
                            const manualNutrientsList: { nutrient: string; value: string }[] = [];

                            Object.entries(food.micronutrients).forEach(([key, val]) => {
                                micros[key] = val?.toString() || '';
                                manualNutrientsList.push({
                                    nutrient: key,
                                    value: val?.toString() || ''
                                });
                            });
                            setMicronutrients(micros);
                            setManualNutrients(manualNutrientsList);
                        }

                        // Don't populate text fields when editing - use form inputs only
                        setNutrientText('');
                        setServingText('');

                        // Build manual servings from portions instead
                        const manualServingsList: { name: string; weight_g: string }[] = [];
                        if (food.portions && Array.isArray(food.portions)) {
                            food.portions.forEach((p: any) => {
                                manualServingsList.push({
                                    name: p.label,
                                    weight_g: p.weight_g?.toString() || ''
                                });
                            });
                        }
                        setManualServings(manualServingsList);

                        // Auto-open the Write panel when editing to show the loaded nutrients
                        setInfoMode('write');
                    }
                } catch (error) {
                    console.error('Failed to load food for editing:', error);
                    toast.error('Failed to load food for editing');
                } finally {
                    setLoadingFood(false);
                }
            };
            loadFood();
        }
    }, [foodIdToEdit]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!user) {
            toast.error('You must be signed in to upload an image');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            // Prefix with user ID — required by storage RLS policy
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-items')
                .getPublicUrl(filePath);

            setImage(publicUrl);
        } catch (err: any) {
            console.error('Upload error:', err);
            toast.error('Image upload failed — please try again');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name) {
            toast.error('Please enter a name for the food item');
            return;
        }

        setLoading(true);
        try {
            // Merge manual entries with pasted text before parsing
            const { combinedServingText, combinedNutrientText } = syncManualToText();

            // Parse nutrition text inline before saving
            const combinedText = `${combinedServingText}\n${combinedNutrientText}`.trim();
            const parsed = combinedText ? parseNutritionText(combinedText) : { micronutrients: {} };

            // Parse portions
            const parsedPortions = combinedServingText ? parseMeasures(combinedServingText) : [];

            // Use parsed values, falling back to any manually entered values
            const finalEnergyKcal = parsed.energy_kcal || parseFloat(energyKcal) || null;
            const finalEnergyKj = parsed.energy_kj || parseFloat(energyKj) || (finalEnergyKcal ? Math.round(finalEnergyKcal * 4.184) : null);
            const finalProtein = parsed.protein_g || parseFloat(protein) || 0;
            const finalCarbs = parsed.carbs_g || parseFloat(carbs) || 0;
            const finalFat = parsed.fat_g || parseFloat(fat) || 0;

            // Merge parsed micronutrients with any manually entered ones
            const finalMicros: Record<string, number> = {};

            // 1. Initial values from the micronutrients state (stashed from load or import)
            Object.entries(micronutrients).forEach(([key, val]) => {
                if (val !== undefined && val !== '') {
                    finalMicros[key] = parseFloat(val);
                }
            });

            // 2. Parsed values from text fields (Paste mode)
            if (parsed.micronutrients) {
                Object.entries(parsed.micronutrients).forEach(([key, val]) => {
                    finalMicros[key] = val;
                });
            }

            // 3. Manually entered nutrients from the Write panel - these OVERRIDE everything
            // Also include the newNutrient if it has values
            [...manualNutrients, newNutrient].forEach((n) => {
                if (n.nutrient && n.value) {
                    const numVal = parseFloat(n.value);
                    if (!isNaN(numVal)) {
                        finalMicros[n.nutrient] = numVal;
                    }
                }
            });

            const foodData: any = {
                name,
                common_name: commonName || null,
                source: source || 'manual',
                category,
                energy_kcal: finalEnergyKcal,
                energy_kj: finalEnergyKj,
                protein_g: finalProtein,
                carbs_g: finalCarbs,
                fat_g: finalFat,
                image: image || null,
                micronutrients: finalMicros,
                portions: parsedPortions,
                user_id: user?.id || null,
                is_curated: false
            };

            if (user) {
                // If editing, include the ID to update the existing record
                if (editingFoodId) {
                    foodData.id = editingFoodId;
                }
                // Cloud Save - upsert will insert or update based on conflict strategy
                const { data: item, error: itemError } = await supabase
                    .from('food_items')
                    .upsert(foodData, { onConflict: editingFoodId ? 'id' : 'name' })
                    .select()
                    .single();

                if (itemError) throw itemError;
            } else {
                // Local Save - Manual ID is fine here since it's just JSON
                if (editingFoodId) {
                    foodData.id = editingFoodId;
                } else {
                    foodData.id = `food-${Date.now()}`;
                }
                const localData = localStorage.getItem('local_foods');
                let localFoods = localData ? JSON.parse(localData) : [];

                if (editingFoodId) {
                    // Update existing local food
                    const index = localFoods.findIndex((f: any) => f.id === editingFoodId);
                    if (index !== -1) {
                        localFoods[index] = foodData;
                    } else {
                        localFoods.push(foodData);
                    }
                } else {
                    // Create new local food
                    localFoods.push(foodData);
                }
                localStorage.setItem('local_foods', JSON.stringify(localFoods));
            }

            toast.success('Food item saved successfully!');

            // Navigate back to foods list
            setTimeout(() => {
                router.push('/dashboard/library/foods');
            }, 1500);

        } catch (err: any) {
            console.error('Error saving food item:', err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };



    // Perform Search
    const performSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchUSDAFood(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce handler
    const handleSearchInput = (val: string) => {
        setSearchQuery(val);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    };

    const handleImportSelect = (item: any) => {
        // Populate the form with the imported item's data
        setName(item.name);
        setCommonName(item.common_name || '');
        setEnergyKcal(item.energy_kcal?.toString() || '');
        setEnergyKj(item.energy_kj?.toString() || '');
        setProtein(item.protein_g?.toString() || '');
        setFat(item.fat_g?.toString() || '');
        setCarbs(item.carbs_g?.toString() || '');

        // Construct nutrient text for display/editing
        let nText = `Calories: ${item.energy_kcal || 0}
Protein: ${item.protein_g || 0}g
Carbs: ${item.carbs_g || 0}g
Fat: ${item.fat_g || 0}g
`;
        if (item.micronutrients) {
            Object.entries(item.micronutrients).forEach(([key, val]) => {
                nText += `${key}: ${val}\n`;
            });
            // Update state map directly too
            const newMicros: Record<string, string> = {};
            Object.entries(item.micronutrients as Record<string, number>).forEach(([k, v]) => {
                newMicros[k] = v.toString();
            });
            setMicronutrients(newMicros);
        }
        setNutrientText(nText);

        // Construct serving text
        let sText = '';
        if (item.portions && Array.isArray(item.portions)) {
            item.portions.forEach((p: any) => {
                sText += `1 ${p.label} = ${p.weight_g}g\n`;
            });
        }
        setServingText(sText);

        setIsSearchActive(false);
        setSearchQuery('');
        setSearchResults([]);
        toast.success("Imported data from Library. You can now edit and save.");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">

            {loadingFood && (
                <div className="flex items-center justify-center gap-3 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Loading food item...</p>
                </div>
            )}

            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-300 transition-colors"
            >
                <ArrowLeft size={14} /> Back to Maker
            </button>

            {/* Food Search Hero Workspace */}
            <div className="pt-6">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={handleSearchInput}
                    results={searchResults}
                    isLoading={isSearching}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={handleImportSelect}
                    onFocus={() => setIsSearchActive(true)}
                    theme="emerald"
                    placeholder="SEARCH FOOD LIBRARY..."
                    idleTitle="Library Search"
                    idleSubtitle="Search your local registry for instant nutrition facts"
                    noResultsMessage="No matching items found"
                    enterMessage="Enter item name to search library"
                    searchingMessage="Searching Local Registry..."
                    renderResult={(food: any) => (
                        <>
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                                    {food.image ? <img src={food.image} className="w-full h-full object-cover" /> : <Beef className="m-auto opacity-10 h-full w-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{food.common_name || food.name}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {energyUnit === 'kJ' ? (food.energy_kcal * 4.184).toFixed(0) : food.energy_kcal.toFixed(0)} {energyUnit} <span className="text-slate-200 dark:text-slate-700">|</span> 100g
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </>
                    )}
                />
            </div>

            {/* Top Row: Info Entry - Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Data Input Section - Left */}
                {showParser && (
                    <Card className="p-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Basic Info Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Beef size={18} className="text-emerald-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Food Details</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-black text-slate-400">Official Name</Label>
                                    <Input
                                        placeholder="e.g. Potatoes, raw, white"
                                        className="h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl font-bold"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-black text-slate-400">Common Name</Label>
                                    <Input
                                        placeholder="e.g. White Potato"
                                        className="h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        value={commonName}
                                        onChange={(e) => setCommonName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] uppercase font-black text-slate-400">Category</Label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold appearance-none pr-10"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Food Information Section - Center */}
                {showParser && (
                    <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Card className="p-6 border-emerald-500/30 bg-emerald-500/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-emerald-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Nutrients & Servings</h3>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setInfoMode(infoMode === 'write' ? null : 'write')}
                                    className={cn(
                                        "w-full h-10 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        infoMode === 'write'
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                    )}
                                >
                                    <Plus size={14} />
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInfoMode(infoMode === 'paste' ? null : 'paste')}
                                    className={cn(
                                        "w-full h-10 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        infoMode === 'paste'
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                                    )}
                                >
                                    <Scale size={14} />
                                    Paste
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInfoMode(infoMode === 'upload' ? null : 'upload')}
                                    className={cn(
                                        "w-full h-10 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        infoMode === 'upload'
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                            : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50"
                                    )}
                                >
                                    <Upload size={14} />
                                    Upload
                                </button>
                            </div>

                            {/* Write Food Info Panel */}
                            {infoMode === 'write' && (
                                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Write Servings, Nutrients & Details</Label>
                                    <div className="space-y-4">
                                        {/* Servings Section */}
                                        <div>
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Quick Add Serving Sizes</Label>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            const [name, weight] = e.target.value.split('|');
                                                            setManualServings([...manualServings, { name, weight_g: weight }]);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium appearance-none pr-10"
                                                >
                                                    <option value="">Select a serving size to add...</option>
                                                    <option value="Gram|1">Gram (1g)</option>
                                                    <option value="Kilogram|1000">Kilogram (1000g)</option>
                                                    <option value="Milliliter|1">Milliliter (1ml)</option>
                                                    <option value="Liter|1000">Liter (1000ml)</option>
                                                    <option value="Teaspoon|5">Teaspoon (5g)</option>
                                                    <option value="Tablespoon|15">Tablespoon (15g)</option>
                                                    <option value="Cup|240">Cup (240g)</option>
                                                    <option value="Ounce|28">Ounce (28g)</option>
                                                    <option value="Pound|454">Pound (454g)</option>
                                                    <option value="Slice|30">Slice (30g)</option>
                                                    <option value="Handful|30">Handful (30g)</option>
                                                    <option value="Serving|100">Serving (100g)</option>
                                                </select>
                                            </div>

                                            {manualServings.length > 0 && (
                                                <div className="space-y-2 mt-2">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Selected Servings:</Label>
                                                    <div className="space-y-1">
                                                        {manualServings.map((s, i) => (
                                                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                                    1 {s.name} = {s.weight_g}g
                                                                </span>
                                                                {manualServings.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setManualServings(manualServings.filter((_, idx) => idx !== i))}
                                                                        className="p-1 text-emerald-400 hover:text-rose-500 transition-colors"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nutrients Section */}
                                        <div className="space-y-4 pt-2 border-t border-emerald-100 dark:border-emerald-800/50 mt-4">
                                            <div>
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Nutrients & Values</Label>

                                                {/* Listed Nutrients (Existing) */}
                                                {manualNutrients.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                                        {manualNutrients.map((n, i) => (
                                                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-left-2 duration-200">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{n.nutrient}</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            value={n.value}
                                                                            onChange={(e) => {
                                                                                const updated = [...manualNutrients];
                                                                                updated[i] = { ...updated[i], value: e.target.value };
                                                                                setManualNutrients(updated);
                                                                            }}
                                                                            className="h-7 border-none bg-transparent p-0 text-sm font-bold text-slate-900 dark:text-white focus-visible:ring-0 shadow-none text-right"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setManualNutrients(manualNutrients.filter((_, idx) => idx !== i))}
                                                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add New Nutrient Row */}
                                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/[0.03] border border-dashed border-emerald-200 dark:border-emerald-800">
                                                    <div className="flex-1 min-w-0">
                                                        <select
                                                            value={newNutrient.nutrient}
                                                            onChange={(e) => setNewNutrient(prev => ({ ...prev, nutrient: e.target.value }))}
                                                            className="w-full h-9 px-3 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                                                        >
                                                            <option value="">Select Nutrient...</option>
                                                            {Object.entries(CATEGORIZED_MARKERS).map(([group, markers]) => (
                                                                <optgroup key={group} label={group}>
                                                                    {markers
                                                                        .filter(m => !manualNutrients.some(n => n.nutrient === m))
                                                                        .map(m => (
                                                                            <option key={m} value={m}>{m}</option>
                                                                        ))
                                                                    }
                                                                </optgroup>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-24">
                                                        <Input
                                                            placeholder="Value"
                                                            className="h-9 text-center bg-white dark:bg-slate-950 font-bold"
                                                            value={newNutrient.value}
                                                            onChange={(e) => setNewNutrient(prev => ({ ...prev, value: e.target.value }))}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={!newNutrient.nutrient || !newNutrient.value}
                                                        onClick={() => {
                                                            if (newNutrient.nutrient && newNutrient.value) {
                                                                setManualNutrients([...manualNutrients, newNutrient]);
                                                                setNewNutrient({ nutrient: '', value: '' });
                                                            }
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-20 transition-all shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <Plus size={18} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Paste Food Info Panel */}
                            {infoMode === 'paste' && (
                                <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Paste Servings */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Paste Servings & Sizes</Label>
                                        <Textarea
                                            placeholder="Paste things like '1 cup = 240g' or serving info here..."
                                            className="min-h-[120px] bg-white dark:bg-slate-950 border-blue-500/20 text-xs focus:ring-blue-500/20 rounded-2xl font-mono p-4"
                                            value={servingText}
                                            onChange={(e) => setServingText(e.target.value)}
                                        />
                                    </div>

                                    {/* Paste Nutrients */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Paste Nutrient List</Label>
                                        <Textarea
                                            placeholder="Paste the list of calories, vitamins, and minerals here..."
                                            className="min-h-[120px] bg-white dark:bg-slate-950 border-blue-500/20 text-xs focus:ring-blue-500/20 rounded-2xl font-mono p-4"
                                            value={nutrientText}
                                            onChange={(e) => setNutrientText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Upload Food Info Panel */}
                            {infoMode === 'upload' && (
                                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-purple-600 ml-1">Upload Food Information</Label>
                                    <div className="border-2 border-dashed border-purple-300 dark:border-purple-800 rounded-2xl p-8 text-center space-y-3">
                                        <Camera size={32} className="mx-auto text-purple-400" />
                                        <div>
                                            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">Upload Nutrition Label Screenshot</p>
                                            <p className="text-xs text-purple-600 dark:text-purple-400">Take a photo or upload a screenshot of a nutrition label</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="food-upload"
                                            onChange={handleImageUpload}
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('food-upload')?.click()}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            Choose Image
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </Card>
                    </div>
                )}

                {/* Photo Section - Right */}
                <Card className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Camera size={18} className="text-emerald-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Photo</h3>
                        </div>
                        <label className="relative aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 group hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer block">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50 pointer-events-auto"
                                onChange={handleImageUpload}
                            />
                            {image ? (
                                <>
                                    <img src={image} alt="Food item" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setImage('')}>
                                            <Trash2 size={14} /> Remove Image
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6 pointer-events-none">
                                    {uploading ? (
                                        <div className="space-y-3">
                                            <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uploading Item...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                                                <Upload size={24} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capture or Upload Reference</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </label>
                    </div>
                </Card>
            </div>

            {/* parser control bar moved here for mobile bottom placement */}
            {showParser && (
                <div className="flex items-center gap-4 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800 mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => window.location.reload()}
                        className="flex-1 h-14 rounded-[18px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 gap-2"
                    >
                        <Trash2 size={16} />
                        Start Over
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || !name.trim() || (!servingText.trim() && !manualServings.some(s => s.name.trim() && s.weight_g.trim())) || (!nutrientText.trim() && !manualNutrients.some(n => n.nutrient.trim() && n.value.trim()))}
                        className={cn(
                            "flex-1 h-14 rounded-[18px] text-white shadow-xl text-[10px] font-black uppercase tracking-widest gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
                            (name.trim() && (servingText.trim() || manualServings.some(s => s.name.trim() && s.weight_g.trim())) && (nutrientText.trim() || manualNutrients.some(n => n.nutrient.trim() && n.value.trim())))
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 transform scale-[1.02]"
                                : "bg-slate-950 hover:bg-slate-900 shadow-slate-950/20"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                        Save
                    </Button>
                </div>
            )}

            {showImportPicker && (
                <FoodItemPicker
                    onSelect={handleImportSelect}
                    onClose={() => setShowImportPicker(false)}
                    mode="usda-only"
                    isAdmin={user?.email?.toLowerCase() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase()}
                />

            )}
        </div>
    );
}
