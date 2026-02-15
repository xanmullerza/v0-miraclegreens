'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Search,
    ArrowLeft,
    Loader2,
    Check,
    Filter,
    Table as TableIcon,
    LayoutGrid,
    Heart,
    Edit2,
    Trash2,
    Save,
    X,
    ExternalLink,
    Upload,
    Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    category: string;
    is_favorite: boolean;
    source: string;
    energy_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    micronutrients?: Record<string, number>;
    portions?: { label: string; weight_g: number }[];
}

const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

export default function ManageFoodsPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [foodSourceFilter, setFoodSourceFilter] = useState<'all' | 'manual' | 'usda'>('all');
    const [processingFilter, setProcessingFilter] = useState<'all' | 'whole' | 'processed' | 'ultra'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Edit states
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategoryState, setEditCategoryState] = useState('');
    const [editEnergy, setEditEnergy] = useState<number>(0);
    const [editProtein, setEditProtein] = useState<number>(0);
    const [editCarbs, setEditCarbs] = useState<number>(0);
    const [editFat, setEditFat] = useState<number>(0);
    const [editNutrientText, setEditNutrientText] = useState('');
    const [editServingText, setEditServingText] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        setLoading(true);
        try {
            let allFoods: FoodItem[] = [];
            let lastId = null;
            let hasMore = true;
            const PAGE_SIZE = 1000;

            while (hasMore) {
                let query = supabase
                    .from('food_items')
                    .select('id, name, common_name, category, is_favorite, source, energy_kcal, protein_g, carbs_g, fat_g, micronutrients, portions')
                    .order('id', { ascending: true })
                    .limit(PAGE_SIZE);

                if (lastId) {
                    query = query.gt('id', lastId);
                }

                const { data, error } = await query;

                if (error) throw error;
                if (!data || data.length === 0) {
                    hasMore = false;
                } else {
                    allFoods = [...allFoods, ...data];
                    lastId = data[data.length - 1].id;
                    if (data.length < PAGE_SIZE) hasMore = false;
                }
            }

            // Finally sort by name
            allFoods.sort((a, b) => a.name.localeCompare(b.name));
            setFoods(allFoods);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Failed to load library');
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This cannot be undone.`)) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('food_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.filter(f => f.id !== id));
            toast.success('Food item deleted');
        } catch (error: any) {
            console.error('Error deleting food:', error);
            const message = error.message || 'Failed to delete item';
            toast.error(message.includes('foreign key')
                ? 'Cannot delete: This item is being used in a recipe.'
                : message);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleEditStart = (item: FoodItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditCommonName(item.common_name || '');
        setEditCategoryState(item.category);
        setEditEnergy(item.energy_kcal || 0);
        setEditProtein(item.protein_g || 0);
        setEditCarbs(item.carbs_g || 0);
        setEditFat(item.fat_g || 0);

        // Generate initial nutrient text
        let nutrientText = `Calories: ${item.energy_kcal || 0}\n`;
        nutrientText += `Protein: ${item.protein_g || 0}g\n`;
        nutrientText += `Carbs: ${item.carbs_g || 0}g\n`;
        nutrientText += `Fat: ${item.fat_g || 0}g\n`;
        if (item.micronutrients) {
            Object.entries(item.micronutrients).forEach(([name, val]) => {
                if (val > 0) nutrientText += `${name}: ${val}\n`;
            });
        }
        setEditNutrientText(nutrientText);

        // Generate initial serving text
        const servingText = (item.portions || []).map(p => `1 ${p.label} = ${p.weight_g}g`).join('\n');
        setEditServingText(servingText);
    };

    const handleEditSave = async () => {
        if (!editingItem) return;

        setSaveLoading(true);
        try {
            const { parseNutritionText, parseMeasures } = await import('@/lib/utils/nutrition-parser');
            const parsedNutrients = parseNutritionText(editNutrientText);
            const parsedPortions = parseMeasures(editServingText);

            const updatedData = {
                name: editName,
                common_name: editCommonName,
                category: editCategoryState,
                energy_kcal: parsedNutrients.energy_kcal || editEnergy || 0,
                energy_kj: (parsedNutrients.energy_kcal || editEnergy || 0) * 4.184,
                protein_g: parsedNutrients.protein_g || editProtein || 0,
                carbs_g: parsedNutrients.carbs_g || editCarbs || 0,
                fat_g: parsedNutrients.fat_g || editFat || 0,
                micronutrients: parsedNutrients.micronutrients || {},
                portions: parsedPortions
            };

            const { error } = await supabase
                .from('food_items')
                .update(updatedData as any)
                .eq('id', editingItem.id);

            if (error) throw error;

            setFoods(prev => prev.map(f =>
                f.id === editingItem.id
                    ? {
                        ...f,
                        ...updatedData
                    }
                    : f
            ));

            setEditingItem(null);
            toast.success('Food item updated');
        } catch (error) {
            console.error('Error updating food:', error);
            toast.error('Failed to update item');
        } finally {
            setSaveLoading(false);
        }
    };

    const updateCategory = async (id: string, newCategory: string) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ category: newCategory } as any)
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.map(f => f.id === id ? { ...f, category: newCategory } : f));
            toast.success('Category updated', { duration: 1000 });
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleFavorite = async (id: string, currentStatus: boolean) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: !currentStatus } as any)
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.map(f => f.id === id ? { ...f, is_favorite: !currentStatus } : f));
            toast.success(currentStatus ? 'Removed from favorites' : 'Added to favorites', { duration: 1000 });
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorite status');
        } finally {
            setUpdatingId(null);
        }
    };

    const getProcessingLevel = (item: FoodItem): 'whole' | 'processed' | 'ultra' => {
        const name = item.name.toLowerCase();
        // Ultra-Processed Heuristics
        const ultraKeywords = [
            'candy', 'cookie', 'chip', 'snack', 'cake', 'cracker', 'pastry', 'pudding', 'ice cream',
            'fast food', 'pizza', 'burger', 'fries', 'nugget', 'sausage', 'bacon', 'ham', 'salami', 'deli',
            'soda', 'beverage', 'drink', 'sweetened', 'chocolate', 'cereal', 'granola', 'bar', 'ready-to-eat',
            'instant', 'frozen meal', 'sauce', 'dressing', 'spread', 'margarine', 'shortening', 'whipped',
            'frosting', 'mix', 'substitute', 'artificial', 'flavor', 'brand', 'campbell', 'kellogg', 'kraft',
            'general mills', 'nestle', 'pepsi', 'coke', 'doritos', 'lays', 'cheetos'
        ];
        if (ultraKeywords.some(k => name.includes(k))) return 'ultra';

        // Whole Food Heuristics (Strict)
        const wholeKeywords = ['raw', 'fresh', 'uncooked'];
        const isWholeCategory = ['Vegetables', 'Fruit', 'Legumes', 'Nuts', 'Proteins'].includes(item.category || '');
        if (wholeKeywords.some(k => name.includes(k))) return 'whole';
        if (isWholeCategory && !name.includes('canned') && !name.includes('frozen') && !name.includes('cooked') && !name.includes('dried')) return 'whole';

        // Default to Processed (Lightly processed like Rice, Bread, Cheese, Cooked items)
        return 'processed';
    };

    const filteredFoods = foods.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.common_name && f.common_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFavorite = showOnlyFavorites ? f.is_favorite : true;
        const matchesSource = foodSourceFilter === 'all' ? true : f.source === foodSourceFilter;

        // Smart Processing Filter
        let matchesProcessing = true;
        if (processingFilter !== 'all') {
            const level = getProcessingLevel(f);
            matchesProcessing = level === processingFilter;
        }

        return matchesSearch && matchesFavorite && matchesSource && matchesProcessing;
    });

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-slate-500 font-medium">Loading management dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/admin')}
                        className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                    >
                        <ArrowLeft size={14} /> Back to Admin
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Categorization</h1>
                    <p className="text-slate-500 mt-1">Quickly organize your collection using table view.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={cn(
                            "rounded-xl gap-2 font-bold border-slate-200 dark:border-slate-800 transition-all",
                            showOnlyFavorites && "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/50 text-rose-500"
                        )}
                    >
                        <Heart size={16} fill={showOnlyFavorites ? "currentColor" : "none"} />
                        {showOnlyFavorites ? "Favorites" : "All"}
                    </Button>

                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 mr-1 hidden sm:inline-block">Source</span>
                        <button
                            onClick={() => setFoodSourceFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                foodSourceFilter === 'all'
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFoodSourceFilter('manual')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                foodSourceFilter === 'manual'
                                    ? "bg-emerald-500 shadow-sm text-white"
                                    : "text-slate-500 hover:text-emerald-500"
                            )}
                        >
                            Custom
                        </button>
                        <button
                            onClick={() => setFoodSourceFilter('usda')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                foodSourceFilter === 'usda'
                                    ? "bg-blue-500 shadow-sm text-white"
                                    : "text-slate-500 hover:text-blue-500"
                            )}
                        >
                            Global
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 mr-1 hidden sm:inline-block">Type</span>
                        <button
                            onClick={() => setProcessingFilter('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                processingFilter === 'all'
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setProcessingFilter('whole')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                processingFilter === 'whole'
                                    ? "bg-emerald-500 shadow-sm text-white"
                                    : "text-slate-500 hover:text-emerald-500"
                            )}
                        >
                            Whole
                        </button>
                        <button
                            onClick={() => setProcessingFilter('processed')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                processingFilter === 'processed'
                                    ? "bg-amber-500 shadow-sm text-white"
                                    : "text-slate-500 hover:text-amber-500"
                            )}
                        >
                            Processed
                        </button>
                        <button
                            onClick={() => setProcessingFilter('ultra')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                processingFilter === 'ultra'
                                    ? "bg-rose-500 shadow-sm text-white"
                                    : "text-slate-500 hover:text-rose-500"
                            )}
                        >
                            Ultra
                        </button>
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search ingredients..."
                            className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400">Category</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredFoods.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-sm capitalize">{item.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-500 italic">{item.common_name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {CATEGORIES.map(category => (
                                                <button
                                                    key={category}
                                                    disabled={updatingId === item.id}
                                                    onClick={() => updateCategory(item.id, category)}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                        item.category === category
                                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    {updatingId === item.id && item.category === category ? (
                                                        <Loader2 size={10} className="animate-spin" />
                                                    ) : (
                                                        category
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-400">
                                            <button
                                                onClick={() => toggleFavorite(item.id, item.is_favorite)}
                                                className={cn(
                                                    "p-2 transition-colors",
                                                    item.is_favorite ? "text-rose-500 hover:text-rose-600" : "hover:text-rose-500"
                                                )}
                                                title={item.is_favorite ? "Remove Favorite" : "Add to Favorites"}
                                            >
                                                <Heart size={16} fill={item.is_favorite ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/dashboard/library/ingredients/${item.id}`)}
                                                className="p-2 hover:text-emerald-500 transition-colors"
                                                title="View Profile"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEditStart(item)}
                                                className="p-2 hover:text-amber-500 transition-colors"
                                                title="Edit Item"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id, item.name)}
                                                disabled={isDeleting === item.id}
                                                className="p-2 hover:text-rose-500 transition-colors disabled:opacity-50"
                                                title="Delete Item"
                                            >
                                                {isDeleting === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredFoods.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 italic">No ingredients matching your search.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center italic text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Showing {filteredFoods.length} items
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 space-y-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 uppercase tracking-widest text-[9px] mb-2 px-2">Edit Mode</Badge>
                                    <h3 className="text-2xl font-black tracking-tight capitalize">Update Database Entry</h3>
                                </div>
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Ingredient Name (Scientific)</Label>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold h-12 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Common Name</Label>
                                        <Input
                                            value={editCommonName}
                                            onChange={(e) => setEditCommonName(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12 rounded-xl"
                                            placeholder="e.g. Garden Pea"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Category</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map(category => (
                                                <button
                                                    key={category}
                                                    onClick={() => setEditCategoryState(category)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                        editCategoryState === category
                                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                    )}
                                                >
                                                    {category}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] p-6 space-y-6 border border-slate-200 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nutritional Data (per 100g)</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500">Kcal</Label>
                                            <Input
                                                type="number"
                                                value={editEnergy}
                                                onChange={(e) => setEditEnergy(Number(e.target.value))}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500">Protein (g)</Label>
                                            <Input
                                                type="number"
                                                value={editProtein}
                                                onChange={(e) => setEditProtein(Number(e.target.value))}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-red-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500">Carbs (g)</Label>
                                            <Input
                                                type="number"
                                                value={editCarbs}
                                                onChange={(e) => setEditCarbs(Number(e.target.value))}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] uppercase font-black tracking-widest text-slate-500">Fat (g)</Label>
                                            <Input
                                                type="number"
                                                value={editFat}
                                                onChange={(e) => setEditFat(Number(e.target.value))}
                                                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-bold text-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Advanced Nutrients</Label>
                                            <textarea
                                                value={editNutrientText}
                                                onChange={(e) => setEditNutrientText(e.target.value)}
                                                className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="Paste nutrition data..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Serving Sizes</Label>
                                            <textarea
                                                value={editServingText}
                                                onChange={(e) => setEditServingText(e.target.value)}
                                                className="w-full h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                placeholder="1 cup = 240g"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-8 border-t border-slate-100 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs" onClick={() => setEditingItem(null)}>
                                    Discard Changes
                                </Button>
                                <Button
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 gap-3"
                                    onClick={handleEditSave}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    Sync to Database
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
