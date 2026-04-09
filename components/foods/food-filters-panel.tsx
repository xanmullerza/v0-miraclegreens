'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/context/food-filter-context';

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
  const isAllSelected = selectedCategories.length === CATEGORIES.length;

  return (
    <div className="flex flex-col min-h-0">
      <div className="p-4 sm:p-6 space-y-6 overflow-visible flex-1">
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
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Manage visibility by food group.</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{isAllSelected ? "ALL" : `${selectedCategories.length}/${CATEGORIES.length}`}</span>
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
                      : 'bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-400/50 hover:bg-slate-100 dark:hover:bg-slate-800'
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
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
           <button
             onClick={() => {
               setShowFavoritesOnly(false);
               setSelectedCategories([...CATEGORIES]);
             }}
             className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px] font-black uppercase tracking-widest transition-all"
           >
             Show All
           </button>
           <button
             onClick={onClose}
             className="flex-[2] h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
           >
             Apply Filters
           </button>
        </div>
      )}
    </div>
  );
}
