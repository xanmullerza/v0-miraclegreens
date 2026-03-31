'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TabHeader } from '@/components/ui/tab-header';
import { PageContainer } from '@/components/ui/page-container';
import { useHeaderActions } from '@/lib/context/header-actions-context';
import {
    useRecipeDetail,
    RecipeHeader,
    RecipeSection,
    RecipeNutrition,
    RecipeSmartMatch,
    RecipeRelated,
    RecipeManagement,
} from '@/components/recipe/detail';

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const { setCustomSegmentLabel } = useHeaderActions();

    const ctx = useRecipeDetail({
        recipeId: String(id),
        onBack: () => router.back(),
    });

    const { recipe, loading, activeSection } = ctx;

    // Push recipe title into breadcrumb
    useEffect(() => {
        if (recipe?.title) setCustomSegmentLabel(recipe.title);
        return () => setCustomSegmentLabel(null);
    }, [recipe?.title, setCustomSegmentLabel]);

    const handleTabChange = (tabId: string) => {
        if (tabId === 'recipes') router.push('/recipes');
        else router.push(`/recipes?tab=${tabId}`);
    };

    // ── Loading state ─────────────────────────────────────────
    if (loading) {
        return (
            <>
                <TabHeader
                    tabs={[
                        { id: 'recipes', label: 'Recipes' },
                        { id: 'remixes', label: 'Remixes' },
                        { id: 'mixes', label: 'Mixes' },
                        { id: 'foods', label: 'Foods' },
                        { id: 'nutrients', label: 'Nutrients' },
                    ]}
                    activeTab="recipes"
                    onTabChange={handleTabChange}
                />
                <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
                        Loading Recipe…
                    </p>
                </div>
            </>
        );
    }

    if (!recipe) return null;

    // ── Main render ────────────────────────────────────────────
    return (
        <>
            <TabHeader
                tabs={[
                    { id: 'recipes', label: 'Recipes' },
                    { id: 'remixes', label: 'Remixes' },
                    { id: 'mixes', label: 'Mixes' },
                    { id: 'foods', label: 'Foods' },
                    { id: 'nutrients', label: 'Nutrients' },
                ]}
                activeTab="recipes"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-6xl">
                <div className="space-y-6 pb-20 animate-in fade-in duration-700">
                    {/* ─── Card Shell (mirrors foods page) ─────────────── */}
                    <div className="bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">

                        {/* ── Compact Header with inline pills ──────── */}
                        <RecipeHeader ctx={ctx} standalone />

                        {/* ── Active section content ────────────────── */}
                        <div className="px-6 py-4 space-y-6">
                            {activeSection === 'recipe' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                                    <RecipeSection ctx={ctx} />
                                </div>
                            )}

                            {activeSection === 'nutrition' && (
                                <div className="space-y-6">
                                    <RecipeNutrition ctx={ctx} />
                                    <RecipeSmartMatch ctx={ctx} />
                                </div>
                            )}

                            {activeSection === 'related' && (
                                <RecipeRelated ctx={ctx} />
                            )}

                            {activeSection === 'management' && (
                                <RecipeManagement ctx={ctx} />
                            )}

                            {/* Collapsed state — quick summary */}
                            {activeSection === null && (
                                <div className="flex flex-col items-center gap-3 py-8 text-center animate-in fade-in duration-500">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                        <UtensilsCrossed size={20} className="text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        Select a section above
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageContainer>
        </>
    );
}