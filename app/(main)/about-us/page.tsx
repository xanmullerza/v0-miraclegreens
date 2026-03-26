'use client';

import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { Shield, Scale, Globe } from 'lucide-react';
import { Carousel } from '@/components/ui/carousel';

export default function AboutUsPage() {
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
                </div>
            </main>
        </PageContainer>
    );
}
