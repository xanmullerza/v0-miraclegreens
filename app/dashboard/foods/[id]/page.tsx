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
    Edit2,
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
    ShieldCheck
} from 'lucide-react';
import { FOOD_DETAILS } from '@/lib/data/food-details';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { findNutrientMatch } from '@/lib/utils/nutrition-calculator';

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
    details?: import('@/lib/data/food-details').FoodDetail;
}

export default function FoodDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [food, setFood] = useState<FoodItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNutrientInfo, setSelectedNutrientInfo] = useState<string | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
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

    const { nutrientDisplayMode, profile, energyUnit, dailyTargets } = useUserPreferences();

    // Context-aware RDAs
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        2000 // Standard reference
    );

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
                return val;
            }
        }

        // 2. Special Fallback for Energy: Calculate from macros if Energy/Calories is missing or 0
        if (keys.some(k => k.toLowerCase().includes('energy') || k.toLowerCase().includes('calorie'))) {
            const p = food.protein_g || 0;
            const c = food.carbs_g || 0;
            const f = food.fat_g || 0;
            if (p > 0 || c > 0 || f > 0) {
                const kcal = (p * 4) + (c * 4) + (f * 9);
                return energyUnit === 'kJ' ? kcal * 4.184 : kcal;
            }
        }

        return 0;
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
            { label: 'Trans Fat', keys: ['Trans Fat'], unit: 'g' },
            { label: 'Omega-3', keys: ['Omega-3'], unit: 'g' },
            { label: 'Omega-6', keys: ['Omega-6'], unit: 'g' },
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
                        const val = getVal(keys as string[]);
                        const macroRDAs: Record<string, number> = {
                            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
                            'Protein': dailyTargets.protein,
                            'Carbs': dailyTargets.carbs,
                            'Fat': dailyTargets.fat
                        };
                        const rda = userRDAs?.[label] || macroRDAs[label];
                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                        const styles = getNutrientLevelStyles(pct || 0, label);
                        const unitLabel = label === 'Vitamin D' ? 'IU' : (label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label === 'Vitamin A' || label === 'Vitamin K' || label.includes('µg') ? 'µg' : (label === 'Energy' ? energyUnit : (label === 'Protein' || label === 'Carbs' || label === 'Fat') ? 'g' : 'mg'));
                        const hasBreakdown = breakdownLabels.includes(label);

                        return (
                            <div key={label} onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const scrollY = window.scrollY;
                                const viewportHeight = window.innerHeight;
                                const modalHeight = 500; // approximate modal height

                                // Calculate top position - prefer below the element, but adjust if near bottom
                                let top = rect.bottom + scrollY + 8;
                                if (rect.bottom + modalHeight > viewportHeight) {
                                    top = Math.max(scrollY + 80, rect.top + scrollY - modalHeight - 8);
                                }

                                // Center horizontally relative to clicked element
                                let left = rect.left + (rect.width / 2);

                                setModalPosition({ top, left });
                                setSelectedNutrientInfo(label);
                            }} className={cn("p-4 rounded-2xl border bg-white dark:bg-slate-950 cursor-pointer hover:shadow-md transition-all relative group", t.itemBorder, pct > 0 ? `${styles.borderLight} ${styles.fade}` : "")}>
                                <p className="text-[9px] uppercase font-black text-foreground/60 truncate mb-1">{label}</p>
                                <div className="space-y-0.5">
                                    {(nutrientDisplayMode === 'percentage' && !forceRaw) ? (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn("text-xl font-black tracking-tighter", styles.text)}>{pct}%</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400">
                                                {val.toFixed(1)}{unitLabel}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-bold">{val.toFixed(1)}</span>
                                                <span className={cn("text-[10px] font-bold", (unitLabel === 'µg') ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{unitLabel}</span>
                                            </div>
                                            {(nutrientDisplayMode === 'value' || nutrientDisplayMode === 'both') && rda && (
                                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                                    Target: {Math.round(rda)}{unitLabel}
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

                    {/* Details Section - Dynamic Database or Fallback */}
                    {(food.details || FOOD_DETAILS[food.id]) && (() => {
                        const details = food.details || FOOD_DETAILS[food.id];
                        return (
                            <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                {/* Description */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                        <BookOpen size={14} /> Description
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                        {details.description}
                                    </p>
                                </div>

                                {/* History */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-xs">
                                        <Globe size={14} /> Origin & History
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {details.history}
                                    </p>
                                </div>

                                {/* Producers */}
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Producers</span>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {details.producers}
                                    </p>
                                </div>

                                {/* Benefits */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs">
                                        <ShieldCheck size={14} /> Key Benefits
                                    </div>
                                    <ul className="space-y-2.5">
                                        {details.benefits.map((benefit: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <span className="text-blue-500 font-bold mt-0.5">•</span>
                                                <span className="leading-snug">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Facts */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-xs">
                                        <Lightbulb size={14} /> Did you know?
                                    </div>
                                    <ul className="space-y-3">
                                        {details.facts.map((fact: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 italic">
                                                <span className="text-purple-500 mt-0.5">✨</span>
                                                <span className="leading-snug">{fact}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-[0.85]">
                            {food.common_name || food.name}
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <NutrientGrid title="Core Macronutrients" icon={Zap} theme="orange" subtitle="Scientific and Clinical breakdown of caloric density" breakdownLabels={['Protein', 'Carbs', 'Fat']} items={{
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

                        <NutrientGrid title="Trace Bio-Minerals" icon={Gem} theme="rose" subtitle="Rare essential minerals required for metabolic enzymatic reactions" items={{
                            'Iron': ['Iron', 'iron_mg'],
                            'Zinc': ['Zinc', 'zinc_mg'],
                            'Copper': ['Copper', 'copper_mg'],
                            'Manganese': ['Manganese', 'manganese_mg'],
                            'Selenium': ['Selenium', 'selenium_ug']
                        }} />

                        <NutrientGrid title="Water-Soluble Vitamins" icon={Droplet} theme="blue" subtitle="Bio-available B-Complex and Vitamin C concentrations" items={{
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

                        <NutrientGrid title="Fat-Soluble Bio-Storage" icon={Battery} theme="emerald" subtitle="Vitamins stored within cellular lipid layers" breakdownLabels={['Vitamin A', 'Vitamin E']} items={{
                            'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                            'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                            'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                            'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                        }} />

                        <NutrientGrid title="Clinical Markers" icon={Activity} theme="amber" subtitle="Secondary markers for advanced health profile mapping" forceRaw={true} items={{
                            'Fiber': ['Fiber', 'fiber_g'],
                            'Sugars': ['Sugars', 'sugars_g'],
                            'Oxalate': ['Oxalate', 'oxalate_mg'],
                            'Omega-3': ['Omega-3', 'omega3_g'],
                            'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
                        }} />
                    </div>
                </div>
            </div>

            {/* NUTRIENT INFO MODAL */}
            {selectedNutrientInfo && (nutrientInfo as any)[selectedNutrientInfo] && modalPosition && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setSelectedNutrientInfo(null); setModalPosition(null); }}>
                    <div
                        className="absolute bg-white dark:bg-slate-900 rounded-[3rem] max-w-md w-full p-11 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-top-2 duration-200"
                        style={{
                            top: modalPosition.top,
                            left: Math.min(Math.max(modalPosition.left - 200, 16), window.innerWidth - 432),
                            maxWidth: 'calc(100vw - 32px)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => { setSelectedNutrientInfo(null); setModalPosition(null); }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"><X size={24} /></button>
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

            {/* NUTRIENT BREAKDOWN MODAL */}
            {breakdownNutrient && (food.micronutrients) && (
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
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Constituent Laboratory Analysis</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                const items = NUTRIENT_BREAKDOWNS[breakdownNutrient] || [];
                                return items.map((item, idx) => {
                                    const val = getVal(item.keys);
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                                    {item.label}
                                                    {item.isEssential && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded uppercase">Essential</span>}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-xs text-slate-900 dark:text-white">{val.toFixed(2)}</span>
                                                <span className="ml-1 text-[10px] font-bold text-slate-400">{item.unit}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Values represent a 100g clinical sample volume</p>
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
