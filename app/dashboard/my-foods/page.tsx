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
    const PAGE_SIZE = 20;
    const [favorites, setFavorites] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);

    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFavorites(0, true);
    }, [searchQuery, selectedCategories]);

    const fetchFavorites = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('food_items')
                .select('*', { count: 'exact' })
                .eq('is_favorite', true)
                .order('common_name', { ascending: true });

            if (searchQuery.trim()) {
                query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
            }

            if (selectedCategories.length < CATEGORIES.length) {
                query = query.in('category', selectedCategories);
            }

            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            const newItems = data || [];
            if (isNewSearch) {
                setFavorites(newItems);
                setPage(0);
            } else {
                setFavorites(prev => [...prev, ...newItems]);
                setPage(pageNum);
            }

            setHasMore(count ? (isNewSearch ? newItems.length : favorites.length + newItems.length) < count : false);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            toast.error('Failed to load your foods');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchFavorites(page + 1);
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
            toast.info(`${item.common_name || item.name} removed from collections`);
        } catch (error) {
            console.error('Error removing favorite:', error);
            toast.error('Failed to remove from favorites');
        }
    };



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
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-rose-500" size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading your collection...</p>
                </div>
            ) : favorites.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Heart size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your collection is empty.</p>
                    <p className="text-sm text-slate-500 text-center max-w-xs px-6">Browse the library and tap the heart icon to start building your personal database.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_80px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div>Image</div>
                        <div>Food Item</div>
                        <div className="text-right">Calories</div>
                        <div className="text-right flex items-center justify-end gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Carbs
                        </div>
                        <div className="text-right flex items-center justify-end gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            Fat
                        </div>
                        <div className="text-right flex items-center justify-end gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Protein
                        </div>
                        <div className="text-center">Actions</div>
                    </div>

                    {/* Food Items List */}
                    <div className="space-y-3">
                        {favorites.map((food) => (
                            <div
                                key={food.id}
                                onClick={() => router.push(`/dashboard/browse?id=${food.id}`)}
                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                            >
                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_80px] gap-4 lg:items-center">
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {food.image ? (
                                            <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Beef size={24} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 lg:p-0">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                            {food.common_name || food.name}
                                        </h3>
                                        {food.common_name && (
                                            <p className="text-[10px] text-slate-400 italic truncate uppercase tracking-tighter">{food.name}</p>
                                        )}
                                        {food.category && (
                                            <Badge className="lg:hidden mt-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none">
                                                {food.category}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Stats (Desktop View) */}
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {Math.round(food.energy_kcal)}
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.carbs_g.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.fat_g.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {food.protein_g.toFixed(1)}g
                                    </div>

                                    {/* Mobile Stats Row */}
                                    <div className="lg:hidden grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        {[
                                            { label: 'CAL', val: food.energy_kcal, sub: 'k', color: 'text-orange-500' },
                                            { label: 'CHO', val: food.carbs_g, sub: 'g', color: 'text-amber-500' },
                                            { label: 'FAT', val: food.fat_g, sub: 'g', color: 'text-sky-500' },
                                            { label: 'PRO', val: food.protein_g, sub: 'g', color: 'text-purple-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="text-center">
                                                <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                                                <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItem(food);
                                                setEditName(food.name);
                                                setEditCommonName(food.common_name);
                                                setEditCategory(food.category || 'General');
                                                setEditImage(food.image || '');
                                            }}
                                            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => toggleFavorite(food, e)}
                                            className="w-8 h-8 rounded-full bg-rose-500 text-white shadow-md shadow-rose-500/20 flex items-center justify-center transition-all border border-rose-600"
                                        >
                                            <Heart size={14} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Button */}
                    {hasMore && (
                        <div className="flex justify-center pt-8">
                            <Button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl group transition-all"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="animate-spin mr-3" size={18} />
                                        Loading Results...
                                    </>
                                ) : (
                                    <>
                                        View More Saved Foods
                                        <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
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
