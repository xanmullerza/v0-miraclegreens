'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { useChatbot } from '@/lib/context/chatbot-context';
import { PageContainer } from '@/components/ui/page-container';
import { Shield, Scale, Globe, BookOpen, TrendingUp, Users, Settings } from 'lucide-react';
import { Carousel } from '@/components/ui/carousel';

export default function AboutUsPage() {
    const router = useRouter();
    const { showHeroes } = useUserPreferences();
    const { setChatbotView, setIsChatbotOpen } = useChatbot();

    // Open chatbot with dashboard view on mobile
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setIsChatbotOpen(true);
            setChatbotView('dashboard');
        }
    }, [setIsChatbotOpen, setChatbotView]);
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
                            <div onClick={() => router.push('/recipes')} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4 cursor-pointer hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cookbook</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        Discover and create nutritious recipes tailored to your dietary goals.
                                    </p>
                                </div>
                            </div>

                            {/* Tracker Card */}
                            <div onClick={() => router.push('/tracker')} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4 cursor-pointer hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tracker</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        Monitor your nutritional intake and reach your health targets daily.
                                    </p>
                                </div>
                            </div>

                            {/* Coach Card */}
                            <div onClick={() => {
                                setChatbotView('messages');
                                setIsChatbotOpen(true);
                            }} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4 cursor-pointer hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Coach</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        Get personalized guidance and insights from your AI nutrition coach.
                                    </p>
                                </div>
                            </div>

                            {/* Settings Card */}
                            <div onClick={() => router.push('/profile')} className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4 cursor-pointer hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300">
                                <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-500 flex items-center justify-center">
                                    <Settings size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Settings</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        Customize your preferences and manage your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </PageContainer>
    );
}
