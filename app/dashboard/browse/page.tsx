'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Search,
    X,
    Plus,
    Activity,
    Beef,
    Zap,
    Droplet,
    Gem,
    Battery,
    Heart,
    Info,
    ArrowRight,
    Star,
    Share2,
    Calendar,
    ChevronRight,
    Library,
    Edit2,
    Camera,
    Upload,
    Save,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
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

const CATEGORIES = ["Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

function BrowseFoodsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Initial load from URL
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            const fetchItem = async () => {
                const { data } = await supabase.from('food_items').select('*').eq('id', id).single();
                if (data) setSelectedItem(data);
            };
            fetchItem();
        }
    }, [searchParams]);

    // Update URL when selection changes
    useEffect(() => {
        if (selectedItem) {
            router.replace(`/dashboard/browse?id=${selectedItem.id}`, { scroll: false });
        } else {
            router.replace('/dashboard/browse', { scroll: false });
        }
    }, [selectedItem, router]);

    useEffect(() => {
        const searchFoodItems = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('food_items')
                    .select('*')
                    .limit(50);

                if (searchQuery.trim()) {
                    query = query.or(`name.ilike.%${searchQuery.trim()}%,common_name.ilike.%${searchQuery.trim()}%`);
                } else {
                    query = query.order('name', { ascending: true });
                }

                const { data, error } = await query;

                if (error) throw error;
                if (data) setSearchResults(data);
            } catch (error) {
                console.error('Error searching foods:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const toggleFavorite = async (item: FoodItem) => {
        try {
            const newStatus = !item.is_favorite;
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: newStatus } as any)
                .eq('id', item.id);

            if (error) throw error;

            // Update local state
            setSelectedItem(prev => prev?.id === item.id ? { ...prev, is_favorite: newStatus } : prev);
            setSearchResults(prev => prev.map(i => i.id === item.id ? { ...i, is_favorite: newStatus } : i));

            if (newStatus) {
                toast.success(`${item.name} added to My Foods`);
            } else {
                toast.info(`${item.name} removed from My Foods`);
            }
        } catch (error: any) {
            console.error('Error toggling favorite:', error);
            toast.error(`Failed to update favorite: ${error.message}`);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-items')
                .getPublicUrl(filePath);

            setEditImage(publicUrl);
            toast.success('Image uploaded successfully');
        } catch (err: any) {
            console.error("Upload error:", err);
            // Fallback to base64 for preview if storage fails
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
        if (!editingItem) return;

        try {
            const { error } = await supabase
                .from('food_items')
                .update({
                    name: editName,
                    common_name: editCommonName,
                    category: editCategory,
                    image: editImage
                } as any)
                .eq('id', editingItem.id);

            if (error) throw error;

            // Refresh UI
            setSelectedItem(prev => prev?.id === editingItem.id ? { ...prev, name: editName, common_name: editCommonName, category: editCategory, image: editImage } : prev);
            setSearchResults(prev => prev.map(i => i.id === editingItem.id ? { ...i, name: editName, common_name: editCommonName, category: editCategory, image: editImage } : i));

            setEditingItem(null);
            toast.success('Food item updated successfully');
        } catch (error) {
            console.error('Error updating food item:', error);
            toast.error('Failed to update food item');
        }
    };

    // Default RDA for comparison context
    const userRDAs = useRDA(30, 'female', 2000);

    const getVal = (item: FoodItem, key: string) => {
        if (key === 'energy_kcal') return item.energy_kcal;
        if (key === 'protein_g') return item.protein_g;
        if (key === 'carbohydrates_g' || key === 'carbs_g') return item.carbs_g;
        if (key === 'fat_g') return item.fat_g;
        return item.micronutrients?.[key] || 0;
    };

    const NutrientSection = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, string[]>, icon: any, theme?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'amber', subtitle?: string }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
        };
        const t = themes[theme];

        return (
            <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-sm", t.text)}><Icon className="h-5 w-5" /> {title}</h4>
                {subtitle && <p className={cn("text-[10px] text-muted-foreground mb-4 border-b pb-2", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(items).map(([label, keys]) => {
                        const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label.includes('Vitamin A') || label.includes('Vitamin K') || label.includes('Vitamin D') ? 'µg' : label.includes('Vitamin D') ? 'IU' : 'mg';

                        const key = keys.find(k => selectedItem?.micronutrients?.[k] !== undefined) || keys[0];
                        const val = selectedItem ? getVal(selectedItem, key) : 0;
                        const rda = userRDAs?.[label];
                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                        const styles = getNutrientLevelStyles(pct, label);

                        return (
                            <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all", t.itemBorder)}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase font-black text-foreground/60 truncate">{label}</p>
                                    <span className="text-[10px] text-muted-foreground font-bold">{unitLabel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{val >= 1 ? val.toFixed(0) : val.toFixed(1)}</span>
                                    {rda && (
                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[32px] text-center", styles.bg, styles.textFill)}>
                                            {pct}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selector Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search library..."
                                    className="pl-10 h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent align-[-0.125em]" />
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500 text-sm italic">No ingredients found</div>
                                ) : (
                                    searchResults.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border transition-all duration-200 flex justify-between items-center group",
                                                selectedItem?.id === item.id
                                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 shadow-sm"
                                                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className="min-w-0 flex-1 mr-2">
                                                <div className="font-semibold text-xs truncate capitalize">{item.common_name || item.name}</div>
                                                {item.common_name && (
                                                    <div className="text-[10px] opacity-60 truncate">Scientific: {item.name}</div>
                                                )}
                                                <div className="flex gap-1 mt-1.5">
                                                    {item.protein_g > 10 && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">High Protein</span>}
                                                    {item.carbs_g < 5 && item.fat_g > 5 && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Keto</span>}
                                                    {item.energy_kcal < 50 && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Low Cal</span>}
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className={cn("transition-transform", selectedItem?.id === item.id ? "text-emerald-500 translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100")} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <Info size={12} />
                            Discovery Tip
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Use the search to find nutrient-dense alternatives. Each entry is benchmarked against adult RDA.
                        </p>
                    </div>
                </div>

                {/* Profile Display Area */}
                <div className="lg:col-span-3 space-y-8">
                    {!selectedItem ? (
                        <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                                <Library size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-400">Select an Ingredient</h3>
                            <p className="text-sm text-slate-500 mt-1">Pick a food from the library to view its clinical profile</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            {/* Header Card with Image */}
                            <Card className="relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                                <div className="flex flex-col md:flex-row">
                                    <div className="w-full md:w-64 h-64 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center group/img relative">
                                        {selectedItem.image ? (
                                            <img
                                                src={selectedItem.image}
                                                alt={selectedItem.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <Beef size={48} className="text-slate-300 dark:text-slate-700 opacity-50" />
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingItem(selectedItem);
                                                setEditName(selectedItem.name);
                                                setEditCommonName(selectedItem.common_name);
                                                setEditCategory(selectedItem.category || 'General');
                                                setEditImage(selectedItem.image || '');
                                            }}
                                            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-950/90 shadow-lg flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform opacity-0 group-hover/img:opacity-100 border border-slate-100 dark:border-slate-800"
                                            title="Edit item image"
                                        >
                                            <Camera size={18} />
                                        </button>
                                    </div>
                                    <div className="flex-1 p-8 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 uppercase tracking-widest text-[10px] px-2">Clinical Profile</Badge>
                                                <h1 className="text-3xl font-black capitalize leading-tight">{selectedItem.common_name || selectedItem.name}</h1>
                                                {selectedItem.common_name && (
                                                    <p className="text-slate-500 font-medium italic">Scientific: {selectedItem.name}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className={cn(
                                                        "rounded-full h-10 w-10 transition-all",
                                                        selectedItem.is_favorite ? "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-900/50" : ""
                                                    )}
                                                    onClick={() => toggleFavorite(selectedItem)}
                                                >
                                                    <Heart size={18} fill={selectedItem.is_favorite ? "currentColor" : "none"} />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="rounded-full h-10 w-10 text-emerald-500 border-emerald-100 hover:bg-emerald-50 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
                                                    onClick={() => {
                                                        setEditingItem(selectedItem);
                                                        setEditName(selectedItem.name);
                                                        setEditCommonName(selectedItem.common_name);
                                                        setEditCategory(selectedItem.category || 'General');
                                                        setEditImage(selectedItem.image || '');
                                                    }}
                                                >
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                                                    <Share2 size={18} />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {selectedItem.protein_g > 10 && <Badge className="bg-red-500/10 text-red-600 border-red-200 px-3 py-1">High Protein</Badge>}
                                            {selectedItem.carbs_g < 5 && selectedItem.fat_g > 5 && <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 px-3 py-1">Keto Friendly</Badge>}
                                            {selectedItem.energy_kcal < 100 && <Badge className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1">Low Calorie</Badge>}
                                            {(selectedItem.micronutrients['Fiber'] || 0) > 5 && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 px-3 py-1">High Fiber</Badge>}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Macro Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Energy', val: selectedItem.energy_kcal, unit: 'kcal', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                    { label: 'Protein', val: selectedItem.protein_g, unit: 'g', color: 'text-red-500', bg: 'bg-red-500/10' },
                                    { label: 'Carbs', val: selectedItem.carbs_g, unit: 'g', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'Fat', val: selectedItem.fat_g, unit: 'g', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map(macro => (
                                    <div key={macro.label} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3", macro.bg)}>
                                            <Zap size={20} className={macro.color} />
                                        </div>
                                        <div className="text-2xl font-black">{macro.val.toFixed(macro.label === 'Energy' ? 0 : 1)}<span className="text-xs font-bold text-slate-400 ml-1">{macro.unit}</span></div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{macro.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detailed Nutrient Sections */}
                            <div className="space-y-6">
                                {/* ELECTROLYTES */}
                                <NutrientSection title="Electrolytes" icon={Zap} theme="indigo" subtitle="Hydration • Muscle & Nerve Function" items={{
                                    'Sodium': ['Sodium', 'sodium_mg'],
                                    'Potassium': ['Potassium', 'potassium_mg'],
                                    'Magnesium': ['Magnesium', 'magnesium_mg'],
                                    'Calcium': ['Calcium', 'calcium_mg'],
                                    'Phosphorus': ['Phosphorus', 'phosphorus_mg']
                                }} />

                                {/* TRACE MINERALS */}
                                <NutrientSection title="Trace Minerals" icon={Gem} theme="rose" subtitle="Essential micro-minerals" items={{
                                    'Iron': ['Iron', 'iron_mg'],
                                    'Zinc': ['Zinc', 'zinc_mg'],
                                    'Copper': ['Copper', 'copper_mg'],
                                    'Manganese': ['Manganese', 'manganese_mg'],
                                    'Selenium': ['Selenium', 'selenium_ug']
                                }} />

                                {/* DAILY VITAMINS */}
                                <NutrientSection title="Daily Vitamins" icon={Droplet} theme="blue" subtitle="Water-soluble • Must be replenished daily" items={{
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

                                {/* STORED VITAMINS */}
                                <NutrientSection title="Stored Vitamins" icon={Battery} theme="emerald" subtitle="Fat-soluble • Stored in body tissues" items={{
                                    'Vitamin A': ['Vitamin A', 'vitamin_a_ug'],
                                    'Vitamin D': ['Vitamin D', 'vitamin_d_iu', 'vitamin_d_ug'],
                                    'Vitamin E': ['Vitamin E', 'vitamin_e_mg'],
                                    'Vitamin K': ['Vitamin K', 'vitamin_k_ug'],
                                }} />

                                {/* MISC */}
                                <NutrientSection title="Health Markers" icon={Activity} theme="amber" subtitle="Specialized nutritional markers" items={{
                                    'Fiber': ['Fiber'],
                                    'Sugars': ['Sugars'],
                                    'Oxalate': ['Oxalate'],
                                    'Omega-3': ['Omega-3'],
                                    'Cholesterol': ['Cholesterol'],
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md">
                        <Card className="bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xl border-emerald-500/20">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold tracking-tight">Edit Food Entry</h3>
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name</Label>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</Label>
                                    <Input
                                        value={editCommonName}
                                        onChange={(e) => setEditCommonName(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="e.g. Garden Pea"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Category</Label>
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
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Reference Photo</Label>
                                    <div className="relative aspect-video rounded-2xl bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group/upload flex items-center justify-center">
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
                                                        <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                                                        <p className="text-[10px] font-bold text-slate-500">Click to Upload</p>
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

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setEditingItem(null)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold gap-2" onClick={handleEditSave}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BrowseFoodsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        }>
            <BrowseFoodsContent />
        </Suspense>
    );
}
