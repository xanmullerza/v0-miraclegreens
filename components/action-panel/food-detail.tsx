'use client';

import React from 'react';
import { useFoodDetail, FoodHeader, FoodFacts, FoodNutrition, FoodRecipes, FoodManagement, FoodEditCard } from '@/components/foods/detail';
import { FOOD_DETAILS } from '@/lib/data/food-details';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { Loader2, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FoodDetailProps {
    foodId: string;
    onBack: () => void;
}

export function FoodDetail({ foodId, onBack }: FoodDetailProps) {
    const ctx = useFoodDetail(foodId);
    const { food, loading, activeSection } = ctx;

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Scanning Bio-Reference...</p>
            </div>
        );
    }

    if (!food) return null;

    return (
        <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
            {/* Content Area - Flex column to allow sticky button inside */}
            <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 w-full mx-auto">
                    <FoodHeader ctx={ctx} />
                    
                    <div className="px-5 py-4 space-y-6 w-full">
                        {activeSection === 'management' && <FoodManagement ctx={ctx} user={ctx.user} />}
                        {activeSection === 'facts' && (food.details || FOOD_DETAILS[food.id]) && <FoodFacts ctx={ctx} />}
                        {activeSection === 'recipes' && <FoodRecipes ctx={ctx} />}
                        {activeSection === 'nutrition' && <FoodNutrition ctx={ctx} />}
                    </div>
                </div>
                
                <FoodEditCard ctx={ctx} />
                
                {/* Sticky Back Button - inside scrollable container */}
                <div className="sticky bottom-0 mt-auto flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <Button 
                        onClick={onBack} 
                        variant="ghost" 
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ChevronLeft size={16} className="mr-2" />
                        Back to Recipe
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FoodDetail;
