'use client';

import React from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { Shield, Scale, Globe } from 'lucide-react';

export default function AboutUsPage() {
    return (
        <PageContainer className="p-0 sm:p-0">
            <main className="max-w-[800px] mx-auto xl:mx-0 p-8 pt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-12">
                    <section className="text-center max-w-2xl mx-auto space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mb-4">
                            <Globe size={32} />
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white sm:text-5xl">
                            Our Mission
                        </h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            Vitala is dedicated to empowering individuals through molecular-level nutritional intelligence. We believe that understanding exactly what goes into your body is the first step toward optimal health.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Data Privacy</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Your health data is yours alone. We use industry-standard encryption and never sell your personal information to third parties.
                            </p>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Scale size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Scientific Accuracy</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Our nutrient databases are sourced from reputable scientific institutions and verified by nutrition specialists.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </PageContainer>
    );
}
