'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { Calendar } from 'lucide-react';

export interface SurvivalCalendarProps {
  inventory: any[];
  adjustedInventory: any[];
  profileType: 'maintenance' | 'starvation';
  waterStatus: 'clean' | 'dirty' | 'none' | null;
}

export function LifeguardSurvivalCalendar(props: SurvivalCalendarProps) {
  if (!props.inventory.length) return null;

  const nutrients = [
    { 
      label: 'Energy', 
      calc: () => Math.ceil((INITIAL_STORES.energy + props.adjustedInventory.reduce((acc: any, i: any) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0)) / SURVIVAL_PROFILES[props.profileType].energy_floor), 
      color: 'from-red-500 to-orange-500', 
      icon: '🔥' 
    },
    { 
      label: 'Vitamin C', 
      calc: () => Math.ceil((INITIAL_STORES.vit_c * SURVIVAL_PROFILES[props.profileType].vit_c_floor + props.adjustedInventory.reduce((acc: any, i: any) => acc + (i.nutrition?.micronutrients?.['Vitamin C'] || 0) * (i.weight_g / 100), 0)) / SURVIVAL_PROFILES[props.profileType].vit_c_floor), 
      color: 'from-orange-500 to-amber-500', 
      icon: '🍊' 
    },
    { 
      label: 'B1 (Thiamine)', 
      calc: () => Math.ceil((INITIAL_STORES.b1 * SURVIVAL_PROFILES[props.profileType].b1_floor + props.adjustedInventory.reduce((acc: any, i: any) => acc + (i.nutrition?.micronutrients?.['B1 (Thiamine)'] || 0) * (i.weight_g / 100), 0)) / SURVIVAL_PROFILES[props.profileType].b1_floor), 
      color: 'from-purple-500 to-pink-500', 
      icon: '💊' 
    },
    { 
      label: 'Water', 
      calc: () => props.waterStatus === 'clean' ? 30 : (props.waterStatus === 'dirty' ? 8 : 3), 
      color: 'from-blue-500 to-cyan-500', 
      icon: '💧' 
    }
  ];

  return (
    <div className="space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-indigo-500" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Survival Timeline</h3>
        <p className="text-[7px] text-slate-500 ml-auto">30-day nutrient depletion forecast</p>
      </div>

      <div className="space-y-2">
        {nutrients.map((nutrient) => {
          const daysLeft = Math.min(nutrient.calc(), 30);
          return (
            <div key={nutrient.label} className="space-y-1">
              <div className="flex items-center justify-between text-[8px]">
                <div className="flex items-center gap-1.5 font-black uppercase">
                  <span>{nutrient.icon}</span>
                  <span className="text-slate-900 dark:text-white">{nutrient.label}</span>
                </div>
                <span className={`font-black px-2 py-0.5 rounded-full ${daysLeft > 20 ? 'bg-emerald-500 text-white' : daysLeft > 10 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                  Day {daysLeft}
                </span>
              </div>
              <div className="flex gap-0.5 h-4">
                {Array.from({ length: 30 }).map((_, day) => {
                  const isDepleted = day >= daysLeft;
                  return (
                    <div
                      key={day}
                      className={`flex-1 rounded-sm transition-all ${isDepleted ? 'bg-slate-200 dark:bg-slate-700' : `bg-gradient-to-r ${nutrient.color}`}`}
                      title={`Day ${day + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[7px] text-slate-500 dark:text-slate-400 mt-3 p-2 bg-slate-100 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
        {props.waterStatus && props.waterStatus !== 'clean' && (
          <p className="font-bold text-amber-600 dark:text-amber-400">⚠️ Water penalty active: {props.waterStatus === 'dirty' ? '-25% nutrients' : '-15% energy'} (affects calculations above)</p>
        )}
      </div>
    </div>
  );
}
