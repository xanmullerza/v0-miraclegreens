'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    Search,
    ArrowRight,
    ChefHat,
    Clock,
    Users,
    ChevronRight,
    Loader2,
    Plus,
    Filter,
    X,
    Utensils,
    Zap,
    Scale,
    Library
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    energy_kj: number;
    protein: number;
    fat: number;
    carbs: number;
    prep_time: number;
    servings: number;
    image: string | null;
    is_favorite: boolean;
    diet: string[];
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function BrowseMealsPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);

    useEffect(() => {
        fetchAllRecipes();
    }, []);

    const fetchAllRecipes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('title', { ascending: true });

            if (error) throw error;
            setRecipes(data || []);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            toast.error('Failed to load recipe library');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (recipe: Recipe) => {
        const newStatus = !recipe.is_favorite;
        try {
            const { error } = await supabase
                .from('recipes')
                .update({ is_favorite: newStatus } as any)
                .eq('id', recipe.id);

            if (error) throw error;

            setRecipes(prev => prev.map(r =>
                r.id === recipe.id ? { ...r, is_favorite: newStatus } : r
            ));

            if (newStatus) {
                toast.success('Added to collections');
            } else {
                toast.success('Removed from collections');
            }
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedTypes.includes(recipe.type?.toLowerCase());
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">
            {/* Hero Section */}
            <div className="relative h-48 rounded-[2.5rem] bg-emerald-600 overflow-hidden flex items-center px-12 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543353071-873f17a7a088?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600/50 mix-blend-multiply" />

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                            <Library className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Meal Library</h1>
                    </div>
                    <p className="text-emerald-50 font-medium max-w-md text-sm pl-1">
                        Explore a world of nutritionally optimized laboratory-tested recipes.
                    </p>
                </div>

                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">Global Database</p>
                        <p className="text-3xl font-black text-white leading-none tracking-tighter italic">
                            {recipes.length} <span className="text-emerald-300">RECIPES</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <Input
                        placeholder="Search the global meal databank..."
                        className="pl-12 h-14 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Type Filter */}
                <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar">
                    {MEAL_TYPES.map(type => {
                        const isActive = selectedTypes.includes(type);
                        const count = recipes.filter(r => r.type?.toLowerCase() === type).length;

                        return (
                            <button
                                key={type}
                                onClick={() => {
                                    if (isActive) {
                                        setSelectedTypes(prev => prev.filter(t => t !== type));
                                    } else {
                                        setSelectedTypes(prev => [...prev, type]);
                                    }
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                    isActive
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                )}
                            >
                                {type}
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
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Querying Databank...</p>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        <Library size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">No results found.</p>
                    <p className="text-sm text-slate-500 text-center">We couldn't find any recipes matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRecipes.map((recipe) => (
                        <Card key={recipe.id} className="group relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-transparent hover:border-emerald-500/20">
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => toggleFavorite(recipe)}
                                    className={cn(
                                        "w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all border",
                                        recipe.is_favorite
                                            ? "bg-rose-500 text-white border-rose-600 scale-110"
                                            : "bg-white/90 dark:bg-slate-950/90 text-slate-400 hover:text-rose-500 border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    <Heart size={14} fill={recipe.is_favorite ? "currentColor" : "none"} />
                                </button>
                            </div>

                            <div className="p-3">
                                <div className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-950/50 mb-4 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ChefHat size={48} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1 backdrop-blur-sm">
                                            {recipe.type}
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                        <div className="flex items-center gap-3 text-white">
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} className="text-emerald-400" />
                                                <span className="text-[9px] font-black">{recipe.prep_time}m</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users size={10} className="text-emerald-400" />
                                                <span className="text-[9px] font-black">{recipe.servings}P</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="min-h-[40px]">
                                        <h3 className="font-bold text-sm tracking-tight line-clamp-2 text-slate-900 dark:text-white leading-tight">
                                            {recipe.title}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-4 gap-1">
                                        {[
                                            { label: 'CAL', val: recipe.calories, sub: 'kcal', color: 'text-orange-500' },
                                            { label: 'PRO', val: recipe.protein, sub: 'g', color: 'text-red-500' },
                                            { label: 'CHO', val: recipe.carbs, sub: 'g', color: 'text-amber-500' },
                                            { label: 'FAT', val: recipe.fat, sub: 'g', color: 'text-sky-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                                                <p className="text-[7px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">{stat.label}</p>
                                                <p className={cn("text-xs font-black leading-none", stat.color)}>{Math.round(stat.val)}<span className="text-[7px] opacity-70 ml-0.5">{stat.sub}</span></p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-emerald-500 hover:text-white transition-all group/btn2 border border-transparent"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover/btn2:text-white">View Details</span>
                                        <ArrowRight size={12} className="group-hover/btn2:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
