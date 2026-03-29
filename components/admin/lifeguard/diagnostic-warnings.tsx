'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Info, Activity, Sparkles } from 'lucide-react';

export interface DiagnosticWarningsProps {
  simStatus: any;
}

export function LifeguardDiagnosticWarnings(props: DiagnosticWarningsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2 ml-4">
        <Info size={16} className="text-rose-500" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Diagnostic Warnings</h3>
      </div>
      <div className="space-y-4">
        {props.simStatus.activeSymptoms.length === 0 ? (
          <div className="p-12 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Bio-Integrity Maintained.</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase max-w-xs mt-2">Current inventory sustains all critical functions through current timeframe.</p>
          </div>
        ) : (
          props.simStatus.activeSymptoms.map((s: any) => (
            <div key={s.name} className="p-6 bg-rose-50 dark:bg-rose-500/5 border-2 border-rose-500/20 rounded-[2.5rem] animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-rose-500 text-white p-2 rounded-xl">
                  <Activity size={18} />
                </div>
                <h4 className="text-lg font-black uppercase italic text-rose-600">{s.name}</h4>
              </div>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase leading-relaxed mb-3">
                {s.symptom}
              </p>
              <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/10">
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-rose-500">Terminal Risk: {s.terminal}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
