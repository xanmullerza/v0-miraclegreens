'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    Search,
    ArrowRight,
    Zap,
    Beef,
    Utensils,
    Scale,
    ChevronRight,
    Loader2,
    Library,
    Edit2,
    Save,
    X,
    Camera,
    Table,
    Filter,
    Upload
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_favorite: boolean;
    category: string;
}

const CATEGORIES = ["Grains", "Vegetables", "Fruit", "Legumes", "Proteins", "Fats", "Flavour", "Seeds", "Nuts", "Supplements", "General"];

const CATEGORY_COLORS: Record<string, string> = {
    "Grains": "bg-amber-500 shadow-amber-500/20 border-amber-500",
    "Vegetables": "bg-emerald-500 shadow-emerald-500/20 border-emerald-500",
    "Fruit": "bg-rose-500 shadow-rose-500/20 border-rose-500",
    "Legumes": "bg-orange-600 shadow-orange-600/20 border-orange-600",
    "Proteins": "bg-red-500 shadow-red-500/20 border-red-500",
    "Fats": "bg-sky-500 shadow-sky-500/20 border-sky-500",
    "Flavour": "bg-purple-500 shadow-purple-500/20 border-purple-500",
    "Seeds": "bg-teal-500 shadow-teal-500/20 border-teal-500",
    "Nuts": "bg-stone-500 shadow-stone-500/20 border-stone-500",
    "Supplements": "bg-indigo-500 shadow-indigo-500/20 border-indigo-500",
    "General": "bg-slate-500 shadow-slate-500/20 border-slate-500"
};

export default function MyFoodsPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_favorite', true)
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) setFavorites(data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
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

            setFavorites(prev => prev.map(f =>
                f.id === editingItem.id ? { ...f, name: editName, common_name: editCommonName, category: editCategory, image: editImage } : f
            ));
            setEditingItem(null);
            toast.success('Food item updated successfully');
        } catch (error) {
            console.error('Error updating food item:', error);
            toast.error('Failed to update food item');
        }
    };

    const toggleFavorite = async (item: FoodItem) => {
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: false } as any)
                .eq('id', item.id);

            if (error) throw error;

            // Remove from local state
            setFavorites(prev => prev.filter(f => f.id !== item.id));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-slate-500 font-medium">Loading your library...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                    <Filter size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filter:</span>
                </div>

                {/* Total Filter Block */}
                <button
                    onClick={() => {
                        if (selectedCategories.length === CATEGORIES.length) {
                            setSelectedCategories([]);
                        } else {
                            setSelectedCategories(CATEGORIES);
                        }
                    }}
                    className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all duration-300 border flex items-center gap-3",
                        selectedCategories.length === CATEGORIES.length
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-500"
                    )}
                >
                    <span>Total</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[9px]",
                        selectedCategories.length === CATEGORIES.length ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                        {favorites.length}
                    </span>
                </button>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />

                {CATEGORIES.map(category => {
                    const isActive = selectedCategories.includes(category);
                    const count = favorites.filter(f => f.category === category || (!f.category && category === 'General')).length;

                    return (
                        <button
                            key={category}
                            onClick={() => {
                                if (isActive) {
                                    setSelectedCategories(prev => prev.filter(c => c !== category));
                                } else {
                                    setSelectedCategories(prev => [...prev, category]);
                                }
                            }}
                            className={cn(
                                "group px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all duration-300 border flex flex-col items-center gap-0.5 min-w-[65px]",
                                isActive
                                    ? cn("text-white shadow-lg", CATEGORY_COLORS[category])
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-400"
                            )}
                        >
                            <span>{category}</span>
                            <span className={cn(
                                "text-[8px] opacity-60 font-bold",
                                isActive ? "text-white" : "text-slate-400"
                            )}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {favorites.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Heart size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-400">Your collection is empty</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-6 text-center max-w-xs">Favorite ingredients while browsing the library to build your personalized reference set.</p>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/browse')}
                        className="rounded-xl font-bold"
                    >
                        Go to Browse Library
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {favorites
                        .filter(item => selectedCategories.length === 0 || selectedCategories.includes(item.category || 'General'))
                        .map((item) => (
                            <Card key={item.id} className="group relative transition-all duration-300 hover:scale-105 hover:shadow-md border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item);
                                        }}
                                        className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-950/90 shadow-sm flex items-center justify-center text-rose-500 hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800"
                                        title="Remove from favorites"
                                    >
                                        <Heart size={12} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingItem(item);
                                            setEditName(item.name);
                                            setEditCommonName(item.common_name);
                                            setEditCategory(item.category || 'General');
                                            setEditImage(item.image || '');
                                        }}
                                        className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-950/90 shadow-sm flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800"
                                        title="Edit item"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>

                                <div
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/dashboard/browse?id=${item.id}`)}
                                >
                                    <div className="aspect-square relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.common_name || item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                                <Beef size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-bold text-[10px] capitalize truncate leading-tight mb-1 text-slate-900 dark:text-white">
                                            {item.common_name || item.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Profile <ArrowRight size={8} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            )}

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
