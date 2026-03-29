'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { ChevronLeft } from 'lucide-react';

export interface LifeguardComponentProps {
  inventory: any[];
  simStatus: any;
  waterStatus: 'clean' | 'dirty' | 'none' | null;
  profileType: 'maintenance' | 'starvation';
  simulationDay: number;
  onSimulationDayChange: (day: number) => void;
  onProfileTypeChange: (type: 'maintenance' | 'starvation') => void;
  energyUnit?: string;
}

export function LifeguardLongevityMeter(props: LifeguardComponentProps) {
  const survivalDays = (() => {
    const profile = SURVIVAL_PROFILES[props.profileType];
    const energyDays = props.inventory.reduce((acc, i) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0) / profile.energy_floor;
    const criticalDay = Math.max(0, Math.ceil(energyDays + 20));
    return Math.min(criticalDay, 30);
  })();

  return (
    <div className="sticky top-16 md:top-20 z-40 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 backdrop-blur-xl p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-amber-500/20 shadow-2xl overflow-hidden relative animate-in fade-in duration-700">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-transparent to-transparent animate-pulse" />
      </div>

      <div className="relative space-y-1 md:space-y-2">
        {/* Title + Ring Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-amber-400">Survival:</p>
              <h2 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter">{survivalDays}</h2>
              <p className="text-[8px] font-bold text-amber-300">days</p>
            </div>
          </div>

          {/* Status Ring - Compact (Mobile Optimized) */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <div className={cn("w-12 md:w-16 h-12 md:h-16 rounded-full flex items-center justify-center border-3 animate-pulse", props.simStatus.isTerminal ? "border-rose-500 bg-rose-500/10" : "border-emerald-500 bg-emerald-500/10")}>
              <div className="text-center">
                <p className={cn("text-lg md:text-2xl font-black", props.simStatus.isTerminal ? "text-rose-500" : "text-emerald-500")}>
                  {props.simStatus.results.energy > 0 ? '✓' : '✗'}
                </p>
                <p className="text-[5px] md:text-[6px] font-black uppercase leading-none text-white">
                  {props.simStatus.isTerminal ? 'CRIT' : 'OK'}
                </p>
              </div>
            </div>

            <div className={cn("px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[6px] md:text-[7px] font-black uppercase tracking-widest whitespace-nowrap", props.profileType === 'starvation' ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
              {props.profileType === 'starvation' ? 'STARV' : 'MAINT'}
            </div>
          </div>
        </div>

        {/* Slider Row - Compact (Mobile Optimized) */}
        <div className="space-y-0.5 md:space-y-1 pt-2 border-t border-slate-700">
          <div className="flex items-center justify-between gap-1 md:gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[7px] md:text-[8px] font-bold text-white truncate">
                Day {props.simulationDay} • Energy: <span className={props.simStatus.results.energy > 0 ? "text-emerald-400" : "text-rose-400"}>{Math.round(props.simStatus.results.energy)}</span> kcal
              </p>
            </div>
            <button
              onClick={() => props.onProfileTypeChange(props.profileType === 'maintenance' ? 'starvation' : 'maintenance')}
              className="text-[7px] uppercase font-black text-amber-400 hover:text-amber-300 px-2 py-0 h-auto transition-colors"
            >
              Switch
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={props.simulationDay}
            onChange={(e) => props.onSimulationDayChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between px-1 text-[7px] font-black text-slate-500 uppercase tracking-widest">
            <span>Now</span>
            <span>30 Days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
