'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    ShoppingBasket,
    Loader2,
    X,
    Search,
    Trash2,
    Beef,
    Zap,
    Wheat,
    Droplet,
    Info,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_in_pantry: boolean;
}

export default function PantryPage() {
    const router = useRouter();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPantry();
    }, []);

    const fetchPantry = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('food_items')
                .select('*')
                .eq('is_in_pantry', true)
                .order('common_name', { ascending: true });

            if (error) throw error;
            setFoods(data || []);
        } catch (error: any) {
            console.error('Error fetching pantry:', error);
            // If the column doesn't exist yet, we'll get an error. 
            // We should catch it and show an informative message if it's a "column does not exist" error.
            if (error.code === '42703') {
                toast.error("Database schema update required. Please run the latest migration.");
            } else {
                toast.error("Failed to load pantry.");
            }
        } finally {
            setLoading(false);
        }
    };

    const removeFromPantry = async (id: string, name: string) => {
        try {
            const { error } = await supabase
                .from('food_items')
                .update({ is_in_pantry: false } as any)
                .eq('id', id);

            if (error) throw error;

            setFoods(prev => prev.filter(f => f.id !== id));
            toast.success(`${name} removed from pantry`);
        } catch (error) {
            console.error('Error removing from pantry:', error);
            toast.error("Failed to remove item.");
        }
    };

    const filteredFoods = foods.filter(food =>
        (food.common_name || food.name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <ShoppingBasket className="text-emerald-600" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">My Pantry</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-lg">
                        Manage your local inventory of high-density staples. Items added here can be quickly used in recipe builds.
                    </p>
                </div>

                <Button
                    onClick={() => router.push('/dashboard/foods')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/10 flex items-center gap-2 group transition-all"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Add Items
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search your pantry..."
                    className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventorying Pantry...</p>
                </div>
            ) : foods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <ShoppingBasket size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your pantry is empty</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 px-4">
                        Add the staples you keep on hand to quickly build recipes and track your nutrition.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/foods')}
                        variant="outline"
                        className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px] border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                    >
                        Browse Food Library
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFoods.map(food => (
                        <div
                            key={food.id}
                            className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                            onClick={() => router.push(`/dashboard/foods/${food.id}`)}
                        >
                            {/* Image Header */}
                            <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-950/50">
                                {food.image ? (
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Beef size={40} className="opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromPantry(food.id, food.common_name || food.name);
                                        }}
                                        className="w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12"
                                        title="Remove from Pantry"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize truncate mb-4 group-hover:text-emerald-500 transition-colors">
                                    {food.common_name || food.name}
                                </h3>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-500 mb-1">
                                            <Zap size={10} fill="currentColor" /> Energy
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                            {Math.round(food.energy_kcal)} <span className="text-[10px] text-slate-400">kcal</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-500 mb-1">
                                            <Beef size={10} /> Protein
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                            {food.protein_g.toFixed(1)} <span className="text-[10px] text-slate-400">g</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-500 mb-1">
                                            <Wheat size={10} /> Carbs
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                            {food.carbs_g.toFixed(1)} <span className="text-[10px] text-slate-400">g</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-900 mb-1">
                                            <Droplet size={10} /> Fat
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                            {food.fat_g.toFixed(1)} <span className="text-[10px] text-slate-400">g</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    <span>Details</span>
                                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
