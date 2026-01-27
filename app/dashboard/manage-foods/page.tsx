'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Search,
    ArrowLeft,
    Loader2,
    Check,
    Filter,
    Table as TableIcon,
    LayoutGrid,
    Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    category: string;
    is_favorite: boolean;
}

const CATEGORIES = ["Grains", "Vegetables", "Fruit", "Legumes", "Proteins", "Fats", "Flavour", "Seeds", "Nuts", "General"];

export default function ManageFoodsPage() {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, category, is_favorite')
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) setFoods(data);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Failed to load library');
        } finally {
            setLoading(false);
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

    const filteredFoods = foods.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.common_name && f.common_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesFavorite = showOnlyFavorites ? f.is_favorite : true;
        return matchesSearch && matchesFavorite;
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
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                    >
                        <ArrowLeft size={14} /> Back to Library
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk Categorization</h1>
                    <p className="text-slate-500 mt-1">Quickly organize your collection using table view.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={cn(
                            "rounded-xl gap-2 font-bold border-slate-200 dark:border-slate-800",
                            showOnlyFavorites && "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/50 text-rose-500"
                        )}
                    >
                        <Heart size={16} fill={showOnlyFavorites ? "currentColor" : "none"} />
                        {showOnlyFavorites ? "Favorites Only" : "Show All"}
                    </Button>
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
        </div>
    );
}
