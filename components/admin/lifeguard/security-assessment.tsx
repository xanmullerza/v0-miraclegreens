'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './card';
import { Info } from 'lucide-react';

export interface SecurityAssessmentProps {
  securityStatus: 'safe' | 'unsafe' | null;
  onStatusChange: (status: 'safe' | 'unsafe') => void;
  onNext: () => void;
}

export function LifeguardSecurityAssessment({
  securityStatus,
  onStatusChange,
  onNext
}: SecurityAssessmentProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <Card className="p-12 text-center space-y-8 border-2 border-amber-500/20">
        <h2 className="text-2xl font-black uppercase italic tracking-tight">Are you in a safe space or shelter?</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              onStatusChange('safe');
              onNext();
            }}
            className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-emerald-500"
          >
            Yes, I am Safe
          </button>
          <button
            onClick={() => onStatusChange('unsafe')}
            className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-rose-500"
          >
            No, I need Shelter
          </button>
        </div>
        {securityStatus === 'unsafe' && (
          <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-500">
              <Info size={18} />
              <span className="font-black uppercase text-xs tracking-widest">Safe Space Advisory</span>
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
              Priority one: Find shelter. Look for brick or concrete structures if weather is harsh. If outside, create a thermal barrier between you and the ground (dry leaves, cardboard). Keep your core warm—layers are essential.
            </p>
            <Button
              onClick={onNext}
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px]"
            >
              Next: Water Assessment
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
