'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { BreadcrumbPillbox } from '@/components/ui/breadcrumb-pillbox';
import { cn } from '@/lib/utils';
import { Info, LifeBuoy, MonitorPlay, ChevronRight, Globe, Shield, Scale, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const tabs = [
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'media', label: 'Media', icon: MonitorPlay },
];

export default function BrowsePage() {
    const [activeTab, setActiveTab] = useState('about');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
            const isUserAdmin = (user?.email || user?.user_metadata?.email || '').toLowerCase() === adminEmail.toLowerCase();

            setIsAdmin(isUserAdmin);

            if (!isUserAdmin) {
                router.push('/dashboard');
            }
        };
        checkAdmin();
    }, [router]);

    if (isAdmin === null) return null; // Or a loading spinner
    if (!isAdmin) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'about':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                );
            case 'support':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: 'General Help', desc: 'Basics of Vitala', icon: Info },
                                { title: 'Contact Us', desc: 'Get in touch with support', icon: Mail },
                                { title: 'Documentation', desc: 'Developer guides & API', icon: FileText },
                            ].map((item, i) => (
                                <button key={i} className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left hover:border-emerald-500/30 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 flex items-center justify-center mb-4 transition-colors">
                                        <item.icon size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-emerald-500/10 text-center space-y-4">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Still need help?</h3>
                            <p className="text-slate-500 font-medium">Our team is typically available Monday through Friday, 9am to 5pm GMT.</p>
                            <button className="px-8 py-3 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                Submit a Ticket
                            </button>
                        </div>
                    </div>
                );
            case 'media':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-4 group cursor-pointer">
                                <div className="aspect-video rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-6">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <MonitorPlay size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                                        <span>Press Release</span>
                                        <span>•</span>
                                        <span>Oct 24, 2025</span>
                                    </div>
                                    <h4 className="text-xl font-bold group-hover:text-emerald-500 transition-colors">Vitala Beta v2: Redefining the Kitchen Experience</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <PageContainer className="p-0 sm:p-0">
            {/* Custom Header for Browse Page */}
            <div className="sticky top-0 z-50 p-4 pb-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl">
                <BreadcrumbPillbox
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sectionLabel="Vitala Hub"
                    sectionColor="text-emerald-500"
                />

                {/* Tabs Under Pillbox */}
                <div className="max-w-[800px] mx-auto xl:mx-0 mt-6 flex items-center gap-4 px-2 overflow-x-auto no-scrollbar pb-4 border-b border-slate-100 dark:border-slate-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-[800px] mx-auto xl:mx-0 p-8 pt-12">
                {renderContent()}
            </main>
        </PageContainer>
    );
}

const FileText = ({ size }: { size: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);
