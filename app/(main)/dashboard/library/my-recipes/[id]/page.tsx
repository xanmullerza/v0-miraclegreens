'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Heart, Pencil, Trash2, Loader2, Clock, Users, ChefHat } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDataPersistence, Recipe } from '@/lib/hooks/use-data-persistence';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

const CAL_TO_KJ = 4.184;
const formatEnergy = (calories: number, unit: 'kcal' | 'kJ') => {
    if (unit === 'kJ') {
        return `${Math.round(calories * CAL_TO_KJ).toLocaleString()} kJ`;
    }
    return `${Math.round(calories).toLocaleString()} kC`;
};

interface RecipeDetail extends Recipe {
    ingredients?: Array<{ 
        item: string;
        quantity: number;
        measure_label: string;
        weight_g: number;
    }>;
    instructions?: Array<{
        step_text: string;
        step_order: number;
    }>;
}

export default function MyRecipeDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const { energyUnit } = useUserPreferences();
    const { user, loading: authLoading } = useDataPersistence();
    
    const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchRecipeDetails = async () => {
            if (!user || !id) {
                setLoading(false);
                return;
            }

            try {
                setIsFetching(true);
                
                // Import supabase locally to fetch recipe details
                const { supabase } = await import('@/lib/supabase');
                
                // Fetch recipe
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id as string)
                    .eq('user_id', user.id)
                    .single();

                if (recipeError) {
                    toast.error('Recipe not found');
                    router.back();
                    return;
                }

                // Fetch ingredients
                const { data: ingredientsData } = await supabase
                    .from('ingredients')
                    .select('*')
                    .eq('recipe_id', id as string);

                // Fetch instructions
                const { data: instructionsData } = await supabase
                    .from('instructions')
                    .select('*')
                    .eq('recipe_id', id as string)
                    .order('step_order', { ascending: true });

                setRecipe({
                    ...recipeData,
                    ingredients: ingredientsData || [],
                    instructions: instructionsData || []
                });
            } catch (error) {
                console.error('Error fetching recipe details:', error);
                toast.error('Failed to load recipe');
            } finally {
                setIsFetching(false);
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchRecipeDetails();
        }
    }, [id, user, authLoading, router]);

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${recipe?.title}"?`)) return;

        try {
            const { deleteRecipe } = await import('@/lib/hooks/use-data-persistence').then(() => useDataPersistence());
            
            // Re-import to get fresh instance
            const { supabase } = await import('@/lib/supabase');
            
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id as string)
                .eq('user_id', user?.id);

            if (error) throw error;
            
            toast.success('Recipe deleted successfully');
            router.back();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete recipe');
        }
    };

    const handleEdit = () => {
        router.push(`/dashboard/library/my-recipes/${id}/edit`);
    };

    if (loading) {
        return (
            <PageContainer maxWidth="max-w-7xl">
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipe...</p>
                </div>
            </PageContainer>
        );
    }

    if (!recipe) {
        return (
            <PageContainer maxWidth="max-w-7xl">
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <ChefHat size={48} className="text-slate-300" />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">Recipe Not Found</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Go back"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    
                    <div className="flex-1 text-center">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white capitalize">
                            {recipe.title}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{recipe.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleEdit}
                            className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Edit recipe"
                        >
                            <Pencil size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete recipe"
                        >
                            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                        </button>
                    </div>
                </div>

                {/* Image */}
                {recipe.image && (
                    <div className="w-full h-96 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img 
                            src={recipe.image} 
                            alt={recipe.title} 
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Servings</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{recipe.servings}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Prep Time</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{recipe.prep_time} <span className="text-sm">min</span></p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <ChefHat size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Calories</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formatEnergy(recipe.calories, energyUnit)}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Macros</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-amber-600 dark:text-amber-400">C: {recipe.carbs.toFixed(1)}g</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-rose-600 dark:text-rose-400">F: {recipe.fat.toFixed(1)}g</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-emerald-600 dark:text-emerald-400">P: {recipe.protein.toFixed(1)}g</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-black uppercase tracking-wider mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                            <span>📝 Ingredients</span>
                            <span className="text-sm font-bold text-slate-400">{recipe.ingredients.length}</span>
                        </h2>
                        <div className="space-y-3">
                            {recipe.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900 dark:text-white">{ing.item}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {ing.quantity} {ing.measure_label || 'unit'} {ing.weight_g ? `(${ing.weight_g.toFixed(0)}g)` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                        <h2 className="text-2xl font-black uppercase tracking-wider mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                            <span>👨‍🍳 Instructions</span>
                            <span className="text-sm font-bold text-slate-400">{recipe.instructions.length}</span>
                        </h2>
                        <div className="space-y-4">
                            {recipe.instructions.map((ins, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-black text-amber-700 dark:text-amber-400">{ins.step_order}</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 pt-1">{ins.step_text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Edit Button */}
                <div className="flex justify-center pb-8">
                    <Button
                        onClick={handleEdit}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest h-12 px-8 rounded-xl flex items-center gap-2"
                    >
                        <Pencil size={14} />
                        Edit Recipe
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
