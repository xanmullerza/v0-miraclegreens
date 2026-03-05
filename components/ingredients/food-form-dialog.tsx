'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    Trash2,
    Sparkles,
    Beef,
    ChevronDown,
    Camera,
    Upload,
    Loader2,
    X,
    Plus,
    ClipboardPaste,
    ListPlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { parseNutritionText, parseMeasures } from '@/lib/utils/nutrition-parser';

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
    'Macros': ['Protein', 'Fat', 'Carbs', 'Fiber', 'Sugars', 'Starch', 'Alcohol', 'Water', 'Ash'],
    'Fats': ['Saturated Fat', 'Monounsaturated Fat', 'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Omega-3', 'Omega-6'],
    'Vitamins': ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline'],
    'Carotenoids': ['Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin', 'Lycopene', 'Lutein + Zeaxanthin'],
    'Tocopherols': ['Alpha-tocopherol', 'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol'],
    'Minerals': ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Chromium', 'Fluoride', 'Molybdenum'],
    'Amino Acids': ['Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'],
    'Other': ['Oxalate', 'Caffeine', 'Phytosterol', 'Beta-Hydroxybutyrate', 'Sugar Alcohol', 'Allulose', 'Glucose', 'Fructose', 'Sucrose', 'Lactose', 'Maltose', 'Galactose']
};

interface FoodFormDialogProps {
    onClose: () => void;
    foodIdToEdit?: string | null;
}

