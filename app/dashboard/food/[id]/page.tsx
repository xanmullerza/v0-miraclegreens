'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    ArrowLeft,
    Beef,
    Zap,
    Gem,
    Droplet,
    Battery,
    Activity,
    Info,
    Edit2,
    X,
    Loader2,
    Layers,
    Share2,
    Star,
    Upload,
    Camera,
    Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

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
    is_favorite?: boolean;
    category?: string;
}

export default function FoodDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [food, setFood] = useState<FoodItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [breakdownNutrient, setBreakdownNutrient] = useState<string | null>(null);

    // Edit states
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const CATEGORIES = ["Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

    // Default RDA for comparison context
    const userRDAs = useRDA(30, 'female', food?.energy_kcal ? food.energy_kcal * 10 : 2000);

    useEffect(() => {
        if (id) {
            fetchFoodDetails();
        }
    }, [id]);

    const fetchFoodDetails = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setFood(data);
        } catch (error: any) {
            console.error('Error fetching food:', error);
            toast.error('Failed to load food profile');
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

    const handleEditStart = () => {
        if (!food) return;
        setEditName(food.name);
        setEditCommonName(food.common_name || '');
        setEditCategory(food.category || 'General');
        setEditImage(food.image || '');
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
            const { error } = await supabase
                .from('food_items')
                .update({
                    name: editName,
                    common_name: editCommonName,
                    category: editCategory,
                    image: editImage
                } as any)
                .eq('id', food.id);

            if (error) throw error;

            setFood({
                ...food,
                name: editName,
                common_name: editCommonName,
                category: editCategory,
                image: editImage
            });

            setIsEditing(false);
            toast.success('Food profile updated successfully');
        } catch (error) {
            console.error('Error updating food:', error);
            toast.error('Failed to update food profile');
        } finally {
            setSaveLoading(false);
        }
    };

    const getVal = (keys: string[]) => {
        if (!food) return 0;
        const m = food.micronutrients || {};
        for (const k of keys) {
            if (k === 'energy_kcal') return food.energy_kcal;
            if (k === 'protein_g') return food.protein_g;
            if (k === 'carbs_g') return food.carbs_g;
            if (k === 'fat_g') return food.fat_g;
            if (m[k] !== undefined) return m[k];
        }
        return 0;
    };

    const NutrientSection = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, string[]>, icon: any, theme?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'amber', subtitle?: string }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
        };
        const t = (themes as any)[theme];

        return (
            <div className={cn("p-8 rounded-[2.5rem] border bg-gradient-to-br", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-3 mb-1 uppercase tracking-widest text-xs", t.text)}><Icon className="h-5 w-5" /> {title}</h4>
                {subtitle && <p className={cn("text-[10px] text-slate-400 mb-6 border-b pb-2", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(items).map(([label, keys]) => {
                        const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label.includes('Vitamin A') || label.includes('Vitamin K') || label.includes('Vitamin D') ? 'µg' : label.includes('Vitamin D') ? 'IU' : 'mg';
                        const val = getVal(keys);
                        const rda = (userRDAs as any)?.[label];
                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                        const styles = getNutrientLevelStyles(pct, label);

                        return (
                            <div key={label} onClick={() => setSelectedNutrientInfo(label)} className={cn("p-5 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[9px] uppercase font-black text-foreground/60 truncate">{label}</p>
                                    <span className="text-[9px] text-muted-foreground font-black">{unitLabel}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black tracking-tighter">
                                        {val >= 1 ? val.toFixed(1) : val.toFixed(2)}
                                    </span>
                                </div>
                                {pct > 0 && (
                                    <div className={cn("mt-2 text-[10px] font-black flex items-center gap-1", styles.text)}>
                                        <div className={cn("h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden")}>
                                            <div className={cn("h-full rounded-full", styles.bg)} style={{ width: `${Math.min(100, pct)}%` }} />
                                        </div>
                                        <span>{pct}%</span>
                                    </div>
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
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleEditStart}
                        className="rounded-2xl h-12 gap-2 font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-[10px]"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-2xl h-12 w-12 p-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <Share2 size={18} />
                    </Button>
                    <Button
                        onClick={toggleFavorite}
                        variant="outline"
                        className={cn(
                            "rounded-2xl px-6 h-12 font-black uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800 transition-all shadow-sm",
                            food.is_favorite ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Heart size={18} fill={food.is_favorite ? "currentColor" : "none"} />
                        {food.is_favorite ? 'Favorited' : 'Favorite'}
                    </Button>
                </div>
            </div>

            {/* Hero Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="aspect-square relative p-4 bg-white dark:bg-slate-900 border-none group">
                        <div className="w-full h-full rounded-[2rem] bg-slate-50 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                            {food.image ? (
                                <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                    <Beef size={120} className="opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <Badge className="bg-emerald-600/90 text-white border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 backdrop-blur-md shadow-2xl w-fit">
                                    {food.category || 'General'}
                                </Badge>
                                {food.protein_g > 15 && (
                                    <Badge className="bg-red-600/90 text-white border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 backdrop-blur-md shadow-2xl w-fit">
                                        High Protein
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                <Activity size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Bio-Clinical Profile</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-[0.85]">
                            {food.common_name || food.name}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Energy', val: food.energy_kcal, unit: 'kcal', color: 'bg-orange-500/10 text-orange-500', icon: Zap },
                            { label: 'Protein', val: food.protein_g, unit: 'g', color: 'bg-red-500/10 text-red-600', icon: Beef },
                            { label: 'Carbs', val: food.carbs_g, unit: 'g', color: 'bg-blue-500/10 text-blue-600', icon: Activity },
                            { label: 'Fat', val: food.fat_g, unit: 'g', color: 'bg-amber-500/10 text-amber-600', icon: Droplet },
                        ].map(macro => (
                            <div key={macro.label} className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                                <macro.icon size={20} className={cn("mb-3", macro.color.split(' ')[1])} />
                                <span className="text-2xl font-black">{macro.val.toFixed(macro.label === 'Energy' ? 0 : 1)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{macro.label} ({macro.unit})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comprehensive Nutrient Report */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                        <Layers className="text-emerald-500" />
                        Constituent Analysis
                    </h2>
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                        <Info size={16} className="text-blue-500" />
                        <p className="text-[10px] uppercase font-black tracking-widest text-blue-600">All values represent a 100g clinical sample</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <NutrientSection title="Hydration & Electrolytes" icon={Zap} theme="indigo" subtitle="Essential minerals for cellular hydration and nerve signal transmission" items={{
                        'Sodium': ['Sodium', 'sodium_mg'],
                        'Potassium': ['Potassium', 'potassium_mg'],
                        'Magnesium': ['Magnesium', 'magnesium_mg'],
                        'Calcium': ['Calcium', 'calcium_mg'],
                        'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                    }} />

                    <NutrientSection title="Trace Bio-Minerals" icon={Gem} theme="rose" subtitle="Rare essential minerals required for metabolic enzymatic reactions" items={{
                        'Iron': ['Iron', 'iron_mg'],
                        'Zinc': ['Zinc', 'zinc_mg'],
                        'Copper': ['Copper', 'copper_mg'],
                        'Manganese': ['Manganese', 'manganese_mg'],
                        'Selenium': ['Selenium', 'selenium_ug']
                    }} />

                    <NutrientSection title="Water-Soluble Vitamins" icon={Droplet} theme="blue" subtitle="Bio-available B-Complex and Vitamin C concentrations" items={{
                        'B1 (Thiamine)': ['B1 (Thiamine)', 'thiamine_mg'],
                        'B2 (Riboflavin)': ['B2 (Riboflavin)', 'riboflavin_mg'],
                        'B3 (Niacin)': ['B3 (Niacin)', 'niacin_mg'],
                        'B5 (Pantothenic)': ['B5 (Pantothenic Acid)', 'pantothenic_acid_mg'],
                        'B6 (Pyridoxine)': ['B6 (Pyridoxine)', 'vitamin_b6_mg'],
                        'B7 (Biotin)': ['Biotin', 'biotin_ug'],
                        'B9 (Folate)': ['B9 (Folate)', 'folate_ug'],
                        'B12 (Cobalamin)': ['B12 (Cobalamin)', 'vitamin_b12_ug'],
                        'Vitamin C': ['Vitamin C', 'vitamin_c_mg'],
                        'Choline': ['Choline', 'choline_mg'],
                    }} />

                    <NutrientSection title="Fat-Soluble Bio-Storage" icon={Battery} theme="emerald" subtitle="Vitamins stored within cellular lipid layers" items={{
                        'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                        'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                        'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                        'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                    }} />

                    <NutrientSection title="Clinical Markers" icon={Activity} theme="amber" subtitle="Secondary markers for advanced health profile mapping" items={{
                        'Fiber': ['Fiber', 'fiber_g'],
                        'Sugars': ['Sugars', 'sugars_g'],
                        'Oxalate': ['Oxalate', 'oxalate_mg'],
                        'Omega-3': ['Omega-3', 'omega3_g'],
                        'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                    }} />
                </div>
            </div>

            {/* NUTRIENT INFO MODAL */}
            {selectedNutrientInfo && (nutrientInfo as any)[selectedNutrientInfo] && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedNutrientInfo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-11 shadow-2xl relative border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedNutrientInfo(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-tighter italic">{selectedNutrientInfo}</h3>
                                <p className="text-slate-400 italic text-sm leading-relaxed">"{(nutrientInfo as any)[selectedNutrientInfo].description}"</p>
                            </div>

                            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/50">
                                <h4 className="font-black text-[10px] mb-3 uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Biological Significance</h4>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{(nutrientInfo as any)[selectedNutrientInfo].importance}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(nutrientInfo as any)[selectedNutrientInfo].benefits.map((b: string, i: number) => (
                                    <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        {b}
                                    </span>
                                ))}
                            </div>

                            <div>
                                <h4 className="font-black text-[10px] mb-3 uppercase tracking-widest text-slate-400">Alternative Sources</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {(nutrientInfo as any)[selectedNutrientInfo].sources.map((s: string, i: number) => (
                                        <span key={i} className="text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditing && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md">
                        <Card className="bg-white dark:bg-slate-900 p-8 space-y-6 shadow-2xl border-emerald-500/20">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Edit Clinical File</h3>
                                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-5">
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
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Reference Clinical Image</Label>
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
            )}
        </div>
    );
}
