'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './card';
import { ChefHat, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmergencyRecipe {
  id: string;
  name: string;
  description: string;
  purpose: 'energy' | 'nutrients' | 'balanced' | 'quick';
  servingSize: number;
  servings: number;
  ingredients: { item: any; amount_g: number }[];
  nutrition: {
    energy_kcal: number;
    vitamin_c: number;
    b1: number;
    potential_days: number;
  };
  efficiency: number;
  difficulty: 'simple' | 'moderate' | 'complex';
  prepTime: number;
  icon: string;
}

export interface MealPlannerProps {
  recipes: EmergencyRecipe[];
  isGenerating: boolean;
  onGenerate: () => void;
  onConsume: (recipe: EmergencyRecipe) => void;
  hasInventory: boolean;
}

const PURPOSE_COLORS: Record<string, string> = {
  energy: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
  nutrients: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  balanced: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  quick: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
};

export function LifeguardMealPlanner({
  recipes,
  isGenerating,
  onGenerate,
  onConsume,
  hasInventory
}: MealPlannerProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-8 space-y-6 border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/5 dark:to-pink-500/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-purple-500 shrink-0" />
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Emergency Meal Planner</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">AI-optimized survival recipes</p>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            disabled={!hasInventory || isGenerating}
            className={cn(
              "h-12 px-6 font-black uppercase tracking-widest text-sm rounded-xl whitespace-nowrap",
              isGenerating 
                ? "bg-slate-400 cursor-not-allowed" 
                : hasInventory
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              '✨ Generate Recipes'
            )}
          </Button>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              {hasInventory ? 'Click "Generate Recipes" to see meal options' : 'Add ingredients to generate recipes'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => onConsume(recipe)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl p-5 text-left transition-all",
                  "bg-white dark:bg-slate-800 hover:shadow-lg",
                  "border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-400"
                )}
              >
                {/* Header with icon and name */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl">{recipe.icon}</span>
                    <div className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
                      PURPOSE_COLORS[recipe.purpose]
                    )}>
                      {recipe.purpose}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      {recipe.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {recipe.description}
                    </p>
                  </div>
                </div>

                {/* Nutrition metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-xl font-black text-orange-500">{Math.round(recipe.nutrition.energy_kcal)}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">kcal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-emerald-500">{Math.round(recipe.nutrition.vitamin_c)}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">mg Vit C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-blue-500">{Math.round(recipe.nutrition.b1 * 100) / 100}</div>
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">mg B1</div>
                  </div>
                </div>

                {/* Serving and efficiency info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 uppercase">
                      {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''} ({recipe.servingSize}g each)
                    </span>
                    <span className={cn(
                      "font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                      recipe.efficiency >= 80 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : recipe.efficiency >= 50
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
                    )}>
                      {Math.round(recipe.efficiency)}% efficient
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-400 uppercase">
                      Prep: {recipe.prepTime} min ({recipe.difficulty})
                    </span>
                    <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">
                      {recipe.nutrition.potential_days} day{recipe.nutrition.potential_days !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Ingredients list */}
                <div className="mb-4 space-y-1">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ingredients:</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {ing.item.name.split(' ')[0]} ({ing.amount_g}g)
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => onConsume(recipe)}
                  className="w-full h-10 bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  🍽️ Consume Recipe
                </Button>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
