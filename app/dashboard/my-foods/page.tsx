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
    Library
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}

export default function MyFoodsPage() {
    const router = useRouter();
    const [favorites, setFavorites] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Foods</h1>
                    <p className="text-slate-500 mt-1">Your curated collection of laboratory-grade ingredients.</p>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/browse')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold"
                >
                    <Library size={18} /> Browse Library
                </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 group relative">
                            {/* Un-favorite Absolute Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item);
                                }}
                                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm flex items-center justify-center text-rose-500 hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700"
                            >
                                <Heart size={16} fill="currentColor" />
                            </button>

                            <div
                                className="cursor-pointer"
                                onClick={() => router.push(`/dashboard/browse?id=${item.id}`)}
                            >
                                <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                            <Beef size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                        <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase tracking-widest leading-none py-1">Saved Item</Badge>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg capitalize truncate">{item.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium truncate">{item.common_name || 'Individual Ingredient'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50">
                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1">Protein</div>
                                            <div className="text-sm font-bold">{item.protein_g.toFixed(1)}<span className="text-[10px] ml-0.5 text-slate-400">g</span></div>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50">
                                            <div className="text-[10px] uppercase font-black text-slate-400 mb-1">Calories</div>
                                            <div className="text-sm font-bold">{item.energy_kcal.toFixed(0)}<span className="text-[10px] ml-0.5 text-slate-400">cal</span></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex -space-x-1">
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Zap size={10} className="text-red-500" /></div>
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Library size={10} className="text-blue-500" /></div>
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Scale size={10} className="text-amber-500" /></div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                            View Full Lab Profile <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
