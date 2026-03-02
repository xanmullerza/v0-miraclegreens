'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ChefHat, Beaker, Plus, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { cn } from '@/lib/utils';

const MAKER_OPTIONS = [
    {
        id: 'food',
        label: 'New Food',
        description: 'Add a whole food ingredient with full nutrition data',
        icon: Leaf,
        href: '/dashboard/meal-o-matic/maker/food',
        color: 'emerald',
        iconColor: 'text-emerald-500',
        borderColor: 'border-emerald-500/30',
        bgColor: 'bg-emerald-500/10',
        hoverBorder: 'hover:border-emerald-500/60',
        shadowColor: 'hover:shadow-emerald-500/10',
    },
    {
        id: 'meal',
        label: 'New Meal',
        description: 'Build a meal recipe with ingredients and instructions',
        icon: ChefHat,
        href: '/dashboard/meal-o-matic/maker/meal',
        color: 'amber',
        iconColor: 'text-amber-500',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/60',
        shadowColor: 'hover:shadow-amber-500/10',
    },
    {
        id: 'mix',
        label: 'New Mix',
        description: 'Create a custom ingredient blend or base mix',
        icon: Beaker,
        href: '/dashboard/meal-o-matic/maker/mix',
        color: 'indigo',
        iconColor: 'text-indigo-500',
        borderColor: 'border-indigo-500/30',
        bgColor: 'bg-indigo-500/10',
        hoverBorder: 'hover:border-indigo-500/60',
        shadowColor: 'hover:shadow-indigo-500/10',
    },
];

export default function MakerPage() {
    const router = useRouter();

    return (
        <PageContainer maxWidth="max-w-3xl">
            <div className="space-y-10 animate-in fade-in duration-500 py-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-2">
                        <Plus size={28} className="text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Maker
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        Create new foods, meals &amp; mixes
                    </p>
                </div>

                {/* Option Cards */}
                <div className="grid gap-4">
                    {MAKER_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.id}
                                onClick={() => router.push(option.href)}
                                className={cn(
                                    'group w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer',
                                    'bg-white dark:bg-slate-900/50',
                                    option.borderColor,
                                    option.hoverBorder,
                                    'hover:shadow-xl',
                                    option.shadowColor,
                                )}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        'w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                                        option.bgColor,
                                    )}>
                                        <Icon size={24} className={option.iconColor} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                            {option.label}
                                        </h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                            {option.description}
                                        </p>
                                    </div>
                                    <ArrowRight
                                        size={20}
                                        className={cn(
                                            'shrink-0 transition-all duration-300 text-slate-300 dark:text-slate-600',
                                            'group-hover:translate-x-1',
                                            `group-hover:${option.iconColor}`,
                                        )}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </PageContainer>
    );
}
