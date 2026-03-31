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
            'group cursor-pointer flex flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-1 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg ring-2 ring-emerald-500/20'
                : 'border-slate-100/10 dark:border-slate-800 bg-white/5 dark:bg-slate-900 text-white/80 hover:bg-white/10 hover:border-emerald-500/20 hover:text-emerald-400'
        )}
    >
        <Icon className={cn('h-3 w-3', selected ? 'text-white' : 'text-emerald-500/60 group-hover:text-emerald-400')} />
        <span className={cn(
            "text-[8px] font-black uppercase tracking-widest leading-none transition-colors",
            selected ? "text-white" : "group-hover:text-emerald-400"
        )}>
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
            'group cursor-pointer flex flex-row items-center justify-center gap-1.5 rounded-full border px-4 py-1.5 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-violet-600 text-white border-violet-700 shadow-lg ring-2 ring-violet-500/20'
                : 'border-slate-100/10 dark:border-slate-800 bg-white/5 dark:bg-slate-900 text-white/80 hover:bg-white/10 hover:border-violet-500/20 hover:text-emerald-400'
        )}
    >
        <Icon className={cn('h-3.5 w-3.5', selected ? 'text-white' : 'text-emerald-500/60 group-hover:text-emerald-400')} />
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest leading-none transition-colors",
            selected ? "text-white" : "group-hover:text-emerald-400"
        )}>
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
            'group cursor-pointer flex flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 transition-all hover:shadow-md active:scale-95 text-center',
            selected
                ? 'bg-blue-600 text-white border-blue-700 shadow-lg ring-2 ring-blue-500/20'
                : 'border-slate-100/10 dark:border-slate-800 bg-white/5 dark:bg-slate-900 text-white/80 hover:bg-white/10 hover:border-blue-500/20 hover:text-emerald-400'
        )}
    >
        <Icon className={cn('h-3.5 w-3.5', selected ? 'text-white' : 'text-emerald-500/60 group-hover:text-emerald-400')} />
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest leading-none transition-colors",
            selected ? "text-white" : "group-hover:text-emerald-400"
        )}>
            {label || type}
        </span>
    </div>
);
