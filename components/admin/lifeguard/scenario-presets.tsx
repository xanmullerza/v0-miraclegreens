'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './card';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScenarioPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  foods: { name: string; weight_g: number }[];
}

export interface ScenarioPresetsProps {
  presets?: ScenarioPreset[];
  onLoadPreset: (foods: { name: string; weight_g: number }[]) => void;
}

const DEFAULT_PRESETS: ScenarioPreset[] = [
  {
    id: 'desert',
    name: 'Desert Kit',
    emoji: '🏜️',
    description: 'High-energy, minimal water',
    foods: [
      { name: 'Peanut Butter', weight_g: 500 },
      { name: 'Beef Jerky', weight_g: 300 },
      { name: 'Honey', weight_g: 400 },
      { name: 'Dates', weight_g: 400 },
      { name: 'Almonds', weight_g: 300 }
    ]
  },
  {
    id: 'mountain',
    name: 'Mountain Kit',
    emoji: '⛰️',
    description: 'Preserved, high-calorie',
    foods: [
      { name: 'Canned Beans', weight_g: 600 },
      { name: 'Dark Chocolate', weight_g: 300 },
      { name: 'Trail Mix', weight_g: 400 },
      { name: 'Hardtack', weight_g: 400 },
      { name: 'Cheese', weight_g: 300 }
    ]
  },
  {
    id: 'urban',
    name: 'Urban Kit',
    emoji: '🏙️',
    description: 'Balanced, accessible',
    foods: [
      { name: 'Rice', weight_g: 500 },
      { name: 'Canned Vegetables', weight_g: 500 },
      { name: 'Pasta', weight_g: 400 },
      { name: 'Oats', weight_g: 400 },
      { name: 'Canned Tuna', weight_g: 300 }
    ]
  }
];

export function LifeguardScenarioPresets({
  presets = DEFAULT_PRESETS,
  onLoadPreset
}: ScenarioPresetsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-8 space-y-6 border-2 border-cyan-500/20 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/5 dark:to-blue-500/5">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-cyan-500 shrink-0" />
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Scenario Presets</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Quick-load survival kits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => onLoadPreset(preset.foods)}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 text-left transition-all",
                "bg-white dark:bg-slate-800 hover:shadow-lg",
                "border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-400",
                "flex flex-col gap-4"
              )}
            >
              {/* Preset emoji as large background element */}
              <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">{preset.emoji}</div>

              {/* Content */}
              <div className="space-y-3 relative z-10">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {preset.emoji} {preset.name}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    {preset.description}
                  </p>
                </div>

                {/* Food tags preview */}
                <div className="flex flex-wrap gap-2">
                  {preset.foods.slice(0, 3).map((food, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {food.name.split(' ')[0]}
                    </span>
                  ))}
                  {preset.foods.length > 3 && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      +{preset.foods.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Load button */}
              <Button
                onClick={() => onLoadPreset(preset.foods)}
                className="w-full h-10 mt-auto bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl"
              >
                Load Kit →
              </Button>
            </button>
          ))}
        </div>

        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
          Load a preset to instantly populate your pantry
        </p>
      </Card>
    </div>
  );
}
