'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { Scale } from 'lucide-react';

export interface DeficitAnalysisProps {
  inventory: any[];
  simStatus: any;
  profileType: 'maintenance' | 'starvation';
  simulationDay: number;
}

export function LifeguardDeficitAnalysis(props: DeficitAnalysisProps) {
  const analysis = React.useMemo(() => {
    const profile = SURVIVAL_PROFILES[props.profileType];
    return [
      { 
        label: 'Energy', 
        required: profile.energy_floor * props.simulationDay, 
        actual: props.simStatus.results.energy, 
        unit: 'kcal', 
        deficit: (profile.energy_floor * props.simulationDay) - props.simStatus.results.energy 
      },
      { 
        label: 'Hydration', 
        required: profile.water_floor * props.simulationDay, 
        actual: props.simStatus.results.water, 
        unit: 'L', 
        deficit: (profile.water_floor * props.simulationDay) - props.simStatus.results.water 
      },
      { 
        label: 'B1 (Thiamine)', 
        required: profile.b1_floor * props.simulationDay, 
        actual: props.simStatus.results.b1, 
        unit: 'mg', 
        deficit: (profile.b1_floor * props.simulationDay) - props.simStatus.results.b1 
      },
      { 
        label: 'C (Ascorbic Acid)', 
        required: profile.vit_c_floor * props.simulationDay, 
        actual: props.simStatus.results.vit_c, 
        unit: 'mg', 
        deficit: (profile.vit_c_floor * props.simulationDay) - props.simStatus.results.vit_c 
      }
    ];
  }, [props.profileType, props.simulationDay, props.simStatus]);

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <Scale size={16} className="text-blue-500" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deficit Analysis</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.map(item => {
          const percentMet = item.actual > 0 ? Math.round((item.actual / item.required) * 100) : 0;
          const isDeficient = item.actual < item.required;
          return (
            <div key={item.label} className={cn("p-6 rounded-2xl border-2", isDeficient ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/30" : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30")}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest">{item.label}</h4>
                <div className={cn("px-2 py-1 rounded-lg text-[8px] font-black uppercase", isDeficient ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
                  {percentMet}%
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[8px] font-bold text-slate-500 mb-1">Required: {Math.round(item.required)} {item.unit}</p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 dark:bg-slate-600" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <p className={cn("text-[8px] font-bold mb-1", isDeficient ? "text-rose-600" : "text-emerald-600")}>Actual: {Math.round(item.actual)} {item.unit}</p>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={cn("h-full", isDeficient ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(percentMet, 100)}%` }} />
                  </div>
                </div>
                {isDeficient && (
                  <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider">Shortfall: {Math.round(item.deficit)} {item.unit}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
