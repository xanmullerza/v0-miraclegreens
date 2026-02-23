'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowRight, Scale, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/ui/page-container';

export default function WorkshopPage() {
    const workshopTools = [
        {
            id: 'compare',
            title: 'Comparator',
            desc: 'A handy tool for side-by-side food and nutrient checks.',
            href: '/dashboard/workshop/comparefoods',
            icon: Scale,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            borderHover: 'hover:border-violet-500/40',
            gradient: 'from-violet-500 to-purple-600',
            active: true
        },
        {
            id: 'request-1',
            title: 'Tool Request',
            desc: 'Have an idea for a new tool? We\'d love to hear it.',
            href: '#',
            icon: Plus,
            color: 'text-slate-400',
            bg: 'bg-slate-500/5',
            borderHover: 'hover:border-slate-500/20',
            gradient: 'from-slate-500/20 to-slate-600/20',
            active: false
        },
        {
            id: 'request-2',
            title: 'Tool Request',
            desc: 'Help us shape the future of these helpful modules.',
            href: '#',
            icon: Plus,
            color: 'text-slate-400',
            bg: 'bg-slate-500/5',
            borderHover: 'hover:border-slate-500/20',
            gradient: 'from-slate-500/20 to-slate-600/20',
            active: false
        },
        {
            id: 'request-3',
            title: 'Tool Request',
            desc: 'More ways to refine your nutrition are on the way.',
            href: '#',
            icon: Plus,
            color: 'text-slate-400',
            bg: 'bg-slate-500/5',
            borderHover: 'hover:border-slate-500/20',
            gradient: 'from-slate-500/20 to-slate-600/20',
            active: false
        },
    ];

    return (
        <PageContainer>
            <div className="space-y-12 animate-in fade-in duration-700 pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Wrench size={12} />
                        Personal Workshop
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
                        The Workshop
                    </h1>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Explore helpful tools and insights to build, refine, and perfect your personal nutrition strategy.
                    </p>
                </div>

                <div className="w-full mx-auto md:max-w-[900px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {workshopTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.href}
                                    className={cn(
                                        "group relative overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-500 flex flex-col justify-between h-[200px]",
                                        tool.active
                                            ? cn("border-slate-700/60 bg-slate-800/40 backdrop-blur-sm", tool.borderHover, "hover:bg-slate-800/70 hover:shadow-2xl")
                                            : "border-slate-800/30 bg-slate-900/20 cursor-default"
                                    )}
                                >
                                    {tool.active && (
                                        <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500", tool.gradient)} />
                                    )}

                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex items-center gap-5 group/title">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                                tool.bg,
                                                tool.active && "group-hover/title:scale-110"
                                            )}>
                                                <Icon size={28} className={tool.color} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn("text-xl font-black tracking-tight", tool.active ? "text-white" : "text-slate-600")}>
                                                        {tool.title}
                                                    </h3>
                                                    {tool.active && (
                                                        <ArrowRight size={16} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover/title:opacity-100 group-hover/title:translate-x-0", tool.color)} />
                                                    )}
                                                </div>
                                                <p className={cn("text-[14px] leading-relaxed max-w-[240px]", tool.active ? "text-slate-500" : "text-slate-700")}>
                                                    {tool.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
