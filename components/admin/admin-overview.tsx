'use client';

import React from 'react';
import {
    Plus,
    Table,
    ChefHat,
    ArrowRight,
    Scale,
    Beaker,
    Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300", className)}>
        {children}
    </div>
);

interface AdminOverviewProps {
    onTabSelect: (tabId: string) => void;
}

export function AdminOverview({ onTabSelect }: AdminOverviewProps) {
    const adminTools = [
        {
            name: 'Bulk Manager',
            desc: 'Category and tag management for food items.',
            tabId: 'food-db',
            icon: Table,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Add New Food',
            desc: 'Manually enter clinical USDA/custom data.',
            tabId: 'creator',
            icon: Plus,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10'
        },
        {
            name: 'Recipe Architect',
            desc: 'Build smart meal data and mixes.',
            tabId: 'builder',
            icon: ChefHat,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10'
        },
        {
            name: 'Edit Recipe',
            desc: 'Protocol and step refinement.',
            tabId: 'recipes',
            icon: Table,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            name: 'Compare Foods',
            desc: 'Analyze and compare profiles.',
            tabId: 'comparator',
            icon: Scale,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        },
        {
            name: 'Life Guard',
            desc: 'Monitor nutritional survival thresholds.',
            tabId: 'lifeguard',
            icon: Wallet,
            color: 'text-teal-500',
            bg: 'bg-teal-500/10'
        },
        {
            name: 'Spice Lab',
            desc: 'Convert whole vs ground spices.',
            tabId: 'spice-lab',
            icon: Beaker,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Admin Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {adminTools.map((tool) => (
                    <button 
                        key={tool.tabId} 
                        onClick={() => onTabSelect(tool.tabId)} 
                        className="h-full text-left"
                    >
                        <Card className="p-6 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6", tool.bg, tool.color)}>
                                <tool.icon size={24} />
                            </div>
                            <h3 className="text-base font-bold tracking-tight mb-2 group-hover:text-emerald-500 transition-colors uppercase italic">{tool.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-grow line-clamp-3">{tool.desc}</p>
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                Launch
                                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
    );
}
