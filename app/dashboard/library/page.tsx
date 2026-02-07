'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Library,
    Apple,
    ChefHat,
    Activity,
    Search,
    Loader2,
    Zap,
    Scale,
    Plus,
    X,
    Filter,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/lib/context/search-context';

import { FoodsView } from '@/components/library/foods-view';
import { RecipesView } from '@/components/library/recipes-view';
import { NutrientsView } from '@/components/library/nutrients-view';

export default function ClinicalLibrary() {
    return (
        <Suspense fallback={
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Getting things ready...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'foods' | 'recipes' | 'nutrients'>('nutrients');

    // Sync tab with URL if needed
    useEffect(() => {
        const tab = searchParams.get('tab') as any;
        if (tab && ['foods', 'recipes', 'nutrients'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'foods' | 'recipes' | 'nutrients') => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        window.history.pushState(null, '', `?${params.toString()}`);
    };

    const tabs = [
        { id: 'nutrients', label: 'Nutrients', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { id: 'foods', label: 'Ingredients', icon: Apple, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'recipes', label: 'Meals', icon: ChefHat, color: 'text-blue-500', bg: 'bg-blue-600/10' },
    ];

    const { searchQuery, setSearchQuery } = useSearch();

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Unified Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 rounded-[1.5rem] bg-emerald-600 shadow-xl shadow-emerald-500/20 text-white">
                            <Library size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                                The <span className="text-emerald-500">Library.</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Healthy Eating Made Easy v0.4</p>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl self-start">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap group",
                                    isActive
                                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xl translate-y-[-2px]"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <Icon size={16} className={cn(
                                    "transition-transform duration-500 group-hover:scale-110",
                                    isActive ? tab.color : "text-slate-400"
                                )} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Unified Search Bar */}
            <div className="relative group max-w-4xl mx-auto w-full">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Search className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                </div>
                <Input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    className="w-full h-16 pl-14 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-bold uppercase tracking-widest"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-6 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Dynamic Content Area */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'foods' && <FoodsView />}
                {activeTab === 'recipes' && <RecipesView />}
                {activeTab === 'nutrients' && <NutrientsView />}
            </div>
        </div>
    );
}
