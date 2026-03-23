'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Loader2,
    Search,
    BookOpen,
    ArrowRight,
    Clock,
    Users,
    Zap,
    Heart,
    ChefHat,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Recipe {
    id: string;
    name: string;
    description?: string;
    category?: string;
    image?: string;
    prep_time?: number;
    cook_time?: number;
    servings?: number;
    calories?: number;
    is_favorite?: boolean;
}

export function AllMealsView() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'favorites'>('all');

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setRecipes(data || []);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            toast.error("Failed to load recipes.");
        } finally {
            setLoading(false);
        }
    };

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (recipe.category || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || (filter === 'favorites' && recipe.is_favorite);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Recipe Library</h2>
                    <p className="text-slate-500 font-medium text-sm">Browse your collection of healthy meals.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative group flex-grow max-w-sm">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <Input
                            type="text"
                            placeholder="Search recipes..."
                            className="w-full h-14 pl-12 pr-6 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/10 text-sm font-bold transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Favorites Switch Toggle */}
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-all">
                        <Globe
                            size={18}
                            className={cn(
                                "transition-all cursor-pointer",
                                filter === 'all' ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" : "text-slate-300 hover:text-slate-400"
                            )}
                            onClick={() => setFilter('all')}
                        />
                        <Switch
                            id="favorites-mode"
                            checked={filter === 'favorites'}
                            onCheckedChange={(checked) => setFilter(checked ? 'favorites' : 'all')}
                            className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-orange-500"
                        />
                        <Heart
                            size={18}
                            className={cn(
                                "transition-all cursor-pointer",
                                filter === 'favorites' ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300 hover:text-slate-400"
                            )}
                            onClick={() => setFilter('favorites')}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-orange-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Loading recipes...</p>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-[3rem]">
                    <div className="p-6 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
                        <ChefHat size={48} className="text-orange-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                        {filter === 'favorites' ? 'No favorites yet' : 'No recipes found'}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {filter === 'favorites' ? 'Mark recipes as favorite to see them here' : 'Try a different search term'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => router.push(`/dashboard/library/recipes/${recipe.id}`)}
                            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Image */}
                            <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 relative overflow-hidden">
                                {recipe.image ? (
                                    <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ChefHat size={48} className="text-orange-300" />
                                    </div>
                                )}
                                {recipe.is_favorite && (
                                    <div className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500">
                                        <Heart size={14} fill="currentColor" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1">
                                    {recipe.name}
                                </h3>

                                {recipe.category && (
                                    <Badge className="mt-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] border-none uppercase font-black">
                                        {recipe.category}
                                    </Badge>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-4 text-[10px] text-slate-400">
                                    {recipe.prep_time && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{recipe.prep_time + (recipe.cook_time || 0)} min</span>
                                        </div>
                                    )}
                                    {recipe.servings && (
                                        <div className="flex items-center gap-1">
                                            <Users size={12} />
                                            <span>{recipe.servings} servings</span>
                                        </div>
                                    )}
                                    {recipe.calories && (
                                        <div className="flex items-center gap-1">
                                            <Zap size={12} className="text-orange-500" />
                                            <span>{recipe.calories} cal</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );
}
