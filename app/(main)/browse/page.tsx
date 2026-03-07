'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/ui/page-container';
import { cn } from '@/lib/utils';
import { Info, Shield, HelpCircle, BookOpen, Globe, Scale, Mail, MessageCircle, Phone } from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { Footer } from '@/components/footer';
import { HeaderLogo } from '@/components/ui/header-logo';

const tabs = [
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'terms', label: 'Terms', icon: BookOpen },
];

export default function BrowsePage() {
    const [activeTab, setActiveTab] = useState('about');

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
            case 'privacy':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Shield className="text-emerald-500" size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase italic text-slate-900 dark:text-white">Privacy Policy</h2>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: February 25, 2026</p>
                        </div>

                        <div className="prose dark:prose-invert max-w-none space-y-6">
                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Introduction</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Vitala ("we", "us", "our" or "Company") operates the Vitala website and application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Information Collection and Use</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                                    We collect several different types of information for various purposes to provide and improve our Service to you.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                                    <li>Personal Data: Email address, first name, last name, profile information</li>
                                    <li>Usage Data: Browser type, IP address, pages visited, time and date of visits</li>
                                    <li>Nutritional Data: Food preferences, dietary restrictions, meal history</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Use of Data</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Vitala uses the collected data for various purposes:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 mt-3">
                                    <li>To provide and maintain our Service</li>
                                    <li>To notify you about changes to our Service</li>
                                    <li>To provide customer support</li>
                                    <li>To gather analysis or valuable information so we can improve our Service</li>
                                    <li>To monitor the usage of our Service</li>
                                    <li>To detect, prevent and address technical issues</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Security of Data</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Contact Us</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    If you have any questions about this Privacy Policy, please contact us at:
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-slate-700 dark:text-slate-300">
                                    <Mail size={18} className="text-emerald-500" />
                                    <span>privacy@vitala.app</span>
                                </div>
                            </section>
                        </div>
                    </div>
                );
            case 'support':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <HelpCircle className="text-indigo-500" size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase italic text-slate-900 dark:text-white">Support Center</h2>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">We're here to help! Find answers and get support.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <Mail className="text-indigo-500" size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Email Support</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">
                                    Send us an email and we'll get back to you within 24 hours.
                                </p>
                                <a href="mailto:support@vitala.app" className="text-indigo-500 font-bold text-xs hover:underline">
                                    support@vitala.app
                                </a>
                            </div>

                            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <MessageCircle className="text-emerald-500" size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Live Chat</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">
                                    Chat with our team in real-time during business hours (9am-6pm EST).
                                </p>
                                <button className="text-emerald-500 font-bold text-xs hover:underline">
                                    Start Chat
                                </button>
                            </div>

                            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Phone className="text-amber-500" size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Phone Support</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-xs mb-4">
                                    Call us for urgent issues. Available Monday-Friday, 9am-6pm EST.
                                </p>
                                <button className="text-amber-500 font-bold text-xs hover:underline">
                                    Call Us
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white">Frequently Asked Questions</h3>
                            
                            <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                                    How do I create a Vitala account?
                                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                                    You can create a new account by visiting our sign-up page and providing your email address and password. If you have any issues during registration, please contact our support team.
                                </p>
                            </details>

                            <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                                    How do I reset my password?
                                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                                    Click the "Forgot Password" link on the login page and follow the instructions sent to your email address. You'll receive a password reset link valid for 24 hours.
                                </p>
                            </details>

                            <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                                    Can I export my nutritional data?
                                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                                    Yes! You can export your meal history, nutritional data, and recipes in various formats from your account settings. This feature helps you maintain a backup of your data.
                                </p>
                            </details>

                            <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                                    How accurate is the nutritional information?
                                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                                    Our nutritional data is sourced from verified databases and updated regularly. However, actual nutrition content may vary based on production methods and specific brands. Always consult with a nutritionist for personalized advice.
                                </p>
                            </details>

                            <details className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 group cursor-pointer">
                                <summary className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                                    Is my data secure and private?
                                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
                                    Yes, we use industry-standard encryption and security protocols to protect your data. Please review our Privacy Policy for more details on how we handle your information.
                                </p>
                            </details>
                        </div>
                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                    <BookOpen className="text-amber-500" size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase italic text-slate-900 dark:text-white">Terms of Service</h2>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Last updated: February 25, 2026</p>
                        </div>

                        <div className="prose dark:prose-invert max-w-none space-y-6">
                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Agreement to Terms</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    By accessing and using the Vitala website, application, and services, you accept and agree to be bound by and comply with these Terms and Conditions. If you do not agree to abide by the above, please do not use this service.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Use License</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Permission is granted to temporarily download one copy of the materials (information or software) on Vitala for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 mt-3">
                                    <li>Modify or copying the materials</li>
                                    <li>Using the materials for any commercial purpose or for any public display</li>
                                    <li>Attempting to decompile or reverse engineer any software contained on Vitala</li>
                                    <li>Removing any copyright or other proprietary notations from the materials</li>
                                    <li>Transferring the materials to another person or other websites</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Disclaimer</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    The materials on Vitala are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Limitations</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    In no event shall Vitala or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Vitala.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Accuracy of Materials</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    The materials appearing on Vitala could include technical, typographical, or photographic errors. Vitala does not warrant that any of the materials on its website are accurate, complete, or current. Vitala may make changes to the materials contained on its website at any time without notice.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Links</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Vitala has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Vitala of the site. Use of any such linked website is at the user's own risk.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Modifications</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Vitala may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white mb-3">Contact Us</h3>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    If you have any questions about these Terms of Service, please contact us at:
                                </p>
                                <div className="flex items-center gap-2 mt-4 text-slate-700 dark:text-slate-300">
                                    <Mail size={18} className="text-amber-500" />
                                    <span>legal@vitala.app</span>
                                </div>
                            </section>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="z-30 px-2 sm:px-4 w-full flex justify-center sticky top-0">
                <div className="pointer-events-auto w-full max-w-[900px]">
                    <HeaderLogo />
                </div>
            </div>
            <DashboardNav />
            <PageContainer className="p-0 sm:p-0">
                {/* Tabs */}
                <div className="max-w-[800px] mx-auto xl:mx-0 flex items-center justify-center gap-4 px-6 overflow-x-auto no-scrollbar pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 md:px-6 py-3 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px] whitespace-nowrap",
                                activeTab === tab.id
                                    ? tab.id === 'about'
                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                                        : tab.id === 'privacy'
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : tab.id === 'support'
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <main className="max-w-[800px] mx-auto xl:mx-0 p-8 pt-12 mb-20">
                    {renderContent()}
                </main>
            </PageContainer>
            <Footer />
        </>
    );
}
