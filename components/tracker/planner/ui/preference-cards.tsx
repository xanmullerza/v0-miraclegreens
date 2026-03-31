import React from 'react';
import { cn } from '@/lib/utils';
import { DietType } from '@/lib/data/recipes';
import { GoalType, ActivityLevel } from '../types';

export const DietCard = ({
    type, selected, onClick, icon: Icon, label,
}: {
    type: DietType; selected: boolean; onClick: () => void; icon: any; label?: string;
}) => (
    <div
        onClick={onClick}
        className={cn(
            'cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/20'
        )}
    >
        <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-white' : 'text-emerald-500/60')} />
        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
            {label || (type === 'anything' ? 'Anything' : type)}
        </span>
    </div>
);

export const GoalCard = ({
    type, selected, onClick, icon: Icon, label,
}: {
    type: GoalType; selected: boolean; onClick: () => void; icon: any; label?: string;
}) => (
    <div
        onClick={onClick}
        className={cn(
            'cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-violet-600 text-white border-violet-700 shadow-lg ring-2 ring-violet-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-violet-500/20'
        )}
    >
        <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-white' : 'text-emerald-500/60')} />
        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
            {label || type.replace('-', ' ')}
        </span>
    </div>
);

export const ActivityCard = ({
    type, selected, onClick, icon: Icon, label,
}: {
    type: ActivityLevel; selected: boolean; onClick: () => void; icon: any; label?: string;
}) => (
    <div
        onClick={onClick}
        className={cn(
            'cursor-pointer flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500/20'
        )}
    >
        <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-white' : 'text-emerald-500/60')} />
        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{label || type}</span>
    </div>
);
