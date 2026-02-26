'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Search,
    ArrowLeft,
    Loader2,
    ChefHat,
    Edit2,
    Trash2,
    X,
    ExternalLink,
    Filter,
    Clock,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSearch } from '@/lib/context/search-context';

interface Recipe {
    id: string;
    title: string;
    type: string;
    calories: number;
    prep_time: number;
    servings: number;
    image: string | null;
    source: string | null;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function ManageRecipesPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('id, title, type, calories, prep_time, servings, image, source')
                .order('title', { ascending: true });

            if (error) throw error;
            setRecipes(data || []);
        } catch (error: any) {
            console.error('Error fetching recipes:', error);
            toast.error('Failed to load recipes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRecipes(recipes.filter(r => r.id !== id));
            toast.success('Recipe deleted successfully');
        } catch (error: any) {
            toast.error('Failed to delete recipe');
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredRecipes = recipes.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || r.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-slate-500 font-medium">Accessing Recipe Vault...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 text-violet-500 font-bold text-xs uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                    >
                        <ArrowLeft size={14} /> Back to Admin
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Recipe Protocol Registry</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage and calibrate therapeutic meal data.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.push('/admin/recipebuilder')}
                        className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold px-6"
                    >
                        <ChefHat size={16} />
                        Architect New Recipe
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Search recipes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-none bg-slate-50 dark:bg-slate-800/50 rounded-xl focus-visible:ring-violet-500/20"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={16} className="text-slate-400" />
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl gap-1 overflow-x-auto whitespace-nowrap">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                typeFilter === 'all' ? "bg-white dark:bg-slate-700 text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            All
                        </button>
                        {MEAL_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    typeFilter === type ? "bg-white dark:bg-slate-700 text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Registry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                    <div key={recipe.id} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                            {recipe.image ? (
                                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ChefHat size={48} className="opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <Badge className="bg-white/90 dark:bg-slate-900/90 text-violet-600 border-none text-[8px] font-black uppercase tracking-widest px-2.5 py-1 backdrop-blur-md shadow-sm">
                                    {recipe.type}
                                </Badge>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-4 line-clamp-1 italic uppercase">
                                {recipe.title}
                            </h3>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mb-0.5">Energy</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{recipe.calories} <span className="text-[8px] text-slate-400">kcal</span></p>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <Clock size={10} className="mx-auto mb-0.5 text-violet-500" />
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{recipe.prep_time}m</p>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <Users size={10} className="mx-auto mb-0.5 text-violet-500" />
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{recipe.servings}P</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Button
                                    onClick={() => router.push(`/dashboard/recipes/meals/${recipe.id}/edit`)}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 gap-2"
                                >
                                    <Edit2 size={12} />
                                    Edit Protocol
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/dashboard/recipes/meals/${recipe.id}`)}
                                    className="w-10 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-violet-600 hover:bg-violet-50 p-0"
                                >
                                    <ExternalLink size={14} />
                                </Button>
                                <Button
                                    disabled={isDeleting === recipe.id}
                                    onClick={() => handleDelete(recipe.id, recipe.title)}
                                    variant="outline"
                                    className="w-10 h-10 rounded-xl border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0"
                                >
                                    {isDeleting === recipe.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredRecipes.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <ChefHat size={48} className="mx-auto mb-4 text-slate-200" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">No protocols found</h3>
                    <p className="text-slate-500 mt-1">Adjust your parameters or architect a new recipe.</p>
                </div>
            )}
        </div>
    );
}