export function FoodFormDialog({ onClose, foodIdToEdit }: FoodFormDialogProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingFood, setLoadingFood] = useState(false);
    const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

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

    // Panel mode: 'none' | 'manual' | 'paste'
    const [servingPanel, setServingPanel] = useState<'none' | 'manual' | 'paste'>('none');
    const [nutrientPanel, setNutrientPanel] = useState<'none' | 'manual' | 'paste'>('none');
    const [manualServings, setManualServings] = useState<{name: string; weight_g: string}[]>([{name: '', weight_g: ''}]);
    const [manualNutrients, setManualNutrients] = useState<{marker: string; value: string}[]>([{marker: '', value: ''}]);

    // Sync manual entries into the text fields used by the parser
    const syncManualToText = () => {
        const sLines = manualServings
            .filter(s => s.name && s.weight_g)
            .map(s => `1 ${s.name} = ${s.weight_g}g`);
        if (sLines.length) setServingText(prev => (prev ? prev + '\n' : '') + sLines.join('\n'));

        const nLines = manualNutrients
            .filter(n => n.marker && n.value)
            .map(n => `${n.marker}: ${n.value}`);
        if (nLines.length) setNutrientText(prev => (prev ? prev + '\n' : '') + nLines.join('\n'));

        // Reset manual entries after syncing
        setManualServings([{name: '', weight_g: ''}]);
        setManualNutrients([{marker: '', value: ''}]);
        setServingPanel('none');
        setNutrientPanel('none');
    };

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

                        if (food.micronutrients) {
                            const micros: Record<string, string> = {};
                            Object.entries(food.micronutrients).forEach(([key, val]) => {
                                micros[key] = val?.toString() || '';
                            });
                            setMicronutrients(micros);
                        }

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

            const { data: urlData } = supabase.storage.from('food-items').getPublicUrl(filePath);
            setImage(urlData.publicUrl);
            toast.success('Image uploaded');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload image — please try again');
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
            const combinedText = `${servingText}\n${nutrientText}`.trim();
            const parsed = combinedText ? parseNutritionText(combinedText) : { micronutrients: {} };
            const parsedPortions = servingText ? parseMeasures(servingText) : [];

            const finalEnergyKcal = parsed.energy_kcal || parseFloat(energyKcal) || null;
            const finalEnergyKj = parsed.energy_kj || parseFloat(energyKj) || (finalEnergyKcal ? Math.round(finalEnergyKcal * 4.184) : null);
            const finalProtein = parsed.protein_g || parseFloat(protein) || 0;
            const finalCarbs = parsed.carbs_g || parseFloat(carbs) || 0;
            const finalFat = parsed.fat_g || parseFloat(fat) || 0;

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
                if (editingFoodId) {
                    foodData.id = editingFoodId;
                }
                const { data: item, error: itemError } = await supabase
                    .from('food_items')
                    .upsert(foodData, { onConflict: editingFoodId ? 'id' : 'name' })
                    .select()
                    .single();

                if (itemError) throw itemError;
            } else {
                if (editingFoodId) {
                    foodData.id = editingFoodId;
                } else {
                    foodData.id = `food-${Date.now()}`;
                }
                const localData = localStorage.getItem('local_foods');
                let localFoods = localData ? JSON.parse(localData) : [];
                
                if (editingFoodId) {
                    const index = localFoods.findIndex((f: any) => f.id === editingFoodId);
                    if (index !== -1) {
                        localFoods[index] = foodData;
                    } else {
                        localFoods.push(foodData);
                    }
                } else {
                    localFoods.push(foodData);
                }
                localStorage.setItem('local_foods', JSON.stringify(localFoods));
            }

            toast.success(editingFoodId ? 'Food item updated!' : 'Food item saved!');
            onClose();
            router.refresh();
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error?.message || 'Failed to save food item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Header with Close Button */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {editingFoodId ? 'Edit Food Item' : 'Add New Food'}
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
                    {loadingFood && (
                        <div className="flex items-center justify-center gap-3 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/30">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Loading food item...</p>
                        </div>
                    )}

                    {/* Top Row: Info Entry */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Extraction Section */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="p-6 border-emerald-500/30 bg-emerald-500/[0.03]">
                                <div className="flex items-center gap-3 mb-6">
                                    <Sparkles size={20} className="text-emerald-500" />
                                    <h3 className="font-black text-sm uppercase tracking-widest">Nutrients & Servings</h3>
                                </div>

                                {/* 4-Button Action Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setServingPanel(servingPanel === 'manual' ? 'none' : 'manual')}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                                            servingPanel === 'manual'
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <Plus size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Servings</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setServingPanel(servingPanel === 'paste' ? 'none' : 'paste')}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                                            servingPanel === 'paste'
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <ClipboardPaste size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Paste Servings</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNutrientPanel(nutrientPanel === 'manual' ? 'none' : 'manual')}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                                            nutrientPanel === 'manual'
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <ListPlus size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add Nutrients</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNutrientPanel(nutrientPanel === 'paste' ? 'none' : 'paste')}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                                            nutrientPanel === 'paste'
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                                : "border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-slate-600 dark:text-slate-400"
                                        )}
                                    >
                                        <ClipboardPaste size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Paste Nutrients</span>
                                    </button>
                                </div>

                                {/* Serving – Manual Form */}
                                {servingPanel === 'manual' && (
                                    <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Add Servings Manually</Label>
                                        {manualServings.map((s, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="e.g. cup, tbsp, slice"
                                                    className="flex-1 h-10 text-sm rounded-xl bg-white dark:bg-slate-950"
                                                    value={s.name}
                                                    onChange={e => {
                                                        const copy = [...manualServings];
                                                        copy[i] = { ...copy[i], name: e.target.value };
                                                        setManualServings(copy);
                                                    }}
                                                />
                                                <Input
                                                    placeholder="weight (g)"
                                                    type="number"
                                                    className="w-28 h-10 text-sm rounded-xl bg-white dark:bg-slate-950"
                                                    value={s.weight_g}
                                                    onChange={e => {
                                                        const copy = [...manualServings];
                                                        copy[i] = { ...copy[i], weight_g: e.target.value };
                                                        setManualServings(copy);
                                                    }}
                                                />
                                                {manualServings.length > 1 && (
                                                    <button type="button" onClick={() => setManualServings(manualServings.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" className="gap-1 text-[10px] uppercase font-black tracking-widest rounded-xl" onClick={() => setManualServings([...manualServings, { name: '', weight_g: '' }])}>
                                                <Plus size={14} /> Add More
                                            </Button>
                                            <Button type="button" size="sm" className="gap-1 text-[10px] uppercase font-black tracking-widest rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white" onClick={syncManualToText}>
                                                <Save size={14} /> Done
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Serving – Paste Textarea */}
                                {servingPanel === 'paste' && (
                                    <div className="mb-6 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Paste Servings & Sizes</Label>
                                        <Textarea
                                            placeholder="Paste things like '1 cup = 240g' or serving info here..."
                                            className="min-h-[140px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                            value={servingText}
                                            onChange={(e) => setServingText(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Nutrient – Manual Form */}
                                {nutrientPanel === 'manual' && (
                                    <div className="mb-6 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Add Nutrients Manually</Label>
                                        {manualNutrients.map((n, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={n.marker}
                                                        onChange={e => {
                                                            const copy = [...manualNutrients];
                                                            copy[i] = { ...copy[i], marker: e.target.value };
                                                            setManualNutrients(copy);
                                                        }}
                                                        className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm appearance-none pr-8"
                                                    >
                                                        <option value="">Select nutrient...</option>
                                                        {Object.entries(CATEGORIZED_MARKERS).map(([group, markers]) => (
                                                            <optgroup key={group} label={group}>
                                                                {markers.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                                </div>
                                                <Input
                                                    placeholder="value (e.g. 12mg)"
                                                    className="w-32 h-10 text-sm rounded-xl bg-white dark:bg-slate-950"
                                                    value={n.value}
                                                    onChange={e => {
                                                        const copy = [...manualNutrients];
                                                        copy[i] = { ...copy[i], value: e.target.value };
                                                        setManualNutrients(copy);
                                                    }}
                                                />
                                                {manualNutrients.length > 1 && (
                                                    <button type="button" onClick={() => setManualNutrients(manualNutrients.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-600">
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" className="gap-1 text-[10px] uppercase font-black tracking-widest rounded-xl" onClick={() => setManualNutrients([...manualNutrients, { marker: '', value: '' }])}>
                                                <Plus size={14} /> Add More
                                            </Button>
                                            <Button type="button" size="sm" className="gap-1 text-[10px] uppercase font-black tracking-widest rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white" onClick={syncManualToText}>
                                                <Save size={14} /> Done
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Nutrient – Paste Textarea */}
                                {nutrientPanel === 'paste' && (
                                    <div className="mb-6 space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Paste Nutrient List</Label>
                                        <Textarea
                                            placeholder="Paste the list of calories, vitamins, and minerals here..."
                                            className="min-h-[140px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                            value={nutrientText}
                                            onChange={(e) => setNutrientText(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Show accumulated text preview */}
                                {(servingText || nutrientText) && (
                                    <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Parsed Data Preview</p>
                                        {servingText && <p className="text-[10px] text-slate-500 font-mono truncate">Servings: {servingText.split('\n').filter(Boolean).length} entries</p>}
                                        {nutrientText && <p className="text-[10px] text-slate-500 font-mono truncate">Nutrients: {nutrientText.split('\n').filter(Boolean).length} entries</p>}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Name Details Card */}
                        <Card className="lg:col-span-4 p-6">
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
                        <div className="space-y-6">
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
                                            <img src={image} alt="Food item" className="w-full h-full object-cover rounded-2xl" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                                <Button variant="secondary" size="sm" className="gap-2 pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImage(''); }}>
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setName('');
                                setCommonName('');
                                setServingText('');
                                setNutrientText('');
                                setImage('');
                                setCategory('General');
                            }}
                            className="flex-1 h-14 rounded-[18px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 gap-2"
                        >
                            <Trash2 size={16} />
                            Clear
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading || !name.trim()}
                            className={cn(
                                "flex-1 h-14 rounded-[18px] text-white shadow-xl text-[10px] font-black uppercase tracking-widest gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300",
                                name.trim()
                                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 transform scale-[1.02]"
                                    : "bg-slate-950 hover:bg-slate-900 shadow-slate-950/20"
                            )}
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                            Save
                        </Button>
                    </div>
                </div>
            </div>
    );
}
