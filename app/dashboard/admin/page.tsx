'use client';

import React from 'react';
import Link from 'next/link';
import {
    Settings,
    Plus,
    Table,
    ChefHat,
    ArrowRight,
    ShieldCheck,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300", className)}>
        {children}
    </div>
);

export default function AdminOverview() {
    const adminTools = [
        {
            name: 'Food Manager',
            desc: 'Bulk manage the database.',
            href: '/dashboard/admin/manage-foods',
            icon: Table,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Add Food',
            desc: 'Manually enter clinical data.',
            href: '/dashboard/admin/add-food',
            icon: Plus,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10'
        },
        {
            name: 'Recipe Architect',
            desc: 'Build smart meal data.',
            href: '/dashboard/admin/recipebuilder',
            icon: ChefHat,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10'
        },
        {
            name: 'My Profile',
            desc: 'Manage account access.',
            href: '/dashboard/profile',
            icon: User,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Hero Section - 2/3 Width */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16 flex flex-col justify-center min-h-[450px]">
                    <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
                        <ShieldCheck size={300} className="text-emerald-500" />
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                            <Settings size={12} className="fill-current" />
                            Admin Headquarters
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-8 italic uppercase">
                            Lab <span className="text-emerald-500">Administration.</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Control the core engine of Miracle Greens. Manage the global food database, curate clinical data, and architect new nutritional recipes.
                        </p>
                    </div>
                </div>

                {/* Tool Grid - 1/3 Width (2x2) */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                    {adminTools.map((tool) => (
                        <Link key={tool.href} href={tool.href} className="h-full">
                            <Card className="p-5 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full flex flex-col">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6", tool.bg, tool.color)}>
                                    <tool.icon size={20} />
                                </div>
                                <h3 className="text-xs font-black tracking-tight mb-1.5 group-hover:text-emerald-500 transition-colors uppercase italic">{tool.name}</h3>
                                <p className="text-[10px] text-slate-500 leading-relaxed mb-4 flex-grow line-clamp-2">{tool.desc}</p>
                                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Launch
                                    <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
