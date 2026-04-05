'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { PageContainer } from '@/components/ui/page-container';
import { Shield, Scale, Globe, BookOpen, Calendar, TrendingUp, Users, Settings, ChevronRight, MessageCircle } from 'lucide-react';
import { Carousel } from '@/components/ui/carousel';

export default function AboutUsPage() {
    const router = useRouter();
    const { showHeroes } = useUserPreferences();
    const { setActiveView, setIsActionPanelOpen } = useActionPanel();
    const [isMobile, setIsMobile] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Open chatbot with dashboard view on mobile
    useEffect(() => {
        const checkMobile = window.innerWidth < 768;
        setIsMobile(checkMobile);
        if (checkMobile) {
            setIsActionPanelOpen(true);
            setActiveView('dashboard');
        }
        setIsReady(true);
    }, [setIsActionPanelOpen, setActiveView]);

    // Don't render about page on mobile
    if (!isReady || isMobile) {
        return null;
    }
    const cards = [
        {
            icon: Globe,
            title: 'Our Mission',
            description: 'Vitala is dedicated to empowering individuals through molecular-level nutritional intelligence. We believe that understanding exactly what goes into your body is the first step toward optimal health.',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-500',
        },
        {
            icon: Shield,
            title: 'Data Privacy',
            description: 'Your health data is yours alone. We use industry-standard encryption and never sell your personal information to third parties.',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-500',
        },
        {
            icon: Scale,
            title: 'Scientific Accuracy',
            description: 'Our nutrient databases are sourced from reputable scientific institutions and verified by nutrition specialists.',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-500',
        },
    ];

    return (
        <PageContainer className="p-0 sm:p-0">
            <main className="max-w-[1000px] mx-auto xl:mx-0 p-8 pt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-12">
                    {/* Hero Carousel Section */}
                    {showHeroes && (
                    <section className="text-center space-y-8">
                        <div className="space-y-4 mb-8">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white sm:text-5xl">
                                Why Vitala
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                                Everything you need to know about our commitment to your health and nutrition
                            </p>
                        </div>

                        <Carousel
                            className="w-full"
                            containerClassName="gap-4"
                            showDots={true}
                        >
                            {cards.map((card, index) => {
                                const IconComponent = card.icon;
                                return (
                                    <div
                                        key={index}
                                        className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-6 h-full flex flex-col min-h-[350px]"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${card.bgColor} ${card.textColor} flex items-center justify-center`}>
                                            <IconComponent size={28} />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-left">
                                                    {card.title}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed font-medium text-left">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </Carousel>
                    </section>
                    )}

                    {/* Features Grid Section */}
                    <section className="space-y-8 mt-16">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Explore Vitala
                            </h2>
                            <p className="text-slate-500 font-medium">
                                Access powerful tools to optimize your nutrition
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cookbook Card */}
                            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-3xl p-6 border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <BookOpen size={120} className="text-emerald-500 -rotate-12" />
                                </div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cookbook</h3>
                                </div>
                                <div className="flex flex-col gap-4 relative z-10">
                                    <button
                                        onClick={() => router.push('/cookbook')}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group/btn shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-all">
                                                <BookOpen size={24} className="text-emerald-600 dark:text-emerald-400 group-hover/btn:text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">View Cookbook</h4>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-0.5 max-w-[200px] leading-tight break-words">Discover and create nutritious recipes</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover/btn:text-emerald-500 group-hover/btn:translate-x-1 transition-all" />
                                    </button>
                                </div>
                            </div>

                            {/* Tracker Card */}
                            <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-3xl p-6 border border-blue-500/20 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <Calendar size={120} className="text-blue-500 -rotate-12" />
                                </div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tracker</h3>
                                </div>
                                <div className="flex flex-col gap-4 relative z-10">
                                    <button
                                        onClick={() => router.push('/tracker')}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-blue-500/20 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group/btn shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-all">
                                                <Calendar size={24} className="text-blue-600 dark:text-blue-400 group-hover/btn:text-white" />
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Open Tracker</h4>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-0.5 max-w-[200px] leading-tight break-words">Track your weekly molecular meals</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-300 group-hover/btn:text-blue-500 group-hover/btn:translate-x-1 transition-all" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </main>
        </PageContainer>
    );
}
