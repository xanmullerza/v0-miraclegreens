'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const CATEGORIES = [
  'General',
  'Vegetables',
  'Grains',
  'Legumes',
  'Oils',
  'Proteins',
  'Fruit',
  'Nuts',
  'Flavour',
  'Supplements',
] as const;

interface FoodFiltersPanelProps {
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  onClose?: () => void;
}

export function FoodFiltersPanel({
  showFavoritesOnly,
  setShowFavoritesOnly,
  selectedCategories,
  setSelectedCategories,
  onClose,
}: FoodFiltersPanelProps) {
  const activeCount = selectedCategories.length + (showFavoritesOnly ? 1 : 0);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Food Filters</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Refine the ingredient library.</p>
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => {
              setShowFavoritesOnly(false);
              setSelectedCategories([]);
            }}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Favorites only</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Show only saved favorite foods.</p>
            </div>
            <Switch checked={showFavoritesOnly} onCheckedChange={setShowFavoritesOnly} className="data-[state=checked]:bg-emerald-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Categories</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Filter ingredients by food group.</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{selectedCategories.length} selected</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(category => {
              const active = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => {
                    if (active) setSelectedCategories(prev => prev.filter(item => item !== category));
                    else setSelectedCategories(prev => [...prev, category]);
                  }}
                  className={cn(
                    'h-9 px-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                    active
                      ? 'bg-emerald-600 text-white border border-emerald-600'
                      : 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {onClose && (
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           <button
             onClick={onClose}
             className="w-full h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
           >
             Apply Filters
           </button>
        </div>
      )}
    </div>
  );
}
