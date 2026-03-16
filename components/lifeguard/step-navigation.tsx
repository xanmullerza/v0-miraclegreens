'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Droplet, BookOpen, TrendingUp } from 'lucide-react';

export type StepType = 'security' | 'water' | 'ingredients' | 'lifeline';

export interface StepNavStep {
  id: StepType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface StepNavigationProps {
  currentStep: StepType;
  onStepChange?: (step: StepType) => void;
  interactive?: boolean;
}

const STEPS: StepNavStep[] = [
  {
    id: 'security',
    label: 'Safety',
    icon: <Shield size={20} />,
    description: 'Find shelter'
  },
  {
    id: 'water',
    label: 'Water',
    icon: <Droplet size={20} />,
    description: 'Assess source'
  },
  {
    id: 'ingredients',
    label: 'Inventory',
    icon: <BookOpen size={20} />,
    description: 'Add foods'
  },
  {
    id: 'lifeline',
    label: 'Analysis',
    icon: <TrendingUp size={20} />,
    description: 'Survival forecast'
  }
];

export function LifeguardStepNavigation({
  currentStep,
  onStepChange,
  interactive = false
}: StepNavigationProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isComplete = idx < currentIndex;
          const isClickable = interactive && onStepChange && (isActive || isComplete);

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepChange?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                  isActive
                    ? "bg-amber-500 text-white"
                    : isComplete
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                  isClickable && "cursor-pointer hover:shadow-lg"
                )}
              >
                {step.icon}
                <span className="text-[8px] font-black uppercase">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    idx < currentIndex
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {interactive && (
        <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 text-center uppercase">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      )}
    </div>
  );
}
