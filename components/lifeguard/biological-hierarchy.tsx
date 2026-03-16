'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BiologicalHierarchyRule {
  label: string;
  detail: string;
  color: string;
}

export interface BiologicalHierarchyProps {
  rules?: BiologicalHierarchyRule[];
}

export function LifeguardBiologicalHierarchy({
  rules = [
    { label: 'Stability (3 Hrs)', detail: 'Regulate core temp or face hypothermia.', color: 'text-amber-500' },
    { label: 'Hydration (3 Days)', detail: 'Without water, blood thickens and kidneys fail.', color: 'text-blue-500' },
    { label: 'Nutrition (3 Weeks)', detail: 'Body begins consuming vital organs for energy.', color: 'text-emerald-500' }
  ]
}: BiologicalHierarchyProps) {
  return (
    <div className="p-10 bg-slate-900 text-white rounded-[4rem] space-y-6 animate-in fade-in delay-500 border border-amber-500/10 shadow-3xl">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-500/20 rounded-2xl">
          <Info className="text-amber-500" size={24} />
        </div>
        <h5 className="text-xl font-black uppercase italic tracking-[0.1em]">Biological Hierarchy of Needs</h5>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {rules.map((rule, idx) => (
          <div key={idx} className="space-y-2 border-l-2 border-slate-800 pl-6">
            <p className={cn("font-black text-xs uppercase tracking-widest", rule.color)}>{rule.label}</p>
            <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">{rule.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
