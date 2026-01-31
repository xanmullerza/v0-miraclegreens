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
    Zap,
    Database,
    Sparkles
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
            desc: 'Bulk categorize and organize the entire food database with ease.',
            href: '/dashboard/admin/manage-foods',
            icon: Table,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            name: 'Food Creator',
            desc: 'Add new food items to the database with detailed clinical nutrition data.',
            href: '/dashboard/admin/food',
            icon: Plus,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10'
        },
        {
            name: 'Recipe Architect',
            desc: 'Build complex nutritional recipes with smart data and scaling tools.',
            href: '/dashboard/admin/recipebuilder',
            icon: ChefHat,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 lg:p-16 flex flex-col justify-center min-h-[300px]">
                <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl">
                    <ShieldCheck size={300} className="text-emerald-500" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Settings size={12} className="fill-current" />
                        Admin Headquarters
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter leading-[0.9] mb-6 italic uppercase">
                        Lab <span className="text-emerald-500">Administration.</span>
                    </h1>
                    <p className="text-base text-slate-400 leading-relaxed">
                        Control the core engine of Miracle Greens. Manage the global food database, curate clinical data, and architect new nutritional recipes.
                    </p>
                </div>
            </div>

            {/* Admin Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminTools.map((tool) => (
                    <Link key={tool.href} href={tool.href}>
                        <Card className="p-8 group hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 h-full flex flex-col box-border">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-300", tool.bg, tool.color)}>
                                <tool.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-3 group-hover:text-emerald-500 transition-colors uppercase italic">{tool.name}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-grow">{tool.desc}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                                Access Tool
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Stats or Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Database size={20} />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Database Status</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-sm font-bold">Main Registry</p>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Encypted & Syncing</p>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                            <p className="text-sm font-bold">USDA Integration</p>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Operational</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-bold">Recipe Compiler</p>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Ready</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 bg-emerald-500/5 border-emerald-500/10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Administrator Notice</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "As an administrator, you have direct write access to the Miracle Greens health databank. Ensure all clinical markers are verified before syncing to the global registry."
                    </p>
                </Card>
            </div>
        </div>
    );
}
