'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './card';
import { Info } from 'lucide-react';

export interface WaterAssessmentProps {
  waterStatus: 'clean' | 'dirty' | 'none' | null;
  onStatusChange: (status: 'clean' | 'dirty' | 'none') => void;
  onNext: () => void;
}

export function LifeguardWaterAssessment({
  waterStatus,
  onStatusChange,
  onNext
}: WaterAssessmentProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <Card className="p-12 text-center space-y-8 border-2 border-blue-500/20">
        <h2 className="text-2xl font-black uppercase italic tracking-tight">Do you have access to clean water?</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => {
              onStatusChange('clean');
              onNext();
            }}
            className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-blue-500"
          >
            Clean Water
          </button>
          <button
            onClick={() => onStatusChange('dirty')}
            className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-amber-500"
          >
            Dirty Source
          </button>
          <button
            onClick={() => onStatusChange('none')}
            className="h-20 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all border border-slate-100 dark:border-slate-700 hover:border-rose-500"
          >
            No Source
          </button>
        </div>

        {waterStatus === 'dirty' && (
          <div className="p-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2 text-amber-600">
              <Info size={18} />
              <span className="font-black uppercase tracking-widest">Purification Advisory</span>
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
              Never drink standing water. Boiling is the safest method. Filter through cloth/sand first to remove sediment. If fire is not possible, use water purification tablets or 2 drops of bleach per quart (let stand for 30 mins).
            </p>
            <Button onClick={onNext} className="w-full h-12 bg-amber-500 text-white font-black uppercase">
              Continue
            </Button>
          </div>
        )}

        {waterStatus === 'none' && (
          <div className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl text-left space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2 text-rose-500">
              <Info size={18} />
              <span className="font-black uppercase tracking-widest">Finding Water</span>
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300 leading-relaxed uppercase">
              Scan environment for: lower ground (where rain collects), green vegetation, animal tracks, or morning dew on leaves (collect with cloth). Avoid seawater or urine; they dehydrate you faster.
            </p>
            <Button onClick={onNext} className="w-full h-12 bg-rose-500 text-white font-black uppercase">
              Continue
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
