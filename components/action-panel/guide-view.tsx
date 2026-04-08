'use client';

import React from 'react';
import { Home, BookOpen, Library, Gauge, Sparkles, Upload, Zap, BarChart3 } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';

export function GuideView() {
    const { navigateTo } = useActionPanel();

    const sections = [
        {
            icon: Home,
            title: 'HOME',
            description: 'Quick access to create, import, and manage recipes. Start your cooking journey here.',
            subFeatures: ['Create new recipes', 'Import from URLs or photos', 'Quick recipe access']
        },
        {
            icon: BookOpen,
            title: 'COOKBOOK',
            description: 'Browse, search, and organize your recipe collection. Filter by ingredients, nutrition, or meal type.',
            subFeatures: ['View all recipes', 'Filter & search', 'Rate & favorite recipes']
        },
        {
            icon: Library,
            title: 'LIBRARY',
            description: 'Access your ingredient database. View nutrition facts and manage pantry items.',
            subFeatures: ['Food items database', 'Nutrition information', 'Pantry management']
        },
        {
            icon: Gauge,
            title: 'TRACKER',
            description: 'Plan meals and track nutrition. Monitor your daily intake against RDA guidelines.',
            subFeatures: ['Meal planning', 'Nutrition tracking', 'RDA comparison', 'Goal monitoring']
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="text-center space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2">
                    <Sparkles size={20} className="text-emerald-500" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Welcome to MiracleGreens
                    </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                    Choose a section to get started or explore the recipe ecosystem
                </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div
                            key={section.title}
                            className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 hover:shadow-lg transition-all group cursor-pointer"
                            onClick={() => {
                                if (section.title === 'HOME') navigateTo('home');
                                else if (section.title === 'COOKBOOK') navigateTo('recipes');
                                else if (section.title === 'LIBRARY') navigateTo('foods');
                                else if (section.title === 'TRACKER') navigateTo('planner');
                            }}
                        >
                            {/* Title with Icon */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <Icon size={20} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">
                                    {section.title}
                                </h3>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                                {section.description}
                            </p>

                            {/* Sub-features */}
                            <div className="space-y-1">
                                {section.subFeatures.map((feature) => (
                                    <div key={feature} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <Zap size={12} className="text-emerald-500" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/30 p-4 bg-emerald-50 dark:bg-emerald-900/10">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <Sparkles size={14} />
                    Quick Tips
                </h4>
                <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400/80">
                    <li>• Use <span className="font-semibold">HOME</span> to create or import recipes quickly</li>
                    <li>• Search recipes in <span className="font-semibold">COOKBOOK</span> by nutrition or ingredients</li>
                    <li>• Explore the <span className="font-semibold">LIBRARY</span> to find new ingredients</li>
                    <li>• Track daily nutrition and plan meals in <span className="font-semibold">TRACKER</span></li>
                </ul>
            </div>
        </div>
    );
}
