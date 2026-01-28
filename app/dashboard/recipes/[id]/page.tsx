'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Heart,
    ArrowLeft,
    ChefHat,
    Clock,
    Users,
    ChevronRight,
    Loader2,
    Utensils,
    ShoppingBasket,
    Flame,
    Zap,
    Scale,
    Activity,
    Info,
    CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

interface Ingredient {
    item: string;
    amount: string;
    base_ingredient: string;
    weight_g: number;
}

interface Instruction {
    step_text: string;
    step_order: number;
}

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
    source?: string;
}

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState<Instruction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipeDetails();
    }, [id]);

    const fetchRecipeDetails = async () => {
        setLoading(true);
        try {
            // Fetch Recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', id)
                .single();

            if (recipeError) throw recipeError;
            setRecipe(recipeData);

            // Fetch Ingredients
            const { data: ingData, error: ingError } = await supabase
                .from('ingredients')
                .select('*')
                .eq('recipe_id', id);

            if (ingError) throw ingError;
            setIngredients(ingData || []);

            // Fetch Instructions
            const { data: insData, error: insError } = await supabase
                .from('instructions')
                .select('*')
                .eq('recipe_id', id)
                .order('step_order', { ascending: true });

            if (insError) throw insError;
            setInstructions(insData || []);

        } catch (error) {
            console.error('Error fetching recipe:', error);
            toast.error('Failed to load recipe details');
            router.push('/dashboard/my-meals');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!recipe) return;
        const newStatus = !recipe.is_favorite;
        try {
            const { error } = await supabase
                .from('recipes')
                .update({ is_favorite: newStatus } as any)
                .eq('id', recipe.id);

            if (error) throw error;
            setRecipe({ ...recipe, is_favorite: newStatus });
            toast.success(newStatus ? 'Added to collections' : 'Removed from collections');
        } catch (error) {
            toast.error('Failed to update favorite status');
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Accessing Recipe Databank...</p>
            </div>
        );
    }

    if (!recipe) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </button>
                <div className="flex gap-3">
                    <Button
                        onClick={toggleFavorite}
                        variant="outline"
                        className={cn(
                            "rounded-2xl px-6 h-12 font-black uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800 transition-all",
                            recipe.is_favorite ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <Heart size={18} fill={recipe.is_favorite ? "currentColor" : "none"} />
                        {recipe.is_favorite ? 'Favorited' : 'Favorite'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image and Specs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-3">
                        <div className="aspect-square rounded-[2rem] bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                            {recipe.image ? (
                                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ChefHat size={84} className="opacity-10" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 backdrop-blur-md shadow-xl">
                                    {recipe.type}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <Clock size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Prep Time</p>
                            <p className="text-xl font-black">{recipe.prep_time}m</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                            <Users size={20} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Servings</p>
                            <p className="text-xl font-black">{recipe.servings}P</p>
                        </div>
                    </div>

                    <Card className="p-8 space-y-6">
                        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <Zap className="text-orange-500" size={18} />
                            Caloric Breakdown
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Energy', val: recipe.calories, unit: 'kcal', color: 'bg-orange-500' },
                                { label: 'Protein', val: recipe.protein, unit: 'g', color: 'bg-red-500' },
                                { label: 'Carbs', val: recipe.carbs, unit: 'g', color: 'bg-amber-500' },
                                { label: 'Fat', val: recipe.fat, unit: 'g', color: 'bg-sky-500' }
                            ].map(stat => (
                                <div key={stat.label} className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                        <p className="font-black text-sm">{Math.round(stat.val)}{stat.unit}</p>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", stat.color)}
                                            style={{ width: `${Math.min(100, (stat.val / (stat.label === 'Energy' ? 800 : 50)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Title, Ingredients, Instructions */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95] italic uppercase">
                            {recipe.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {recipe.diet?.map(d => (
                                <Badge key={d} variant="outline" className="border-emerald-500/30 text-emerald-600 dark:bg-emerald-500/5 text-[9px] font-black uppercase tracking-widest px-3">
                                    {d}
                                </Badge>
                            ))}
                            {recipe.source && (
                                <Badge variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3">
                                    Source: {recipe.source}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Ingredients */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                                <ShoppingBasket className="text-emerald-500" />
                                Lab Ingredients
                            </h3>
                            <div className="space-y-2">
                                {ingredients.map((ing, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 transition-all group">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-emerald-500 font-black text-xs group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{ing.base_ingredient || ing.item}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ing.amount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400">{Math.round(ing.weight_g)}g</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic text-amber-500">
                                <ChefHat />
                                Procedure
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-5 before:w-px before:bg-slate-100 dark:before:bg-slate-800 pl-2">
                                {instructions.map((ins, i) => (
                                    <div key={i} className="relative pl-10 space-y-2 group">
                                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 group-hover:border-amber-500 transition-colors">
                                            <span className="text-xs font-black text-slate-400 group-hover:text-amber-500">{ins.step_order}</span>
                                        </div>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium pt-2">
                                            {ins.step_text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
