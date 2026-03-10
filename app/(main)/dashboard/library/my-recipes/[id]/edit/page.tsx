'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDataPersistence } from '@/lib/hooks/use-data-persistence';
import { supabase } from '@/lib/supabase';

interface RecipeFormData {
    title: string;
    type: string;
    servings: number;
    prep_time: number;
    image?: string;
    source?: string;
}

const RECIPE_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function EditRecipePage() {
    const router = useRouter();
    const { id } = useParams();
    const { user, loading: authLoading } = useDataPersistence();
    
    const [recipe, setRecipe] = useState<RecipeFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<RecipeFormData>({
        title: '',
        type: 'dinner',
        servings: 4,
        prep_time: 30,
        image: '',
        source: ''
    });

    useEffect(() => {
        const fetchRecipe = async () => {
            if (!user || !id) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('recipes')
                    .select('*')
                    .eq('id', id as string)
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    toast.error('Recipe not found');
                    router.back();
                    return;
                }

                setRecipe(data);
                setFormData({
                    title: data.title || '',
                    type: data.type || 'dinner',
                    servings: data.servings || 4,
                    prep_time: data.prep_time || 30,
                    image: data.image || '',
                    source: data.source || ''
                });
            } catch (error) {
                console.error('Error fetching recipe:', error);
                toast.error('Failed to load recipe');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchRecipe();
        }
    }, [id, user, authLoading, router]);

    const handleInputChange = (field: keyof RecipeFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Recipe title is required');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('recipes')
                .update({
                    title: formData.title,
                    type: formData.type,
                    servings: formData.servings,
                    prep_time: formData.prep_time,
                    image: formData.image || null,
                    source: formData.source || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id as string)
                .eq('user_id', user?.id);

            if (error) throw error;

            toast.success('Recipe updated successfully');
            router.back();
        } catch (error) {
            console.error('Error saving recipe:', error);
            toast.error('Failed to save recipe');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <PageContainer maxWidth="max-w-2xl">
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Recipe...</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer maxWidth="max-w-2xl">
            <div className="space-y-8 animate-in fade-in duration-500">
                
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Go back"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    
                    <h1 className="flex-1 text-3xl font-black text-slate-900 dark:text-white">
                        Edit Recipe
                    </h1>

                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                    
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Recipe Title
                        </label>
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g., Honey Mustard Chicken"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Meal Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            {RECIPE_TYPES.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Servings & Prep Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                Servings
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.servings}
                                onChange={(e) => handleInputChange('servings', parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                Prep Time (min)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.prep_time}
                                onChange={(e) => handleInputChange('prep_time', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Image URL
                        </label>
                        <Input
                            type="url"
                            value={formData.image || ''}
                            onChange={(e) => handleInputChange('image', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Source URL */}
                    <div className="space-y-2">
                        <label className="block text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Source URL
                        </label>
                        <Input
                            type="url"
                            value={formData.source || ''}
                            onChange={(e) => handleInputChange('source', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-300">
                            <strong>Note:</strong> To edit ingredients and instructions, please use the recipe detail page. This form updates basic recipe information only.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => router.back()}
                        className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest h-12 px-6 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest h-12 px-6 rounded-xl flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save Recipe'}
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
}
