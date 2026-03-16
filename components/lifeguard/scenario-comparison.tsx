'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SURVIVAL_PROFILES, INITIAL_STORES } from '@/lib/utils/survival-sim';
import { X } from 'lucide-react';

export interface ScenarioComparisonProps {
  inventory: any[];
  comparisonInventory: any[];
  comparisonMode: boolean;
  comparisonWaterStatus: 'clean' | 'dirty' | 'none' | null;
  adjustedInventory: any[];
  comparisonAdjustedInventory: any[];
  comparisonSimStatus: any;
  profileType: 'maintenance' | 'starvation';
  simulationDay: number;
  waterStatus: 'clean' | 'dirty' | 'none' | null;
  onStartComparison: () => void;
  onCloseComparison: () => void;
  onComparisonInventoryChange: (items: any[]) => void;
  onComparisonWaterStatusChange: (status: 'clean' | 'dirty' | 'none' | null) => void;
}

export function LifeguardScenarioComparison(props: ScenarioComparisonProps) {
  if (!props.inventory.length) return null;

  return (
    <>
      {/* Toggle Button */}
      <div className="flex gap-2 md:gap-3 flex-wrap justify-center animate-in fade-in duration-700">
        <button
          onClick={props.onStartComparison}
          disabled={props.comparisonMode}
          className="text-[8px] uppercase font-black px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 transition-colors"
        >
          ⚖️ Compare Scenario
        </button>
        {props.comparisonMode && (
          <button
            onClick={props.onCloseComparison}
            className="text-[8px] uppercase font-black px-4 py-2 rounded-xl bg-slate-500 hover:bg-slate-600 text-white transition-colors"
          >
            ✕ Close Comparison
          </button>
        )}
      </div>

      {/* Comparison Panel */}
      {props.comparisonMode && props.comparisonSimStatus && (
        <div className="space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-500/30 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400">Scenario Comparison</h3>
            <p className="text-[7px] text-slate-500">Modify the alternate scenario below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-emerald-200 dark:border-emerald-500/30 space-y-2">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">Current Scenario</p>
              <div className="text-[8px] space-y-1 font-bold">
                <p>Survival Window: <span className="text-emerald-600 dark:text-emerald-400">{Math.min(30, Math.max(0, Math.ceil((INITIAL_STORES.energy + props.adjustedInventory.reduce((acc: any, i: any) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0)) / SURVIVAL_PROFILES[props.profileType].energy_floor + 20)))} days</span></p>
                <p>Items: <span className="text-emerald-600 dark:text-emerald-400">{props.inventory.length}</span></p>
                <p>Water: <span className="text-emerald-600 dark:text-emerald-400">{props.waterStatus || 'none'}</span></p>
              </div>
            </div>

            {/* Comparison */}
            <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-indigo-200 dark:border-indigo-500/30 space-y-2">
              <p className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">Alternate Scenario</p>
              <div className="text-[8px] space-y-1 font-bold">
                <p>Survival Window: <span className="text-indigo-600 dark:text-indigo-400">{Math.min(30, Math.max(0, Math.ceil((INITIAL_STORES.energy + props.comparisonAdjustedInventory.reduce((acc: any, i: any) => acc + (i.nutrition?.energy_kcal || 0) * (i.weight_g / 100), 0)) / SURVIVAL_PROFILES[props.profileType].energy_floor + 20)))} days</span></p>
                <p>Items: <span className="text-indigo-600 dark:text-indigo-400">{props.comparisonInventory.length}</span></p>
                <p>Water: <span className="text-indigo-600 dark:text-indigo-400">{props.comparisonWaterStatus || 'none'}</span></p>
              </div>

              <div className="space-y-2 pt-3 border-t border-indigo-200 dark:border-indigo-500/30">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-600 dark:text-slate-400">Water Source</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['clean', 'dirty', 'none'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => props.onComparisonWaterStatusChange(status)}
                        className={`text-[7px] font-black uppercase px-2 py-1 rounded transition-colors ${props.comparisonWaterStatus === status ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[7px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-500/20 p-2 rounded border border-indigo-200 dark:border-indigo-500/30 font-bold">
            💡 Tip: Adjust comparison inventory items below and change water status to test different scenarios
          </div>
        </div>
      )}

      {/* Comparison Inventory Editor */}
      {props.comparisonMode && (
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 animate-in fade-in duration-500">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Edit Comparison Inventory</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {props.comparisonInventory.map((item) => (
              <div key={item.id} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={item.weight_g}
                  onChange={(e) => props.onComparisonInventoryChange(
                    props.comparisonInventory.map(i => i.id === item.id ? { ...i, weight_g: parseInt(e.target.value) } : i)
                  )}
                  className="flex-1 h-1.5 accent-indigo-500"
                />
                <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 w-12 text-right">{item.weight_g}g</span>
                <button 
                  onClick={() => props.onComparisonInventoryChange(props.comparisonInventory.filter(i => i.id !== item.id))}
                  className="text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
