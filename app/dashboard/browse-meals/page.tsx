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
    Library,
    Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    const PAGE_SIZE = 20;
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(MEAL_TYPES);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    useEffect(() => {
        fetchRecipes(0, true);
    }, [searchQuery, selectedTypes, showFavoritesOnly]);

    const fetchRecipes = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('recipes')
                .select('*', { count: 'exact' })
                .order('title', { ascending: true });

            if (searchQuery.trim()) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            if (selectedTypes.length < MEAL_TYPES.length) {
                query = query.in('type', selectedTypes);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            if (count !== null) setTotalCount(count);

            const newItems = data || [];
            if (isNewSearch) {
                setRecipes(newItems);
                setPage(0);
            } else {
                setRecipes(prev => [...prev, ...newItems]);
                setPage(pageNum);
            }

            setHasMore(count ? (isNewSearch ? newItems.length : recipes.length + newItems.length) < count : false);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            toast.error('Failed to load recipe library');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchRecipes(page + 1);
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
                toast.info('Removed from collections');
            }
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

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
                            {totalCount} <span className="text-emerald-300">RECIPES</span>
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/dashboard/recipes')}
                        className="bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl px-6 h-12 font-black uppercase tracking-widest gap-2 shadow-lg shadow-emerald-900/40 border-none group/btn"
                    >
                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                        Create Recipe
                    </Button>
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

                <div className="flex items-center gap-6">
                    {/* Favorites Switch Toggle */}
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shrink-0">
                        <Globe
                            size={18}
                            className={cn(
                                "transition-all cursor-pointer",
                                !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-300 hover:text-slate-400"
                            )}
                            onClick={() => setShowFavoritesOnly(false)}
                        />
                        <Switch
                            id="favorites-mode"
                            checked={showFavoritesOnly}
                            onCheckedChange={setShowFavoritesOnly}
                            className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600 dark:data-[state=unchecked]:bg-blue-600"
                        />
                        <Heart
                            size={18}
                            className={cn(
                                "transition-all cursor-pointer",
                                showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300 hover:text-slate-400"
                            )}
                            onClick={() => setShowFavoritesOnly(true)}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar h-14 items-center">
                        {MEAL_TYPES.map(type => {
                            const isActive = selectedTypes.includes(type);

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
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Querying Databank...</p>
                </div>
            ) : recipes.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                        {showFavoritesOnly ? <Heart size={32} /> : <Library size={32} />}
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        {showFavoritesOnly ? "Your collection is empty" : "No results found"}
                    </p>
                    <p className="text-sm text-slate-500 text-center max-w-xs">
                        {showFavoritesOnly
                            ? "You haven't favorited any recipes yet. Browse the library to add some to your collection."
                            : "We couldn't find any recipes matching your criteria."}
                    </p>
                    {showFavoritesOnly && (
                        <Button
                            onClick={() => setShowFavoritesOnly(false)}
                            className="mt-6 rounded-full bg-emerald-600 text-white px-8 font-black uppercase tracking-widest text-[10px]"
                        >
                            Browse All Recipes
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* List Header */}
                    <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_40px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <div>Image</div>
                        <div>Meal Item</div>
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
                        <div></div>
                    </div>

                    {/* Meal Items List */}
                    <div className="space-y-3">
                        {recipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                                className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                            >
                                <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_40px] gap-4 lg:items-center">
                                    {/* Thumbnail */}
                                    <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                        {recipe.image ? (
                                            <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ChefHat size={24} className="opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 lg:p-0">
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                            {recipe.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                <Clock size={10} />
                                                {recipe.prep_time}m
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                <Users size={10} />
                                                {recipe.servings}P
                                            </div>
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none uppercase tracking-widest px-1.5 py-0">
                                                {recipe.type}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Stats (Desktop View) */}
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {Math.round(recipe.calories)}
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {recipe.carbs.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {recipe.fat.toFixed(1)}g
                                    </div>
                                    <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                        {recipe.protein.toFixed(1)}g
                                    </div>

                                    {/* Mobile Stats Row */}
                                    <div className="lg:hidden grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        {[
                                            { label: 'CAL', val: recipe.calories, sub: 'k', color: 'text-orange-500' },
                                            { label: 'CHO', val: recipe.carbs, sub: 'g', color: 'text-amber-500' },
                                            { label: 'FAT', val: recipe.fat, sub: 'g', color: 'text-sky-500' },
                                            { label: 'PRO', val: recipe.protein, sub: 'g', color: 'text-purple-500' }
                                        ].map(stat => (
                                            <div key={stat.label} className="text-center">
                                                <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                                                <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-3 lg:p-0 flex justify-end lg:justify-center pr-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(recipe);
                                            }}
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
                                        View More Meals
                                        <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
