'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';

export interface InventoryManagerProps {
  inventory: any[];
  isSearching: boolean;
  onUpdateWeight: (id: string, weight: number) => void;
  onRemoveItem: (id: string) => void;
  onFindMeals: () => void;
}

export function LifeguardInventoryManager({
  inventory,
  isSearching,
  onUpdateWeight,
  onRemoveItem,
  onFindMeals
}: InventoryManagerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase italic italic tracking-tight">Active Pantry</h2>
        <Badge className="bg-amber-500">{inventory.length} ITEMS</Badge>
      </div>
      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {inventory.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pantry is empty.</p>
          </div>
        ) : (
          inventory.map(item => (
            <div key={item.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group shadow-sm">
              <div className="min-w-0">
                <h4 className="text-xs font-black uppercase truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={item.weight_g}
                    onChange={(e) => onUpdateWeight(item.id, parseInt(e.target.value))}
                    className="w-16 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-black p-1 text-center"
                  />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Grams</span>
                </div>
              </div>
              <button onClick={() => onRemoveItem(item.id)} className="text-slate-200 hover:text-rose-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      {inventory.length > 0 && (
        <Button
          onClick={onFindMeals}
          className="w-full h-14 bg-amber-500 hover:bg-amber-600 rounded-2xl font-black uppercase tracking-widest text-[10px]"
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="animate-spin" /> : 'Project Lifeline'}
        </Button>
      )}
    </div>
  );
}
