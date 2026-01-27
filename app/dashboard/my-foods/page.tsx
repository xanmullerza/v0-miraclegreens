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
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                    {favorites.map((item) => (
                        <Card key={item.id} className="group relative transition-all duration-300 hover:scale-105 hover:shadow-md border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                            {/* Un-favorite Absolute Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item);
                                }}
                                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-950/90 shadow-sm flex items-center justify-center text-rose-500 hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                            >
                                <Heart size={12} fill="currentColor" />
                            </button>

                            <div
                                className="cursor-pointer"
                                onClick={() => router.push(`/dashboard/browse?id=${item.id}`)}
                            >
                                <div className="aspect-square relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
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
        </div>
    );
}
