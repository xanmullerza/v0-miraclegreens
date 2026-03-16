'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat } from 'lucide-react';

export interface ProtocolSuggestionsProps {
  suggestions: any[];
  onEatMeal: (recipe: any) => void;
  onAdjustPantry: () => void;
}

export function LifeguardProtocolSuggestions({
  suggestions,
  onEatMeal,
  onAdjustPantry
}: ProtocolSuggestionsProps) {
  return (
    <div className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-2xl font-black uppercase italic tracking-tight">Protocol Lifelines</h3>
        <Button variant="ghost" onClick={onAdjustPantry} className="text-[10px] font-black uppercase">
          Adjust Pantry
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.length === 0 ? (
          <div className="md:col-span-2 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No matching protocols in library.</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Add more diverse ingredients to unlock recommendations.</p>
          </div>
        ) : (
          suggestions.map(recipe => (
            <div key={recipe.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] flex flex-col justify-between hover:shadow-xl transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {recipe.image ? (
                    <img src={recipe.image} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <ChefHat className="text-slate-300" size={24} />
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase italic truncate max-w-[200px]">{recipe.title}</h4>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase">{recipe.calories} KCAL SHIELD</p>
                </div>
              </div>
              <Button
                onClick={() => onEatMeal(recipe)}
                className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[9px]"
              >
                Consume Protocol
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
