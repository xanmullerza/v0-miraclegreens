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
    Upload,
    Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSearch } from '@/lib/context/search-context';

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
    sub_category: string | null;
}

const CATEGORIES = ["Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

export default function MyFoodsPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);

    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);

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
                .order('common_name', { ascending: true });

            if (error) throw error;
            if (data) setFavorites(data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error('Failed to load your foods');
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

    const toggleFavorite = async (item: FoodItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: false } as any)
                .eq('id', item.id);

            if (error) throw error;

            setFavorites(prev => prev.filter(f => f.id !== item.id));
            toast.info(`${item.common_name || item.name} removed from My Foods`);
        } catch (error) {
            console.error('Error removing favorite:', error);
            toast.error('Failed to remove from favorites');
        }
    };

    const filteredFavorites = favorites.filter(item => {
        const name = (item.common_name || item.name || '').toLowerCase();
        const matchesSearch = !searchQuery.trim() || name.includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category || 'General');
        return matchesSearch && matchesCategory;
    });

    const getCategoryCounts = () => {
        const counts: Record<string, number> = {};
        CATEGORIES.forEach(cat => {
            counts[cat] = favorites.filter(f => f.category === cat).length;
        });
        return counts;
    };
    const categoryCounts = getCategoryCounts();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">
            {/* Hero Section */}
            <div className="relative h-48 rounded-[2.5rem] bg-rose-500 overflow-hidden flex items-center px-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500/50 mix-blend-multiply opacity-40" />

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <Heart className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">My Foods</h1>
                    </div>
                    <p className="text-rose-50 font-medium max-w-md text-sm pl-1">
                        Your personalized collection of favorite ingredients for quick access and meal planning.
                    </p>
                </div>

                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Your Collection</p>
                        <p className="text-3xl font-black text-white leading-none tracking-tighter italic">
                            {favorites.length} <span className="text-rose-300">SAVED</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                    <Input
                        placeholder="Search your saved foods..."
                        className="pl-12 h-14 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-rose-500/10 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(category => {
                        const isActive = selectedCategories.includes(category);
                        const count = categoryCounts[category] || 0;

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
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                    isActive
                                        ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                )}
                            >
                                {category}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[9px]",
                                    isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Grid */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-rose-500" size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Your Collection...</p>
                </div>
            ) : favorites.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Heart size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your collection is empty</p>
                    <p className="text-sm text-slate-500 text-center max-w-sm mb-6">Favorite ingredients while browsing the library to build your personalized reference set.</p>
                    <Button
                        onClick={() => router.push('/dashboard/browse')}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold px-6"
                    >
                        Browse Food Library
                    </Button>
                </div>
            ) : filteredFavorites.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Search size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">No results found</p>
                    <p className="text-sm text-slate-500 text-center">Try adjusting your search or category filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFavorites.map((food) => (
                        <Card key={food.id} className="group relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-transparent hover:border-rose-500/20">
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => toggleFavorite(food, e)}
                                    className="w-8 h-8 rounded-full bg-rose-500 text-white shadow-sm flex items-center justify-center transition-all border border-rose-600 hover:scale-110"
                                >
                                    <Heart size={14} fill="currentColor" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItem(food);
                                        setEditName(food.name);
                                        setEditCommonName(food.common_name);
                                        setEditCategory(food.category || 'General');
                                        setEditImage(food.image || '');
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-950/90 shadow-sm flex items-center justify-center text-emerald-500 hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>

                            <div className="p-3">
                                <div className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-950/50 mb-4 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                    {food.image ? (
                                        <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Beef size={48} className="opacity-20" />
                                        </div>
                                    )}
                                    {food.category && (
                                        <div className="absolute top-2 left-2">
                                            <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1 backdrop-blur-sm">
                                                {food.category}
                                            </Badge>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                        <div className="flex items-center gap-3 text-white">
                                            <div className="flex items-center gap-1">
                                                <Zap size={10} className="text-rose-400" />
                                                <span className="text-[9px] font-black">{Math.round(food.energy_kcal)}kcal</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Beef size={10} className="text-rose-400" />
                                                <span className="text-[9px] font-black">{food.protein_g.toFixed(1)}g pro</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="min-h-[40px]">
                                        <h3 className="font-bold text-sm tracking-tight line-clamp-2 text-slate-900 dark:text-white leading-tight capitalize">
                                            {food.common_name || food.name}
                                        </h3>
                                        {food.common_name && (
                                            <p className="text-[10px] text-slate-500 italic truncate">{food.name}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-1">
                                        {[
                                            { label: 'CAL', val: food.energy_kcal, sub: 'kcal', color: 'text-orange-500' },
                                            { label: 'PRO', val: food.protein_g, sub: 'g', color: 'text-red-500' },
                                            { label: 'CHO', val: food.carbs_g, sub: 'g', color: 'text-amber-500' },
                                            { label: 'FAT', val: food.fat_g, sub: 'g', color: 'text-sky-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[7px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">{stat.label}</p>
                                                <p className={cn("text-xs font-black leading-none", stat.color)}>{Math.round(stat.val)}<span className="text-[7px] opacity-70 ml-0.5">{stat.sub}</span></p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/dashboard/browse?id=${food.id}`)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-rose-500 hover:text-white transition-all group/btn2 border border-transparent"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/btn2:text-white">View Profile</span>
                                        <ArrowRight size={12} className="group-hover/btn2:translate-x-1 transition-transform" />
                                    </button>
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
                        <Card className="bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xl border-rose-500/20">
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
                                                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
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
                                                    <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
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
                                <Button className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold gap-2" onClick={handleEditSave}>
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
