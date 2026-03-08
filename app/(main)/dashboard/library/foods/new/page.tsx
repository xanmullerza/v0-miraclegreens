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
    Leaf
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { parseNutritionText, parseMeasures } from '@/lib/utils/nutrition-parser';
import { searchUSDAFood, getUSDAFoodDetails } from '@/lib/services/nutrition';
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

function FoodItemCreatorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const foodIdToEdit = searchParams.get('edit');
    const { energyUnit } = useUserPreferences();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
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
            setAuthLoading(false);
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
    const [servingPanel, setServingPanel] = useState<'paste' | 'add' | null>(null);
    const [nutrientPanel, setNutrientPanel] = useState<'paste' | 'add' | null>(null);

    // Manual serving entries: array of { name, weight_g }
    const [manualServings, setManualServings] = useState<{ name: string; weight_g: string }[]>([{ name: '', weight_g: '' }]);

    // Manual nutrient entries: array of { nutrient, value }
    const [manualNutrients, setManualNutrients] = useState<{ nutrient: string; value: string }[]>([{ nutrient: '', value: '' }]);

    // Sync manual entries into text strings for the existing parser
    const syncManualToText = () => {
        // Build serving text from manual entries
        const manualServingLines = manualServings
            .filter(s => s.name.trim() && s.weight_g.trim())
            .map(s => `1 ${s.name.trim()} = ${s.weight_g.trim()}g`);
        const combinedServingText = [servingText, ...manualServingLines].filter(Boolean).join('\n');

        // Build nutrient text from manual entries
        const manualNutrientLines = manualNutrients
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
                            Object.entries(food.micronutrients).forEach(([key, val]) => {
                                micros[key] = val?.toString() || '';
                            });
                            setMicronutrients(micros);
                        }

                        // Construct nutrient text for the textarea
                        let nText = `Calories: ${food.energy_kcal || 0}
Protein: ${food.protein_g || 0}g
Carbs: ${food.carbs_g || 0}g
Fat: ${food.fat_g || 0}g
`;
                        if (food.micronutrients) {
                            Object.entries(food.micronutrients).forEach(([key, val]) => {
                                nText += `${key}: ${val}\n`;
                            });
                        }
                        setNutrientText(nText);

                        // Construct serving text for the textarea
                        let sText = '';
                        if (food.portions && Array.isArray(food.portions)) {
                            food.portions.forEach((p: any) => {
                                sText += `1 ${p.label} = ${p.weight_g}g\n`;
                            });
                        }
                        setServingText(sText);
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
            if (parsed.micronutrients) {
                Object.entries(parsed.micronutrients).forEach(([key, val]) => {
                    finalMicros[key] = val;
                });
            }
            Object.entries(micronutrients).forEach(([key, val]) => {
                if (val && !finalMicros[key]) {
                    finalMicros[key] = parseFloat(val);
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

    if (authLoading) {
        return (
            <div className="max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic animate-pulse">
                    Verifying Workspace...
                </p>
            </div>
        );
    }

    const updateMicro = (name: string, value: string) => {
        setMicronutrients(prev => ({ ...prev, [name]: value }));
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

    const handleImportSelect = async (item: any) => {
        // Fetch full details for USDA foods to get portions and complete micronutrients
        let fullItem = item;
        if (item.fdcId && item.source === 'usda') {
            try {
                const details = await getUSDAFoodDetails(item.fdcId);
                fullItem = {
                    ...item,
                    portions: details.portions,
                    micronutrients: details.micronutrients
                };
            } catch (error) {
                console.error('Error fetching USDA food details:', error);
                toast.warning("Partial data imported. Some details may be incomplete.");
            }
        }

        // Calculate missing carbs from sugar components if not provided
        let finalCarbs = fullItem.carbs_g || 0;
        if (!finalCarbs || finalCarbs === 0) {
            const micros = fullItem.micronutrients || {};
            const sugarComponents = [
                'Glucose', 'Fructose', 'Sucrose', 'Lactose', 'Maltose', 
                'Starch', 'Fiber', 'Sugar Alcohol', 'Sugars', 'Allulose', 'Galactose'
            ];
            
            let calculatedCarbs = 0;
            sugarComponents.forEach(comp => {
                // Find the nutrient key (case-insensitive)
                const key = Object.keys(micros).find(k => k.toLowerCase() === comp.toLowerCase());
                if (key && micros[key]) {
                    calculatedCarbs += parseFloat(micros[key]) || 0;
                }
            });
            if (calculatedCarbs > 0) {
                finalCarbs = calculatedCarbs;
            }
        }

        // Calculate missing energy (calories) using Atwater factors if not provided
        let finalEnergy = fullItem.energy_kcal || 0;
        if (!finalEnergy || finalEnergy === 0) {
            const protein = parseFloat(fullItem.protein_g) || 0;
            const carbs = finalCarbs || 0;
            const fat = parseFloat(fullItem.fat_g) || 0;
            
            // Atwater factors: Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g
            if (protein > 0 || carbs > 0 || fat > 0) {
                finalEnergy = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
            }
        }

        // Populate the form with the imported item's data
        setName(fullItem.name);
        setCommonName(fullItem.common_name || '');
        setEnergyKcal(finalEnergy?.toString() || '');
        setEnergyKj(fullItem.energy_kj?.toString() || (finalEnergy ? Math.round(finalEnergy * 4.184).toString() : ''));
        setProtein(fullItem.protein_g?.toString() || '');
        setFat(fullItem.fat_g?.toString() || '');
        setCarbs(finalCarbs?.toString() || '');

        // Construct nutrient text for display/editing
        let nText = `Calories: ${finalEnergy || 0}
Protein: ${fullItem.protein_g || 0}g
Carbs: ${finalCarbs || 0}g
Fat: ${fullItem.fat_g || 0}g
`;
        if (fullItem.micronutrients) {
            Object.entries(fullItem.micronutrients).forEach(([key, val]) => {
                nText += `${key}: ${val}\n`;
            });
            // Update state map directly too
            const newMicros: Record<string, string> = {};
            Object.entries(fullItem.micronutrients as Record<string, number>).forEach(([k, v]) => {
                newMicros[k] = v.toString();
            });
            setMicronutrients(newMicros);
        }
        setNutrientText(nText);

        // Construct serving text with portions
        let sText = '';
        if (fullItem.portions && Array.isArray(fullItem.portions) && fullItem.portions.length > 0) {
            fullItem.portions.forEach((p: any) => {
                sText += `1 ${p.label} = ${p.weight_g}g\n`;
            });
        } else {
            // Add default gram and kilogram sizes if no portions exist
            sText = '1 gram = 1g\n1 kilogram = 1000g\n';
        }
        setServingText(sText);

        setIsSearchActive(false);
        setSearchQuery('');
        setSearchResults([]);
        toast.success("Imported data from Library. You can now edit and save.");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-8 h-screen overflow-y-auto animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">

            {loadingFood && (
                <div className="flex items-center justify-center gap-3 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Loading food item...</p>
                </div>
            )}

            {/* Food Search Hero Workspace */}
            <div className="pt-3">
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

            {/* Top Row: Info Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Extraction Section */}
                {showParser && (
                    <div className="lg:col-span-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Card className="p-6 border-emerald-500/30 bg-emerald-500/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-emerald-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Nutrients & Servings</h3>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setServingPanel(servingPanel === 'add' ? null : 'add')}
                                    className={cn(
                                        "h-12 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                        servingPanel === 'add'
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                    )}
                                >
                                    <Plus size={16} />
                                    Add Servings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setServingPanel(servingPanel === 'paste' ? null : 'paste')}
                                    className={cn(
                                        "h-12 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                        servingPanel === 'paste'
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                                    )}
                                >
                                    <Scale size={16} />
                                    Paste Servings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNutrientPanel(nutrientPanel === 'add' ? null : 'add')}
                                    className={cn(
                                        "h-12 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                        nutrientPanel === 'add'
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                    )}
                                >
                                    <Plus size={16} />
                                    Add Nutrients
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNutrientPanel(nutrientPanel === 'paste' ? null : 'paste')}
                                    className={cn(
                                        "h-12 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                                        nutrientPanel === 'paste'
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                                    )}
                                >
                                    <Activity size={16} />
                                    Paste Nutrients
                                </button>
                            </div>

                            {/* Serving Paste Panel */}
                            {servingPanel === 'paste' && (
                                <div className="mb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Paste Servings & Sizes</Label>
                                    <Textarea
                                        placeholder="Paste things like '1 cup = 240g' or serving info here..."
                                        className="min-h-[160px] bg-white dark:bg-slate-950 border-blue-500/20 text-xs focus:ring-blue-500/20 rounded-2xl font-mono p-4"
                                        value={servingText}
                                        onChange={(e) => setServingText(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Serving Add Panel */}
                            {servingPanel === 'add' && (
                                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Add Serving Sizes</Label>
                                    <div className="space-y-2">
                                        {manualServings.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Input
                                                    placeholder="e.g. cup, tablespoon, slice"
                                                    className="flex-1 h-9 text-sm rounded-lg bg-white dark:bg-slate-950"
                                                    value={s.name}
                                                    onChange={(e) => {
                                                        const updated = [...manualServings];
                                                        updated[i] = { ...updated[i], name: e.target.value };
                                                        setManualServings(updated);
                                                    }}
                                                />
                                                <Input
                                                    placeholder="g"
                                                    type="number"
                                                    className="w-20 h-9 text-sm text-center rounded-lg bg-white dark:bg-slate-950"
                                                    value={s.weight_g}
                                                    onChange={(e) => {
                                                        const updated = [...manualServings];
                                                        updated[i] = { ...updated[i], weight_g: e.target.value };
                                                        setManualServings(updated);
                                                    }}
                                                />
                                                {manualServings.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualServings(manualServings.filter((_, idx) => idx !== i))}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setManualServings([...manualServings, { name: '', weight_g: '' }])}
                                        className="w-full h-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add More
                                    </button>
                                </div>
                            )}

                            {/* Nutrient Paste Panel */}
                            {nutrientPanel === 'paste' && (
                                <div className="mb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Paste Nutrient List</Label>
                                    <Textarea
                                        placeholder="Paste the list of calories, vitamins, and minerals here..."
                                        className="min-h-[160px] bg-white dark:bg-slate-950 border-blue-500/20 text-xs focus:ring-blue-500/20 rounded-2xl font-mono p-4"
                                        value={nutrientText}
                                        onChange={(e) => setNutrientText(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Nutrient Add Panel */}
                            {nutrientPanel === 'add' && (
                                <div className="mb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Add Nutrients</Label>
                                    <div className="space-y-2">
                                        {manualNutrients.map((n, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <select
                                                    value={n.nutrient}
                                                    onChange={(e) => {
                                                        const updated = [...manualNutrients];
                                                        updated[i] = { ...updated[i], nutrient: e.target.value };
                                                        setManualNutrients(updated);
                                                    }}
                                                    className="flex-1 h-9 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                                                >
                                                    <option value="">Select nutrient...</option>
                                                    {Object.entries(CATEGORIZED_MARKERS).map(([group, markers]) => (
                                                        <optgroup key={group} label={group}>
                                                            {markers.map(m => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                                <Input
                                                    placeholder="Value"
                                                    className="w-24 h-9 text-sm text-center rounded-lg bg-white dark:bg-slate-950"
                                                    value={n.value}
                                                    onChange={(e) => {
                                                        const updated = [...manualNutrients];
                                                        updated[i] = { ...updated[i], value: e.target.value };
                                                        setManualNutrients(updated);
                                                    }}
                                                />
                                                {manualNutrients.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualNutrients(manualNutrients.filter((_, idx) => idx !== i))}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setManualNutrients([...manualNutrients, { nutrient: '', value: '' }])}
                                        className="w-full h-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Add More
                                    </button>
                                </div>
                            )}

                        </Card>
                    </div>
                )}

                {/* Name Details Card */}
                <Card className={cn(showParser ? "lg:col-span-4" : "lg:col-span-12", "p-6")}>
                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Beef size={20} className="text-emerald-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Name</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Official Name</Label>
                                <Input
                                    placeholder="e.g. Potatoes, raw, white"
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl font-bold"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Common Name / Nickname</Label>
                                <Input
                                    placeholder="e.g. White Potato"
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl"
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
                                        className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-bold appearance-none pr-10"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Photo Section - Full Width */}
            <Card className="p-6 w-full">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Camera size={20} className="text-emerald-500" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Photo</h3>
                    </div>
                    <div className="space-y-4">
                        <label className="relative aspect-video md:aspect-auto md:h-[120px] rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 group hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center cursor-pointer block">
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
                </div>
            </Card>

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

