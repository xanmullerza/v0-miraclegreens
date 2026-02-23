'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowRight, Scale, Plus, ChevronRight } from 'lucide-react';
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
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            borderHover: 'hover:border-purple-500/40',
            gradient: 'from-purple-500 to-violet-600',
            active: true
        },
        {
            id: 'request-1',
            title: 'Feature Request',
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
            title: 'Feature Request',
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
            title: 'Feature Request',
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
            <div className="space-y-12 animate-in fade-in duration-700 pb-20 md:pb-32 flex flex-col items-center justify-start min-h-[calc(100vh-100px)]">

                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Wrench size={12} />
                        Personal Workshop
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
                        Workshop
                    </h1>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                        The place for experimentation and trying out new things. Build, refine, and perfect your personal nutrition strategy.
                    </p>
                </div>

                <div className="w-full mx-auto md:max-w-[900px]">
                    <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/60 rounded-[2.5rem] overflow-hidden p-2">
                        {workshopTools.map((tool, index) => {
                            const Icon = tool.icon;
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.href}
                                    className={cn(
                                        "group flex items-center justify-between p-6 transition-all duration-300 rounded-2xl",
                                        tool.active ? "hover:bg-slate-800/60" : "opacity-50 cursor-default",
                                        index !== workshopTools.length - 1 && "border-b border-white/[0.03]"
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                            tool.bg,
                                            tool.active && "group-hover:scale-110"
                                        )}>
                                            <Icon size={28} className={tool.color} />
                                        </div>
                                        <div>
                                            <h3 className={cn("text-xl font-black tracking-tight", tool.active ? "text-white" : "text-slate-600")}>
                                                {tool.title}
                                            </h3>
                                            <p className={cn("text-[14px] leading-relaxed", tool.active ? "text-slate-500" : "text-slate-700")}>
                                                {tool.desc}
                                            </p>
                                        </div>
                                    </div>
                                    {tool.active && (
                                        <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
