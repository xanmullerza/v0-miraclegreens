'use client';

import { useState, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    ArrowLeft,
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
    Info,
    Camera,
    Upload,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
    'Proximate': ['Ash', 'Water', 'Fiber', 'Alcohol', 'Protein', 'Fat', 'Carbohydrates'],
    'Carbohydrates': ['Starch', 'Sugars', 'Glucose', 'Fructose', 'Sucrose', 'Lactose', 'Maltose', 'Allulose', 'Galactose', 'Sugar Alcohol'],
    'Vitamins': ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline', 'Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin'],
    'Vitamin E Derivatives': ['Alpha-tocopherol', 'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol'],
    'Minerals': ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Chromium', 'Fluoride', 'Molybdenum'],
    'Amino Acids': ['Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'],
    'Lipids & Others': ['Saturated Fat', 'Monounsaturated Fat', 'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Omega-3', 'Omega-6', 'Phytosterol', 'Oxalate', 'Caffeine', 'Lycopene', 'Beta-Hydroxybutyrate', 'Lutein + Zeaxanthin']
};

export default function DashboardFoodPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>}>
            <FoodItemCreatorContent />
        </Suspense>
    );
}

function FoodItemCreatorContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showMissing, setShowMissing] = useState(false);

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

    const handleParse = () => {
        const combinedText = `${servingText}\n${nutrientText}`.trim();
        if (!combinedText) {
            toast.error("Please paste some nutrition text first.");
            return;
        }

        const parsed = parseNutritionText(combinedText);
        let foundData = false;

        if (parsed.energy_kcal) {
            setEnergyKcal(parsed.energy_kcal.toString());
            foundData = true;
            if (!parsed.energy_kj) {
                setEnergyKj(Math.round(parsed.energy_kcal * 4.184).toString());
            }
        }
        if (parsed.energy_kj) {
            setEnergyKj(parsed.energy_kj.toString());
            foundData = true;
            if (!parsed.energy_kcal) {
                setEnergyKcal((parsed.energy_kj / 4.184).toFixed(1));
            }
        }
        if (parsed.protein_g) { setProtein(parsed.protein_g.toString()); foundData = true; }
        if (parsed.carbs_g) { setCarbs(parsed.carbs_g.toString()); foundData = true; }
        if (parsed.fat_g) { setFat(parsed.fat_g.toString()); foundData = true; }

        if (parsed.micronutrients && Object.keys(parsed.micronutrients).length > 0) {
            const newMicros: Record<string, string> = {};
            Object.entries(parsed.micronutrients).forEach(([key, val]) => {
                newMicros[key] = val.toString();
            });
            setMicronutrients(prev => ({ ...prev, ...newMicros }));
            foundData = true;
        }

        // Measures are no longer handled in this view

        if (foundData) {
            toast.success("Nutrition details extracted successfully!");
        } else {
            toast.warning("Could not identify specific nutrients. Try a different format.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = fileName;

            const { data, error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                if (uploadError.message.includes('bucket not found')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImage(reader.result as string);
                        setUploading(false);
                    };
                    reader.readAsDataURL(file);
                    return;
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('food-items')
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

    const handleSave = async () => {
        if (!name) {
            toast.error('Please enter a name for the food item');
            return;
        }

        setLoading(true);
        try {
            const foodData = {
                name,
                common_name: commonName || null,
                source: source || 'manual',
                energy_kcal: parseFloat(energyKcal) || null,
                energy_kj: parseFloat(energyKj) || (parseFloat(energyKcal) ? Math.round(parseFloat(energyKcal) * 4.184) : null),
                protein_g: parseFloat(protein) || 0,
                carbs_g: parseFloat(carbs) || 0,
                fat_g: parseFloat(fat) || 0,
                image: image || null,
                micronutrients: Object.entries(micronutrients).reduce((acc, [key, val]) => {
                    if (val) acc[key] = parseFloat(val);
                    return acc;
                }, {} as Record<string, number>)
            };

            const { data: item, error: itemError } = await supabase
                .from('food_items')
                .upsert(foodData, { onConflict: 'name' })
                .select()
                .single();

            if (itemError) throw itemError;

            toast.success('Food item saved successfully!');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err: any) {
            console.error('Error saving food item:', err);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateMicro = (name: string, value: string) => {
        setMicronutrients(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">


            {/* Top Row: Info Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Extraction Section */}
                {showParser && (
                    <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Card className="p-8 border-emerald-500/30 bg-emerald-500/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-emerald-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Nutrients & Servings</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Servings & Sizes</Label>
                                    <Textarea
                                        placeholder="Paste things like '1 cup = 240g' or serving info here..."
                                        className="min-h-[180px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                        value={servingText}
                                        onChange={(e) => setServingText(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Nutrient List</Label>
                                    <Textarea
                                        placeholder="Paste the list of calories, vitamins, and minerals here..."
                                        className="min-h-[180px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                        value={nutrientText}
                                        onChange={(e) => setNutrientText(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button onClick={handleParse} className="h-12 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-widest px-10 shadow-lg shadow-emerald-600/20 rounded-xl">
                                    Fill Details Automatically
                                </Button>
                            </div>
                        </Card>

                        {/* Control Bar */}
                        <div className="flex items-center gap-4 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800">
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
                                disabled={loading}
                                className="flex-[2] h-14 rounded-[18px] bg-slate-950 hover:bg-slate-900 text-white shadow-xl shadow-slate-950/20 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                Save to My Foods
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={cn(
                                    "flex-1 h-14 rounded-[18px] text-[10px] font-black uppercase tracking-widest gap-2 transition-all",
                                    showAdvanced ? "bg-blue-500 text-white border-blue-600" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                )}
                            >
                                <Activity size={16} />
                                {showAdvanced ? 'Hide Details' : 'Full Nutrition'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Basic Details */}
                <Card className={cn(showParser ? "lg:col-span-4" : "lg:col-span-12", "p-8 space-y-8")}>
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
                        </div>
                    </div>

                    {/* Food Visualization */}
                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Camera size={20} className="text-emerald-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Photo</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col items-center justify-center">
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
                                    <div className="text-center p-6">
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
                            <p className="text-[10px] text-slate-400 font-medium italic text-center">Reference images help with visual identification in the synthetic engine.</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Main Content Area */}
                <div className="space-y-8">
                    {showAdvanced && (
                        <div className="space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                                <h3 className="font-black text-xl uppercase tracking-tighter flex items-center gap-3">
                                    <Activity className="text-blue-500 h-6 w-6" />
                                    Detailed Nutrition
                                    <span className="text-xs text-slate-400 font-medium normal-case tracking-normal">(Full list of vitamins and minerals)</span>
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {Object.entries(CATEGORIZED_MARKERS).map(([category, markers]) => (
                                    <Card key={category} className="p-6">
                                        <div className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{category}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {markers.map(m => (
                                                <div key={m} className="space-y-1">
                                                    <div className="flex justify-between items-center px-1">
                                                        <Label className="text-[10px] text-slate-500 truncate block font-medium uppercase tracking-tighter">
                                                            {m}
                                                        </Label>
                                                        {(m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m]) ? (
                                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                                        ) : null}
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        className={cn(
                                                            "h-8 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg",
                                                            (m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m]) ? "border-emerald-500/20 bg-emerald-500/[0.02]" : ""
                                                        )}
                                                        value={m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m] || ''}
                                                        onChange={(e) => {
                                                            if (m === 'Protein') setProtein(e.target.value);
                                                            else if (m === 'Fat') setFat(e.target.value);
                                                            else if (m === 'Carbs') setCarbs(e.target.value);
                                                            else updateMicro(m, e.target.value);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
